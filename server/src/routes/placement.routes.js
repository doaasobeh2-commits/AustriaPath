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
  beginPlacementAttempt,
  completePlacementAttempt,
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
    success(res, await beginPlacementAttempt(req.auth.userId));
  } catch (e) {
    next(e);
  }
});

router.post("/begin-attempt", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    success(res, await beginPlacementAttempt(req.auth.userId));
  } catch (e) {
    next(e);
  }
});

router.post("/complete-attempt", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    success(
      res,
      await completePlacementAttempt(
        req.auth.userId,
        req.body?.attemptId,
        req.body?.reportSnapshot
      )
    );
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
        currentMoveId,
        inputMode,
        selectedImage,
        attemptId,
        selectedLevel: _ignoredSelectedLevel,
      } = req.body || {};

      if (!attemptId || typeof attemptId !== "string") {
        throw new AppError("VALIDATION_ERROR", "attemptId ist erforderlich.", 400);
      }
      const idempotencyKey =
        req.headers["idempotency-key"] || req.body?.idempotencyKey;
      if (!idempotencyKey || typeof idempotencyKey !== "string") {
        throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist erforderlich.", 400);
      }

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
        currentMoveId: currentMoveId ?? null,
        inputMode: inputMode ?? "typed",
        selectedImage: selectedImage ?? null,
        attemptId,
        idempotencyKey,
      });

      success(res, data);
    } catch (e) {
      console.error("[placement] evaluate-turn failed", {
        code: e?.code || "INTERNAL_ERROR",
        status: e?.status || 500,
      });
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
      if (!payload.attemptId || typeof payload.attemptId !== "string") {
        throw new AppError("VALIDATION_ERROR", "attemptId ist erforderlich.", 400);
      }
      const idempotencyKey =
        req.headers["idempotency-key"] || payload.idempotencyKey;
      if (!idempotencyKey || typeof idempotencyKey !== "string") {
        throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist erforderlich.", 400);
      }
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
        attemptId: payload.attemptId,
        idempotencyKey,
      });

      success(res, data);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
