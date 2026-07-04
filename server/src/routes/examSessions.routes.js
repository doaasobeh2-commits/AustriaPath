import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth } from "../middleware/auth.js";
import { requireIdempotency } from "../middleware/idempotency.js";
import {
  cancelExamSession,
  completeExamSession,
  getActiveSession,
  getSession,
  startExamSession,
  submitSection,
} from "../services/examSessionService.js";

const router = Router();

router.post("/", requireAuth, requireIdempotency("POST /exam-sessions"), async (req, res, next) => {
  try {
    const data = await startExamSession(req.auth.userId, {
      ...req.body,
      idempotencyKey: req.idempotencyKey,
    });
    success(res, data, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/active", requireAuth, async (req, res, next) => {
  try {
    const session = await getActiveSession(req.auth.userId, req.query.productType);
    success(res, { session });
  } catch (e) {
    next(e);
  }
});

router.get("/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const session = await getSession(req.auth.userId, req.params.sessionId);
    success(res, { session });
  } catch (e) {
    next(e);
  }
});

router.post("/:sessionId/sections", requireAuth, async (req, res, next) => {
  try {
    const data = await submitSection(req.auth.userId, req.params.sessionId, req.body);
    success(res, data);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:sessionId/complete",
  requireAuth,
  requireIdempotency("POST /exam-sessions/:sessionId/complete"),
  async (req, res, next) => {
    try {
      const data = await completeExamSession(req.auth.userId, req.params.sessionId, req.idempotencyKey);
      success(res, data);
    } catch (e) {
      next(e);
    }
  }
);

router.post("/:sessionId/cancel", requireAuth, async (req, res, next) => {
  try {
    const data = await cancelExamSession(req.auth.userId, req.params.sessionId);
    success(res, data);
  } catch (e) {
    next(e);
  }
});

export default router;
