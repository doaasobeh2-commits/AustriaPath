import { readStringStorage, removeStorageKeys } from "./secureStorage";

export const SESSION_INTEGRITY_KEY = "austriaPathSessionIntegrity";

function computeFingerprint(user) {
  if (!user?.email || user?.id == null) return null;

  const payload = [
    String(user.email).trim().toLowerCase(),
    String(user.id),
    String(user.role || "student"),
    String(user.status || "approved"),
  ].join("|");

  try {
    return btoa(payload).slice(0, 48);
  } catch {
    return null;
  }
}

export function writeSessionIntegrity(user) {
  const fingerprint = computeFingerprint(user);
  if (!fingerprint) return;

  try {
    localStorage.setItem(SESSION_INTEGRITY_KEY, fingerprint);
  } catch {
    // ignore
  }
}

export function verifySessionIntegrity(user) {
  const stored = readStringStorage(SESSION_INTEGRITY_KEY, "");
  const expected = computeFingerprint(user);

  if (!expected) return false;
  if (!stored) return true;
  return stored === expected;
}

export function clearSessionIntegrity() {
  removeStorageKeys([SESSION_INTEGRITY_KEY]);
}

export function detectLegacyRoleMismatch(resolvedUser) {
  const legacyRole = readStringStorage("userRole", "");
  if (!legacyRole || !resolvedUser?.role) return false;
  return legacyRole !== resolvedUser.role;
}
