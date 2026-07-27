import { WEEKLY_PLAN_ANALYTICS_KEY } from '../../constants/storageKeys.js';
import { getCurrentUser } from '../../app/userAccess.js';

const MAX_EVENTS = 500;

/**
 * Minimal internal analytics — localStorage audit log, no external provider.
 * Never stores transcripts or learner answers.
 */

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [metadata]
 */
export function recordWeeklyPlanAnalyticsEvent(eventName, metadata = {}) {
  const user = getCurrentUser();
  const event = {
    eventName,
    timestamp: new Date().toISOString(),
    userId: user?.id || user?.email || 'anonymous',
    ...sanitizeMetadata(metadata),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(WEEKLY_PLAN_ANALYTICS_KEY) || '[]');
    const next = Array.isArray(existing) ? [...existing, event] : [event];
    localStorage.setItem(
      WEEKLY_PLAN_ANALYTICS_KEY,
      JSON.stringify(next.slice(-MAX_EVENTS))
    );
    return event;
  } catch {
    return event;
  }
}

function sanitizeMetadata(metadata) {
  const blocked = new Set([
    'transcript',
    'learnerResponse',
    'learnerText',
    'answer',
    'emailBody',
    'solution',
  ]);
  const out = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    if (blocked.has(key)) continue;
    if (typeof value === 'string' && value.length > 200) {
      out[key] = value.slice(0, 200);
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function getWeeklyPlanAnalyticsEvents(storage = localStorage) {
  try {
    const raw = storage.getItem(WEEKLY_PLAN_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const WeeklyPlanAnalyticsEvents = Object.freeze({
  OPENED: 'weekly_plan_opened',
  PLACEMENT_RECOMMENDATION_SHOWN: 'placement_recommendation_shown',
  RECOMMENDED_LEVEL_ACCEPTED: 'recommended_level_accepted',
  DIFFERENT_LEVEL_SELECTED: 'different_level_selected',
  A2_SELECTED: 'a2_selected',
  B1_SELECTED: 'b1_selected',
  B2_COMING_SOON_CLICKED: 'b2_coming_soon_clicked',
  B1_SETUP_STARTED: 'b1_setup_started',
  B1_CATEGORY_SELECTION_COMPLETED: 'b1_category_selection_completed',
  B1_PLAN_PREVIEW_OPENED: 'b1_plan_preview_opened',
  B1_PLAN_CONFIRMED: 'b1_plan_confirmed',
  B1_PLAN_REPLACEMENT_CONFIRMED: 'b1_plan_replacement_confirmed',
  B1_SETUP_ABANDONED: 'b1_setup_abandoned',
});
