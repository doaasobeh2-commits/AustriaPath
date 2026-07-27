/** Ephemeral AI session payload for Profile / Premium Exam → AISessionScreen */
export const AI_SESSION_STORAGE_KEY = "austriaPathAiSession";

/** @deprecated Legacy key — read fallback only */
export const LEGACY_AI_SESSION_STORAGE_KEY = "austriaPathCurrentAISession";

/** Persistent Weekly Plan coach-v1 state */
export const WEEKLY_PLAN_STORAGE_KEY = "austriaPathWeeklyPlan";

/** Ephemeral handoff: active planIndex + exercise slot for coach screens */
export const WEEKLY_PLAN_HANDOFF_KEY = "austriaPathWeeklyPlanHandoff";

export const ONBOARDING_COMPLETE_KEY = "austriaPathOnboardingComplete";

/** B1 Weekly Plan setup draft (selections + step), separate from active coach plan */
export const B1_WEEKLY_PLAN_SETUP_DRAFT_KEY = "austriaPathB1WeeklyPlanSetupDraft";

/** Internal audit log for Weekly Plan learner choices (no transcripts) */
export const WEEKLY_PLAN_ANALYTICS_KEY = "austriaPathWeeklyPlanAnalytics";
