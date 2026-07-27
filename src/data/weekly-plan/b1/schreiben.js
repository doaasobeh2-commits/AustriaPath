import { b1Models } from '../../modelsb1.js';
import { B1_WEEKLY_PLAN_ID_PREFIX, B1_WEEKLY_PLAN_MODEL_VERSION } from './metadata.js';

/**
 * Maps approved B1 email models into the dedicated Weekly Plan library.
 * Source: src/data/modelsb1.js → b1Models (13 models, 27 emails)
 * @returns {import('./metadata.js').B1WeeklyPlanModelBase[]}
 */
function buildSchreibenCatalog() {
  return b1Models.map((model) => ({
    id: `${B1_WEEKLY_PLAN_ID_PREFIX}-schreiben-${String(model.id).padStart(3, '0')}`,
    modelVersion: B1_WEEKLY_PLAN_MODEL_VERSION,
    level: 'B1',
    title: model.title,
    description: model.emails?.[0]?.title || model.category || 'B1 E-Mail Schreiben',
    shortDescription:
      model.emails?.[0]?.task?.slice(0, 2).join(' ') ||
      'Formelle oder informelle E-Mail auf B1-Niveau schreiben.',
    category: 'schreiben',
    emails: model.emails.map((email, index) => ({
      emailIndex: index + 1,
      title: email.title,
      task: email.task,
      solution: email.solution,
      akademie: email.akademie,
    })),
    source: {
      file: 'src/data/modelsb1.js',
      sourceId: `b1Models[${model.id}]`,
      note: `${model.emails?.length || 0} approved email(s) in source model`,
    },
  }));
}

export const b1WeeklyPlanSchreibenCatalog = Object.freeze(buildSchreibenCatalog());
