/**
 * Known localStorage keys used by AustriaPath.
 * Used for documentation and optional validation — not an exhaustive runtime blocklist.
 */

export const AUTH_KEYS = Object.freeze([
  "austriaPathUsers",
  "austriaPathCurrentUser",
  "austriaPathLegalConsent",
  "currentUser",
  "isLoggedIn",
  "userEmail",
  "userName",
  "userRole",
  "isAdminPreview",
  "austriaPathSessionIntegrity",
]);

export const MAX_JSON_STORAGE_BYTES = 5 * 1024 * 1024;

export const MAX_PROFILE_IMAGE_BYTES = 500 * 1024;
