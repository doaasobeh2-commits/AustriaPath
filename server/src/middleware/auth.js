import { query } from "../db/client.js";
import { hashToken } from "./request.js";
import { AppError } from "./errorHandler.js";
import { hasApplicationAccess } from "../services/accessService.js";
import { env } from "../config/env.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const cookieToken = req.cookies?.austria_path_session;
    const token = bearer || cookieToken;
    if (!token) {
      throw new AppError("AUTH_REQUIRED", "Bitte melden Sie sich an.", 401);
    }

    const tokenHash = hashToken(token);
    const { rows } = await query(
      `SELECT s.*, u.*
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.deleted_at IS NULL
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length) {
      throw new AppError("AUTH_INVALID", "E-Mail oder Passwort ist falsch.", 401);
    }

    const row = rows[0];
    if (row.status === "blocked") {
      throw new AppError("AUTH_BLOCKED", "Ihr Konto wurde gesperrt.", 403);
    }

    req.auth = {
      userId: row.user_id,
      sessionId: row.id,
      user: row,
    };
    next();
  } catch (e) {
    next(e);
  }
}

export async function requireActiveAccess(req, _res, next) {
  try {
    const user = req.auth?.user;
    if (!user) {
      throw new AppError("AUTH_REQUIRED", "Bitte melden Sie sich an.", 401);
    }
    if (!hasApplicationAccess(user, env.adminEmail)) {
      throw new AppError(
        "TRIAL_EXPIRED",
        "Your 48-hour trial has ended. Please contact the administrator if you need continued access.",
        403
      );
    }
    next();
  } catch (e) {
    next(e);
  }
}

export async function requireAdmin(req, _res, next) {
  try {
    const { env } = await import("../config/env.js");
    const u = req.auth?.user;
    if (
      !u ||
      u.role !== "admin" ||
      String(u.email).toLowerCase() !== env.adminEmail
    ) {
      throw new AppError("FORBIDDEN", "Keine Berechtigung.", 403);
    }
    next();
  } catch (e) {
    next(e);
  }
}

export async function requireExaminerOrAdmin(req, _res, next) {
  try {
    const { env } = await import("../config/env.js");
    const u = req.auth?.user;
    const isAdmin =
      u?.role === "admin" && String(u.email).toLowerCase() === env.adminEmail;
    const isExaminer = u?.role === "examiner" || isAdmin;
    if (!isExaminer) {
      throw new AppError("FORBIDDEN", "Keine Berechtigung.", 403);
    }
    next();
  } catch (e) {
    next(e);
  }
}
