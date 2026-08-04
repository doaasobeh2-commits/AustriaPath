/**
 * B1 Weekly Training AI routes.
 * Mounted at /weekly-training-ai/b1 under /v1.
 */

import { Router } from "express";
import { success } from "../../utils/response.js";
import { requireAuth, requireActiveAccess } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { requireWeeklyPlanEntitlement } from "../../middleware/requireWeeklyPlanEntitlement.js";
import { getB1WeeklyTrainingAiConfig } from "../core/config.js";
import { assertValidIdempotencyKey, readIdempotencyKey } from "../core/idempotency.js";
import {
  beginB1WeeklyTrainingConversation,
  completeB1WeeklyTrainingSession,
  getB1WeeklyTrainingSession,
  saveB1TrainingMemory,
  startB1WeeklyTrainingSession,
  turnB1WeeklyTrainingSession,
} from "../core/sessionService.js";
import { completeB1TrainingDay } from "../core/dayService.js";
import {
  validateDayCompleteBody,
  validateSessionCompleteBody,
  validateSessionMemoryBody,
  validateSessionStartBody,
  validateSessionTurnBody,
} from "../schemas/sessionSchemas.js";

const router = Router();

const weeklyPlanGuards = [requireAuth, requireActiveAccess, requireWeeklyPlanEntitlement];

const b1WeeklyTrainingRateLimit = rateLimit({
  max: Number(process.env.B1_WEEKLY_PLAN_TASK_AI_RATE_LIMIT_PER_MIN || 30),
  windowMs: 60_000,
  keyFn: (req) => `b1-weekly-training-ai:${req.auth?.userId || req.ip}`,
});

router.post(
  "/sessions/start",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      const idempotencyKey = assertValidIdempotencyKey(readIdempotencyKey(req));
      const body = validateSessionStartBody(req.body);
      const result = await startB1WeeklyTrainingSession({
        userId: req.auth.userId,
        idempotencyKey,
        ...body,
      });
      success(res, result, result.replayed ? 200 : 201);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/sessions/:sessionId", ...weeklyPlanGuards, async (req, res, next) => {
  try {
    const result = await getB1WeeklyTrainingSession({
      sessionId: req.params.sessionId,
      userId: req.auth.userId,
    });
    success(res, result);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/sessions/:sessionId/begin",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      const result = await beginB1WeeklyTrainingConversation({
        sessionId: req.params.sessionId,
        userId: req.auth.userId,
      });
      success(res, result, result.replayed ? 200 : 201);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/sessions/:sessionId/turn",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      const body = validateSessionTurnBody(req.body);
      const result = await turnB1WeeklyTrainingSession({
        sessionId: req.params.sessionId,
        userId: req.auth.userId,
        ...body,
      });
      success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/sessions/:sessionId/memory",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      const body = validateSessionMemoryBody(req.body);
      const result = await saveB1TrainingMemory({
        sessionId: req.params.sessionId,
        userId: req.auth.userId,
        ...body,
      });
      success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/sessions/:sessionId/complete",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      assertValidIdempotencyKey(readIdempotencyKey(req));
      validateSessionCompleteBody(req.body);
      const result = await completeB1WeeklyTrainingSession({
        sessionId: req.params.sessionId,
        userId: req.auth.userId,
      });
      success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/days/complete",
  ...weeklyPlanGuards,
  b1WeeklyTrainingRateLimit,
  async (req, res, next) => {
    try {
      const idempotencyKey = assertValidIdempotencyKey(readIdempotencyKey(req));
      const body = validateDayCompleteBody(req.body);
      const result = await completeB1TrainingDay({
        userId: req.auth.userId,
        idempotencyKey,
        ...body,
      });
      success(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/config/health", requireAuth, (_req, res) => {
  const config = getB1WeeklyTrainingAiConfig();
  success(res, {
    enabled: config.enabled,
    model: config.model,
    timeoutMs: config.timeoutMs,
    rateLimitPerMin: config.rateLimitPerMin,
    apiKeyConfigured: Boolean(String(config.apiKey || "").trim()),
  });
});

export default router;
