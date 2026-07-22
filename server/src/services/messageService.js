import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

const PLACEMENT_SKILLS = new Set([
  "selbstvorstellung",
  "bildbeschreibung",
  "lesenHoeren",
  "planung",
]);
const PLACEMENT_REPORT_LEVELS = new Set(["A2", "A2+", "B1-", "B1", "B1+", "B2-"]);

function cleanText(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function cleanStringList(value, maxItems = 12, maxLength = 500) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function cleanLearnerItems(value, maxItems = 12) {
  return Array.isArray(value)
    ? value
        .filter((item) => item && item.finalState !== "not_assessed")
        .map((item) => ({
          ...(item.skill ? { skill: cleanText(item.skill, 40) } : {}),
          ...(item.label ? { label: cleanText(item.label, 120) } : {}),
          text: cleanText(item.text || item.label, 500),
          ...(Array.isArray(item.missingTopics)
            ? { missingTopics: cleanStringList(item.missingTopics, 8, 120) }
            : {}),
        }))
        .filter((item) => item.text)
        .slice(0, maxItems)
    : [];
}

/** Freeze an already-finalized learner-facing Placement report. */
export function sanitizePlacementReportSnapshot(value) {
  if (!value || typeof value !== "object" || value.qaOnly) {
    throw new AppError("VALIDATION_ERROR", "Finalisierter Placement-Bericht erforderlich.", 400);
  }
  const level = cleanText(value.level, 8).toUpperCase();
  if (!PLACEMENT_REPORT_LEVELS.has(level)) {
    throw new AppError("VALIDATION_ERROR", "Ungültiges Placement-Niveau.", 400);
  }
  const date = new Date(value.date);
  if (!Number.isFinite(date.getTime())) {
    throw new AppError("VALIDATION_ERROR", "Ungültiges Abschlussdatum.", 400);
  }

  const report = value.learnerReport;
  if (!report || typeof report !== "object") {
    throw new AppError("VALIDATION_ERROR", "Finalisierter Lernbericht erforderlich.", 400);
  }
  const areas = Array.isArray(report.areas)
    ? report.areas
        .filter((area) => PLACEMENT_SKILLS.has(area?.skill))
        .map((area) => ({
          skill: area.skill,
          label: cleanText(area.label, 120),
          performanceLabel: cleanText(area.performanceLabel, 120),
          summary: cleanText(area.summary, 1000),
          coveredTopics: cleanStringList(area.coveredTopics, 12, 120),
          missingTopics: cleanStringList(
            (area.missingTopics || []).filter(
              (topic) => typeof topic === "string"
            ),
            12,
            120
          ),
        }))
        .slice(0, 4)
    : [];
  if (areas.length !== 4 || new Set(areas.map((area) => area.skill)).size !== 4) {
    throw new AppError("VALIDATION_ERROR", "Vier Placement-Bereiche erforderlich.", 400);
  }

  return {
    level,
    date: date.toISOString(),
    learnerReport: {
      levelExplanation: cleanText(report.levelExplanation, 1200),
      areas,
      strengths: cleanLearnerItems(report.strengths),
      improvements: cleanLearnerItems(report.improvements),
      recommendations: cleanStringList(report.recommendations, 12, 500),
      transcripts: Array.isArray(report.transcripts)
        ? report.transcripts
            .slice(0, 24)
            .map((turn) => ({
              skill: cleanText(turn?.skill, 40),
              label: cleanText(turn?.label, 120),
              question: cleanText(turn?.question, 500),
              transcript: cleanText(turn?.transcript, 3000),
            }))
            .filter((turn) => turn.transcript)
        : [],
      studyPlan: Array.isArray(report.studyPlan)
        ? report.studyPlan
            .slice(0, 12)
            .map((item) => ({
              day: cleanText(item?.day, 40),
              skill: cleanText(item?.skill, 80),
              focus: cleanText(item?.focus, 120),
              task: cleanText(item?.task, 800),
            }))
            .filter((item) => item.task)
        : [],
    },
    skillBands: Object.fromEntries(
      Object.entries(value.skillBands || {}).filter(
        ([skill, band]) =>
          PLACEMENT_SKILLS.has(skill) && ["weak", "medium", "strong"].includes(band)
      )
    ),
  };
}

export async function insertPlacementReportMessage(q, { userId, attemptId, snapshot }) {
  const id = randomUUID();
  const dateLabel = new Date(snapshot.date).toLocaleDateString("de-AT");
  const { rows } = await q(
    `INSERT INTO user_messages
       (id, user_id, kind, source_type, source_id, title, subtitle, snapshot)
     VALUES ($1, $2, 'system', 'placement_report', $3,
             'Ihr Ergebnis der Einstufung', $4, $5::jsonb)
     ON CONFLICT (user_id, source_type, source_id) DO NOTHING
     RETURNING id`,
    [id, userId, attemptId, `${snapshot.level} · ${dateLabel}`, JSON.stringify(snapshot)]
  );
  if (rows.length) return rows[0].id;
  const existing = await q(
    `SELECT id FROM user_messages
     WHERE user_id = $1 AND source_type = 'placement_report' AND source_id = $2`,
    [userId, attemptId]
  );
  return existing.rows[0]?.id || null;
}

export async function listMessages(userId) {
  const { rows } = await query(
    `SELECT id, kind, title, subtitle, source_type, source_id, created_at
     FROM user_messages WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    sourceType: row.source_type,
    sourceId: row.source_id,
    createdAt: row.created_at,
  }));
}

export async function getMessage(userId, messageId) {
  const { rows } = await query(
    `SELECT id, kind, title, subtitle, source_type, source_id, snapshot, created_at
     FROM user_messages WHERE id = $1 AND user_id = $2`,
    [messageId, userId]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    sourceType: row.source_type,
    sourceId: row.source_id,
    snapshot: row.snapshot,
    createdAt: row.created_at,
  };
}
