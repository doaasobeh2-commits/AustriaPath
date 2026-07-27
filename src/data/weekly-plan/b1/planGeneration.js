import {
  B1_TRAINING_DAYS,
  B1_WEEKLY_PLAN_LIBRARY_VERSION,
} from './metadata.js';
import { b1WeeklyPlanSelbstvorstellungModel } from './selbstvorstellung.js';
import { b1WeeklyPlanSchreibenCatalog } from './schreiben.js';
import { b1WeeklyPlanHoerenCatalog } from './hoeren.js';
import { b1WeeklyPlanBildbeschreibungCatalog } from './bildbeschreibung.js';
import { b1WeeklyPlanPlanungCatalog } from './planung.js';

const ALL_CATALOGS = {
  selbstvorstellung: [b1WeeklyPlanSelbstvorstellungModel],
  schreiben: b1WeeklyPlanSchreibenCatalog,
  hoeren: b1WeeklyPlanHoerenCatalog,
  bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog,
  planung: b1WeeklyPlanPlanungCatalog,
};

export function resolveB1WeeklyPlanModel(category, modelId) {
  const catalog = ALL_CATALOGS[category];
  if (!catalog) return null;
  const id = String(modelId || '').trim();
  if (!id.startsWith('b1wp-')) return null;
  return catalog.find((model) => model.id === id) || null;
}

const SELBST_DAYS = new Set([1, 4, 7]);

/**
 * @typedef {object} B1WeeklyPlanSelections
 * @property {string[]} schreiben
 * @property {string[]} hoeren
 * @property {string[]} bildbeschreibung
 * @property {string[]} planung
 */

/**
 * Deterministic 7-day B1 schedule.
 * Each day: Hören + Schreiben + Bildbeschreibung + Planung (one of each selection).
 * Selbstvorstellung is added automatically on days 1, 4 and 7 (3× per week).
 * Days 1 / 4 / 7 → 5 exercises; days 2 / 3 / 5 / 6 → 4 exercises.
 *
 * @param {B1WeeklyPlanSelections} selections
 * @param {{ placementFocus?: string[] }} [options]
 */
export function generateB1WeeklyPlanSchedule(selections, options = {}) {
  const schreiben = selections.schreiben.slice(0, 7);
  const hoeren = selections.hoeren.slice(0, 7);
  const bild = selections.bildbeschreibung.slice(0, 7);
  const planung = selections.planung.slice(0, 7);

  const days = [];

  for (let dayIndex = 1; dayIndex <= B1_TRAINING_DAYS; dayIndex += 1) {
    const idx = dayIndex - 1;
    const activities = [
      activity('hoeren', hoeren[idx]),
      activity('schreiben', schreiben[idx]),
      activity('bildbeschreibung', bild[idx]),
      activity('planung', planung[idx]),
    ];

    if (SELBST_DAYS.has(dayIndex)) {
      activities.push({
        category: 'selbstvorstellung',
        modelId: b1WeeklyPlanSelbstvorstellungModel.id,
        title: b1WeeklyPlanSelbstvorstellungModel.title,
        repeatedSession: true,
      });
    }

    days.push({ dayIndex, activities });
  }

  const selbstvorstellungSessions = days.reduce(
    (count, day) =>
      count + day.activities.filter((item) => item.category === 'selbstvorstellung').length,
    0
  );

  return {
    libraryVersion: B1_WEEKLY_PLAN_LIBRARY_VERSION,
    selbstvorstellungSessions,
    days,
    focusSkills: options.placementFocus || [],
  };
}

function activity(category, modelId) {
  const model = resolveB1WeeklyPlanModel(category, modelId);
  return {
    category,
    modelId,
    title: model?.title || modelId,
  };
}

/**
 * Convert B1 schedule into coach-v1 plan state (does not save).
 * @param {B1WeeklyPlanSelections} selections
 * @param {{ focusSkills?: string[], placementFocus?: string[] }} [options]
 */
export function buildB1CoachWeeklyPlan(selections, options = {}) {
  const schedule = generateB1WeeklyPlanSchedule(selections, {
    placementFocus: options.placementFocus || options.focusSkills,
  });

  const plans = schedule.days.map((day) => ({
    planIndex: day.dayIndex,
    status: day.dayIndex === 1 ? 'available' : 'locked',
    exercises: day.activities.map((item, slotIndex) => ({
      slot: slotIndex + 1,
      taskId: item.modelId,
      activityName: item.title,
      coachType: mapB1CategoryToCoachType(item.category),
      b1Category: item.category,
      status: 'not_started',
      placeholderCompleted: false,
    })),
    planSummary: null,
  }));

  return {
    schemaVersion: 'coach-v1',
    planKind: 'b1-weekly-plan-v1',
    libraryVersion: B1_WEEKLY_PLAN_LIBRARY_VERSION,
    totalPlans: B1_TRAINING_DAYS,
    currentPlanIndex: 1,
    completedPlans: 0,
    level: 'B1',
    focusSkills: options.focusSkills || [],
    b1Selections: selections,
    b1Schedule: schedule,
    status: 'active',
    plans,
    weeklyReport: null,
    activatedAt: new Date().toISOString(),
  };
}

function mapB1CategoryToCoachType(category) {
  const map = {
    selbstvorstellung: 'speaking',
    schreiben: 'email',
    hoeren: 'listening',
    bildbeschreibung: 'speaking',
    planung: 'speaking',
  };
  return map[category] || 'grammar';
}
