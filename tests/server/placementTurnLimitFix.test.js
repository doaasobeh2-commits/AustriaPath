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
  grantPlacementAttempt,
  PLACEMENT_TURN_LIMIT,
  withAuthorizedPlacementUsage,
} from "../../server/src/services/placementEntitlementService.js";

async function createPlacementUser(email) {
  const { rows } = await query(
    `INSERT INTO users
       (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
     VALUES
       ($1, 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 0, TRUE)
     RETURNING id`,
    [email]
  );
  const userId = rows[0].id;
  await query(
    `INSERT INTO subscriptions
       (user_id, type, status, remaining_exams, permissions, is_current)
     VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
    [userId]
  );
  await grantPlacementAttempt(userId);
  return userId;
}

async function readPlacementUsage(userId) {
  const { rows } = await query(
    `SELECT metadata FROM subscriptions WHERE user_id = $1 AND is_current = TRUE`,
    [userId]
  );
  return rows[0].metadata.placementUsage;
}

describe("Placement turn limit regression", () => {
  beforeAll(async () => {
    await initDb();
    await runMigrations();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("keeps the configured limit at nine unique AI evaluations", () => {
    expect(PLACEMENT_TURN_LIMIT).toBe(9);
  });

  it("allows evaluations 1 through 9 and rejects only the 10th unique evaluation", async () => {
    const userId = await createPlacementUser("placement-turn-limit@test.local");
    const { attemptId } = await beginPlacementAttempt(userId);

    for (let turn = 0; turn < PLACEMENT_TURN_LIMIT; turn += 1) {
      await expect(
        withAuthorizedPlacementUsage(
          {
            userId,
            attemptId,
            operation: "turn",
            idempotencyKey: `turn:0:${turn}`,
            requestPayload: { skill: "selbstvorstellung", turn },
          },
          async () => ({ turn })
        )
      ).resolves.toEqual({ turn });
    }

    const usage = await readPlacementUsage(userId);
    expect(usage.evaluatedTurns).toBe(9);
    expect(usage.completedOperations).toHaveLength(9);

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:overflow",
          requestPayload: { skill: "selbstvorstellung", turn: 99 },
        },
        async () => "unexpected"
      )
    ).rejects.toMatchObject({ code: "PLACEMENT_TURN_LIMIT_REACHED", status: 409 });
  });

  it("does not increase usage when replaying the same idempotent request", async () => {
    const userId = await createPlacementUser("placement-turn-replay@test.local");
    const { attemptId } = await beginPlacementAttempt(userId);
    const payload = { skill: "selbstvorstellung", turn: 0 };

    await withAuthorizedPlacementUsage(
      {
        userId,
        attemptId,
        operation: "turn",
        idempotencyKey: "turn:0:0",
        requestPayload: payload,
      },
      async () => ({ ok: true })
    );

    let providerCalls = 0;
    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:0",
          requestPayload: payload,
        },
        async () => {
          providerCalls += 1;
          return { ok: false };
        }
      )
    ).resolves.toEqual({ ok: true });
    expect(providerCalls).toBe(0);

    const usage = await readPlacementUsage(userId);
    expect(usage.evaluatedTurns).toBe(1);
    expect(usage.completedOperations).toHaveLength(1);
  });

  it("does not consume a turn when evaluation fails", async () => {
    const userId = await createPlacementUser("placement-turn-failure@test.local");
    const { attemptId } = await beginPlacementAttempt(userId);

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:0",
          requestPayload: { skill: "selbstvorstellung", turn: 0 },
        },
        async () => {
          throw new Error("provider failed");
        }
      )
    ).rejects.toThrow("provider failed");

    const usage = await readPlacementUsage(userId);
    expect(usage.evaluatedTurns).toBe(0);
    expect(usage.completedOperations).toHaveLength(0);
  });

  it("starts a fresh placement attempt with an empty turn counter", async () => {
    const userId = await createPlacementUser("placement-turn-fresh@test.local");
    const started = await beginPlacementAttempt(userId);

    const usage = await readPlacementUsage(userId);
    expect(usage).toMatchObject({
      attemptId: started.attemptId,
      evaluatedTurns: 0,
      reports: 0,
      completedOperations: [],
      completedReportOperation: null,
    });
  });

  it("allows a follow-up evaluation immediately after the first successful evaluation", async () => {
    const userId = await createPlacementUser("placement-turn-followup@test.local");
    const { attemptId } = await beginPlacementAttempt(userId);

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:0",
          requestPayload: { skill: "selbstvorstellung", turn: 0, answer: "Ich heiße Anna." },
        },
        async () => ({ followUp: "Wo wohnen Sie?" })
      )
    ).resolves.toEqual({ followUp: "Wo wohnen Sie?" });

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:1",
          requestPayload: { skill: "selbstvorstellung", turn: 1, answer: "In Wien." },
        },
        async () => ({ accepted: true })
      )
    ).resolves.toEqual({ accepted: true });

    const usage = await readPlacementUsage(userId);
    expect(usage.evaluatedTurns).toBe(2);
    expect(usage.completedOperations).toHaveLength(2);
  });

  it("clears stale usage when restarting after a completed attempt with the same attempt id", async () => {
    const userId = await createPlacementUser("placement-turn-stale@test.local");
    const firstStart = await beginPlacementAttempt(userId);
    const attemptId = firstStart.attemptId;

    for (let turn = 0; turn < PLACEMENT_TURN_LIMIT - 1; turn += 1) {
      await withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: `turn:0:${turn}`,
          requestPayload: { skill: "selbstvorstellung", turn },
        },
        async () => ({ turn })
      );
    }

    const staleUsage = await readPlacementUsage(userId);
    expect(staleUsage.evaluatedTurns).toBe(8);

    const { rows } = await query(
      `SELECT id, metadata FROM subscriptions WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    const metadata = rows[0].metadata;
    metadata.placementAttempt = {
      ...metadata.placementAttempt,
      id: attemptId,
      status: "available",
    };
    await query(`UPDATE subscriptions SET metadata = $2::jsonb WHERE id = $1`, [
      rows[0].id,
      JSON.stringify(metadata),
    ]);

    const restarted = await beginPlacementAttempt(userId);
    expect(restarted).toMatchObject({
      started: true,
      resumed: false,
      attemptId,
    });

    const freshUsage = await readPlacementUsage(userId);
    expect(freshUsage).toMatchObject({
      attemptId,
      evaluatedTurns: 0,
      completedOperations: [],
    });

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:0",
          requestPayload: { skill: "selbstvorstellung", turn: 0 },
        },
        async () => ({ turn: 0 })
      )
    ).resolves.toEqual({ turn: 0 });

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey: "turn:0:1",
          requestPayload: { skill: "selbstvorstellung", turn: 1 },
        },
        async () => ({ turn: 1 })
      )
    ).resolves.toEqual({ turn: 1 });
  });
});
