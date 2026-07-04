/**
 * Known localStorage keys used by AustriaPath.
 * Used for documentation, GDPR inventory, and migration planning.
 * See AustriaPath_Production_Engineering_Package.md §6 for DB mapping.
 */

export const AUTH_KEYS = Object.freeze([
  "austriaPathUsers",
  "austriaPathCurrentUser",
  "austriaPathLegalConsent",
  "currentUser",
  "isLoggedIn",
  "userEmail",
  "userName",
  "userRole",
  "isAdminPreview",
  "austriaPathSessionIntegrity",
]);

export const PROFILE_KEYS = Object.freeze([
  "userLevel",
  "austriaPathUserLevel",
  "currentLevel",
  "userLanguage",
  "austriaPathLanguage",
  "userProfileImage",
  "placementCompleted",
  "levelSource",
]);

export const SUBSCRIPTION_KEYS = Object.freeze([
  "premiumActive",
  "userPlan",
  "austriaPathSubscription",
  "austriaPathSelectedPremiumPlan",
  "isPremiumUser",
  "placementPaid",
  "premiumPlan",
  "austriaPathCurrentPremiumType",
  "austriaPathPremiumSchedule",
  "austriaPathPremiumScheduleStatus",
  "austriaPathPremiumExams",
  "austriaPathPremiumExamPackage",
  "austriaPathAIExamTimerStart",
  "austriaPathActivePremiumAppointment",
]);

export const AI_SESSION_KEYS = Object.freeze([
  "austriaPathPlacementProfile",
  "austriaPathWeeklyPlan",
  "austriaPathCurrentAISession",
  "austriaPathAiSession",
  "austriaPathCurrentSessionAnswers",
  "austriaPathAIReports",
  "austriaPathLastAIReport",
  "austriaPathAIErrorLog",
  "austriaPathStudentProfile",
]);

export const ADMIN_KEYS = Object.freeze([
  "austriaPathAdminData",
  "austriaPathAiPrueferLibrary",
  "selectedWritingTopic",
]);

export const ANALYTICS_KEYS = Object.freeze([
  "writingVisits",
  "databaseVisits",
  "lastSmartSection",
]);

/** Dynamic keys: `${section}PremiumVisitCount`, `${section}PremiumLastShown`, `lesenPremiumLastShown` */
export const PREMIUM_HINT_KEY_PREFIXES = Object.freeze([
  "PremiumVisitCount",
  "PremiumLastShown",
]);

export const ALL_DOCUMENTED_KEYS = Object.freeze([
  ...AUTH_KEYS,
  ...PROFILE_KEYS,
  ...SUBSCRIPTION_KEYS,
  ...AI_SESSION_KEYS,
  ...ADMIN_KEYS,
  ...ANALYTICS_KEYS,
]);

export const MAX_JSON_STORAGE_BYTES = 5 * 1024 * 1024;

export const MAX_PROFILE_IMAGE_BYTES = 500 * 1024;
