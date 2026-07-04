import { getCurrentUser, getUsers, saveCurrentUser, saveUsers } from "../app/userAccess";
import { grantPlan } from "../data/subscriptionEngine";

/** Maps SubscriptionScreen plan.type to subscriptionEngine plan types */
const PLAN_TYPE_MAP = {
  placement: "placement_test",
  placement_test: "placement_test",
  weekly_plan: "weekly_plan",
  ai_exam: "ai_exam",
  intensive_week: "intensive_week",
  premium_month: "premium_month",
};

/**
 * Syncs localStorage premium flags with the user record (client-side beta only).
 * Backend replaces this with Stripe webhook + GET /auth/me.
 */
export function applyClientPlanSelection(plan) {
  const engineType = PLAN_TYPE_MAP[plan.type] || plan.type;
  const currentUser = getCurrentUser();

  if (!currentUser?.id) {
    return null;
  }

  const users = getUsers();
  const updatedUsers = users.map((user) =>
    user.id === currentUser.id ? grantPlan(user, engineType) : user
  );

  saveUsers(updatedUsers);

  const updatedUser = updatedUsers.find((user) => user.id === currentUser.id);
  if (updatedUser) {
    const { password: _password, ...sessionUser } = updatedUser;
    saveCurrentUser(sessionUser);
  }

  return updatedUser || null;
}
