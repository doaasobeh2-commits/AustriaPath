import { Router } from "express";
import { success } from "../utils/response.js";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { hashPassword } from "../utils/password.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/bootstrap-admin", async (req, res, next) => {
  try {
    const bootstrapSecret =
      process.env.ADMIN_BOOTSTRAP_SECRET || env.adminBootstrapSecret;
    const secret = req.headers["x-bootstrap-secret"] || req.headers["X-Bootstrap-Secret"];
    if (!bootstrapSecret || secret !== bootstrapSecret) {
      throw new AppError("FORBIDDEN", "Keine Berechtigung.", 403);
    }

    const { rows: existing } = await query(
      `SELECT id FROM users WHERE role = 'admin' AND email = $1 AND deleted_at IS NULL LIMIT 1`,
      [env.adminEmail]
    );
    if (existing.length) {
      throw new AppError("CONFLICT", "Administrator existiert bereits.", 409);
    }

    const { name, password } = req.body;
    if (!password || password.length < 8) {
      throw new AppError("VALIDATION_ERROR", "Passwort mindestens 8 Zeichen.", 400);
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role, status, level, allowed_levels, email_verified, email_verification_status, ai_credits)
       VALUES ($1, $2, 'admin', 'approved', 'B1', '{A2,B1,B2}', TRUE, 'verified', 0)
       RETURNING id, email, role`,
      [env.adminEmail, passwordHash]
    );

    await query(
      `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
      [rows[0].id, name?.trim() || "Administrator"]
    );

    success(res, { user: { id: rows[0].id, email: rows[0].email, role: rows[0].role } }, 201);
  } catch (e) {
    next(e);
  }
});

export default router;
