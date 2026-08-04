/**
 * Lightweight user activity summary — latest state only, no event history.
 * @module services/userActivityService
 */

import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

export const USER_ACTIVITY_EVENTS = Object.freeze({
  LOGIN: "login",
  LOGOUT: "logout",
  OPEN_PLACEMENT: "open_placement",
  OPEN_WEEKLY_TRAINING: "open_weekly_training",
  OPEN_COMING_SOON: "open_coming_soon",
});

export const CLIENT_TRACKABLE_EVENTS = Object.freeze([
  USER_ACTIVITY_EVENTS.OPEN_PLACEMENT,
  USER_ACTIVITY_EVENTS.OPEN_WEEKLY_TRAINING,
  USER_ACTIVITY_EVENTS.OPEN_COMING_SOON,
]);

const FEATURE_LABELS = Object.freeze({
  [USER_ACTIVITY_EVENTS.OPEN_PLACEMENT]: "Placement",
  [USER_ACTIVITY_EVENTS.OPEN_WEEKLY_TRAINING]: "Weekly Training",
  [USER_ACTIVITY_EVENTS.OPEN_COMING_SOON]: "Coming Soon",
});

/** Days without activity before a user is considered inactive. */
export const INACTIVE_AFTER_DAYS = 30;

/**
 * @param {object} row
 */
export function deriveUserActivityStatus(row) {
  if (!row?.last_feature_opened) {
    return "registered_only";
  }
  if (!row.last_activity_at) {
    return "registered_only";
  }
  const lastActivityMs = new Date(row.last_activity_at).getTime();
  if (!Number.isFinite(lastActivityMs)) {
    return "registered_only";
  }
  const inactiveMs = INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - lastActivityMs > inactiveMs) {
    return "inactive";
  }
  return "active";
}

/**
 * @param {object} row
 */
export function mapUserActivitySummary(row) {
  return {
    lastLogin: row.last_login_at || null,
    lastActivity: row.last_activity_at || null,
    loginCount: Number(row.login_count) || 0,
    lastFeatureOpened: row.last_feature_opened || null,
    activityStatus: deriveUserActivityStatus(row),
  };
}

/**
 * @param {string} userId
 * @param {string} event
 */
export async function recordUserActivity(userId, event) {
  const normalized = String(event || "").trim();
  if (!userId || !normalized) return;

  if (normalized === USER_ACTIVITY_EVENTS.LOGIN) {
    await query(
      `UPDATE users
       SET login_count = COALESCE(login_count, 0) + 1,
           last_login_at = NOW(),
           last_activity_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
    return;
  }

  if (normalized === USER_ACTIVITY_EVENTS.LOGOUT) {
    await query(
      `UPDATE users
       SET last_activity_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
    return;
  }

  const featureLabel = FEATURE_LABELS[normalized];
  if (!featureLabel) return;

  await query(
    `UPDATE users
     SET last_activity_at = NOW(),
         last_feature_opened = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, featureLabel]
  );
}

/**
 * @param {string} userId
 * @param {string} event
 */
export async function recordClientUserActivity(userId, event) {
  const normalized = String(event || "").trim();
  if (!CLIENT_TRACKABLE_EVENTS.includes(normalized)) {
    throw new AppError("VALIDATION_ERROR", "Aktivität ist ungültig.", 400);
  }
  await recordUserActivity(userId, normalized);
  return { recorded: true };
}
