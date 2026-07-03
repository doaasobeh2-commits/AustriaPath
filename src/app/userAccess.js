export const USERS_KEY = "austriaPathUsers";
export const CURRENT_USER_KEY = "austriaPathCurrentUser";

const ADMIN_EMAIL = "fadisobehau@gmail.com";

function getAdminUser() {
  return {
    id: "admin-1",
    name: "Fadi Sobeh",
    email: ADMIN_EMAIL,
    password: "admin123",
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

export function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const hasAdmin = users.some(
      (user) => user.email?.toLowerCase() === ADMIN_EMAIL
    );

    if (hasAdmin) {
      return users.map((user) =>
        user.email?.toLowerCase() === ADMIN_EMAIL
          ? {
              ...user,
              role: "admin",
              status: "approved",
              allowedLevels: ["A2", "B1", "B2"],
            }
          : user
      );
    }

    return [getAdminUser(), ...users];
  } catch {
    return [getAdminUser()];
  }
}

export function saveUsers(users) {
  const fixedUsers = users.map((user) =>
    user.email?.toLowerCase() === ADMIN_EMAIL
      ? {
          ...user,
          role: "admin",
          status: "approved",
          allowedLevels: ["A2", "B1", "B2"],
        }
      : user
  );

  const hasAdmin = fixedUsers.some(
    (user) => user.email?.toLowerCase() === ADMIN_EMAIL
  );

  const finalUsers = hasAdmin
    ? fixedUsers
    : [getAdminUser(), ...fixedUsers];

  localStorage.setItem(USERS_KEY, JSON.stringify(finalUsers));
}
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getDefaultAllowedLevels(level) {
  if (level === "B2") return ["A2", "B1", "B2"];
  if (level === "B1") return ["A2", "B1"];
  return ["A2"];
}

export function registerUser({
  name,
  email,
  password,
  level,
  status,
  aiCredits,
  createdAt,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();

  if (cleanEmail === ADMIN_EMAIL) {
    const adminUser = {
      ...getAdminUser(),
      name: name || "Fadi Sobeh",
      password,
    };

    const updatedUsers = users.map((user) =>
      user.email?.toLowerCase() === ADMIN_EMAIL ? adminUser : user
    );

    saveUsers(updatedUsers);
    saveCurrentUser(adminUser);
    return adminUser;
  }

  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === cleanEmail
  );

  if (existingUser) {
    const fixedUser = {
      ...existingUser,
      status: existingUser.status || "pending",
      role: existingUser.role || "student",
      aiCredits:
        typeof existingUser.aiCredits === "number"
          ? existingUser.aiCredits
          : 5,
      allowedLevels:
        existingUser.allowedLevels && existingUser.allowedLevels.length > 0
          ? existingUser.allowedLevels
          : getDefaultAllowedLevels(existingUser.level || level || "A2"),
    };

    saveCurrentUser(fixedUser);
    return fixedUser;
  }

  const newUser = {
    id: Date.now(),
    name,
    email: cleanEmail,
    password,
    level,
    status: status || "pending",
    aiCredits: typeof aiCredits === "number" ? aiCredits : 5,
    allowedLevels: getDefaultAllowedLevels(level),
    plan: "free",
    levelSource: "self_selected",
    role: "student",
    createdAt: createdAt || new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];

  saveUsers(updatedUsers);
  saveCurrentUser(newUser);

  return newUser;
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