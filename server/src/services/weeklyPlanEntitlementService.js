import { query, withTransaction } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { getSubscriptionForUser } from "../repositories/subscriptionRepository.js";
import { getPermissionsByPlan } from "../utils/permissions.js";

function weeklyPlanPermissions(subscription) {
  if (subscription?.permissions && typeof subscription.permissions === "object") {
    return subscription.permissions;
  }
  return getPermissionsByPlan(subscription?.type || "free");
}

export async function getWeeklyPlanEntitlement(userId) {
  const subscription = await getSubscriptionForUser(userId);
  if (!subscription || subscription.status !== "active") {
    return {
      canAccess: false,
      planType: subscription?.type || "free",
    };
  }

  const permissions = weeklyPlanPermissions(subscription);
  return {
    canAccess: Boolean(permissions.weeklyPlan),
    planType: subscription.type,
  };
}

export async function grantWeeklyPlanAccess(userId) {
  const { rows: users } = await query(
    `SELECT id, status FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  if (!users.length) {
    throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
  }
  if (users[0].status === "blocked") {
    throw new AppError("AUTH_BLOCKED", "Benutzer ist gesperrt.", 403);
  }

  const existing = await getWeeklyPlanEntitlement(userId);
  if (existing.canAccess) {
    return {
      granted: false,
      alreadyEntitled: true,
      planType: existing.planType,
    };
  }

  await withTransaction(async (q) => {
    await q(
      `UPDATE subscriptions SET is_current = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    await q(
      `INSERT INTO subscriptions (
         user_id, type, status, remaining_exams, permissions, is_current,
         start_date, metadata
       ) VALUES (
         $1, 'weekly_plan'::subscription_type, 'active', 0, $2::jsonb,
         TRUE, NOW(), $3::jsonb
       )`,
      [
        userId,
        JSON.stringify(getPermissionsByPlan("weekly_plan")),
        JSON.stringify({ source: "admin_grant_weekly_plan_pilot" }),
      ]
    );
    await q(
      `UPDATE users SET plan = 'weekly_plan'::subscription_type, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  });

  return {
    granted: true,
    alreadyEntitled: false,
    planType: "weekly_plan",
  };
}
