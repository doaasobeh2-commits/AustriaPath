import { ACCESS_CONTROL } from "../config/accessControl";
import { getUsers, saveUsers } from "../app/userAccess";

function getAvailableCredits(user) {
  const total = typeof user.aiCredits === "number" ? user.aiCredits : 0;
  const used = typeof user.usedAiCredits === "number" ? user.usedAiCredits : 0;
  return Math.max(0, total - used);
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
    usedAiCredits:
      typeof user.usedAiCredits === "number" ? user.usedAiCredits : 0,
  };
}

export function canUseAI(user, serviceType = "ai_exam") {
  if (!ACCESS_CONTROL.aiCreditsEnabled) return true;

  const safeUser = ensureUserAccessDefaults(user);
  if (!safeUser) return false;

  const cost = ACCESS_CONTROL.aiCosts[serviceType] || 1;

  return (
    safeUser.status !== ACCESS_CONTROL.statuses.blocked &&
    getAvailableCredits(safeUser) >= cost
  );
}

export function consumeAICredits(userId, serviceType = "ai_exam") {
  const users = getUsers();
  const cost = ACCESS_CONTROL.aiCosts[serviceType] || 1;

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) return user;

    const safeUser = ensureUserAccessDefaults(user);
    const available = getAvailableCredits(safeUser);

    if (available < cost) {
      return safeUser;
    }

    return {
      ...safeUser,
      usedAiCredits: safeUser.usedAiCredits + cost,
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

export function getAvailableAICredits(user) {
  return getAvailableCredits(ensureUserAccessDefaults(user) || {});
}
