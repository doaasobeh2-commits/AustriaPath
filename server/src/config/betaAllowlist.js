/**
 * Closed-beta registration allowlist (server-only).
 * Reads process.env.BETA_ALLOWED_EMAILS at runtime on every check.
 */

import { AppError } from "../middleware/errorHandler.js";

/**
 * @param {string} email
 */
export function normalizeAllowlistEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .replace(/^["'<>]+|["'<>]+$/g, "");
}

/**
 * @param {string} raw
 * @returns {Set<string>|null} lowercase emails, or null when allowlist is disabled
 */
export function parseBetaAllowedEmails(raw) {
  if (raw === undefined || raw === null || !String(raw).trim()) return null;

  const trimmed = String(raw).trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const emails = parsed.map((entry) => normalizeAllowlistEmail(entry)).filter(Boolean);
        return emails.length ? new Set(emails) : null;
      }
    } catch {
      /* fall through to delimiter parsing */
    }
  }

  const emails = trimmed
    .split(/[,;\n\r]+/)
    .map((entry) => normalizeAllowlistEmail(entry))
    .filter(Boolean);

  return emails.length ? new Set(emails) : null;
}

/**
 * @returns {Set<string>|null}
 */
export function getBetaAllowedEmails() {
  return parseBetaAllowedEmails(process.env.BETA_ALLOWED_EMAILS);
}

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

/**
 * @returns {{ configured: boolean, enforced: boolean, count: number, production: boolean }}
 */
export function getBetaAllowlistStatus() {
  const raw = process.env.BETA_ALLOWED_EMAILS;
  const allowed = getBetaAllowedEmails();
  return {
    configured: Boolean(raw !== undefined && raw !== null && String(raw).trim()),
    enforced: Boolean(allowed && allowed.size > 0),
    count: allowed?.size ?? 0,
    production: isProductionEnv(),
  };
}

/**
 * Reject registration when email is not permitted. No database access.
 * @param {string} email
 */
export function assertBetaRegistrationAllowed(email) {
  const normalized = normalizeAllowlistEmail(email);
  if (!normalized) return;

  const allowed = getBetaAllowedEmails();

  if (isProductionEnv()) {
    if (!allowed || allowed.size === 0) {
      throw new AppError(
        "BETA_REGISTRATION_CLOSED",
        "Registrierung ist derzeit nur auf Einladung möglich.",
        403
      );
    }
    if (!allowed.has(normalized)) {
      throw new AppError(
        "BETA_REGISTRATION_CLOSED",
        "Registrierung ist derzeit nur auf Einladung möglich.",
        403
      );
    }
    return;
  }

  if (!allowed) return;

  if (!allowed.has(normalized)) {
    throw new AppError(
      "BETA_REGISTRATION_CLOSED",
      "Registrierung ist derzeit nur auf Einladung möglich.",
      403
    );
  }
}

/**
 * Express middleware — runs before registerUser and before any DB access.
 */
export function enforceBetaRegistrationAllowlist(req, _res, next) {
  try {
    assertBetaRegistrationAllowed(req.body?.email);
    next();
  } catch (error) {
    next(error);
  }
}
