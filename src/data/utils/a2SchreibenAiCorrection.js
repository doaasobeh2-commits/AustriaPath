/**
 * Client orchestration for A2 Schreiben AI correction (Weekly Plan coach exercises).
 */
import { getA2SchreibenEvaluation, isA2SchreibenAiCorrectionTask } from '../a2SchreibenEvaluationCatalog.js';
import { postA2SchreibenCorrection } from '../../api/a2SchreibenCorrectionClient.js';
import {
  buildSchreibenCorrectionIdempotencyKey,
  buildSchreibenCorrectionRequest,
} from './a2SchreibenAiCorrectionSchema.js';
import { getUserLanguage } from '../../utils/userPreferences.js';

/**
 * @param {object} task
 */
export function shouldRequestSchreibenAiCorrection(task) {
  return isA2SchreibenAiCorrectionTask(task);
}

/**
 * @param {object} task
 * @param {object} exercise
 */
export function buildSchreibenAiCorrectionPayload(task, exercise) {
  const meta = getA2SchreibenEvaluation(task);
  const evaluationMeta = exercise?.feedback?.evaluationMeta || {};
  return buildSchreibenCorrectionRequest({
    taskId: task.id,
    scenario: meta?.scenario,
    recipient: meta?.recipient,
    requiredPoints: meta?.taskPoints || [],
    deterministicCoveredPoints: evaluationMeta.coveredPoints || [],
    deterministicMissingPoints: evaluationMeta.missingPoints || [],
    learnerEmail: exercise?.learnerResponse || evaluationMeta.learnerResponse || '',
    learnerLevel: 'A2',
    uiLanguage: getUserLanguage(),
  });
}

/**
 * @param {object} exercise
 * @param {number} planIndex
 * @param {number} slot
 */
export function getSchreibenCorrectionIdempotencyKey(exercise, planIndex, slot) {
  if (exercise?.aiCorrection?.idempotencyKey) {
    return exercise.aiCorrection.idempotencyKey;
  }
  return buildSchreibenCorrectionIdempotencyKey(planIndex, slot, exercise?.submittedAt);
}

/**
 * @param {object} task
 * @param {object} exercise
 * @param {number} planIndex
 * @param {number} slot
 */
export async function fetchSchreibenAiCorrection(task, exercise, planIndex, slot) {
  const idempotencyKey = getSchreibenCorrectionIdempotencyKey(exercise, planIndex, slot);
  const input = buildSchreibenAiCorrectionPayload(task, exercise);
  const response = await postA2SchreibenCorrection({ input, idempotencyKey });
  return {
    ...response,
    idempotencyKey,
    status: 'ready',
  };
}

/**
 * @param {object} feedback
 * @param {object} aiCorrection
 */
export function mergeSchreibenFeedbackWithAi(feedback, aiCorrection) {
  if (!feedback || !aiCorrection || aiCorrection.status !== 'ready') {
    return feedback;
  }
  return {
    ...feedback,
    aiCorrection,
    primaryCorrectedEmail: aiCorrection.correctedEmail,
  };
}
