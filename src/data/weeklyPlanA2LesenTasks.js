/**
 * Weekly Plan entries for A2 Lesen — references canonical catalog model IDs only.
 */
import {
  a2LesenModels,
  canonicalLesenModelIdToWeeklyPlanId,
} from './a2LesenCatalog.js';

const A2_READING_ACTIVITY_NAMES = [
  'Kurzen Text lesen',
  'Informationen finden',
  'Fragen beantworten',
];

/** @type {import('./weeklyPlanLibrary.js').WeeklyPlanTask[]} */
export const weeklyPlanA2LesenTasks = a2LesenModels.map((model, index) => ({
  id: canonicalLesenModelIdToWeeklyPlanId(model.model_id),
  level: 'A2',
  skill: 'lesen',
  type: 'reading',
  sessionRole: index < 3 ? 'filler' : 'filler',
  priority: 7 + index,
  title: model.title,
  activityName: A2_READING_ACTIVITY_NAMES[index % A2_READING_ACTIVITY_NAMES.length],
  duration: 5,
  canonicalModelId: model.model_id,
  answerMode: 'choice',
}));
