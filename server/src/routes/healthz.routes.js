/**
 * Lightweight liveness probe — no DB, no auth. Must stay before SPA fallback.
 */
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
  });
});

export default router;
