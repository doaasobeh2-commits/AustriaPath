export const ACCESS_STATUS = {
  TRIAL_ACTIVE: "TRIAL_ACTIVE",
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  APPROVED: "APPROVED",
  BLOCKED: "BLOCKED",
  ADMIN: "ADMIN",
};

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

  return ACCESS_STATUS.APPROVED;
}

/**
 * @param {object} user
 */
export function hasApplicationAccess(user) {
  if (!user || user.status === "blocked") {
    return false;
  }
  return true;
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
    hasApplicationAccess: hasApplicationAccess(row),
  };
}
