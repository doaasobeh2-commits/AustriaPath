import { ACCESS_CONTROL } from "../config/accessControl";

const USERS_KEY = "austriaPathUsers";

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureUserAccessDefaults(user) {
  if (!user) return null;

  return {
    ...user,
    status: user.status || ACCESS_CONTROL.defaultUserStatus,
    aiCredits:
      typeof user.aiCredits === "number"
        ? user.aiCredits
        : ACCESS_CONTROL.defaultAICredits,
  };
}

export function canUseAI(user, serviceType = "ai_exam") {
  if (!ACCESS_CONTROL.aiCreditsEnabled) return true;

  const safeUser = ensureUserAccessDefaults(user);
  if (!safeUser) return false;

  const cost = ACCESS_CONTROL.aiCosts[serviceType] || 1;

  return safeUser.status === ACCESS_CONTROL.statuses.approved &&
    safeUser.aiCredits >= cost;
}

export function consumeAICredits(userId, serviceType = "ai_exam") {
  const users = getUsers();
  const cost = ACCESS_CONTROL.aiCosts[serviceType] || 1;

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    const safeUser = ensureUserAccessDefaults(user);

    return {
      ...safeUser,
      aiCredits: Math.max(0, safeUser.aiCredits - cost),
      lastAIUsageAt: new Date().toISOString(),
    };
  });

  saveUsers(updatedUsers);

  return updatedUsers.find((user) => user.id === userId) || null;
}

export function addAICredits(userId, amount = 1) {
  const users = getUsers();

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    const safeUser = ensureUserAccessDefaults(user);

    return {
      ...safeUser,
      aiCredits: safeUser.aiCredits + Number(amount || 0),
    };
  });

  saveUsers(updatedUsers);

  return updatedUsers.find((user) => user.id === userId) || null;
}

export function updateUserStatus(userId, status) {
  const users = getUsers();

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    return {
      ...ensureUserAccessDefaults(user),
      status,
      statusUpdatedAt: new Date().toISOString(),
    };
  });

  saveUsers(updatedUsers);

  return updatedUsers.find((user) => user.id === userId) || null;
}