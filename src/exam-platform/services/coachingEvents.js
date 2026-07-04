/**
 * Coaching event emitter — notification policy hook (no delivery in Phase D).
 *
 * @module exam-platform/services/coachingEvents
 */

import { CoachingNotificationPolicy } from "../notificationPolicy.js";

/** @type {{ type: string, payload: Record<string, unknown>, at: string }[]} */
let recentEvents = [];

/**
 * @param {import('../notificationPolicy.js').CoachingEventType} eventType
 * @param {Record<string, unknown>} payload
 */
export function emitCoachingEvent(eventType, payload = {}) {
  if (!CoachingNotificationPolicy.allowedTriggers.includes(eventType)) {
    return { emitted: false, reason: "trigger_not_allowed" };
  }
  const event = {
    type: eventType,
    payload,
    at: new Date().toISOString(),
  };
  recentEvents = [event, ...recentEvents].slice(0, 20);
  return { emitted: true, event };
}

export function getRecentCoachingEvents() {
  return [...recentEvents];
}

export function resetCoachingEvents() {
  recentEvents = [];
}

export const coachingEvents = {
  emit: emitCoachingEvent,
  getRecent: getRecentCoachingEvents,
  reset: resetCoachingEvents,
};
