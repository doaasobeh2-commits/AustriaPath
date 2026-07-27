/**
 * Client for B1 Weekly Training AI sessions.
 */

import { apiFetch, ApiError } from './httpClient.js';
import { newIdempotencyKey } from './idempotency.js';

export const B1_WEEKLY_TRAINING_AI_TIMEOUT_MS = 60_000;
/** Daily report may run up to 3 OpenAI attempts server-side. */
export const B1_DAILY_REPORT_COMPLETE_TIMEOUT_MS = 180_000;

function isAbortError(error) {
  return error?.name === 'AbortError';
}

/**
 * @param {{ body: object, idempotencyKey: string }} params
 */
export async function postB1WeeklyTrainingSessionStart({ body, idempotencyKey }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), B1_WEEKLY_TRAINING_AI_TIMEOUT_MS);

  try {
    return await apiFetch('/weekly-training-ai/b1/sessions/start', {
      method: 'POST',
      json: { ...body, idempotencyKey },
      headers: { 'Idempotency-Key': idempotencyKey || newIdempotencyKey() },
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        'TIMEOUT',
        'Die Trainingssitzung konnte nicht gestartet werden. Bitte erneut versuchen.',
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * @param {string} sessionId
 */
export async function getB1WeeklyTrainingSession(sessionId) {
  return apiFetch(`/weekly-training-ai/b1/sessions/${sessionId}`);
}

/**
 * @param {{ sessionId: string, memory: object }} params
 */
export async function postB1TrainingSessionMemory({ sessionId, memory }) {
  return apiFetch(`/weekly-training-ai/b1/sessions/${sessionId}/memory`, {
    method: 'POST',
    json: { memory },
  });
}

/**
 * @param {{ sessionId: string, learnerMessage: string }} params
 */
export async function postB1WeeklyTrainingSessionTurn({ sessionId, learnerMessage }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), B1_WEEKLY_TRAINING_AI_TIMEOUT_MS);

  try {
    return await apiFetch(`/weekly-training-ai/b1/sessions/${sessionId}/turn`, {
      method: 'POST',
      json: { learnerMessage },
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError('TIMEOUT', 'Die Coach-Antwort hat zu lange gedauert.', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * @param {{ planIndex: number, planHash: string, trainingMemories: object[], idempotencyKey: string }} params
 */
export async function postB1DailyReportComplete({
  planIndex,
  planHash,
  trainingMemories,
  idempotencyKey,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    B1_DAILY_REPORT_COMPLETE_TIMEOUT_MS
  );

  try {
    return await apiFetch('/weekly-training-ai/b1/days/complete', {
      method: 'POST',
      json: { planIndex, planHash, trainingMemories },
      headers: { 'Idempotency-Key': idempotencyKey || newIdempotencyKey() },
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        'TIMEOUT',
        'Der Tagesbericht hat zu lange gedauert. Bitte erneut versuchen.',
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
