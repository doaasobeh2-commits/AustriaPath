import { Router } from "express";
import { success } from "../../utils/response.js";
import { requireAdmin } from "../../middleware/auth.js";
import { query } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import { formatPgTextArray } from "../../db/arrays.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.status, u.level, u.plan, u.created_at, p.display_name
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
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
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:userId", requireAdmin, async (req, res, next) => {
  try {
    const { status, role, level, allowedLevels } = req.body;
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

    if (!updates.length) {
      throw new AppError("VALIDATION_ERROR", "Keine Felder zum Aktualisieren.", 400);
    }

    updates.push("updated_at = NOW()");
    const { rows } = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $1 AND deleted_at IS NULL RETURNING id, email, role, status, level, allowed_levels`,
      params
    );
    if (!rows.length) throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
    success(res, { user: rows[0] });
  } catch (e) {
    next(e);
  }
});

export default router;
