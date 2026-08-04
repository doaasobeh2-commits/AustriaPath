/**
 * Local dev + embedded PGLite only — ensure the configured admin exists
 * and password_hash matches VITE_ADMIN_INITIAL_PASSWORD.
 * Does not run in production or against external PostgreSQL.
 */
import { env } from "../config/env.js";
import { getDb, query } from "./client.js";
import { formatPgTextArray } from "./arrays.js";
import { createUserWithProfile } from "../repositories/userRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function readAdminInitialPassword() {
  const raw = process.env.VITE_ADMIN_INITIAL_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || "";
  return String(raw).trim().replace(/^["']|["']$/g, "");
}

async function applyAdminFields(userId, passwordHash) {
  await query(
    `UPDATE users
     SET password_hash = $2,
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
}

/**
 * @returns {Promise<{ action: string, userId?: string }>}
 */
export async function ensureLocalAdminPassword() {
  if (env.nodeEnv === "production") {
    return { action: "skipped_production" };
  }

  let dbKind = "unknown";
  try {
    dbKind = getDb().kind;
  } catch {
    return { action: "skipped_db_not_ready" };
  }

  if (dbKind !== "pglite") {
    return { action: "skipped_not_pglite" };
  }

  const password = readAdminInitialPassword();
  if (!password || password.length < 8) {
    return { action: "skipped_no_password" };
  }

  const { rows } = await query(
    `SELECT id, email, role, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
     LIMIT 1`,
    [env.adminEmail]
  );

  const passwordHash = await hashPassword(password);

  if (!rows.length) {
    const user = await createUserWithProfile({
      email: env.adminEmail,
      passwordHash,
      name: "Administrator",
      level: "B1",
    });
    await applyAdminFields(user.id, passwordHash);
    return { action: "created", userId: user.id };
  }

  const user = rows[0];
  const matches = await verifyPassword(password, user.password_hash);
  if (matches && user.role === "admin") {
    return { action: "unchanged", userId: user.id };
  }

  await applyAdminFields(user.id, passwordHash);
  await query(
    `UPDATE user_profiles SET display_name = $2, updated_at = NOW() WHERE user_id = $1`,
    [user.id, "Administrator"]
  );

  return { action: "password_updated", userId: user.id };
}
