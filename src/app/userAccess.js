import {
  ADMIN_EMAIL,
  getAdminInitialPassword,
  isAdminAccount,
} from "../config/authConfig";
import {
  clearSessionIntegrity,
  writeSessionIntegrity,
} from "../security/sessionIntegrity";
import { readJsonStorage, writeJsonStorage } from "../security/secureStorage.js";
import { isValidEmail } from "../security/sanitize.js";
import { useBackend } from "../api/useBackend.js";
import {
  fetchMe,
  loginViaApi,
  logoutViaApi,
  registerViaApi,
} from "../api/authService.js";
import { ApiError } from "../api/httpClient.js";
import { hydrateBackendFromApi } from "../api/hydrateBackend.js";
import { clearBackendCache } from "../api/backendCache.js";

export const USERS_KEY = "austriaPathUsers";
export const CURRENT_USER_KEY = "austriaPathCurrentUser";

/** In-memory session — never restored from localStorage flags. */
let activeSessionUser = null;

function stripPassword(user) {
  if (!user || typeof user !== "object") return user;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function getStoredUsers() {
  const users = readJsonStorage(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function normalizeAccountStatus(status) {
  return status === "blocked" ? "blocked" : "approved";
}

function normalizeAdminUser(user) {
  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return {
      ...user,
      role: "student",
    };
  }

  return {
    ...user,
    role: "admin",
    status: "approved",
    allowedLevels: ["A2", "B1", "B2"],
  };
}

function normalizeStoredUser(user) {
  if (user.email?.toLowerCase() === ADMIN_EMAIL) {
    return normalizeAdminUser(user);
  }

  return {
    ...user,
    role: "student",
    status: normalizeAccountStatus(user.status),
  };
}

function toSessionUser(storedUser) {
  const cleanEmail = storedUser.email?.trim().toLowerCase();
  const { password: _password, ...safeUser } = storedUser;

  if (cleanEmail !== ADMIN_EMAIL) {
    return {
      ...safeUser,
      email: cleanEmail,
      role: "student",
      status: "approved",
    };
  }

  return {
    ...safeUser,
    email: cleanEmail,
    role: "admin",
    status: "approved",
    allowedLevels: ["A2", "B1", "B2"],
  };
}

function buildSeedAdminUser() {
  const password = getAdminInitialPassword();
  if (!password) {
    return null;
  }

  return {
    id: "admin-1",
    name: "Fadi Sobeh",
    email: ADMIN_EMAIL,
    password,
    level: "B1",
    allowedLevels: ["A2", "B1", "B2"],
    plan: "free",
    levelSource: "system_admin",
    role: "admin",
    status: "approved",
    aiCredits: 0,
    usedAiCredits: 0,
    createdAt: new Date().toISOString(),
  };
}

export function getAdminUserRecord() {
  const users = getUsers();
  return (
    users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL) || null
  );
}

export function getUsers() {
  if (useBackend()) {
    return [];
  }
  try {
    const users = getStoredUsers();
    const hasAdmin = users.some(
      (user) => user.email?.toLowerCase() === ADMIN_EMAIL
    );

    if (hasAdmin) {
      return users.map(normalizeStoredUser);
    }

    const seedAdmin = buildSeedAdminUser();
    return seedAdmin ? [seedAdmin, ...users] : users;
  } catch {
    const seedAdmin = buildSeedAdminUser();
    return seedAdmin ? [seedAdmin] : [];
  }
}

export function saveUsers(users) {
  const fixedUsers = users.map(normalizeStoredUser);

  const hasAdmin = fixedUsers.some(
    (user) => user.email?.toLowerCase() === ADMIN_EMAIL
  );

  const seedAdmin = buildSeedAdminUser();
  const finalUsers =
    hasAdmin || !seedAdmin ? fixedUsers : [seedAdmin, ...fixedUsers];

  localStorage.setItem(USERS_KEY, JSON.stringify(finalUsers));
}

export function getCurrentUser() {
  return resolveSessionUser();
}

export function saveCurrentUser(user) {
  writeJsonStorage(CURRENT_USER_KEY, stripPassword(user));
}

export function clearSession() {
  activeSessionUser = null;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("isAdminPreview");
  clearSessionIntegrity();
  if (useBackend()) clearBackendCache();
}

/** Remove forged/stale client auth markers; legal consent and UI prefs are kept. */
export function purgeLegacyAuthStorage() {
  clearSession();
}

export function resolveSessionUser() {
  return activeSessionUser;
}

export async function validateSessionFromBackend() {
  if (!useBackend()) return null;
  try {
    const user = await fetchMe();
    const sessionUser = apiUserToSessionUser(user);
    syncSessionUser(sessionUser);
    await hydrateBackendFromApi();
    return sessionUser;
  } catch {
    clearSession();
    return null;
  }
}

export function validateSessionOnStartup() {
  purgeLegacyAuthStorage();
  return null;
}

export function syncSessionUser(resolvedUser) {
  if (!resolvedUser) {
    activeSessionUser = null;
    return;
  }

  const sessionUser = stripPassword(toSessionUser(resolvedUser));
  activeSessionUser = sessionUser;

  saveCurrentUser(sessionUser);
  localStorage.setItem("userLevel", sessionUser.level || "B1");
  localStorage.removeItem("isAdminPreview");
  writeSessionIntegrity(sessionUser);
}

function getDefaultAllowedLevels(level) {
  if (level === "B2") return ["A2", "B1", "B2"];
  if (level === "B1") return ["A2", "B1"];
  return ["A2"];
}

function apiUserToSessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email?.trim().toLowerCase(),
    level: user.level || "B1",
    allowedLevels: user.allowedLevels || getDefaultAllowedLevels(user.level),
    plan: user.subscription?.type || "free",
    levelSource: "self_selected",
    role: user.role || "student",
    status: user.status || "approved",
    aiCredits: user.aiCredits ?? 0,
    usedAiCredits: user.usedAiCredits ?? 0,
    emailVerified: user.emailVerified ?? false,
    permissions: user.permissions,
  };
}

function backendAuthErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return "Verbindung zum Server fehlgeschlagen. Bitte später erneut versuchen.";
}

export async function authenticateUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      ok: false,
      message: "Bitte E-Mail und Passwort eingeben.",
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      ok: false,
      message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    };
  }

  if (password.length > 256) {
    return {
      ok: false,
      message: "Passwort ist zu lang.",
    };
  }

  if (useBackend()) {
    try {
      const user = await loginViaApi(cleanEmail, password);
      const sessionUser = apiUserToSessionUser(user);
      syncSessionUser(sessionUser);
      await hydrateBackendFromApi();
      return { ok: true, user: stripPassword(sessionUser) };
    } catch (error) {
      return { ok: false, message: backendAuthErrorMessage(error) };
    }
  }

  const users = getUsers();
  const user = users.find((item) => item.email?.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      ok: false,
      message: "Dieses Konto existiert nicht. Bitte zuerst registrieren.",
    };
  }

  if (user.password !== password) {
    return {
      ok: false,
      message: "E-Mail oder Passwort ist falsch.",
    };
  }

  if (user.status === "blocked") {
    return {
      ok: false,
      message: "Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.",
    };
  }

  const isAdminLogin = cleanEmail === ADMIN_EMAIL;

  if (isAdminLogin) {
    const adminUser = {
      ...user,
      email: cleanEmail,
      role: "admin",
      status: "approved",
      allowedLevels: ["A2", "B1", "B2"],
      lastLogin: new Date().toISOString(),
    };

    const updatedUsers = users.map((item) =>
      item.email?.toLowerCase() === ADMIN_EMAIL ? adminUser : item
    );

    saveUsers(updatedUsers);
    const safeAdmin = stripPassword(adminUser);
    syncSessionUser(safeAdmin);

    return { ok: true, user: safeAdmin };
  }

  const studentUser = {
    ...user,
    email: cleanEmail,
    role: "student",
    status: normalizeAccountStatus(user.status),
    lastLogin: new Date().toISOString(),
  };

  const safeStudent = stripPassword(studentUser);
  syncSessionUser(safeStudent);

  return { ok: true, user: safeStudent };
}

export async function registerStudentUser({ name, email, password, level }) {
  const cleanEmail = email.trim().toLowerCase();

  if (!name?.trim() || !password || !level) {
    return {
      ok: false,
      message: "Bitte füllen Sie alle Pflichtfelder aus.",
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      ok: false,
      message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    };
  }

  if (password.length > 256) {
    return {
      ok: false,
      message: "Passwort ist zu lang.",
    };
  }

  if (cleanEmail === ADMIN_EMAIL) {
    return {
      ok: false,
      message:
        "Diese E-Mail ist für den Administrator reserviert. Bitte verwenden Sie Anmelden.",
    };
  }

  if (useBackend()) {
    try {
      await registerViaApi({ name: name.trim(), email: cleanEmail, password, level });
      return authenticateUser(cleanEmail, password);
    } catch (error) {
      return { ok: false, message: backendAuthErrorMessage(error) };
    }
  }

  const storedUsers = getStoredUsers();
  const existingUser = storedUsers.find(
    (user) => user.email?.toLowerCase() === cleanEmail
  );

  if (existingUser) {
    return {
      ok: false,
      message: "Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.",
    };
  }

  const newUser = {
    id: Date.now(),
    name,
    email: cleanEmail,
    password,
    level,
    status: "approved",
    aiCredits: 5,
    usedAiCredits: 0,
    allowedLevels: getDefaultAllowedLevels(level),
    plan: "free",
    levelSource: "self_selected",
    role: "student",
    emailVerified: false,
    emailVerificationStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  saveUsers([...storedUsers, newUser]);

  return { ok: true, user: stripPassword(newUser) };
}

/** @deprecated Use registerStudentUser instead */
export function registerUser(fields) {
  return registerStudentUser(fields);
}

export function updateUserLevel(userId, newLevel) {
  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          level: newLevel,
          allowedLevels: getDefaultAllowedLevels(newLevel),
          levelSource: "admin_changed",
        }
      : user
  );

  saveUsers(updatedUsers);

  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === userId) {
    saveCurrentUser({
      ...currentUser,
      level: newLevel,
      allowedLevels: getDefaultAllowedLevels(newLevel),
      levelSource: "admin_changed",
    });
  }

  return updatedUsers;
}

export function updateUserAllowedLevels(userId, allowedLevels) {
  const cleanLevels = Array.isArray(allowedLevels)
    ? allowedLevels.filter((level) => ["A2", "B1", "B2"].includes(level))
    : ["A2"];

  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          allowedLevels: cleanLevels.length > 0 ? cleanLevels : ["A2"],
          levelSource: "admin_allowed_levels",
        }
      : user
  );

  saveUsers(updatedUsers);

  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === userId) {
    saveCurrentUser({
      ...currentUser,
      allowedLevels: cleanLevels.length > 0 ? cleanLevels : ["A2"],
      levelSource: "admin_allowed_levels",
    });
  }

  return updatedUsers;
}

export function getCurrentUserAllowedLevels() {
  const currentUser = getCurrentUser();

  if (!currentUser) return ["A2"];

  if (isAdminAccount(currentUser)) {
    return ["A2", "B1", "B2"];
  }

  if (currentUser.allowedLevels && currentUser.allowedLevels.length > 0) {
    return currentUser.allowedLevels;
  }

  return getDefaultAllowedLevels(currentUser.level || "A2");
}
