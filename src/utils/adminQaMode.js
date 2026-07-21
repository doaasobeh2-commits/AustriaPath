/**
 * Admin-only Learner QA mode (uses existing isAdminPreview flag).
 * Affects access/evaluation blocking only — not exam content or scoring algorithms.
 */

import { isAdminAccount } from "../config/authConfig.js";
import { getCurrentUser } from "../app/userAccess.js";

export const ADMIN_QA_STORAGE_KEY = "isAdminPreview";

export function isAdminQaMode(user = getCurrentUser()) {
  if (!isAdminAccount(user)) return false;
  try {
    return localStorage.getItem(ADMIN_QA_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableAdminQaMode() {
  localStorage.setItem(ADMIN_QA_STORAGE_KEY, "true");
}

export function disableAdminQaMode() {
  localStorage.removeItem(ADMIN_QA_STORAGE_KEY);
}

/** Learner-facing marker when evaluation was skipped in admin QA */
export const ADMIN_QA_NOT_EVALUATED = "not evaluated / QA only";
