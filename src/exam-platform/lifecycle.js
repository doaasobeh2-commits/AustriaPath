/**
 * Unified examination lifecycle — ordered stages.
 * Every stage consumes output from the previous; none is standalone.
 *
 * @module exam-platform/lifecycle
 */

export const LifecycleStage = Object.freeze({
  MODEL_CATALOG: "model_catalog",
  STUDENT_PROFILE_LOAD: "student_profile_load",
  MODEL_SELECTION: "model_selection",
  EXAM_ENGINE_START: "exam_engine_start",
  ORCHESTRATION: "orchestration",
  SKILL_EVALUATION: "skill_evaluation",
  LLM_PROPOSAL: "llm_proposal",
  EXAMINER_COUNCIL: "examiner_council",
  REPORT_BUILD: "report_build",
  PROFILE_UPDATE: "profile_update",
  WEEKLY_REENTRY: "weekly_reentry",
  FUTURE_EXAM_REENTRY: "future_exam_reentry",
  EXAMINER_LAB: "examiner_lab",
  RULE_PROMOTION: "rule_promotion",
  EXAMINER_MIND_UPDATE: "examiner_mind_update",
});

export const LIFECYCLE_CHAIN = Object.freeze([
  LifecycleStage.MODEL_CATALOG,
  LifecycleStage.STUDENT_PROFILE_LOAD,
  LifecycleStage.MODEL_SELECTION,
  LifecycleStage.EXAM_ENGINE_START,
  LifecycleStage.ORCHESTRATION,
  LifecycleStage.SKILL_EVALUATION,
  LifecycleStage.LLM_PROPOSAL,
  LifecycleStage.EXAMINER_COUNCIL,
  LifecycleStage.REPORT_BUILD,
  LifecycleStage.PROFILE_UPDATE,
  LifecycleStage.WEEKLY_REENTRY,
  LifecycleStage.FUTURE_EXAM_REENTRY,
  LifecycleStage.EXAMINER_LAB,
  LifecycleStage.RULE_PROMOTION,
  LifecycleStage.EXAMINER_MIND_UPDATE,
]);

export const REENTRY_STAGES = Object.freeze([
  LifecycleStage.WEEKLY_REENTRY,
  LifecycleStage.FUTURE_EXAM_REENTRY,
]);

export const CONDITIONAL_STAGES = Object.freeze([
  LifecycleStage.EXAMINER_LAB,
  LifecycleStage.RULE_PROMOTION,
]);

export const SKILL_EVALUATOR_IDS = Object.freeze([
  "writing",
  "reading",
  "listening",
  "picture_description",
  "planning",
  "discussion",
  "self_introduction",
]);

export const HUMAN_REVIEW_VISIBLE_STATUSES = Object.freeze([
  "confirmed",
  "corrected",
]);

export const PROFILE_UPDATE_ROUTE = Object.freeze({
  placement_test: "placement",
  weekly_plan: "practice",
  ai_exam: "exam",
  intensive_week: "exam",
  premium_month: "exam",
});

export const CEFR_SCORE_BANDS_B1_CONTEXT = Object.freeze([
  { minScore: 85, label: "B1+" },
  { minScore: 70, label: "B1" },
  { minScore: 55, label: "A2+" },
  { minScore: 0, label: "A2" },
]);

export const CEFR_SCORE_BANDS_B2_CONTEXT = Object.freeze([
  { minScore: 85, label: "B2" },
  { minScore: 70, label: "B1+" },
  { minScore: 55, label: "B1" },
  { minScore: 0, label: "A2+" },
]);
