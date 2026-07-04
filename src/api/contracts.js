/**
 * Shared API types and error codes for backend integration.
 * No network calls — documentation contract only.
 */

/** @typedef {'student'|'admin'|'examiner'} UserRole */
/** @typedef {'approved'|'blocked'} UserStatus */
/** @typedef {'free'|'placement_test'|'weekly_plan'|'ai_exam'|'intensive_week'|'premium_month'} PlanType */

/**
 * @typedef {Object} UserPermissions
 * @property {boolean} placementTest
 * @property {boolean} aiExam
 * @property {boolean} weeklyPlan
 * @property {boolean} reports
 * @property {boolean} writingAI
 * @property {boolean} imageAI
 * @property {boolean} speakingAI
 * @property {boolean} readingAI
 * @property {boolean} listeningAI
 */

/**
 * @typedef {Object} ApiUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {UserRole} role
 * @property {UserStatus} status
 * @property {string} level
 * @property {string[]} allowedLevels
 * @property {{ type: PlanType, status: string, remainingExams?: number, endDate?: string|null }} subscription
 * @property {UserPermissions} permissions
 * @property {number} aiCredits
 * @property {number} usedAiCredits
 */

/**
 * @typedef {Object} AiCompletionRequest
 * @property {string} [mode]
 * @property {string} [prompt]
 * @property {string} [studentAnswer]
 * @property {{ role: 'user'|'assistant', content: string }[]} [messages]
 * @property {{ serviceType?: string, level?: string, engineName?: string }} [context]
 */

/**
 * @typedef {Object} AiCompletionResponse
 * @property {boolean} success
 * @property {string} [result]
 * @property {number} [creditsUsed]
 * @property {number} [creditsRemaining]
 * @property {string} [error]
 * @property {string} [errorCode]
 */

/**
 * @typedef {Object} AiReportPayload
 * @property {string} title
 * @property {string} type
 * @property {string} level
 * @property {string} summary
 * @property {string} evaluationMethod
 * @property {number} strongCount
 * @property {number} middleCount
 * @property {number} weakCount
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} focusAreas
 * @property {Record<string, unknown>} [examinerMind]
 */

export const API_ERROR_CODES = Object.freeze({
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  AUTH_BLOCKED: "AUTH_BLOCKED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AI_CREDITS_EXHAUSTED: "AI_CREDITS_EXHAUSTED",
  SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",
  OPENAI_UPSTREAM_ERROR: "OPENAI_UPSTREAM_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_FOUND: "NOT_FOUND",
});

export const EVALUATION_METHODS = Object.freeze({
  EXAMINER_MIND: "examiner_mind",
  TRAINING_HEURISTIC: "training_heuristic",
  LLM_CONVERSATIONAL: "llm_conversational",
  RULE_PLACEMENT: "rule_placement",
});
