/**
 * Admin-wide learning level access — session-local preview for admins;
 * stored learner level is never mutated by admin navigation.
 */
import { isAdminAccount } from '../config/authConfig.js';
import { getCurrentUserAllowedLevels } from '../app/userAccess.js';
import { getUserLevel } from './userPreferences.js';

export const LEARNING_LEVELS = Object.freeze(['A2', 'B1', 'B2']);

export const ADMIN_LEARNING_LEVEL_SESSION_KEY = 'austriaPathAdminLearningLevel';

let memoryAdminLearningLevel = null;

/**
 * @param {object|null|undefined} user
 */
export function canAccessAllLearningLevels(user) {
  return isAdminAccount(user);
}

function defaultAllowedLevelsForLevel(level) {
  if (level === 'B2') return ['A2', 'B1', 'B2'];
  if (level === 'B1') return ['A2', 'B1'];
  return ['A2'];
}

/**
 * @param {object|null|undefined} [user]
 * @returns {string[]}
 */
export function getAccessibleLearningLevels(user) {
  if (canAccessAllLearningLevels(user)) {
    return [...LEARNING_LEVELS];
  }
  if (user?.allowedLevels?.length) {
    return user.allowedLevels.filter((level) => LEARNING_LEVELS.includes(level));
  }
  if (user?.level) {
    return defaultAllowedLevelsForLevel(user.level);
  }
  return getCurrentUserAllowedLevels();
}

/**
 * @returns {string|null}
 */
export function readAdminSessionLearningLevel() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const value = sessionStorage.getItem(ADMIN_LEARNING_LEVEL_SESSION_KEY);
      if (LEARNING_LEVELS.includes(value)) return value;
    }
  } catch {
    // ignore
  }
  return memoryAdminLearningLevel;
}

/**
 * Session-only admin preview level — does not write user profile / localStorage userLevel.
 * @param {string} level
 */
export function writeAdminSessionLearningLevel(level) {
  if (!LEARNING_LEVELS.includes(level)) return;
  memoryAdminLearningLevel = level;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ADMIN_LEARNING_LEVEL_SESSION_KEY, level);
    }
  } catch {
    // ignore
  }
}

export function clearAdminSessionLearningLevel() {
  memoryAdminLearningLevel = null;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ADMIN_LEARNING_LEVEL_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * @param {{
 *   user?: object|null,
 *   selectedLevel?: string|null,
 *   storedLevel?: string|null,
 *   navigationLevel?: string|null,
 * }} params
 */
export function resolveActiveLearningLevel({
  user,
  selectedLevel,
  storedLevel,
  navigationLevel,
}) {
  const fallback = storedLevel || getUserLevel();
  const external = selectedLevel || navigationLevel;

  if (canAccessAllLearningLevels(user)) {
    return external || readAdminSessionLearningLevel() || fallback;
  }

  const allowed = getAccessibleLearningLevels(user);
  if (external && allowed.includes(external)) return external;
  if (allowed.includes(fallback)) return fallback;
  return allowed[0] || fallback;
}

/**
 * @param {object|null|undefined} user
 */
export function shouldPersistLearningLevelToProfile(user) {
  return !canAccessAllLearningLevels(user);
}
