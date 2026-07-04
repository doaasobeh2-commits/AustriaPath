/**
 * Coaching notification policy — event-driven, non-spam.
 * Phase A contract only; no delivery implementation until Phase F+.
 *
 * @module exam-platform/notificationPolicy
 */

/** @typedef {import('./contracts.js').SkillId} SkillId */
/** @typedef {import('./contracts.js').ProductType} ProductType */

/**
 * @typedef {'weak_skill_detected'|'exam_completed'|'practice_milestone'|'readiness_changed'|'lab_review_completed'} CoachingEventType
 */

/**
 * @typedef {Object} CoachingNotificationPolicy
 * @property {number} maxMessagesPerWeek
 * @property {number} minHoursBetweenMessages
 * @property {boolean} eventDrivenOnly
 * @property {CoachingEventType[]} allowedTriggers
 */

export const CoachingNotificationPolicy = Object.freeze({
  maxMessagesPerWeek: 2,
  minHoursBetweenMessages: 48,
  eventDrivenOnly: true,
  allowedTriggers: Object.freeze([
    "weak_skill_detected",
    "exam_completed",
    "practice_milestone",
    "readiness_changed",
    "lab_review_completed",
  ]),
});

export const WEEKLY_PLAN_NOTIFICATION_RULES = Object.freeze({
  productType: "weekly_plan",
  maxPerWeek: 2,
  mustReferenceWeakness: true,
  suppressIfNoNewData: true,
  suppressIfUserPracticedWithinHours: 24,
});

/**
 * @typedef {Object} CoachingMessageRequest
 * @property {CoachingEventType} eventType
 * @property {ProductType} productType
 * @property {SkillId[]} [relatedWeaknesses]
 * @property {string} [relatedReportId]
 * @property {string} studentId
 */

/**
 * @interface ICoachingNotificationService
 * @method {boolean} shouldSend
 * @param {CoachingMessageRequest} request
 * @param {import('./contracts.js').StudentProfile} profile
 * @method {Promise<void>} recordSent
 * @param {CoachingMessageRequest} request
 */
