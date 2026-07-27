/**
 * User-facing Schreiben AI correction errors (Weekly Plan).
 * Never surface auth/login messages on the writing screen.
 */

export const SCHREIBEN_AI_UNAVAILABLE_MESSAGE =
  'Die KI-Korrektur ist vorübergehend nicht verfügbar. Ihre E-Mail wurde sicher gespeichert. Drücken Sie „KI-Korrektur erneut versuchen“, um dieselbe E-Mail zu korrigieren, sobald der KI-Dienst wieder verfügbar ist.';

const AUTH_ERROR_CODES = new Set(['AUTH_REQUIRED', 'AUTH_INVALID', 'AUTH_BLOCKED', 'TRIAL_EXPIRED']);

/**
 * @param {Error | { code?: string, message?: string } | null | undefined} error
 * @returns {string}
 */
export function formatSchreibenAiError(error) {
  const code = String(error?.code || '').trim();
  const message = String(error?.message || '').trim();

  if (AUTH_ERROR_CODES.has(code) || /passwort|melden sie sich an/i.test(message)) {
    return SCHREIBEN_AI_UNAVAILABLE_MESSAGE;
  }

  if (
    code === 'TIMEOUT' ||
    code === 'NETWORK_ERROR' ||
    code === 'SERVICE_UNAVAILABLE' ||
    /network|timeout|nicht verfügbar|failed/i.test(message)
  ) {
    return SCHREIBEN_AI_UNAVAILABLE_MESSAGE;
  }

  if (message && !/passwort|auth/i.test(message)) {
    return SCHREIBEN_AI_UNAVAILABLE_MESSAGE;
  }

  return SCHREIBEN_AI_UNAVAILABLE_MESSAGE;
}
