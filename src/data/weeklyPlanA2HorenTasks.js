/**
 * Weekly Plan entries for A2 Hören — references canonical catalog model IDs only.
 */
import {
  a2HorenModels,
  canonicalModelIdToWeeklyPlanId,
} from './a2HorenCatalog.js';

const A2_LISTENING_ACTIVITY_NAMES = [
  'Nachricht anhören',
  'Kurzes Gespräch hören',
  'Informationen verstehen',
];

/** @type {import('./weeklyPlanLibrary.js').WeeklyPlanTask[]} */
export const weeklyPlanA2HorenTasks = a2HorenModels.map((model, index) => ({
  id: canonicalModelIdToWeeklyPlanId(model.model_id),
  level: 'A2',
  skill: 'hoeren',
  type: 'listening',
  sessionRole: index < 3 ? 'core' : 'filler',
  priority: 2 + index,
  title: model.title,
  activityName: A2_LISTENING_ACTIVITY_NAMES[index % A2_LISTENING_ACTIVITY_NAMES.length],
  duration: 5,
  canonicalModelId: model.model_id,
  answerMode: 'choice',
}));
