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
  withAuthorizedPlacementUsage,
} from "../../server/src/services/placementEntitlementService.js";

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

  it("allows nine turns, rolls back failures, and rejects a tenth", async () => {
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:failed",
          requestPayload: { answer: "failed" },
        },
        async () => {
          throw new Error("provider failed");
        }
      )
    ).rejects.toThrow("provider failed");

    for (let i = 0; i < 9; i += 1) {
      await expect(
        withAuthorizedPlacementUsage(
          {
            userId,
            attemptId,
            operation: "turn",
            idempotencyKey: `turn:${i}`,
            requestPayload: { answer: i },
          },
          async () => i
        )
      ).resolves.toBe(i);
    }

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:10",
          requestPayload: { answer: 10 },
        },
        async () => "unexpected"
      )
    ).rejects.toMatchObject({ code: "PLACEMENT_TURN_LIMIT_REACHED", status: 409 });
  });

  it("allows exactly one report for the completed matching attempt", async () => {
    await completePlacementAttempt(userId, attemptId);
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
