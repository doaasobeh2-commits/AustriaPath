/**
 * Canonical A2 Lesen guided-reading library — single source of truth.
 */
import catalogJson from './a2-lesen-catalog.json' with { type: 'json' };

export const A2_LESEN_QUESTIONS_PER_MODEL = 4;

/** @type {typeof catalogJson.models} */
export const a2LesenModels = Object.freeze(
  (catalogJson.models || []).map((model) => ({
    ...model,
    level: 'A2',
    questions: (model.questions || []).map((question) => ({
      ...question,
      options: [...(question.options || [])],
    })),
    words: [...(model.words || [])],
    verbs: [...(model.verbs || [])],
    grammar: [...(model.grammar || [])],
    mistakes: [...(model.mistakes || [])],
  }))
);

/** @type {Record<string, typeof a2LesenModels[number]>} */
export const a2LesenModelMap = Object.freeze(
  Object.fromEntries(a2LesenModels.map((model) => [model.model_id, model]))
);

/**
 * @param {string} modelId
 */
export function getA2LesenModel(modelId) {
  return a2LesenModelMap[modelId] || null;
}

export function listA2LesenModelIds() {
  return a2LesenModels.map((model) => model.model_id);
}

/**
 * @param {typeof a2LesenModels[number]} model
 */
export function getA2LesenQuestions(model) {
  return model?.questions || [];
}

/**
 * @param {string} weeklyPlanTaskId
 */
export function weeklyPlanIdToCanonicalLesenModelId(weeklyPlanTaskId) {
  const match = String(weeklyPlanTaskId || '').match(/^a2-lesen-(\d{3})$/i);
  if (!match) return null;
  return `A2-L-${match[1]}`;
}

/**
 * @param {string} canonicalModelId
 */
export function canonicalLesenModelIdToWeeklyPlanId(canonicalModelId) {
  const match = String(canonicalModelId || '').match(/^A2-L-(\d{3})$/i);
  if (!match) return null;
  return `a2-lesen-${match[1]}`;
}

export function pickRandomA2LesenModel() {
  if (!a2LesenModels.length) return null;
  const index = Math.floor(Math.random() * a2LesenModels.length);
  return a2LesenModels[index];
}
