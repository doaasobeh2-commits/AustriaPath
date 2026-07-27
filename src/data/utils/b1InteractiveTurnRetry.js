/**
 * Retry wrapper for B1 interactive coach turns.
 */
import { ApiError } from '../../api/httpClient.js';
import { sendB1InteractiveTurn } from './b1InteractiveCoach.js';

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} sessionId
 * @param {string} learnerMessage
 * @param {{ onRetry?: (attempt: number) => void }} [options]
 */
export async function sendB1InteractiveTurnWithRetry(sessionId, learnerMessage, options = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await sendB1InteractiveTurn(sessionId, learnerMessage);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        throw error;
      }
      if (attempt < MAX_ATTEMPTS) {
        options.onRetry?.(attempt);
        await sleep(BASE_DELAY_MS * attempt);
      }
    }
  }

  throw lastError || new Error('Coach-Antwort nicht verfügbar.');
}
