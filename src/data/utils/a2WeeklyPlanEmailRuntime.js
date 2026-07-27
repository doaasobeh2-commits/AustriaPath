/**
 * A2 Weekly Plan email library runtime helpers.
 * @module data/utils/a2WeeklyPlanEmailRuntime
 */
import { getA2EmailTaskById } from '../weeklyPlanA2EmailLibrary.js';

/**
 * @param {object|null|undefined} task
 */
export function isA2WeeklyPlanEmailTask(task) {
  if (!task) return false;
  if (task.emailLibraryId) return true;
  return Boolean(task.id && String(task.id).startsWith('A2-EM-'));
}

/**
 * Resolve the canonical email library record for a coach task.
 * @param {object|null|undefined} task
 */
export function getA2WeeklyPlanEmailRecord(task) {
  if (!task) return null;
  const libraryId = task.emailLibraryId || task.id;
  if (!libraryId || !String(libraryId).startsWith('A2-EM-')) return null;
  return getA2EmailTaskById(libraryId) || null;
}

/**
 * Learner-facing email + Aufgabe content from a single library record.
 * @param {object|null|undefined} task
 */
export function getA2WeeklyPlanEmailCoachContent(task) {
  const email = getA2WeeklyPlanEmailRecord(task);
  if (!email) return null;
  return {
    id: email.id,
    title: email.title,
    scenario: email.scenario,
    taskPoints: [...email.taskPoints],
    aufgabe: email.taskPoints,
  };
}
