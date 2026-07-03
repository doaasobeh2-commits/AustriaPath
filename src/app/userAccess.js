export const USERS_KEY = 'austriaPathUsers';
export const CURRENT_USER_KEY = 'austriaPathCurrentUser';

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  if (level === 'B2') return ['A2', 'B1', 'B2'];
  if (level === 'B1') return ['A2', 'B1'];
  return ['A2'];
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
  const users = getUsers();

  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    const fixedUser = {
      ...existingUser,
      status: existingUser.status || 'pending',
      aiCredits:
        typeof existingUser.aiCredits === 'number'
          ? existingUser.aiCredits
          : 5,
      allowedLevels:
        existingUser.allowedLevels && existingUser.allowedLevels.length > 0
          ? existingUser.allowedLevels
          : getDefaultAllowedLevels(existingUser.level || level || 'A2'),
    };

    saveCurrentUser(fixedUser);
    return fixedUser;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    level,
   status: status || 'pending',
    aiCredits: typeof aiCredits === 'number' ? aiCredits : 5,
    allowedLevels: getDefaultAllowedLevels(level),
    plan: 'free',
    levelSource: 'self_selected',
  role: 'student',
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
          levelSource: 'admin_changed',
        }
      : user
  );

  saveUsers(updatedUsers);

  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === userId) {
    const updatedCurrent = {
      ...currentUser,
      level: newLevel,
      allowedLevels: getDefaultAllowedLevels(newLevel),
      levelSource: 'admin_changed',
    };

    saveCurrentUser(updatedCurrent);
  }

  return updatedUsers;
}

export function updateUserAllowedLevels(userId, allowedLevels) {
  const cleanLevels = Array.isArray(allowedLevels)
    ? allowedLevels.filter((level) => ['A2', 'B1', 'B2'].includes(level))
    : ['A2'];

  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          allowedLevels: cleanLevels.length > 0 ? cleanLevels : ['A2'],
          levelSource: 'admin_allowed_levels',
        }
      : user
  );

  saveUsers(updatedUsers);

  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === userId) {
    const updatedCurrent = {
      ...currentUser,
      allowedLevels: cleanLevels.length > 0 ? cleanLevels : ['A2'],
      levelSource: 'admin_allowed_levels',
    };

    saveCurrentUser(updatedCurrent);
  }

  return updatedUsers;
}

export function getCurrentUserAllowedLevels() {
  const currentUser = getCurrentUser();

  if (!currentUser) return ['A2'];

  if (currentUser.role === 'admin') {
    return ['A2', 'B1', 'B2'];
  }

  if (currentUser.allowedLevels && currentUser.allowedLevels.length > 0) {
    return currentUser.allowedLevels;
  }

  return getDefaultAllowedLevels(currentUser.level || 'A2');
}