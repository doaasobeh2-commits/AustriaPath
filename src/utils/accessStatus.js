import { useBackend } from "../api/useBackend.js";
import { isAdminAccount } from "../config/authConfig.js";

export const ACCESS_STATUS = {
  TRIAL_ACTIVE: "TRIAL_ACTIVE",
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  APPROVED: "APPROVED",
  BLOCKED: "BLOCKED",
  ADMIN: "ADMIN",
};

export function isTrialExpiredUser(user) {
  if (!useBackend() || !user) return false;
  if (isAdminAccount(user)) return false;
  return user.accessStatus === ACCESS_STATUS.TRIAL_EXPIRED;
}

export function hasApplicationAccessUser(user) {
  if (!useBackend() || !user) return true;
  if (isAdminAccount(user)) return true;
  if (user.hasApplicationAccess === false) return false;
  if (user.accessStatus === ACCESS_STATUS.TRIAL_EXPIRED) return false;
  if (user.accessStatus === ACCESS_STATUS.BLOCKED) return false;
  return true;
}

export function accessStatusLabel(status) {
  const labels = {
    TRIAL_ACTIVE: "Trial aktiv",
    TRIAL_EXPIRED: "Trial abgelaufen",
    APPROVED: "Freigegeben",
    BLOCKED: "Gesperrt",
    ADMIN: "Admin",
  };
  return labels[status] || status || "—";
}
