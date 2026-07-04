import { Router } from "express";
import { success } from "../utils/response.js";
import { env } from "../config/env.js";
import { query } from "../db/client.js";
import { hashPassword } from "../utils/password.js";
import { AppError } from "../middleware/errorHandler.js";
import { createUserWithProfile } from "../repositories/userRepository.js";
import { formatPgTextArray } from "../db/arrays.js";

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
      `SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1`,
      [env.adminEmail]
    );
    if (existing.length && existing[0].role === "admin") {
      throw new AppError("CONFLICT", "Administrator existiert bereits.", 409);
    }

    const { name, password } = req.body;
    if (!password || password.length < 8) {
      throw new AppError("VALIDATION_ERROR", "Passwort mindestens 8 Zeichen.", 400);
    }

    const passwordHash = await hashPassword(password);
    const displayName = name?.trim() || "Administrator";
    let userId;

    if (existing.length) {
      userId = existing[0].id;
      await query(
        `UPDATE users SET
          password_hash = $2,
          role = 'admin',
          status = 'approved',
          level = 'B1'::cefr_label,
          allowed_levels = $3::cefr_label[],
          email_verified = TRUE,
          email_verification_status = 'verified',
          ai_credits = 0,
          updated_at = NOW()
         WHERE id = $1`,
        [userId, passwordHash, formatPgTextArray(["A2", "B1", "B2"])]
      );
      await query(
        `UPDATE user_profiles SET display_name = $2, updated_at = NOW() WHERE user_id = $1`,
        [userId, displayName]
      );
    } else {
      const user = await createUserWithProfile({
        email: env.adminEmail,
        passwordHash,
        name: displayName,
        level: "B1",
      });
      userId = user.id;
      await query(
        `UPDATE users SET
          role = 'admin',
          email_verified = TRUE,
          email_verification_status = 'verified',
          ai_credits = 0,
          allowed_levels = $2::cefr_label[],
          updated_at = NOW()
         WHERE id = $1`,
        [userId, formatPgTextArray(["A2", "B1", "B2"])]
      );
    }

    const { rows } = await query(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [userId]
    );

    success(res, { user: rows[0] }, existing.length ? 200 : 201);
  } catch (e) {
    next(e);
  }
});

export default router;
