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
  getPlacementEntitlement,
  grantPlacementAttempt,
} from "../../server/src/services/placementEntitlementService.js";

describe("one-shot Placement entitlement", () => {
  let userId;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES ('placement-entitlement@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 5, TRUE)
       RETURNING id`
    );
    userId = rows[0].id;
    await query(
      `INSERT INTO subscriptions
         (user_id, type, status, remaining_exams, permissions, is_current)
       VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
      [userId]
    );
  });

  afterAll(async () => {
    await closeDb();
  });

  it("keeps failures in progress, resumes, completes once, and permits a fresh admin grant", async () => {
    const before = await query(`SELECT ai_credits FROM users WHERE id = $1`, [userId]);
    expect(before.rows[0].ai_credits).toBe(5);

    const grant = await grantPlacementAttempt(userId);
    expect(grant).toMatchObject({ granted: true, remainingExams: 1 });
    await expect(getPlacementEntitlement(userId)).resolves.toMatchObject({
      canTake: true,
      remainingExams: 1,
      planType: "placement_test",
      attemptStatus: "available",
    });

    const started = await beginPlacementAttempt(userId);
    expect(started).toMatchObject({ started: true, resumed: false, remainingExams: 1 });
    expect(started.attemptId).toBeTruthy();

    // Simulated provider/network failure: no completion call, so nothing is consumed.
    await expect(getPlacementEntitlement(userId)).resolves.toMatchObject({
      canTake: true,
      remainingExams: 1,
      attemptStatus: "in_progress",
      attemptId: started.attemptId,
    });

    const resumed = await beginPlacementAttempt(userId);
    expect(resumed).toMatchObject({
      started: false,
      resumed: true,
      attemptId: started.attemptId,
      remainingExams: 1,
    });

    const completed = await completePlacementAttempt(userId, started.attemptId);
    expect(completed).toMatchObject({ completed: true, replayed: false, remainingExams: 0 });
    const replay = await completePlacementAttempt(userId, started.attemptId);
    expect(replay).toMatchObject({ completed: false, replayed: true, remainingExams: 0 });
    await expect(getPlacementEntitlement(userId)).resolves.toMatchObject({
      canTake: false,
      remainingExams: 0,
      attemptStatus: "completed",
    });

    const after = await query(`SELECT ai_credits FROM users WHERE id = $1`, [userId]);
    expect(after.rows[0].ai_credits).toBe(5);

    const freshGrant = await grantPlacementAttempt(userId);
    expect(freshGrant).toMatchObject({ granted: true, remainingExams: 1 });
    await expect(getPlacementEntitlement(userId)).resolves.toMatchObject({
      canTake: true,
      remainingExams: 1,
      attemptStatus: "available",
    });
  });
});
