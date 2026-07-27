import { getUserLevel } from '../../utils/userPreferences.js';

/**
 * Weekly Plan level selection policy — placement suggests, learner chooses.
 */

export const WEEKLY_PLAN_LEVEL_OPTIONS = Object.freeze(['A2', 'B1', 'B2']);

/**
 * @param {object|null} placementProfile
 * @param {string[]} accessibleLevels
 * @param {string} [storedLevel]
 */
export function resolveWeeklyPlanLevelChoices({
  placementProfile,
  accessibleLevels,
  storedLevel,
} = {}) {
  const placementRaw = placementProfile?.level || null;
  const recommended = placementRaw
    ? String(placementRaw).replace(/[+-]/g, '')
    : null;

  const explicitPreference = storedLevel || getUserLevel();
  const defaultLevel =
    recommended ||
    (explicitPreference && explicitPreference !== 'B1' ? explicitPreference : null) ||
    (accessibleLevels.includes('A2') ? 'A2' : accessibleLevels[0] || 'A2');

  const choices = WEEKLY_PLAN_LEVEL_OPTIONS.map((level) => {
    if (level === 'B2') {
      return {
        level,
        status: 'coming_soon',
        selectable: false,
        label: `${level} — Coming Soon`,
      };
    }

    const allowed = accessibleLevels.includes(level);
    const isRecommended = recommended === level;

    return {
      level,
      status: isRecommended ? 'recommended' : allowed ? 'available' : 'locked',
      selectable: allowed,
      label: isRecommended ? `${level} — Recommended` : level,
      recommended: isRecommended,
    };
  });

  return {
    recommended,
    placementRaw,
    defaultLevel: choices.find((c) => c.selectable && c.level === defaultLevel)
      ? defaultLevel
      : choices.find((c) => c.selectable)?.level || 'A2',
    choices,
    importedFocus: placementProfile?.recommendedFocus || placementProfile?.focusAreas || [],
  };
}

/**
 * @param {string} selectedLevel
 * @param {string|null} recommended
 */
export function didAcceptPlacementRecommendation(selectedLevel, recommended) {
  if (!recommended) return false;
  return selectedLevel === recommended;
}
