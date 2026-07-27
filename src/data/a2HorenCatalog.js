/**
 * Canonical A2 Hören guided-listening library — single source of truth.
 */
import catalogJson from './a2-hoeren-catalog.json' with { type: 'json' };

export const A2_HOREN_AUDIO_BASE_PATH = catalogJson.audioBasePath || '/audio/a2/hoeren/';
export const A2_HOREN_CLIPS_PER_MODEL = 2;
export const A2_HOREN_QUESTIONS_PER_CLIP = 2;

/** @type {typeof catalogJson.models} */
export const a2HorenModels = Object.freeze(
  (catalogJson.models || []).map((model) => ({
    ...model,
    level: 'A2',
    clips: (model.clips || []).map((clip) => ({
      ...clip,
      questions: (clip.questions || []).map((question) => ({
        ...question,
        options: [...(question.options || [])],
      })),
    })),
  }))
);

/** @type {Record<string, typeof a2HorenModels[number]>} */
export const a2HorenModelMap = Object.freeze(
  Object.fromEntries(a2HorenModels.map((model) => [model.model_id, model]))
);

/**
 * @param {string} modelId
 */
export function getA2HorenModel(modelId) {
  return a2HorenModelMap[modelId] || null;
}

export function listA2HorenModelIds() {
  return a2HorenModels.map((model) => model.model_id);
}

/**
 * @param {string} audioFile
 */
export function resolveA2HorenAudioPath(audioFile) {
  const base = A2_HOREN_AUDIO_BASE_PATH.endsWith('/')
    ? A2_HOREN_AUDIO_BASE_PATH
    : `${A2_HOREN_AUDIO_BASE_PATH}/`;
  return `${base}${audioFile}`;
}

/**
 * Flatten clip questions in playback order for the guided flow.
 * @param {typeof a2HorenModels[number]} model
 */
export function flattenA2HorenQuestions(model) {
  const questions = [];
  (model?.clips || []).forEach((clip, clipIndex) => {
    (clip.questions || []).forEach((question, questionIndex) => {
      questions.push({
        ...question,
        clipIndex,
        questionIndex,
        clip,
      });
    });
  });
  return questions;
}

/**
 * @param {string} weeklyPlanTaskId
 */
export function weeklyPlanIdToCanonicalModelId(weeklyPlanTaskId) {
  const match = String(weeklyPlanTaskId || '').match(/^a2-hoeren-(\d{3})$/i);
  if (!match) return null;
  return `A2-H-${match[1]}`;
}

/**
 * @param {string} canonicalModelId
 */
export function canonicalModelIdToWeeklyPlanId(canonicalModelId) {
  const match = String(canonicalModelId || '').match(/^A2-H-(\d{3})$/i);
  if (!match) return null;
  return `a2-hoeren-${match[1]}`;
}

export function pickRandomA2HorenModel() {
  if (!a2HorenModels.length) return null;
  const index = Math.floor(Math.random() * a2HorenModels.length);
  return a2HorenModels[index];
}
