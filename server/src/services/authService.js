import { AppError } from "../middleware/errorHandler.js";
import {
  findUserByEmail,
  findUserById,
  getCurrentSubscription,
  isReservedAdminEmail,
  rowToApiUser,
} from "../repositories/userRepository.js";
import {
  createAuthSession,
  revokeAllSessionsForUser,
  revokeSession,
} from "../repositories/authSessionRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateSessionToken, hashToken } from "../middleware/request.js";
import { query } from "../db/client.js";
import { env } from "../config/env.js";
import {
  consumeOneTimeToken,
  createOneTimeToken,
  revokeOneTimeTokensForUser,
} from "../repositories/tokenStoreRepository.js";
import { buildPublicAppQueryUrl } from "../config/publicAppUrl.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import { registerUserWithCapacityGate } from "../services/registrationCapacityService.js";
import { recordUserActivity, USER_ACTIVITY_EVENTS } from "./userActivityService.js";

const SESSION_DAYS = 7;
const TOKEN_ROUTE_RESET = "auth:password-reset";
const TOKEN_ROUTE_VERIFY = "auth:email-verify";

function validateRegister({ name, email, password, level }) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new AppError("VALIDATION_ERROR", "Ungültige Eingabe.", 400);
  }
  if (password.length < 8) {
    throw new AppError("VALIDATION_ERROR", "Passwort mindestens 8 Zeichen.", 400, {
      fields: [{ path: "password", message: "Mindestens 8 Zeichen." }],
    });
  }
  if (!["A2", "B1", "B2"].includes(String(level || "").toUpperCase())) {
    throw new AppError("VALIDATION_ERROR", "Ungültiges Niveau.", 400);
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.trim())) {
    throw new AppError("VALIDATION_ERROR", "Ungültige E-Mail.", 400);
  }
}

export async function registerUser(body) {
  validateRegister(body);
  const email = body.email.trim().toLowerCase();

  if (isReservedAdminEmail(email)) {
    throw new AppError("EMAIL_RESERVED", "Diese E-Mail ist reserviert.", 409);
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("EMAIL_ALREADY_REGISTERED", "Diese E-Mail ist bereits registriert.", 409);
  }

  return registerUserWithCapacityGate({
    ...body,
    email,
    password: body.password,
  });
}

export async function loginUser(body, meta = {}) {
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) {
    throw new AppError("AUTH_INVALID", "E-Mail oder Passwort ist falsch.", 401);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("AUTH_INVALID", "E-Mail oder Passwort ist falsch.", 401);
  }
  if (user.status === "blocked") {
    throw new AppError("AUTH_BLOCKED", "Ihr Konto wurde gesperrt.", 403);
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    throw new AppError("AUTH_INVALID", "E-Mail oder Passwort ist falsch.", 401);
  }

  await recordUserActivity(user.id, USER_ACTIVITY_EVENTS.LOGIN);
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await createAuthSession({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  const sub = await getCurrentSubscription(user.id);
  return {
    token,
    user: rowToApiUser(user, sub),
    expiresAt,
  };
}

export async function logoutUser(token) {
  if (token) {
    await revokeSession(hashToken(token));
  }
}

export async function getMe(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
  }
  const sub = await getCurrentSubscription(userId);
  return rowToApiUser(user, sub);
}

export async function requestPasswordReset(email) {
  const clean = email?.trim().toLowerCase();
  if (!clean) return { sent: true };
  const user = await findUserByEmail(clean);
  if (!user || user.status === "blocked") return { sent: true };
  try {
    await revokeOneTimeTokensForUser(TOKEN_ROUTE_RESET, user.id);
    const token = await createOneTimeToken(
      TOKEN_ROUTE_RESET,
      { userId: user.id, email: clean },
      1
    );
    const resetUrl = buildPublicAppQueryUrl(`resetPassword=${token}`);
    await sendPasswordResetEmail(clean, resetUrl);
  } catch (error) {
    console.warn(
      "[auth] password reset email delivery failed",
      { email: clean, reason: error instanceof Error ? error.message : String(error) }
    );
  }
  return { sent: true };
}

export async function resetPasswordWithToken(token, password) {
  if (!token || !password || password.length < 8) {
    throw new AppError("VALIDATION_ERROR", "Ungültiges Token oder Passwort.", 400);
  }
  const payload = await consumeOneTimeToken(TOKEN_ROUTE_RESET, token);
  if (!payload?.userId) {
    throw new AppError("AUTH_INVALID", "Token ungültig oder abgelaufen.", 401);
  }
  const passwordHash = await hashPassword(password);
  await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
    payload.userId,
    passwordHash,
  ]);
  await revokeAllSessionsForUser(payload.userId);
  return { reset: true };
}

export async function adminSetUserPassword(actorId, userId, password) {
  if (!password || password.length < 8) {
    throw new AppError("VALIDATION_ERROR", "Passwort mindestens 8 Zeichen.", 400, {
      fields: [{ path: "password", message: "Mindestens 8 Zeichen." }],
    });
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
  }

  const passwordHash = await hashPassword(password);
  await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, [
    userId,
    passwordHash,
  ]);
  await revokeAllSessionsForUser(userId);

  await query(
    `INSERT INTO admin_activity_log (actor_id, action, details, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      actorId,
      "admin_set_user_password",
      `Admin set password for user ${userId}`,
      JSON.stringify({ userId, targetEmail: user.email }),
    ]
  );

  return { updated: true };
}

export async function verifyEmailWithToken(token) {
  const payload = await consumeOneTimeToken(TOKEN_ROUTE_VERIFY, token);
  if (!payload?.userId) {
    throw new AppError("AUTH_INVALID", "Token ungültig oder abgelaufen.", 401);
  }
  await query(
    `UPDATE users SET email_verified = TRUE, email_verification_status = 'verified', email_verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [payload.userId]
  );
  return { verified: true };
}
