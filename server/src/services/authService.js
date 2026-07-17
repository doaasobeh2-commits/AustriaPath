import { AppError } from "../middleware/errorHandler.js";
import {
  createUserWithProfile,
  findUserByEmail,
  findUserById,
  getCurrentSubscription,
  isReservedAdminEmail,
  rowToApiUser,
  updateLastLogin,
} from "../repositories/userRepository.js";
import { createAuthSession, revokeSession } from "../repositories/authSessionRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateSessionToken, hashToken } from "../middleware/request.js";
import { query } from "../db/client.js";
import { env } from "../config/env.js";
import { createOneTimeToken, consumeOneTimeToken } from "../repositories/tokenStoreRepository.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";

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

  const passwordHash = await hashPassword(body.password);
  const user = await createUserWithProfile({
    email,
    passwordHash,
    name: body.name,
    level: body.level,
  });
  const sub = await getCurrentSubscription(user.id);
  const apiUser = rowToApiUser({ ...user, display_name: body.name }, sub);

  try {
    const token = await createOneTimeToken(TOKEN_ROUTE_VERIFY, { userId: user.id, email }, 48);
    const verifyUrl = `${env.corsOrigin}?verifyEmail=${token}`;
    await sendVerificationEmail(email, verifyUrl);
  } catch {
    /* non-blocking */
  }

  return apiUser;
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

  await updateLastLogin(user.id);
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
  if (!user) return { sent: true };
  const token = await createOneTimeToken(TOKEN_ROUTE_RESET, { userId: user.id, email: clean }, 1);
  const resetUrl = `${env.corsOrigin}?resetPassword=${token}`;
  await sendPasswordResetEmail(clean, resetUrl);
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
  return { reset: true };
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
