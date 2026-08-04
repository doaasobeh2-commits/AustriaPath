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
  getWeeklyPlanEntitlement,
  grantWeeklyPlanAccess,
} from "../../server/src/services/weeklyPlanEntitlementService.js";
import { getPermissionsByPlan } from "../../server/src/utils/permissions.js";

describe("weekly plan entitlement", () => {
  let userId;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES ('weekly-plan-entitlement@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 5, TRUE)
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

  it("denies access before admin grant and allows access after grant", async () => {
    await expect(getWeeklyPlanEntitlement(userId)).resolves.toMatchObject({
      canAccess: false,
      planType: "free",
    });

    const grant = await grantWeeklyPlanAccess(userId);
    expect(grant).toMatchObject({ granted: true, planType: "weekly_plan" });

    await expect(getWeeklyPlanEntitlement(userId)).resolves.toMatchObject({
      canAccess: true,
      planType: "weekly_plan",
    });

    const { rows } = await query(
      `SELECT permissions FROM subscriptions WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    expect(rows[0].permissions).toMatchObject(getPermissionsByPlan("weekly_plan"));
  });

  it("is idempotent when weekly access already exists", async () => {
    const second = await grantWeeklyPlanAccess(userId);
    expect(second).toMatchObject({ granted: false, alreadyEntitled: true });
  });
});
