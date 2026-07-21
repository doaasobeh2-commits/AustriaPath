import { Router } from "express";
import { success } from "../../utils/response.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { query } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { formatPgTextArray } from "../../db/arrays.js";
import { accessFieldsForUser } from "../../services/accessService.js";
import { env } from "../../config/env.js";
import { grantPlacementAttempt } from "../../services/placementEntitlementService.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.status, u.level, u.plan, u.allowed_levels,
              u.ai_credits, u.used_ai_credits,
              u.created_at, u.last_login_at, u.trial_started_at, u.trial_expires_at,
              u.is_access_approved, p.display_name,
              s.type AS subscription_type, s.status AS subscription_status,
              s.remaining_exams, s.permissions AS subscription_permissions
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT type, status, remaining_exams, permissions
         FROM subscriptions
         WHERE user_id = u.id AND is_current = TRUE
         ORDER BY created_at DESC LIMIT 1
       ) s ON TRUE
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC
       LIMIT 200`
    );
    success(res, {
      users: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.display_name,
        role: r.role,
        status: r.status,
        level: r.level,
        plan: r.plan,
        aiCredits: r.ai_credits ?? 0,
        usedAiCredits: r.used_ai_credits ?? 0,
        subscription: {
          type: r.subscription_type || r.plan || "free",
          status: r.subscription_status || "inactive",
          remainingExams: r.remaining_exams ?? 0,
        },
        permissions: r.subscription_permissions || {},
        allowedLevels: r.allowed_levels,
        createdAt: r.created_at,
        lastLogin: r.last_login_at,
        trialStartedAt: r.trial_started_at,
        trialExpiresAt: r.trial_expires_at,
        isAccessApproved: r.is_access_approved,
        ...accessFieldsForUser(r, env.adminEmail),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:userId/grant-placement", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    success(res, await grantPlacementAttempt(req.params.userId));
  } catch (e) {
    next(e);
  }
});

router.patch("/:userId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const {
      status,
      role,
      level,
      allowedLevels,
      isAccessApproved,
      trialExpiresAt,
      restartTrial,
    } = req.body;
    const updates = [];
    const params = [req.params.userId];
    let i = 2;

    if (status) {
      updates.push(`status = $${i++}::user_status`);
      params.push(status);
    }
    if (role) {
      updates.push(`role = $${i++}::user_role`);
      params.push(role);
    }
    if (level) {
      updates.push(`level = $${i++}::cefr_label`);
      params.push(level);
    }
    if (allowedLevels) {
      updates.push(`allowed_levels = $${i++}::cefr_label[]`);
      params.push(formatPgTextArray(allowedLevels));
    }
    if (typeof isAccessApproved === "boolean") {
      updates.push(`is_access_approved = $${i++}`);
      params.push(isAccessApproved);
    }
    if (restartTrial === true) {
      updates.push(`trial_started_at = NOW()`);
      updates.push(`trial_expires_at = NOW() + INTERVAL '48 hours'`);
      updates.push(`is_access_approved = FALSE`);
    } else if (trialExpiresAt) {
      updates.push(`trial_expires_at = $${i++}`);
      params.push(new Date(trialExpiresAt));
      if (!updates.some((u) => u.includes("trial_started_at"))) {
        updates.push(`trial_started_at = COALESCE(trial_started_at, NOW())`);
      }
    }

    if (!updates.length) {
      throw new AppError("VALIDATION_ERROR", "Keine Felder zum Aktualisieren.", 400);
    }

    updates.push("updated_at = NOW()");
    const { rows } = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, email, role, status, level, allowed_levels,
                 trial_started_at, trial_expires_at, is_access_approved, last_login_at`,
      params
    );
    if (!rows.length) throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
    const user = rows[0];
    success(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        level: user.level,
        allowedLevels: user.allowed_levels,
        trialStartedAt: user.trial_started_at,
        trialExpiresAt: user.trial_expires_at,
        isAccessApproved: user.is_access_approved,
        lastLoginAt: user.last_login_at,
        ...accessFieldsForUser(user, env.adminEmail),
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
