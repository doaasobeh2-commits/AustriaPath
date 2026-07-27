/**
 * @module data/utils/a2AufgabeLoesenRuntime
 */

/**
 * @param {object} task
 */
export function isAufgabeLoesenWeeklyTask(task) {
  if (!task) return false;
  if (task.skill === 'aufgabe_loesen') return true;
  return Boolean(task.canonicalTaskId && String(task.canonicalTaskId).startsWith('A2-AL-'));
}
