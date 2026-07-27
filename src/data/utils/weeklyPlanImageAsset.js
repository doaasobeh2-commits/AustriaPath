/**
 * Resolve weekly-plan image assets from task metadata.
 * @module data/utils/weeklyPlanImageAsset
 */
import { a2Images } from '../a2Images.js';

/**
 * @param {object} task
 */
export function resolveB1WeeklyPlanTaskImage(task) {
  if (!task?.imageAsset) return null;
  return {
    id: task.imageId || task.id,
    title: task.title,
    image: task.imageAsset,
  };
}

/**
 * @param {object} task
 * @returns {typeof a2Images[number] | { id: string, title: string, image: string } | null}
 */
export function resolveWeeklyPlanTaskImage(task) {
  if (task?.isB1WeeklyPlanBildbeschreibungTask) {
    return resolveB1WeeklyPlanTaskImage(task);
  }

  const ref = task?.imageAssetRef;
  if (!ref) return null;

  return (
    a2Images.find(
      (image) =>
        (ref.id != null && image.id === ref.id) ||
        (ref.canonicalId && image.canonicalId === ref.canonicalId)
    ) || null
  );
}

/**
 * @param {object} task
 */
export function isWeeklyPlanBildbeschreibungTask(task) {
  return Boolean(
    task?.skill === 'bildbeschreibung' &&
      (task?.imageAssetRef || task?.isB1WeeklyPlanBildbeschreibungTask)
  );
}

/**
 * @param {object} task
 */
export function isB1InteractiveCoachTask(task) {
  return Boolean(
    task?.isB1WeeklyPlanBildbeschreibungTask ||
      task?.b1Category === 'planung' ||
      task?.b1Category === 'selbstvorstellung'
  );
}
