/**
 * Gate 0 response envelope helpers.
 */

import { randomUUID } from "node:crypto";

export function requestMeta(req) {
  return {
    requestId: req.requestId || randomUUID(),
    apiVersion: "v1",
    timestamp: new Date().toISOString(),
  };
}

export function success(res, data, status = 200) {
  const envelope = {
    success: true,
    data,
    meta: requestMeta(res.req),
  };
  if (res.req?.storeIdempotency) {
    res.req.storeIdempotency(status, envelope).catch(() => {});
  }
  return res.status(status).json(envelope);
}

export function error(res, code, message, status = 400, details = undefined) {
  const payload = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    meta: requestMeta(res.req),
  };
  return res.status(status).json(payload);
}

export function httpStatusForCode(code) {
  const map = {
    AUTH_REQUIRED: 401,
    AUTH_INVALID: 401,
    AUTH_BLOCKED: 403,
    FORBIDDEN: 403,
    SUBSCRIPTION_INACTIVE: 403,
    SUBSCRIPTION_EXPIRED: 403,
    SUBSCRIPTION_TYPE_MISMATCH: 403,
    NO_REMAINING_EXAMS: 403,
    AI_CREDITS_EXHAUSTED: 402,
    SESSION_NOT_FOUND: 404,
    SESSION_NOT_ACTIVE: 409,
    SESSION_EXPIRED: 410,
    SESSION_INCOMPLETE: 409,
    REPORT_NOT_FOUND: 404,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    EMAIL_ALREADY_REGISTERED: 409,
    EMAIL_RESERVED: 409,
    RATE_LIMITED: 429,
    IDEMPOTENCY_MISMATCH: 409,
    OPENAI_UPSTREAM_ERROR: 502,
    INTERNAL_ERROR: 500,
  };
  return map[code] || 400;
}
