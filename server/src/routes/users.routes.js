import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { findUserById } from "../repositories/userRepository.js";

const router = Router();

router.post("/me/legal-consent", requireAuth, async (req, res, next) => {
  try {
    const { privacyVersion, termsVersion } = req.body;
    if (!privacyVersion || !termsVersion) {
      throw new AppError("VALIDATION_ERROR", "privacyVersion und termsVersion erforderlich.", 400);
    }
    await query(
      `INSERT INTO legal_consents (user_id, privacy_version, terms_version, accepted_at, ip_address, user_agent)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [req.auth.userId, privacyVersion, termsVersion, req.ip || null, req.headers["user-agent"] || null]
    );
    success(res, { recorded: true }, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/me/export", requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.userId);
    const { rows: profileRows } = await query(
      `SELECT profile_json FROM student_learning_profiles WHERE user_id = $1`,
      [req.auth.userId]
    );
    const { rows: reportRows } = await query(
      `SELECT report_json, created_at FROM exam_reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.auth.userId]
    );
    const { rows: subRows } = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.auth.userId]
    );
    success(res, {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        level: user.level,
        role: user.role,
      },
      profile: profileRows[0]?.profile_json || null,
      reports: reportRows.map((r) => r.report_json),
      subscriptions: subRows,
    });
  } catch (e) {
    next(e);
  }
});

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await query(
      `INSERT INTO account_deletion_requests (user_id, status, requested_at, scheduled_purge_at)
       VALUES ($1, 'pending', NOW(), NOW() + INTERVAL '30 days')`,
      [req.auth.userId]
    );
    success(res, { queued: true }, 202);
  } catch (e) {
    next(e);
  }
});

export default router;
