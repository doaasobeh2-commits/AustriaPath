/**
 * Temporary kill-switch for Premium features.
 * Set to false to restore normal Premium access without removing any code.
 */
export const PREMIUM_FEATURES_TEMPORARILY_DISABLED = true;

export const PREMIUM_FEATURE_TABS = Object.freeze([
  'premium',
  'premiumSchedule',
  'premiumExam',
  'premiumExamSession',
  'placementTest',
  'aiSession',
  'exams',
  'weeklyPlanSetup',
  'b1WeeklyPlanSetup',
  'b1WeeklyPlanPreview',
  'weeklyPlanHome',
  'trainingPlanDashboard',
  'coachExercise',
  'weeklyCompletion',
]);

export function isPremiumFeaturesDisabled() {
  return PREMIUM_FEATURES_TEMPORARILY_DISABLED;
}

export function isPremiumFeatureTab(tab) {
  return PREMIUM_FEATURE_TABS.includes(tab);
}

export function shouldBlockPremiumTab(tab) {
  return isPremiumFeaturesDisabled() && isPremiumFeatureTab(tab);
}
