/**
 * B1 Schreiben correction handler — grammar/spelling only, documentation report.
 * @module weekly-training-ai/handlers/b1-schreiben.handler
 */

import { createHash } from "node:crypto";
import { createB1WeeklyTrainingJsonCompletion } from "../core/openaiClient.js";
import { AppError } from "../../middleware/errorHandler.js";

export const B1_SCHREIBEN_HANDLER_VERSION = "b1-schreiben-correction-v1";

const FORBIDDEN_REPORT_FIELDS = [
  "score",
  "cefrLevel",
  "level",
  "advice",
  "recommendations",
  "strengths",
  "weaknesses",
  "grammarLesson",
  "learningTip",
  "positiveFeedback",
  "idealEmail",
  "modelAnswer",
];

/** @type {Map<string, object>} */
const completionCache = new Map();

/**
 * @param {object} snapshot
 */
export function getSchreibenHandlerContext(snapshot) {
  const writingTask = snapshot?.writingTask;
  if (!writingTask) {
    throw new AppError("SESSION_NOT_ACTIVE", "Schreiben-Aufgabe fehlt im Snapshot.", 409);
  }
  return {
    modelId: snapshot.id,
    modelVersion: snapshot.modelVersion,
    selectedEmailIndex: snapshot.selectedEmailIndex,
    scenario: writingTask.scenario,
    recipient: writingTask.recipient,
    requiredPoints: writingTask.requiredPoints || [],
    minimumLength: Number(writingTask.minimumLength) || 80,
    emailTitle: writingTask.emailTitle,
  };
}

function buildSystemPrompt() {
  return [
    "You are a B1 German writing corrector for AustriaPath Weekly Training Schreiben.",
    "Return ONLY valid JSON. No markdown fences.",
    "Correct spelling and grammar only in the learner email.",
    "Preserve the learner's meaning and wording as much as possible.",
    "Do NOT replace the email with an ideal model answer.",
    "Do NOT add new content on behalf of the learner.",
    "Do NOT provide CEFR level, score, advice, strengths, weaknesses, recommendations, or grammar lessons.",
    "For each required point id, decide if the learner email semantically covers it.",
    "Return coveredPointIds and missingPointIds using only the provided point ids.",
    JSON.stringify({
      correctedText: "string",
      coveredPointIds: ["point-1"],
      missingPointIds: ["point-2"],
    }),
  ].join("\n");
}

/**
 * @param {object} context
 * @param {string} learnerText
 */
export function buildSchreibenCorrectionUserPrompt(context, learnerText) {
  return JSON.stringify({
    emailTitle: context.emailTitle,
    scenario: context.scenario,
    recipient: context.recipient,
    requiredPoints: context.requiredPoints,
    learnerEmail: learnerText,
  });
}

/**
 * @param {unknown} raw
 * @param {Array<{ id: string, text: string }>} requiredPoints
 */
export function validateB1SchreibenHandlerResponse(raw, requiredPoints = []) {
  const errors = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Antwort ist kein Objekt."] };
  }

  for (const field of FORBIDDEN_REPORT_FIELDS) {
    if (raw[field] !== undefined) {
      errors.push(`Verbotenes Feld: ${field}`);
    }
  }

  const correctedText = String(raw.correctedText || "").trim();
  if (!correctedText) {
    errors.push("correctedText fehlt.");
  }

  const validIds = new Set(requiredPoints.map((point) => point.id));
  const coveredPointIds = Array.isArray(raw.coveredPointIds)
    ? raw.coveredPointIds.map((id) => String(id))
    : [];
  const missingPointIds = Array.isArray(raw.missingPointIds)
    ? raw.missingPointIds.map((id) => String(id))
    : [];

  for (const id of [...coveredPointIds, ...missingPointIds]) {
    if (!validIds.has(id)) {
      errors.push(`Unbekannte Punkt-ID: ${id}`);
    }
  }

  const seen = new Set();
  for (const id of [...coveredPointIds, ...missingPointIds]) {
    if (seen.has(id)) {
      errors.push(`Doppelte Punkt-ID: ${id}`);
    }
    seen.add(id);
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      correctedText,
      coveredPointIds,
      missingPointIds,
    },
  };
}

/**
 * @param {Array<{ id: string, text: string }>} requiredPoints
 * @param {string[]} coveredPointIds
 * @param {string[]} missingPointIds
 */
export function mapSchreibenCoveragePoints(requiredPoints, coveredPointIds, missingPointIds) {
  const byId = Object.fromEntries(requiredPoints.map((point) => [point.id, point]));
  return {
    coveredPoints: coveredPointIds.map((id) => byId[id]).filter(Boolean),
    missingPoints: missingPointIds.map((id) => byId[id]).filter(Boolean),
  };
}

/**
 * @param {object} params
 */
export async function runB1SchreibenCorrection({
  modelSnapshot,
  learnerText,
  sessionId,
  userId,
  idempotencyKey,
}) {
  const originalText = String(learnerText || "");
  if (!originalText.trim()) {
    throw new AppError("VALIDATION_ERROR", "learnerEmail ist erforderlich.", 400);
  }

  const context = getSchreibenHandlerContext(modelSnapshot);
  if (originalText.trim().length < context.minimumLength) {
    throw new AppError(
      "VALIDATION_ERROR",
      `learnerEmail ist zu kurz (mindestens ${context.minimumLength} Zeichen).`,
      400
    );
  }

  const cacheKey = `${sessionId}:${idempotencyKey || createHash("sha256").update(originalText).digest("hex")}`;
  if (completionCache.has(cacheKey)) {
    return completionCache.get(cacheKey);
  }

  const raw = await createB1WeeklyTrainingJsonCompletion({
    system: buildSystemPrompt(),
    user: buildSchreibenCorrectionUserPrompt(context, originalText),
  });

  const validated = validateB1SchreibenHandlerResponse(raw, context.requiredPoints);
  if (!validated.ok) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      `KI-Antwort war ungültig: ${validated.errors.join(" ")}`,
      502
    );
  }

  const coverage = mapSchreibenCoveragePoints(
    context.requiredPoints,
    validated.data.coveredPointIds,
    validated.data.missingPointIds
  );

  const result = {
    version: B1_SCHREIBEN_HANDLER_VERSION,
    modelId: context.modelId,
    modelVersion: context.modelVersion,
    selectedEmailIndex: context.selectedEmailIndex,
    originalText,
    correctedText: validated.data.correctedText,
    coveredPoints: coverage.coveredPoints,
    missingPoints: coverage.missingPoints,
    learnerTextHash: createHash("sha256").update(originalText).digest("hex"),
    submission: {
      role: "learner",
      kind: "final_email",
      text: originalText,
      at: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
    idempotencyKey: idempotencyKey || null,
    userId,
  };

  completionCache.set(cacheKey, result);
  return result;
}

/** Test helper */
export function resetB1SchreibenHandlerCache() {
  completionCache.clear();
}
