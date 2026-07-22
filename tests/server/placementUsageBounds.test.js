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

  it("derives a bounded allowance that fits the longest legitimate current flow", async () => {
    const longestPlanningPath = Math.max(
      ...placementPlanningPacks.map((pack) => pack.mainMoves.length)
    );
    expect(longestPlanningPath).toBe(8);
    expect(PLACEMENT_TURN_BOUNDS).toEqual({
      selbstvorstellung: 3,
      bildbeschreibung: 3,
      planung: longestPlanningPath,
    });
    expect(PLACEMENT_TURN_LIMIT).toBe(14);

    const longestPack = placementPlanningPacks.find(
      (pack) => pack.mainMoves.length === longestPlanningPath
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
      ...longestPack.mainMoves.map((move) => ({
        key: `turn:3:${longestPack.scenarioId}:${move.id}`,
        payload: {
          skill: "planung",
          modelId: longestPack.scenarioId,
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
      moveId: longestPack.finalMoveId,
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

  it("allows Self, Bild, and every Picknick move through closing and completion", async () => {
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
    const turnKeys = [
      ...[0, 1, 2].map((turn) => `turn:0:${turn}`),
      ...[0, 1, 2].map((turn) => `turn:1:${turn}`),
      ...picnicPack.mainMoves.map(
        (move) => `turn:3:${picnicPack.scenarioId}:${move.id}`
      ),
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
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "report",
          idempotencyKey: "report:final",
          requestPayload: { level: "A2" },
        },
        async () => "report"
      )
    ).resolves.toBe("report");

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
