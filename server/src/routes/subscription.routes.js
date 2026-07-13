import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";
import {
  createCheckoutSession,
  getSubscriptionForUser,
  consumeSubscriptionExamDirect,
} from "../repositories/subscriptionRepository.js";
import { rowToApiUser, findUserById } from "../repositories/userRepository.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireIdempotency } from "../middleware/idempotency.js";

const router = Router();

router.get("/", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const sub = await getSubscriptionForUser(req.auth.userId);
    const user = await findUserById(req.auth.userId);
    success(res, { subscription: rowToApiUser(user, sub).subscription, permissions: rowToApiUser(user, sub).permissions });
  } catch (e) {
    next(e);
  }
});

router.post("/checkout", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const { planType } = req.body;
    if (!planType) throw new AppError("VALIDATION_ERROR", "planType erforderlich.", 400);
    const result = await createCheckoutSession(req.auth.userId, planType);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post("/consume-exam", requireAuth, requireActiveAccess, requireIdempotency("POST /subscription/consume-exam"), async (req, res, next) => {
  try {
    const { productType, examIndex = 1 } = req.body;
    if (!productType) throw new AppError("VALIDATION_ERROR", "productType erforderlich.", 400);
    const sub = await getSubscriptionForUser(req.auth.userId);
    if (!sub || sub.status !== "active") {
      throw new AppError("SUBSCRIPTION_INACTIVE", "Kein aktives Abonnement.", 403);
    }
    const remaining = await consumeSubscriptionExamDirect(
      req.auth.userId,
      sub.id,
      productType,
      examIndex,
      req.idempotencyKey
    );
    success(res, { remainingExams: remaining, productType, examIndex });
  } catch (e) {
    next(e);
  }
});

export default router;
