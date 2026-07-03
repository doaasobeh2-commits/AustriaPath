import {
  ADMIN_EMAIL,
  getAdminInitialPassword,
} from "../config/authConfig";

export const USERS_KEY = "austriaPathUsers";
export const CURRENT_USER_KEY = "austriaPathCurrentUser";
const LEGACY_USER_KEY = "currentUser";

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
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

function readSessionEmail() {
  let email = null;

  for (const key of [CURRENT_USER_KEY, LEGACY_USER_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const candidate = parsed?.email?.trim().toLowerCase();
      if (!candidate) continue;

      if (email && email !== candidate) {
        return null;
      }

      email = candidate;
    } catch {
      return null;
    }
  }

  const legacyEmail = localStorage.getItem("userEmail")?.trim().toLowerCase();
  if (legacyEmail) {
    if (email && email !== legacyEmail) {
      return null;
    }
    email = email || legacyEmail;
  }

  return email;
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
  try {
    const users = getStoredUsers();
    const hasAdmin = users.some(
      (user) => user.email?.toLowerCase() === ADMIN_EMAIL
    );

    if (hasAdmin) {
      return users.map(normalizeAdminUser);
    }

    const seedAdmin = buildSeedAdminUser();
    return seedAdmin ? [seedAdmin, ...users] : users;
  } catch {
    const seedAdmin = buildSeedAdminUser();
    return seedAdmin ? [seedAdmin] : [];
  }
}

export function saveUsers(users) {
  const fixedUsers = users.map(normalizeAdminUser);

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
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("isAdminPreview");
}

export function resolveSessionUser() {
  try {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      return null;
    }

    const cleanEmail = readSessionEmail();
    if (!cleanEmail) return null;

    const storedUser = getUsers().find(
      (user) => user.email?.toLowerCase() === cleanEmail
    );

    if (!storedUser) return null;
    if (storedUser.status !== "approved") return null;

    return toSessionUser(storedUser);
  } catch {
    return null;
  }
}

export function validateSessionOnStartup() {
  const resolved = resolveSessionUser();

  if (!resolved) {
    if (localStorage.getItem("isLoggedIn") === "true") {
      clearSession();
    }
    return null;
  }

  syncSessionUser(resolved);
  return resolved;
}

export function syncSessionUser(resolvedUser) {
  if (!resolvedUser) return;

  const { password: _password, ...sessionUser } = resolvedUser;

  saveCurrentUser(sessionUser);
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userEmail", resolvedUser.email);
  localStorage.setItem("userRole", resolvedUser.role);
  localStorage.setItem(
    "userName",
    resolvedUser.name || resolvedUser.email.split("@")[0]
  );
  localStorage.setItem("userLevel", resolvedUser.level || "B1");
  localStorage.removeItem("isAdminPreview");
}

function getDefaultAllowedLevels(level) {
  if (level === "B2") return ["A2", "B1", "B2"];
  if (level === "B1") return ["A2", "B1"];
  return ["A2"];
}

export function authenticateUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      ok: false,
      message: "Bitte E-Mail und Passwort eingeben.",
    };
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
    saveCurrentUser(adminUser);

    return { ok: true, user: adminUser };
  }

  const studentUser = {
    ...user,
    email: cleanEmail,
    role: "student",
    status: "approved",
    lastLogin: new Date().toISOString(),
  };

  if (user.status !== "approved") {
    const updatedUsers = users.map((item) =>
      item.email?.toLowerCase() === cleanEmail ? studentUser : item
    );
    saveUsers(updatedUsers);
  }

  saveCurrentUser(studentUser);

  return { ok: true, user: studentUser };
}

export function registerStudentUser({ name, email, password, level }) {
  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail === ADMIN_EMAIL) {
    return {
      ok: false,
      message:
        "Diese E-Mail ist für den Administrator reserviert. Bitte verwenden Sie Anmelden.",
    };
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
    allowedLevels: getDefaultAllowedLevels(level),
    plan: "free",
    levelSource: "self_selected",
    role: "student",
    emailVerified: false,
    emailVerificationStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  saveUsers([...storedUsers, newUser]);
  saveCurrentUser(newUser);

  return { ok: true, user: newUser };
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

  if (currentUser.role === "admin") {
    return ["A2", "B1", "B2"];
  }

  if (currentUser.allowedLevels && currentUser.allowedLevels.length > 0) {
    return currentUser.allowedLevels;
  }

  return getDefaultAllowedLevels(currentUser.level || "A2");
}
