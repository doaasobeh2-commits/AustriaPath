import { AppError } from "./errorHandler.js";
import { getWeeklyPlanEntitlement } from "../services/weeklyPlanEntitlementService.js";

export async function requireWeeklyPlanEntitlement(req, _res, next) {
  try {
    const entitlement = await getWeeklyPlanEntitlement(req.auth.userId);
    if (!entitlement.canAccess) {
      throw new AppError(
        "WEEKLY_PLAN_NOT_ENTITLED",
        "Kein Zugang zum KI-Wochenplan.",
        403
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}
