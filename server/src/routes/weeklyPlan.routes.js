/**
 * Weekly Plan routes. Mounted at /weekly-plan under /v1.
 *   POST /v1/weekly-plan/correct-schreiben
 */

import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";
import { aiRateLimit, aiDailyRateLimit } from "../middleware/rateLimit.js";
import { requireWeeklyPlanEntitlement } from "../middleware/requireWeeklyPlanEntitlement.js";
import { AppError } from "../middleware/errorHandler.js";
import { correctA2SchreibenEmail } from "../services/a2SchreibenCorrectionService.js";
import { getWeeklyPlanEntitlement } from "../services/weeklyPlanEntitlementService.js";
import { query } from "../db/client.js";
import { env } from "../config/env.js";
import { isAdminUser } from "../utils/adminAccess.js";

const router = Router();

router.get("/entitlement", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    success(res, await getWeeklyPlanEntitlement(req.auth.userId));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/correct-schreiben",
  requireAuth,
  requireActiveAccess,
  requireWeeklyPlanEntitlement,
  aiRateLimit,
  aiDailyRateLimit,
  async (req, res, next) => {
    try {
      const idempotencyKey =
        req.headers["idempotency-key"] || req.body?.idempotencyKey;
      if (!idempotencyKey || typeof idempotencyKey !== "string") {
        throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist erforderlich.", 400);
      }

      const input = req.body?.input || req.body;
      const data = await correctA2SchreibenEmail({
        input,
        idempotencyKey,
        userId: req.auth.userId,
      });

      try {
        await query(
          `INSERT INTO ai_completion_logs (user_id, mode, service_type, model_name, credits_charged, success)
           VALUES ($1, 'llm_proposal'::ai_gateway_mode, $2, $3, $4, TRUE)`,
          [
            req.auth.userId,
            "weekly_plan_schreiben",
            env.openaiModel,
            isAdminUser(req.auth?.user) ? 0 : 0,
          ]
        );
      } catch {
        // Logging must not block correction delivery.
      }

      success(res, data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
