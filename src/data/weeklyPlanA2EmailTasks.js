/**
 * Weekly Plan coach entries for A2 E-Mail — references weeklyPlanA2EmailLibrary only.
 * Content (scenario, taskPoints) is resolved at runtime via emailLibraryId.
 * @module data/weeklyPlanA2EmailTasks
 */
import { weeklyPlanA2EmailLibrary } from './weeklyPlanA2EmailLibrary.js';

/** @type {import('./weeklyPlanLibrary.js').WeeklyPlanTask[]} */
export const weeklyPlanA2EmailTasks = weeklyPlanA2EmailLibrary.map((email, index) => ({
  id: email.id,
  level: 'A2',
  skill: 'schreiben',
  type: 'writing',
  sessionRole: index < 7 ? 'core' : 'filler',
  priority: 20 + index,
  title: email.title,
  activityName: 'E-Mail schreiben',
  duration: 8,
  answerMode: 'text',
  emailLibraryId: email.id,
}));
