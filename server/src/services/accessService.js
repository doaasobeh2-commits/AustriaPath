import { query } from "../db/client.js";

export const ACCESS_STATUS = {
  TRIAL_ACTIVE: "TRIAL_ACTIVE",
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  APPROVED: "APPROVED",
  BLOCKED: "BLOCKED",
  ADMIN: "ADMIN",
};

const TRIAL_HOURS = 48;

/**
 * Compute effective access status from persisted user fields (server-side only).
 * @param {object} user
 * @param {string} adminEmail
 */
export function computeAccessStatus(user, adminEmail) {
  if (!user) return ACCESS_STATUS.BLOCKED;

  const email = String(user.email || "").trim().toLowerCase();
  const adminEmailNorm = String(adminEmail || "").trim().toLowerCase();

  if (user.status === "blocked") {
    return ACCESS_STATUS.BLOCKED;
  }

  if (user.role === "admin" && email === adminEmailNorm) {
    return ACCESS_STATUS.ADMIN;
  }

  if (user.role === "examiner") {
    return ACCESS_STATUS.APPROVED;
  }

  if (user.is_access_approved === true || user.is_access_approved === "t") {
    return ACCESS_STATUS.APPROVED;
  }

  if (user.trial_started_at && user.trial_expires_at) {
    return new Date(user.trial_expires_at).getTime() > Date.now()
      ? ACCESS_STATUS.TRIAL_ACTIVE
      : ACCESS_STATUS.TRIAL_EXPIRED;
  }

  // New student before first login — trial not started yet; allow login to begin trial.
  return ACCESS_STATUS.TRIAL_ACTIVE;
}

/**
 * @param {object} user
 * @param {string} adminEmail
 */
export function hasApplicationAccess(user, adminEmail) {
  const status = computeAccessStatus(user, adminEmail);
  return (
    status === ACCESS_STATUS.TRIAL_ACTIVE ||
    status === ACCESS_STATUS.APPROVED ||
    status === ACCESS_STATUS.ADMIN
  );
}

/**
 * Start the 48-hour trial on first successful login (idempotent).
 * @param {string} userId
 */
export async function startTrialOnFirstLogin(userId) {
  await query(
    `UPDATE users SET
       trial_started_at = NOW(),
       trial_expires_at = NOW() + ($2 || ' hours')::INTERVAL,
       updated_at = NOW()
     WHERE id = $1
       AND trial_started_at IS NULL
       AND is_access_approved = FALSE
       AND role = 'student'
       AND status <> 'blocked'`,
    [userId, String(TRIAL_HOURS)]
  );
}

/**
 * @param {object} row
 * @param {string} adminEmail
 */
export function accessFieldsForUser(row, adminEmail) {
  const accessStatus = computeAccessStatus(row, adminEmail);
  return {
    accessStatus,
    trialStartedAt: row.trial_started_at || null,
    trialExpiresAt: row.trial_expires_at || null,
    isAccessApproved: Boolean(row.is_access_approved),
    lastLoginAt: row.last_login_at || null,
    hasApplicationAccess: hasApplicationAccess(row, adminEmail),
  };
}
