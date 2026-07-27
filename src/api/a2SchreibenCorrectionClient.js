/**
 * Client for A2 Schreiben AI correction (Weekly Plan only).
 */

import { apiFetch, ApiError } from './httpClient.js';
import { newIdempotencyKey } from './idempotency.js';

export const A2_SCHREIBEN_CORRECTION_TIMEOUT_MS = 60_000;

function isAbortError(error) {
  return error?.name === 'AbortError';
}

/**
 * @param {{ input: object, idempotencyKey: string }} params
 */
export async function postA2SchreibenCorrection({ input, idempotencyKey }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), A2_SCHREIBEN_CORRECTION_TIMEOUT_MS);

  try {
    return await apiFetch('/weekly-plan/correct-schreiben', {
      method: 'POST',
      json: { input, idempotencyKey },
      headers: { 'Idempotency-Key': idempotencyKey || newIdempotencyKey() },
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        'TIMEOUT',
        'Die KI-Korrektur hat zu lange gedauert. Bitte erneut versuchen.',
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
