/**
 * Premium pilot kill-switch — catalog reachable; destinations entitlement-gated.
 */
export const PREMIUM_FEATURES_TEMPORARILY_DISABLED = true;

export const WEEKLY_PLAN_FEATURE_TABS = Object.freeze([
  "weeklyPlanSetup",
  "b1WeeklyPlanSetup",
  "b1WeeklyPlanPreview",
  "weeklyPlanHome",
  "trainingPlanDashboard",
  "coachExercise",
  "weeklyCompletion",
]);

export const LEGACY_BLOCKED_PREMIUM_TABS = Object.freeze([
  "premiumSchedule",
  "premiumExam",
  "premiumExamSession",
  "aiSession",
  "exams",
]);

/** @deprecated use WEEKLY_PLAN_FEATURE_TABS + LEGACY_BLOCKED_PREMIUM_TABS */
export const PREMIUM_FEATURE_TABS = Object.freeze([
  "premium",
  ...LEGACY_BLOCKED_PREMIUM_TABS,
  "placementTest",
  ...WEEKLY_PLAN_FEATURE_TABS,
]);

export function isPremiumFeaturesDisabled() {
  return PREMIUM_FEATURES_TEMPORARILY_DISABLED;
}

export function isPremiumFeatureTab(tab) {
  return PREMIUM_FEATURE_TABS.includes(tab);
}

/**
 * @param {string} tab
 * @param {{ placement?: boolean, weeklyPlan?: boolean }} [entitlements]
 */
export function shouldBlockPremiumTab(tab, entitlements = {}) {
  if (!PREMIUM_FEATURES_TEMPORARILY_DISABLED) {
    return false;
  }
  if (tab === "premium") {
    return false;
  }
  if (tab === "placementTest") {
    return !entitlements.placement;
  }
  if (WEEKLY_PLAN_FEATURE_TABS.includes(tab)) {
    return !entitlements.weeklyPlan;
  }
  if (LEGACY_BLOCKED_PREMIUM_TABS.includes(tab)) {
    return true;
  }
  return false;
}
