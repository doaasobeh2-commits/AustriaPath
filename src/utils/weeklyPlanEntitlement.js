import { useBackend } from "../api/useBackend.js";
import { getWeeklyPlanEntitlement } from "../api/repositories/index.js";
import { getCurrentUser } from "../app/userAccess.js";

export async function fetchWeeklyPlanEntitlementView() {
  if (!useBackend()) {
    return { canAccess: false, source: "disabled" };
  }
  try {
    const data = await getWeeklyPlanEntitlement();
    return {
      canAccess: Boolean(data?.canAccess),
      planType: data?.planType || "free",
      source: "backend",
    };
  } catch (error) {
    return {
      canAccess: false,
      source: "error",
      error: error?.message || "Entitlement check failed",
    };
  }
}

export function canAccessWeeklyPlanFromUser(user = getCurrentUser()) {
  return Boolean(user?.permissions?.weeklyPlan);
}
