/**
 * Placement-only evaluate-turn client with bounded request timeout.
 */

import { apiFetch, ApiError } from "./httpClient.js";
import { newIdempotencyKey } from "./idempotency.js";

/** Frontend ceiling for evaluate-turn (ms). Slightly above backend OpenAI timeout. */
export const PLACEMENT_EVALUATE_TURN_TIMEOUT_MS = 90_000;

function idempotencyHeaders(key = newIdempotencyKey()) {
  return { "Idempotency-Key": key };
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

/**
 * @param {object} body
 */
export async function postPlacementEvaluateTurn(body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    PLACEMENT_EVALUATE_TURN_TIMEOUT_MS
  );

  try {
    return await apiFetch("/placement/evaluate-turn", {
      method: "POST",
      json: body,
      headers: idempotencyHeaders(body.idempotencyKey),
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        "TIMEOUT",
        "Die Auswertung hat zu lange gedauert. Bitte erneut versuchen.",
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
