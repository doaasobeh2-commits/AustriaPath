/**
 * Weekly Plan entries for A2 Aufgabe lösen — references canonical catalog IDs only.
 * @module data/weeklyPlanA2AufgabeLoesenTasks
 */
import { a2AufgabeLoesenTasks, canonicalTaskIdToWeeklyPlanId } from './a2AufgabeLoesenCatalog.js';

/** @type {import('./weeklyPlanLibrary.js').WeeklyPlanTask[]} */
export const weeklyPlanA2AufgabeLoesenTasks = a2AufgabeLoesenTasks.map((task, index) => ({
  id: canonicalTaskIdToWeeklyPlanId(task.id),
  level: 'A2',
  skill: 'aufgabe_loesen',
  type: 'speaking',
  sessionRole: index < 3 ? 'core' : 'filler',
  priority: 4 + index,
  title: task.title,
  activityName: 'Aufgabe lösen',
  duration: 6,
  canonicalTaskId: task.id,
  answerMode: 'audio',
}));
