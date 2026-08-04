import { Router } from "express";
import { success } from "../utils/response.js";
import { getRegistrationOverview } from "../services/registrationCapacityService.js";
import { joinWaitlist } from "../services/waitlistService.js";
import { waitlistRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.get("/status", async (_req, res, next) => {
  try {
    const overview = await getRegistrationOverview();
    success(res, {
      registrationState: overview.registrationState,
      capacity: overview.capacity,
      counted: overview.counted,
      spotsRemaining: overview.spotsRemaining,
      isOpen: overview.isOpen,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/waitlist", waitlistRateLimit, async (req, res, next) => {
  try {
    const entry = await joinWaitlist({
      email: req.body?.email,
      displayName: req.body?.displayName,
      preferredLanguage: req.body?.preferredLanguage,
    });
    success(res, { entry }, 201);
  } catch (e) {
    next(e);
  }
});

export default router;
