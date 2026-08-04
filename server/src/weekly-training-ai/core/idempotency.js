/**
 * Idempotency helpers for B1 Weekly Training AI sessions.
 * @module weekly-training-ai/core/idempotency
 */

import { AppError } from "../../middleware/errorHandler.js";
import { createHash } from "node:crypto";
import { buildSchreibenIdempotencyEmailSuffix } from "./schreibenTaskSelection.js";

const KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * @param {string} key
 */
export function assertValidIdempotencyKey(key) {
  const normalized = String(key || "").trim();
  if (!KEY_PATTERN.test(normalized)) {
    throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist ungültig.", 400);
  }
  return normalized;
}

/**
 * @param {object} input
 */
export function buildSessionIdempotencyScope(input) {
  const parts = [
    String(input.planHash || "no-plan"),
    String(input.planIndex),
    String(input.exerciseSlot),
    String(input.category),
    String(input.modelId),
  ];
  if (input.category === "schreiben" && Number(input.selectedEmailIndex) > 0) {
    parts.push(buildSchreibenIdempotencyEmailSuffix(input.selectedEmailIndex));
  }
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

/**
 * @param {import('express').Request} req
 */
export function readIdempotencyKey(req) {
  return (
    req.headers["idempotency-key"] ||
    req.headers["Idempotency-Key"] ||
    req.body?.idempotencyKey ||
    ""
  );
}
