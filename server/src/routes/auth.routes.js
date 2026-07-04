import { Router } from "express";
import { success } from "../utils/response.js";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";
import { hashToken } from "../middleware/request.js";
import { env } from "../config/env.js";
import {
  loginRateLimit,
  loginEmailRateLimit,
  registerRateLimit,
} from "../middleware/rateLimit.js";
import { enforceBetaRegistrationAllowlist } from "../config/betaAllowlist.js";

const router = Router();

function setSessionCookie(res, token, expiresAt) {
  res.cookie("austria_path_session", token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

router.post("/register", registerRateLimit, enforceBetaRegistrationAllowlist, async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    success(res, { user }, 201);
  } catch (e) {
    next(e);
  }
});

router.post("/login", loginRateLimit, loginEmailRateLimit, async (req, res, next) => {
  try {
    const result = await loginUser(req.body, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setSessionCookie(res, result.token, result.expiresAt);
    success(res, { user: result.user });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    const token = bearer || req.cookies?.austria_path_session;
    await logoutUser(token);
    res.clearCookie("austria_path_session", { path: "/" });
    success(res, { loggedOut: true });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getMe(req.auth.userId);
    success(res, { user });
  } catch (e) {
    next(e);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const result = await requestPasswordReset(req.body?.email);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const result = await resetPasswordWithToken(req.body?.token, req.body?.password);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const result = await verifyEmailWithToken(req.body?.token);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

export default router;
