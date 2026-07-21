/**
 * Placement-only routes. Mounted at /placement under the /v1 app.
 * Final URLs:
 *   POST /v1/placement/evaluate-turn
 *   POST /v1/placement/report
 */

import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";
import { aiRateLimit, aiDailyRateLimit } from "../middleware/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluatePlacementTurn } from "../services/placementEvaluateService.js";
import { polishPlacementReport } from "../services/placementReportService.js";
import {
  consumePlacementAttempt,
  getPlacementEntitlement,
} from "../services/placementEntitlementService.js";

const router = Router();

router.get("/entitlement", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    success(res, await getPlacementEntitlement(req.auth.userId));
  } catch (e) {
    next(e);
  }
});

router.post("/consume-entitlement", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    success(res, await consumePlacementAttempt(req.auth.userId, req.body?.idempotencyKey));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/evaluate-turn",
  requireAuth,
  requireActiveAccess,
  aiRateLimit,
  aiDailyRateLimit,
  async (req, res, next) => {
    try {
      const {
        productType,
        modelId,
        answerText,
        followUpCount,
        conversation,
        currentQuestion,
        inputMode,
        selectedImage,
        selectedLevel: _ignoredSelectedLevel,
      } = req.body || {};

      if (!modelId || typeof modelId !== "string") {
        throw new AppError("VALIDATION_ERROR", "modelId ist erforderlich.", 400);
      }
      if (answerText == null || typeof answerText !== "string") {
        throw new AppError(
          "VALIDATION_ERROR",
          "answerText ist erforderlich.",
          400
        );
      }

      const data = await evaluatePlacementTurn({
        userId: req.auth.userId,
        productType: productType || "placement_test",
        modelId,
        answerText,
        followUpCount: followUpCount ?? 0,
        conversation: Array.isArray(conversation) ? conversation : [],
        currentQuestion: currentQuestion ?? null,
        inputMode: inputMode ?? "typed",
        selectedImage: selectedImage ?? null,
        authUser: req.auth.user,
      });

      success(res, data);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/report",
  requireAuth,
  requireActiveAccess,
  aiRateLimit,
  aiDailyRateLimit,
  async (req, res, next) => {
    try {
      const payload = req.body || {};
      if (!payload.level || !payload.skillBands) {
        throw new AppError(
          "VALIDATION_ERROR",
          "level und skillBands sind erforderlich.",
          400
        );
      }

      const data = await polishPlacementReport({
        userId: req.auth.userId,
        payload,
        authUser: req.auth.user,
      });

      success(res, data);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
