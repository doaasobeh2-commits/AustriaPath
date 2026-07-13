import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";
import { query } from "../db/client.js";
import { importLegacyReports } from "../services/reportPersistenceService.js";

const router = Router();

router.post("/import", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const payload = req.body.payload || {};
    let imported = { reports: 0, profile: false, subscription: false, skippedKeys: [] };

    if (payload.austriaPathStudentProfileV2) {
      await query(
        `UPDATE student_learning_profiles SET profile_json = $2::jsonb, updated_at = NOW() WHERE user_id = $1`,
        [req.auth.userId, JSON.stringify(payload.austriaPathStudentProfileV2)]
      );
      imported.profile = true;
    }

    if (Array.isArray(payload.austriaPathAIReports)) {
      imported.reports = await importLegacyReports(
        req.auth.userId,
        payload.austriaPathAIReports
      );
    }

    if (payload.austriaPathSubscription) {
      imported.subscription = true;
    }

    imported.skippedKeys = ["austriaPathAIErrorLog", "austriaPathExamSession"];
    success(res, { imported });
  } catch (e) {
    next(e);
  }
});

export default router;
