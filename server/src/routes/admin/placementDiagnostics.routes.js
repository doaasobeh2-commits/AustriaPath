/**
 * Admin-only placement diagnostic routes.
 */

import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  exportPlacementDiagnosticSession,
  getPlacementDiagnosticConfig,
  getPlacementDiagnosticSession,
  listPlacementDiagnosticSessions,
  updatePlacementDiagnosticConfig,
} from "../services/placementDiagnosticService.js";

const router = Router();

router.get("/config", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    success(res, await getPlacementDiagnosticConfig());
  } catch (e) {
    next(e);
  }
});

router.patch("/config", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    success(res, await updatePlacementDiagnosticConfig(req.body || {}));
  } catch (e) {
    next(e);
  }
});

router.get("/sessions", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const filter = String(req.query?.filter || "all");
    const config = await getPlacementDiagnosticConfig();
    success(res, {
      config,
      sessions: await listPlacementDiagnosticSessions(filter),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/sessions/:attemptId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const session = await getPlacementDiagnosticSession(req.params.attemptId);
    success(res, session);
  } catch (e) {
    next(e);
  }
});

router.get("/sessions/:attemptId/export", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const exported = await exportPlacementDiagnosticSession(req.params.attemptId);
    success(res, exported);
  } catch (e) {
    next(e);
  }
});

export default router;
