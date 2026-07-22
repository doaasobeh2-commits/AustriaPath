import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

describe("Placement provider evaluation", () => {
  const originalFetch = globalThis.fetch;
  let userId;
  let attemptId;
  let closeDb;
  let query;
  let evaluatePlacementTurn;
  let polishPlacementReport;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.USE_PGLITE = "true";
    process.env.OPENAI_API_KEY = "test-provider-placeholder";
    const db = await import("../../server/src/db/client.js");
    ({ closeDb, query } = db);
    const { initDb, runMigrations } = db;
    const entitlement = await import(
      "../../server/src/services/placementEntitlementService.js"
    );
    const provider = await import(
      "../../server/src/services/placementEvaluateService.js"
    );
    evaluatePlacementTurn = provider.evaluatePlacementTurn;
    ({ polishPlacementReport } = await import(
      "../../server/src/services/placementReportService.js"
    ));
    await initDb();
    await runMigrations();
    const { rows } = await query(
      `INSERT INTO users
         (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES
         ('placement-provider@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 0, TRUE)
       RETURNING id`
    );
    userId = rows[0].id;
    await query(
      `INSERT INTO subscriptions
         (user_id, type, status, remaining_exams, permissions, is_current)
       VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
      [userId]
    );
    await entitlement.grantPlacementAttempt(userId);
    const started = await entitlement.beginPlacementAttempt(userId);
    attemptId = started.attemptId;
  });

  afterAll(async () => {
    await closeDb();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("evaluates a voice transcript through the configured provider path", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                band: "strong",
                coveredTopics: ["Name", "Wohnort", "Arbeit oder Kurs"],
                missingTopics: ["Freizeit"],
                needsFollowUp: true,
                followUpQuestion: "Was machen Sie gern in Ihrer Freizeit?",
                followUpSource: "examinerQuestions",
                notes: ["zusammenhängende Antwort"],
              }),
            },
          },
        ],
      }),
    });

    const result = await evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "turn:0:0",
      productType: "placement_test",
      modelId: "a2_self_mittel",
      answerText: "Ich heiße Mina, wohne in Wien und arbeite in einem Hotel.",
      currentQuestion: "Stellen Sie sich bitte kurz vor.",
      inputMode: "voice_transcript",
      conversation: [],
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      band: "strong",
      evaluationMethod: "placement-ai-turn-v1",
      needsFollowUp: true,
      followUpQuestion: "Was machen Sie gern in Ihrer Freizeit?",
      creditsUsed: 0,
      creditsRemaining: null,
    });
    const credits = await query(
      `SELECT ai_credits, used_ai_credits FROM users WHERE id = $1`,
      [userId]
    );
    expect(credits.rows[0]).toMatchObject({ ai_credits: 0, used_ai_credits: 0 });
    const usage = await query(
      `SELECT credits_charged FROM ai_completion_logs
       WHERE user_id = $1 AND service_type = 'placement_test'`,
      [userId]
    );
    expect(usage.rows).toEqual([{ credits_charged: 0 }]);

    const replay = await evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "turn:0:0",
      productType: "placement_test",
      modelId: "a2_self_mittel",
      answerText: "Ich heiße Mina, wohne in Wien und arbeite in einem Hotel.",
      currentQuestion: "Stellen Sie sich bitte kurz vor.",
      inputMode: "voice_transcript",
      conversation: [],
    });
    expect(replay).toEqual(result);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const turnMetadata = await query(
      `SELECT metadata FROM subscriptions
       WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    expect(turnMetadata.rows[0].metadata.placementUsage).toMatchObject({
      evaluatedTurns: 1,
      reports: 0,
    });
    expect(turnMetadata.rows[0].metadata.placementUsage.completedOperations).toHaveLength(1);
    expect(JSON.stringify(turnMetadata.rows[0].metadata)).not.toContain(
      "Ich heiße Mina"
    );

    await expect(
      evaluatePlacementTurn({
        userId,
        attemptId,
        idempotencyKey: "turn:0:0",
        productType: "placement_test",
        modelId: "a2_self_mittel",
        answerText: "Diese materiell andere Antwort darf nicht wiederverwendet werden.",
        currentQuestion: "Stellen Sie sich bitte kurz vor.",
        inputMode: "voice_transcript",
        conversation: [],
      })
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_MISMATCH", status: 409 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Decke.", "covered", "decke"],
    ["Nichts.", "tested_but_weak_or_incomplete", "nichts"],
    ["Ein Ball.", "covered", "ball"],
  ])("evaluates a short usable Planning answer %s and advances", async (answerText, expectedState, key) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({ band: "weak", needsFollowUp: true }),
          },
        }],
      }),
    });

    const result = await evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: `planning-short:${key}`,
      productType: "placement_test",
      modelId: "a2_planung_picknick",
      answerText,
      currentQuestion: "Was brauchen wir noch für das Picknick?",
      currentMoveId: "picnic-items",
      inputMode: "voice_transcript",
      conversation: [
        { moveId: "picnic-time", question: "Termin?", transcript: "Samstag um zehn Uhr." },
        { moveId: "picnic-meet", question: "Treffpunkt?", transcript: "Wir treffen uns vor dem Park." },
        { moveId: "picnic-food", question: "Essen?", transcript: "Wir bringen Brot und Wasser mit." },
      ],
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.planningEvidenceLedger.items.finalState).toBe(expectedState);
    expect(result.followUpQuestionId).toBe("picnic-reaction");
    expect(result.followUpQuestionId).not.toBe("picnic-items");
  });

  it("keeps empty Planning and short non-Planning answers on validation failure", async () => {
    globalThis.fetch = vi.fn();
    await expect(evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "planning-empty",
      productType: "placement_test",
      modelId: "a2_planung_picknick",
      answerText: "   ",
      currentMoveId: "picnic-items",
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    await expect(evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "planning-punctuation-only",
      productType: "placement_test",
      modelId: "a2_planung_picknick",
      answerText: "...",
      currentMoveId: "picnic-items",
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    await expect(evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "self-short",
      productType: "placement_test",
      modelId: "a2_self_mittel",
      answerText: "Kurz.",
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("polishes one report without pooled credits and logs zero charged credits", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                levelExplanation: "Solide Grundlage.",
                areas: [],
                strengths: [],
                improvements: [],
                recommendations: ["Weiter üben."],
                studyPlan: [],
              }),
            },
          },
        ],
      }),
    });

    const result = await polishPlacementReport({
      userId,
      attemptId,
      idempotencyKey: "report:final",
      payload: {
        productType: "placement_test",
        level: "A2",
        skillBands: { selbstvorstellung: "strong" },
        strengths: [],
        weaknesses: [],
        evidenceSummary: {},
        deterministicReport: {},
      },
    });

    expect(result).toMatchObject({
      level: "A2",
      creditsUsed: 0,
      creditsRemaining: null,
    });
    const credits = await query(
      `SELECT ai_credits, used_ai_credits FROM users WHERE id = $1`,
      [userId]
    );
    expect(credits.rows[0]).toMatchObject({ ai_credits: 0, used_ai_credits: 0 });
    const usage = await query(
      `SELECT mode, credits_charged FROM ai_completion_logs
       WHERE user_id = $1 AND service_type = 'placement_test'
       ORDER BY created_at`,
      [userId]
    );
    expect(usage.rows).toEqual([
      { mode: "conversational", credits_charged: 0 },
      { mode: "conversational", credits_charged: 0 },
      { mode: "conversational", credits_charged: 0 },
      { mode: "conversational", credits_charged: 0 },
      { mode: "report_narrative", credits_charged: 0 },
    ]);

    const replay = await polishPlacementReport({
      userId,
      attemptId,
      idempotencyKey: "report:final",
      payload: {
        productType: "placement_test",
        level: "A2",
        skillBands: { selbstvorstellung: "strong" },
        strengths: [],
        weaknesses: [],
        evidenceSummary: {},
        deterministicReport: {},
      },
    });
    expect(replay).toEqual(result);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    await expect(
      polishPlacementReport({
        userId,
        attemptId,
        idempotencyKey: "report:final",
        payload: {
          productType: "placement_test",
          level: "B1",
          skillBands: { selbstvorstellung: "strong" },
          strengths: [],
          weaknesses: [],
          evidenceSummary: {},
          deterministicReport: {},
        },
      })
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_MISMATCH", status: 409 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const reportMetadata = await query(
      `SELECT metadata FROM subscriptions
       WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    expect(reportMetadata.rows[0].metadata.placementUsage).toMatchObject({
      evaluatedTurns: 4,
      reports: 1,
    });
    expect(reportMetadata.rows[0].metadata.placementUsage.completedOperations).toHaveLength(5);
  });
});
