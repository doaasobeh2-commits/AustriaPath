import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";

export async function persistCompleteResult(userId, sessionId, completeResult) {
  const { report, profile } = completeResult;
  const decision = report.councilDecision;

  const { rows: decRows } = await query(
    `INSERT INTO council_decisions (
      decision_json, overall_score, cefr_level, confidence, needs_human_review,
      human_review_reason, rules_version, examiner_mind_version
    ) VALUES ($1::jsonb, $2, $3::cefr_label, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      JSON.stringify(decision),
      report.overallScore,
      report.cefrLevel.replace("+", ""),
      report.confidence,
      decision?.needsHumanReview || false,
      decision?.humanReviewReason || null,
      report.rulesVersion,
      decision?.examinerMindVersion || "2.0.0-contract",
    ]
  );
  const councilId = decRows[0].id;

  const reportId = randomUUID();
  await query(
    `INSERT INTO exam_reports (
      id, user_id, session_id, council_decision_id, product_type, mode,
      evaluation_method, cefr_level, overall_score, confidence, readiness_band,
      skill_results, strengths, weaknesses, recurring_mistakes, focus_areas,
      summary, recommendations, study_advice, improvement_priorities,
      weekly_focus_skills, report_json, rules_version, blueprint_id
    ) VALUES (
      $1, $2, $3, $4, $5::product_type, $6::exam_mode,
      $7::evaluation_method, $8::cefr_label, $9, $10, $11::readiness_band,
      $12::jsonb, $13, $14, $15, $16,
      $17, $18, $19, $20,
      $21::skill_id[], $22::jsonb, $23, $24
    )`,
    [
      reportId,
      userId,
      sessionId,
      councilId,
      report.productType,
      report.mode,
      report.evaluationMethod,
      report.cefrLevel.replace("+", ""),
      report.overallScore,
      report.confidence,
      report.readinessBand || null,
      JSON.stringify(report.skillResults || {}),
      report.strengths || [],
      report.weaknesses || [],
      report.recurringMistakes || [],
      report.focusAreas || [],
      report.summary,
      report.recommendations || [],
      report.studyAdvice || [],
      report.improvementPriorities || [],
      report.weeklyFocusSkills || null,
      JSON.stringify({ ...report, reportId }),
      report.rulesVersion,
      report.blueprintId,
    ]
  );

  let labEnqueued = false;
  if (decision?.needsHumanReview) {
    const { rows: labRows } = await query(
      `SELECT COUNT(*)::int AS c FROM examiner_lab_queue_items
       WHERE user_id = $1 AND queued_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    if ((labRows[0]?.c || 0) < 1) {
      await query(
        `INSERT INTO examiner_lab_queue_items (
          lab_item_id, user_id, report_id, session_id, council_decision_id,
          section_evaluations, council_decision, status, classification
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'pending', $8)`,
        [
          `lab_${randomUUID()}`,
          userId,
          reportId,
          sessionId,
          councilId,
          JSON.stringify([]),
          JSON.stringify(decision),
          decision.humanReviewReason || "quality_review",
        ]
      );
      labEnqueued = true;
    }
  }

  if (profile) {
    await query(
      `UPDATE student_learning_profiles SET
        profile_json = $2::jsonb,
        official_exam_level = $3::cefr_label,
        updated_at = NOW()
       WHERE user_id = $1`,
      [
        userId,
        JSON.stringify(profile),
        String(profile.officialExamLevel || "B1").replace("+", ""),
      ]
    );
  }

  return { report: { ...report, reportId, sessionId }, labEnqueued };
}

export async function listReports(userId, { page = 1, limit = 20, productType } = {}) {
  const offset = (page - 1) * limit;
  const params = [userId, limit, offset];
  let filter = "";
  if (productType) {
    filter = " AND product_type = $4::product_type";
    params.push(productType);
  }
  const { rows } = await query(
    `SELECT id, report_json, product_type, created_at FROM exam_reports
     WHERE user_id = $1 AND is_superseded = FALSE ${filter}
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    params
  );
  return rows.map((r) => ({ ...r.report_json, reportId: r.id }));
}

export async function getReport(userId, reportId) {
  const { rows } = await query(
    `SELECT report_json FROM exam_reports WHERE id = $1 AND user_id = $2`,
    [reportId, userId]
  );
  if (!rows.length) return null;
  return { ...rows[0].report_json, reportId };
}

export async function getLatestReport(userId) {
  const { rows } = await query(
    `SELECT report_json, id FROM exam_reports
     WHERE user_id = $1 AND is_superseded = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!rows.length) return null;
  return { ...rows[0].report_json, reportId: rows[0].id };
}

function normalizeCefr(level) {
  return String(level || "B1").replace("+", "").slice(0, 2).toUpperCase();
}

function normalizeProductType(type) {
  const allowed = [
    "weekly_plan",
    "placement_test",
    "ai_exam",
    "intensive_week",
    "premium_month",
  ];
  const t = String(type || "ai_exam");
  return allowed.includes(t) ? t : "ai_exam";
}

/**
 * Import legacy localStorage reports during migration (creates completed session + council stub).
 * @param {string} userId
 * @param {Object[]} legacyReports
 */
export async function importLegacyReports(userId, legacyReports = []) {
  let imported = 0;
  for (const legacy of legacyReports) {
    const reportId = legacy.id || randomUUID();
    const productType = normalizeProductType(legacy.type || legacy.productType);
    const cefrLevel = normalizeCefr(legacy.level || legacy.cefrLevel);
    const overallScore = Number(legacy.overallScore || legacy.score || 60);
    const confidence = Number(legacy.confidence || 70);
    const rulesVersion = legacy.rulesVersion || "0.0.0";
    const blueprintId = legacy.blueprintId || `import_${reportId}`;
    const summary = legacy.summary || legacy.title || `${productType} import`;
    const decisionJson = {
      overallScore,
      cefrLevel,
      confidence,
      needsHumanReview: false,
      rulesVersion,
      source: "migration_import",
    };

    const sessionId = randomUUID();
    await query(
      `INSERT INTO exam_sessions (
        id, user_id, product_type, mode, status, blueprint, rules_version,
        completed_at, started_at, idempotency_key
      ) VALUES ($1, $2, $3::product_type, 'exam', 'completed', $4::jsonb, $5, NOW(), NOW(), $6)
      ON CONFLICT DO NOTHING`,
      [
        sessionId,
        userId,
        productType,
        JSON.stringify({ blueprintId, productType, imported: true }),
        rulesVersion,
        `import_${reportId}`,
      ]
    );

    const { rows: decRows } = await query(
      `INSERT INTO council_decisions (
        decision_json, overall_score, cefr_level, confidence, needs_human_review,
        rules_version, examiner_mind_version
      ) VALUES ($1::jsonb, $2, $3::cefr_label, $4, FALSE, $5, '2.0.0-contract')
      RETURNING id`,
      [JSON.stringify(decisionJson), overallScore, cefrLevel, confidence, rulesVersion]
    );

    const reportJson = {
      ...legacy,
      reportId,
      productType,
      mode: "exam",
      evaluationMethod: legacy.evaluationMethod || "examiner_mind",
      cefrLevel,
      overallScore,
      confidence,
      summary,
      rulesVersion,
      blueprintId,
      importedAt: new Date().toISOString(),
    };

    await query(
      `INSERT INTO exam_reports (
        id, user_id, session_id, council_decision_id, product_type, mode,
        evaluation_method, cefr_level, overall_score, confidence,
        strengths, weaknesses, recurring_mistakes, focus_areas,
        summary, recommendations, study_advice, improvement_priorities,
        report_json, rules_version, blueprint_id, legacy_adapter_key
      ) VALUES (
        $1, $2, $3, $4, $5::product_type, 'exam',
        'examiner_mind', $6::cefr_label, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17::jsonb, $18, $19, 'legacy_import'
      )
      ON CONFLICT (id) DO NOTHING`,
      [
        reportId,
        userId,
        sessionId,
        decRows[0].id,
        productType,
        cefrLevel,
        overallScore,
        confidence,
        legacy.strengths || [],
        legacy.weaknesses || [],
        legacy.recurringMistakes || [],
        legacy.focusAreas || [],
        summary,
        legacy.recommendations || [],
        legacy.studyAdvice || [],
        legacy.improvementPriorities || [],
        JSON.stringify(reportJson),
        rulesVersion,
        blueprintId,
      ]
    );
    imported += 1;
  }
  return imported;
}
