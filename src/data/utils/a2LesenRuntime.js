/**
 * @module data/utils/a2LesenRuntime
 */

/**
 * @param {object} task
 */
export function isA2LesenWeeklyTask(task) {
  if (!task) return false;
  if (task.skill === 'lesen' && task.canonicalModelId) return true;
  return Boolean(task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-L-'));
}
