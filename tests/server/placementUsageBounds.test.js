import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";

import {
  closeDb,
  initDb,
  query,
  runMigrations,
} from "../../server/src/db/client.js";
import {
  beginPlacementAttempt,
  completePlacementAttempt,
  grantPlacementAttempt,
  PLACEMENT_TURN_BOUNDS,
  PLACEMENT_TURN_LIMIT,
  withAuthorizedPlacementUsage,
} from "../../server/src/services/placementEntitlementService.js";
import { placementPlanningPacks } from "../../src/data/placementPlanningPacks.js";
import { placementReportSnapshot } from "../helpers/placementReportSnapshot.js";

describe("Placement attempt usage bounds", () => {
  let userId;
  let attemptId;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    const { rows } = await query(
      `INSERT INTO users
         (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES
         ('placement-usage@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 0, TRUE)
       RETURNING id`
    );
    userId = rows[0].id;
    await query(
      `INSERT INTO subscriptions
         (user_id, type, status, remaining_exams, permissions, is_current)
       VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
      [userId]
    );
    await grantPlacementAttempt(userId);
    const started = await beginPlacementAttempt(userId);
    attemptId = started.attemptId;
  });

  afterAll(async () => {
    await closeDb();
  });

  it("derives a bounded allowance that fits the adaptive 4–5 minute flow", async () => {
    expect(PLACEMENT_TURN_BOUNDS).toEqual({
      selbstvorstellung: 3,
      bildbeschreibung: 3,
      planung: 8,
    });
    expect(PLACEMENT_TURN_LIMIT).toBe(9);

    const picnicPack = placementPlanningPacks.find(
      (pack) => pack.scenarioId === "a2_planung_picknick"
    );
    const planungMoveIds = ["picnic-time", "picnic-reaction", "picnic-close"];
    const planungMoves = planungMoveIds.map((id) =>
      picnicPack.mainMoves.find((move) => move.id === id)
    );
    const legitimateTurns = [
      ...[0, 1, 2].map((turn) => ({
        key: `turn:0:${turn}`,
        payload: { skill: "selbstvorstellung", turn },
      })),
      ...[0, 1, 2].map((turn) => ({
        key: `turn:1:${turn}`,
        payload: { skill: "bildbeschreibung", turn },
      })),
      ...planungMoves.map((move) => ({
        key: `turn:3:${picnicPack.scenarioId}:${move.id}`,
        payload: {
          skill: "planung",
          modelId: picnicPack.scenarioId,
          currentMoveId: move.id,
          answer: `Antwort auf ${move.id}`,
        },
      })),
    ];
    expect(legitimateTurns).toHaveLength(PLACEMENT_TURN_LIMIT);

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: legitimateTurns[0].key,
          requestPayload: legitimateTurns[0].payload,
        },
        async () => {
          throw new Error("provider failed");
        }
      )
    ).rejects.toThrow("provider failed");

    for (const [index, turn] of legitimateTurns.entries()) {
      await expect(
        withAuthorizedPlacementUsage(
          {
            userId,
            attemptId,
            operation: "turn",
            idempotencyKey: turn.key,
            requestPayload: turn.payload,
          },
          async () => ({ index, moveId: turn.payload.currentMoveId || null })
        )
      ).resolves.toEqual({ index, moveId: turn.payload.currentMoveId || null });
    }

    const closingTurn = legitimateTurns.at(-1);
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: closingTurn.key,
          requestPayload: closingTurn.payload,
        },
        async () => "must not run on replay"
      )
    ).resolves.toEqual({
      index: legitimateTurns.length - 1,
      moveId: picnicPack.finalMoveId,
    });

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:overflow",
          requestPayload: { answer: "overflow" },
        },
        async () => "unexpected"
      )
    ).rejects.toMatchObject({ code: "PLACEMENT_TURN_LIMIT_REACHED", status: 409 });
  });

  it("allows Self, Bild, and three Picknick examiner turns through closing", async () => {
    const { rows } = await query(
      `INSERT INTO users
         (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES
         ('placement-picnic-bound@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 0, TRUE)
       RETURNING id`
    );
    const picnicUserId = rows[0].id;
    await query(
      `INSERT INTO subscriptions
         (user_id, type, status, remaining_exams, permissions, is_current)
       VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
      [picnicUserId]
    );
    await grantPlacementAttempt(picnicUserId);
    const picnicAttempt = await beginPlacementAttempt(picnicUserId);
    const picnicPack = placementPlanningPacks.find(
      (pack) => pack.scenarioId === "a2_planung_picknick"
    );
    const planungMoveIds = ["picnic-time", "picnic-reaction", "picnic-close"];
    const turnKeys = [
      ...[0, 1, 2].map((turn) => `turn:0:${turn}`),
      ...[0, 1].map((turn) => `turn:1:${turn}`),
      ...planungMoveIds.map((id) => `turn:3:${picnicPack.scenarioId}:${id}`),
    ];

    for (const key of turnKeys) {
      await expect(
        withAuthorizedPlacementUsage(
          {
            userId: picnicUserId,
            attemptId: picnicAttempt.attemptId,
            operation: "turn",
            idempotencyKey: key,
            requestPayload: { key },
          },
          async () => key
        )
      ).resolves.toBe(key);
    }
    expect(turnKeys.at(-1)).toContain("picnic-close");
    await expect(
      completePlacementAttempt(
        picnicUserId,
        picnicAttempt.attemptId,
        placementReportSnapshot({ level: "A2+" })
      )
    ).resolves.toMatchObject({ completed: true });
  });

  it("allows exactly one report for the completed matching attempt", async () => {
    await completePlacementAttempt(
      userId,
      attemptId,
      placementReportSnapshot({ level: "A2+" })
    );
    let providerCalls = 0;
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "report",
          idempotencyKey: "report:final",
          requestPayload: { level: "A2" },
        },
        async () => {
          providerCalls += 1;
          return "report";
        }
      )
    ).resolves.toBe("report");

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "report",
          idempotencyKey: "report:final",
          requestPayload: { level: "A2" },
        },
        async () => {
          providerCalls += 1;
          return "unexpected";
        }
      )
    ).resolves.toBe("report");
    expect(providerCalls).toBe(1);

    const { rows } = await query(
      `SELECT metadata FROM subscriptions WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    expect(rows[0].metadata.placementUsage.completedOperations).toHaveLength(9);
    expect(rows[0].metadata.placementUsage.completedReportOperation).toMatchObject({
      operation: "report",
      idempotencyKey: "report:final",
      response: "report",
    });

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "report",
          idempotencyKey: "report:second",
          requestPayload: { level: "A2" },
        },
        async () => "unexpected"
      )
    ).rejects.toMatchObject({ code: "PLACEMENT_REPORT_LIMIT_REACHED", status: 409 });
  });

  it("returns a safe replay when legacy metadata lost the report response", async () => {
    const { rows } = await query(
      `SELECT id, metadata FROM subscriptions WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    const metadata = rows[0].metadata;
    delete metadata.placementUsage.completedReportOperation;
    metadata.placementUsage.completedOperations = metadata.placementUsage.completedOperations
      .filter((item) => item?.operation !== "report");
    await query(
      `UPDATE subscriptions SET metadata = $2::jsonb WHERE id = $1`,
      [rows[0].id, JSON.stringify(metadata)]
    );

    let providerCalls = 0;
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "report",
          idempotencyKey: "report:final",
          requestPayload: { level: "A2" },
        },
        async () => {
          providerCalls += 1;
          return "unexpected";
        }
      )
    ).resolves.toEqual({
      alreadyGenerated: true,
      replayed: true,
      polished: null,
      creditsUsed: 0,
      creditsRemaining: null,
    });
    expect(providerCalls).toBe(0);
  });

  it("rejects an unrelated attempt id", async () => {
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId: "00000000-0000-4000-8000-000000000000",
          operation: "report",
          idempotencyKey: "report:invalid",
          requestPayload: { level: "A2" },
        },
        async () => "unexpected"
      )
    ).rejects.toMatchObject({ code: "PLACEMENT_NOT_ENTITLED", status: 403 });
  });
});
