import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { success } from "../../utils/response.js";
import {
  getRegistrationOverview,
  updateRegistrationSettings,
} from "../../services/registrationCapacityService.js";
import {
  exportWaitlistCsv,
  getWaitlistSummary,
  listWaitlistEntries,
  updateWaitlistEntry,
} from "../../services/waitlistService.js";
import { AppError } from "../../middleware/errorHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", async (_req, res, next) => {
  try {
    const overview = await getRegistrationOverview();
    const waitlist = await getWaitlistSummary();
    success(res, { overview, waitlist });
  } catch (e) {
    next(e);
  }
});

router.get("/waitlist", async (req, res, next) => {
  try {
    success(
      res,
      await listWaitlistEntries({
        search: req.query.search,
        limit: req.query.limit,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.patch("/waitlist/:entryId", async (req, res, next) => {
  try {
    success(
      res,
      await updateWaitlistEntry(req.params.entryId, {
        status: req.body?.status,
        adminNotes: req.body?.adminNotes,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get("/waitlist/export.csv", async (_req, res, next) => {
  try {
    const csv = await exportWaitlistCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="registration-waitlist.csv"');
    res.status(200).send(csv);
  } catch (e) {
    next(e);
  }
});

router.patch("/settings", async (req, res, next) => {
  try {
    const overview = await updateRegistrationSettings({
      capacity: req.body?.capacity,
      manualState: req.body?.manualState,
    });
    success(res, { overview });
  } catch (e) {
    next(e);
  }
});

router.get("/waitlist/:entryId", async (req, res, next) => {
  try {
    const items = await listWaitlistEntries({ search: "", limit: 200 });
    const entry = items.find((item) => item.id === req.params.entryId);
    if (!entry) throw new AppError("NOT_FOUND", "Wartelisteneintrag nicht gefunden.", 404);
    success(res, { entry });
  } catch (e) {
    next(e);
  }
});

export default router;
