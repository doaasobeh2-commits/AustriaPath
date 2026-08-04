/**
 * Admin QA-only full A2 test day (5 canonical exercises on Day 1).
 * Does not alter the normal learner weekly-plan planner.
 */
import { getWeeklyPlanTaskById, resolveCoachType } from '../weeklyPlanLibrary.js';
import { getExerciseCardTitle } from './weeklyPlanLabels.js';
import { WEEKLY_PLAN_HANDOFF_KEY, WEEKLY_PLAN_STORAGE_KEY } from '../../constants/storageKeys.js';
import { isAdminQaMode } from '../../utils/adminQaMode.js';
import { COACH_SCHEMA_VERSION } from './weeklyPlanCoachState.js';

export const ADMIN_QA_PLAN_KIND = 'admin-qa-full-day-a2';
export const ADMIN_QA_FULL_DAY_TASK_IDS = Object.freeze([
  'a2-lesen-001',
  'a2-hoeren-001',
  'a2-bild-001',
  'a2-al-001',
  'a2-schreiben-001',
]);

/**
 * @param {unknown} plan
 * @returns {boolean}
 */
export function isAdminQaFullDayPlan(plan) {
  return Boolean(plan && plan.planKind === ADMIN_QA_PLAN_KIND);
}

/**
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState}
 */
export function createAdminQaFullDayPlan() {
  const dayTasks = ADMIN_QA_FULL_DAY_TASK_IDS.map((taskId) => {
    const task = getWeeklyPlanTaskById(taskId);
    if (!task) {
      throw new Error(`Admin QA task missing from canonical library: ${taskId}`);
    }
    return {
      ...task,
      coachType: resolveCoachType(task),
    };
  });

  const dayOneExercises = dayTasks.map((task, index) => ({
    slot: index + 1,
    taskId: task.id,
    activityName: getExerciseCardTitle(task),
    coachType: task.coachType,
    status: index === 0 ? 'in_progress' : 'not_started',
    placeholderCompleted: false,
  }));

  const plans = [
    {
      planIndex: 1,
      status: 'in_progress',
      exercises: dayOneExercises,
      planSummary: null,
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      planIndex: index + 2,
      status: 'locked',
      exercises: [],
      planSummary: null,
    })),
  ];

  return {
    schemaVersion: COACH_SCHEMA_VERSION,
    planKind: ADMIN_QA_PLAN_KIND,
    totalPlans: 7,
    currentPlanIndex: 1,
    completedPlans: 0,
    level: 'A2',
    focusSkills: [],
    status: 'active',
    plans,
    weeklyReport: null,
    activatedAt: new Date().toISOString(),
  };
}

/**
 * Clear only Admin QA weekly-plan and handoff state.
 */
export function clearAdminQaWeeklyPlanState(storage = localStorage) {
  try {
    const raw = storage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isAdminQaFullDayPlan(parsed)) {
        storage.removeItem(WEEKLY_PLAN_STORAGE_KEY);
      }
    }
    storage.removeItem(WEEKLY_PLAN_HANDOFF_KEY);
    storage.removeItem('austriaPathPlacementProfile');
    storage.removeItem('austriaPathPlacementAttempt');
  } catch {
    // ignore
  }
}

/**
 * Load a fresh Admin QA full day and open Day 1 / slot 1.
 * @param {{ storage?: Storage, setActiveTab?: (tab: string) => void }} [options]
 */
export function loadAdminQaFullDayPlan({ storage = localStorage, setActiveTab } = {}) {
  if (!isAdminQaMode()) {
    return { ok: false, error: 'Learner QA mode is required.' };
  }

  clearAdminQaWeeklyPlanState(storage);
  const plan = createAdminQaFullDayPlan();
  storage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(plan));
  storage.setItem(WEEKLY_PLAN_HANDOFF_KEY, JSON.stringify({ planIndex: 1, slot: 1 }));
  setActiveTab?.('coachExercise');
  return { ok: true, plan };
}
