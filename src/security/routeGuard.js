import { isAdminAccount } from "../config/authConfig.js";

export const ADMIN_ONLY_TABS = Object.freeze([
  "admin",
  "userManagement",
  "examinerLab",
  "aiPruefer",
]);

export function canAccessTab(tab, user) {
  if (!tab) return false;
  if (!ADMIN_ONLY_TABS.includes(tab)) return true;
  return isAdminAccount(user);
}

export function getSafeTab(tab, user, fallback = "home") {
  return canAccessTab(tab, user) ? tab : fallback;
}

export function isAdminPreviewAllowed(user) {
  return isAdminAccount(user);
}
