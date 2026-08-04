/**
 * Repository ports — Gate 0 API mapping.
 */

import { apiFetch } from "../httpClient.js";
import { postPlacementEvaluateTurn } from "../placementEvaluateClient.js";
import { postA2SchreibenCorrection } from "../a2SchreibenCorrectionClient.js";
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
  return postPlacementEvaluateTurn(body);
}

/** A2 Schreiben AI correction — POST /v1/weekly-plan/correct-schreiben */
export async function requestA2SchreibenCorrection(body) {
  return postA2SchreibenCorrection(body);
}

/** Placement-only learner report polish — POST /v1/placement/report */
export async function polishPlacementReport(body) {
  return apiFetch("/placement/report", {
    method: "POST",
    json: body,
    headers: idempotencyHeaders(body.idempotencyKey),
  });
}

export async function getPlacementEntitlement() {
  return apiFetch("/placement/entitlement");
}

export async function getWeeklyPlanEntitlement() {
  return apiFetch("/weekly-plan/entitlement");
}

export async function beginPlacementAttempt() {
  return apiFetch("/placement/begin-attempt", {
    method: "POST",
    json: {},
  });
}

export async function completePlacementAttempt(attemptId, reportSnapshot) {
  return apiFetch("/placement/complete-attempt", {
    method: "POST",
    json: { attemptId, reportSnapshot },
  });
}

/** Hidden admin diagnostic sync — silent, learner-invisible. */
export async function syncPlacementDiagnostic(body) {
  return apiFetch("/placement/diagnostic-sync", {
    method: "POST",
    json: body,
  });
}

export async function completePlacementDiagnostic(body) {
  return apiFetch("/placement/diagnostic-complete", {
    method: "POST",
    json: body,
  });
}

export async function fetchPlacementDiagnosticConfig() {
  return apiFetch("/admin/placement-diagnostics/config");
}

export async function updatePlacementDiagnosticConfig(body) {
  return apiFetch("/admin/placement-diagnostics/config", {
    method: "PATCH",
    json: body,
  });
}

export async function fetchPlacementDiagnosticSessions(filter = "all") {
  const qs = filter && filter !== "all" ? `?filter=${encodeURIComponent(filter)}` : "";
  return apiFetch(`/admin/placement-diagnostics/sessions${qs}`);
}

export async function exportPlacementDiagnosticSession(attemptId) {
  return apiFetch(`/admin/placement-diagnostics/sessions/${encodeURIComponent(attemptId)}/export`);
}

export async function listMessages() {
  return apiFetch("/messages");
}

export async function fetchMessage(messageId) {
  return apiFetch(`/messages/${encodeURIComponent(messageId)}`);
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

export async function grantAdminWeeklyPlan(userId) {
  return apiFetch(`/admin/users/${userId}/grant-weekly-plan`, {
    method: "POST",
    json: {},
  });
}

export async function adminSetUserPassword(userId, password) {
  return apiFetch(`/admin/users/${userId}/set-password`, {
    method: "POST",
    json: { password },
  });
}

export async function listCommunityQuestions(params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/community/questions${suffix}`);
}

export async function createCommunityQuestion(body) {
  const data = await apiFetch("/community/questions", {
    method: "POST",
    json: body,
  });
  return data.question;
}

export async function fetchCommunityQuestion(questionId) {
  return apiFetch(`/community/questions/${questionId}`);
}

export async function createCommunityAnswer(questionId, body) {
  const data = await apiFetch(`/community/questions/${questionId}/answers`, {
    method: "POST",
    json: { body },
  });
  return data.answer;
}

export async function closeCommunityQuestion(questionId) {
  return apiFetch(`/community/questions/${questionId}/close`, {
    method: "POST",
    json: {},
  });
}

export async function listMyCommunityQuestions(params = {}) {
  const qs = new URLSearchParams();
  if (params.archived) qs.set("archived", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/community/my/questions${suffix}`);
}

export async function fetchMyCommunityQuestion(questionId) {
  return apiFetch(`/community/my/questions/${questionId}`);
}

export async function archiveCommunityQuestion(questionId) {
  return apiFetch(`/community/my/questions/${questionId}/archive`, {
    method: "POST",
    json: {},
  });
}

export async function restoreCommunityQuestion(questionId) {
  return apiFetch(`/community/my/questions/${questionId}/restore`, {
    method: "POST",
    json: {},
  });
}

export async function adminListCommunityQuestions(params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(`/admin/community/questions${suffix}`);
}

export async function adminAnswerCommunityQuestion(questionId, body) {
  const data = await apiFetch(`/admin/community/questions/${questionId}/answer`, {
    method: "POST",
    json: { body },
  });
  return data.answer;
}

export async function adminSetCommunityQuestionVisibility(questionId, visibility) {
  return apiFetch(`/admin/community/questions/${questionId}/visibility`, {
    method: "PATCH",
    json: { visibility },
  });
}

export async function adminSetCommunityQuestionStatus(questionId, status) {
  return apiFetch(`/admin/community/questions/${questionId}/status`, {
    method: "PATCH",
    json: { status },
  });
}

export async function adminSetCommunityAnswerVisibility(answerId, visibility) {
  return apiFetch(`/admin/community/answers/${answerId}/visibility`, {
    method: "PATCH",
    json: { visibility },
  });
}

export async function fetchRegistrationStatus() {
  return apiFetch("/registration/status");
}

export async function joinRegistrationWaitlist(body) {
  const data = await apiFetch("/registration/waitlist", {
    method: "POST",
    json: body,
  });
  return data.entry;
}

export async function fetchAdminRegistrationOverview() {
  return apiFetch("/admin/registration/overview");
}

export async function fetchAdminWaitlist(search = "") {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/admin/registration/waitlist${qs}`);
}

export async function patchAdminWaitlistEntry(entryId, body) {
  return apiFetch(`/admin/registration/waitlist/${entryId}`, {
    method: "PATCH",
    json: body,
  });
}

export async function patchAdminRegistrationSettings(body) {
  return apiFetch("/admin/registration/settings", {
    method: "PATCH",
    json: body,
  });
}
