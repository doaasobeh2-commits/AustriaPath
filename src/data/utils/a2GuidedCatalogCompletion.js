/**
 * Validation for canonical A2 Lesen/Hören guided-trainer weekly-plan completion.
 * @module data/utils/a2GuidedCatalogCompletion
 */
import { isA2LesenWeeklyTask } from './a2LesenRuntime.js';
import { isA2HorenWeeklyTask } from './a2HorenRuntime.js';

export const A2_GUIDED_CATALOG_QUESTIONS_PER_MODEL = 4;

/**
 * @param {object} [payload]
 */
export function extractGuidedCatalogCompletion(payload = {}) {
  const selectedAnswers = payload.selectedAnswers || {};
  const guidedCompleted =
    payload.guidedCompleted === true ||
    selectedAnswers.guidedCompleted === true ||
    selectedAnswers.guidedCompleted === 'true';

  const correctCount = Number(payload.correctCount ?? selectedAnswers.correctCount);
  const totalQuestions = Number(payload.totalQuestions ?? selectedAnswers.totalQuestions);
  const canonicalModelId = String(
    payload.canonicalModelId ?? selectedAnswers.canonicalModelId ?? ''
  ).trim();

  return { guidedCompleted, correctCount, totalQuestions, canonicalModelId };
}

/**
 * @param {object} task
 * @param {string} coachType
 */
export function isCanonicalA2GuidedCatalogTask(task, coachType) {
  if (coachType === 'reading') return isA2LesenWeeklyTask(task);
  if (coachType === 'listening') return isA2HorenWeeklyTask(task);
  return false;
}

/**
 * @param {object} task
 * @param {string} coachType
 * @param {object} payload
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateGuidedCatalogCompletion(task, coachType, payload = {}) {
  if (!isCanonicalA2GuidedCatalogTask(task, coachType)) {
    return { ok: false, reason: 'Keine gültige Katalogübung.' };
  }

  const { guidedCompleted, correctCount, totalQuestions, canonicalModelId } =
    extractGuidedCatalogCompletion(payload);

  if (!guidedCompleted) {
    return { ok: false, reason: 'Bitte schließe die Übung im Trainer ab.' };
  }

  const expectedModelId = String(task.canonicalModelId || '').trim();
  if (!canonicalModelId || canonicalModelId !== expectedModelId) {
    return {
      ok: false,
      reason: 'Das Modell stimmt nicht mit der Wochenplan-Aufgabe überein.',
    };
  }

  if (totalQuestions !== A2_GUIDED_CATALOG_QUESTIONS_PER_MODEL) {
    return { ok: false, reason: 'Ungültige Fragenanzahl.' };
  }

  if (!Number.isFinite(correctCount) || correctCount < 0 || correctCount > 4) {
    return { ok: false, reason: 'Ungültige Punktzahl.' };
  }

  return { ok: true };
}

/**
 * @param {number} correctCount
 * @param {number} totalQuestions
 * @param {string} canonicalModelId
 */
export function buildGuidedCatalogCompletionPayload(
  correctCount,
  totalQuestions,
  canonicalModelId
) {
  return {
    guidedCompleted: true,
    correctCount,
    totalQuestions,
    canonicalModelId,
    selectedAnswers: {
      guidedCompleted: 'true',
      correctCount: String(correctCount),
      totalQuestions: String(totalQuestions),
      canonicalModelId,
    },
  };
}
