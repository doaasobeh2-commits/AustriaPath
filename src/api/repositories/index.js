/**
 * Repository ports — Gate 0 API mapping.
 */

import { apiFetch } from "../httpClient.js";
import { newIdempotencyKey } from "../idempotency.js";

function idempotencyHeaders(key = newIdempotencyKey()) {
  return { "Idempotency-Key": key };
}

export async function fetchStudentProfile() {
  return apiFetch("/student-profile");
}

export async function fetchSubscription() {
  return apiFetch("/subscription");
}

export async function checkoutSubscription(planType) {
  return apiFetch("/subscription/checkout", {
    method: "POST",
    json: { planType },
  });
}

export async function listReports(params = {}) {
  const qs = new URLSearchParams();
  if (params.productType) qs.set("productType", params.productType);
  if (params.page) qs.set("page", String(params.page));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/reports${suffix}`);
}

export async function fetchLatestReport() {
  return apiFetch("/reports/latest");
}

export async function startExamSession(body) {
  const idempotencyKey = body.idempotencyKey || newIdempotencyKey();
  return apiFetch("/exam-sessions", {
    method: "POST",
    json: { ...body, idempotencyKey },
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export async function submitExamSection(sessionId, payload) {
  return apiFetch(`/exam-sessions/${sessionId}/sections`, {
    method: "POST",
    json: payload,
  });
}

export async function completeExamSession(sessionId) {
  const idempotencyKey = newIdempotencyKey();
  return apiFetch(`/exam-sessions/${sessionId}/complete`, {
    method: "POST",
    json: {},
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export async function fetchRuleRegistryMeta() {
  return apiFetch("/rule-registry");
}

export async function fetchEffectiveRubric(level, skill) {
  const qs = new URLSearchParams({ level, skill });
  return apiFetch(`/rule-registry/effective?${qs}`);
}

export async function fetchLabDashboard() {
  return apiFetch("/admin/examiner-lab/dashboard");
}

export async function fetchLabQueue() {
  return apiFetch("/admin/examiner-lab/queue");
}

export async function resolveLabItem(labItemId, body) {
  const idempotencyKey = newIdempotencyKey();
  return apiFetch(`/admin/examiner-lab/queue/${labItemId}/resolve`, {
    method: "POST",
    json: body,
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export async function requestAiCompletion(body) {
  return apiFetch("/ai/completions", {
    method: "POST",
    json: body,
  });
}

/** Placement-only turn evaluation — POST /v1/placement/evaluate-turn */
export async function evaluatePlacementTurn(body) {
  return apiFetch("/placement/evaluate-turn", {
    method: "POST",
    json: body,
  });
}

/** Placement-only learner report polish — POST /v1/placement/report */
export async function polishPlacementReport(body) {
  return apiFetch("/placement/report", {
    method: "POST",
    json: body,
  });
}

export async function getPlacementEntitlement() {
  return apiFetch("/placement/entitlement");
}

export async function beginPlacementAttempt() {
  return apiFetch("/placement/begin-attempt", {
    method: "POST",
    json: {},
  });
}

export async function completePlacementAttempt(attemptId) {
  return apiFetch("/placement/complete-attempt", {
    method: "POST",
    json: { attemptId },
  });
}

export async function fetchAiUsage() {
  return apiFetch("/ai/usage");
}

export async function importMigrationPayload(payload) {
  return apiFetch("/migration/import", {
    method: "POST",
    json: payload,
  });
}

export async function forgotPassword(email) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    json: { email },
  });
}

export async function resetPassword(token, password) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    json: { token, password },
  });
}

export async function verifyEmail(token) {
  return apiFetch("/auth/verify-email", {
    method: "POST",
    json: { token },
  });
}

export async function listAdminUsers() {
  const data = await apiFetch("/admin/users");
  return data.users || [];
}

export async function patchAdminUser(userId, body) {
  return apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    json: body,
  });
}

export async function grantAdminPlacement(userId) {
  return apiFetch(`/admin/users/${userId}/grant-placement`, {
    method: "POST",
    json: {},
  });
}
