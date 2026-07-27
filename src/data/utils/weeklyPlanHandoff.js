import { WEEKLY_PLAN_HANDOFF_KEY } from '../../constants/storageKeys.js';

/**
 * @param {{ planIndex: number, slot: number, review?: boolean }} handoff
 * @param {Storage|null|undefined} [storage]
 */
export function setWeeklyPlanHandoff(handoff, storage = localStorage) {
  try {
    storage.setItem(WEEKLY_PLAN_HANDOFF_KEY, JSON.stringify(handoff));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Storage|null|undefined} [storage]
 * @returns {{ planIndex: number, slot: number, review?: boolean } | null}
 */
export function readWeeklyPlanHandoff(storage = localStorage) {
  try {
    const raw = storage.getItem(WEEKLY_PLAN_HANDOFF_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {Storage|null|undefined} [storage]
 */
export function clearWeeklyPlanHandoff(storage = localStorage) {
  try {
    storage.removeItem(WEEKLY_PLAN_HANDOFF_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {object|null|undefined} handoff
 */
export function isActiveWeeklyPlanExerciseHandoff(handoff) {
  return Boolean(handoff?.planIndex && handoff?.slot && !handoff?.review);
}

/**
 * @param {(tab: string) => void} [setActiveTab]
 * @param {Storage|null|undefined} [storage]
 */
export function returnToWeeklyPlanDashboard(setActiveTab, storage = localStorage) {
  const handoff = readWeeklyPlanHandoff(storage);
  const planIndex = handoff?.planIndex || 1;
  clearWeeklyPlanHandoff(storage);
  setWeeklyPlanHandoff({ planIndex, view: 'dashboard' }, storage);
  setActiveTab?.('trainingPlanDashboard');
}
