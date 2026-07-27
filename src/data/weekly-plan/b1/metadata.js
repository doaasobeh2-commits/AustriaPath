/** Dedicated B1 Weekly Plan library — schema and category constants. */

export const B1_WEEKLY_PLAN_LIBRARY_VERSION = 'b1-weekly-plan-v1';

export const B1_WEEKLY_PLAN_ID_PREFIX = 'b1wp';

export const B1_WEEKLY_PLAN_MODEL_VERSION = 1;

export const B1_WEEKLY_PLAN_CATEGORIES = Object.freeze([
  'selbstvorstellung',
  'schreiben',
  'hoeren',
  'bildbeschreibung',
  'planung',
]);

/** Learner must pick exactly this many per selectable category. */
export const B1_SELECTION_COUNT_PER_CATEGORY = 7;

/** Selbstvorstellung sessions scheduled across the week. */
export const B1_SELBSTVORSTELLUNG_SESSION_COUNT = 4;

export const B1_TRAINING_DAYS = 7;
export const B1_ACTIVITIES_PER_DAY = 4;

export const B1_CATEGORY_LABELS = Object.freeze({
  selbstvorstellung: 'Selbstvorstellung',
  schreiben: 'Schreiben / E-Mail',
  hoeren: 'Hören',
  bildbeschreibung: 'Bildbeschreibung',
  planung: 'Planung',
});

/**
 * @typedef {object} B1WeeklyPlanSourceRef
 * @property {string} file
 * @property {string} sourceId
 * @property {string} [note]
 */

/**
 * @typedef {object} B1WeeklyPlanModelBase
 * @property {string} id - Stable b1wp-* ID
 * @property {number} modelVersion - Frozen catalog version for session snapshots
 * @property {'B1'} level
 * @property {string} title
 * @property {string} [description]
 * @property {B1WeeklyPlanSourceRef} source
 */
