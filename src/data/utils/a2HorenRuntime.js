/**
 * @module data/utils/a2HorenRuntime
 */

/**
 * @param {object} task
 */
export function isA2HorenWeeklyTask(task) {
  if (!task) return false;
  if (task.skill === 'hoeren' && task.canonicalModelId) return true;
  return Boolean(task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-H-'));
}
