/**
 * A2 Schreiben AI correction — educational rewrite of the learner's own email.
 * Does NOT modify deterministic scoring; placement logic is untouched.
 */

import { A2_SCHREIBEN_EVALUATION_BY_TASK_ID } from "../../../src/data/a2SchreibenEvaluationCatalog.js";
import {
  A2_SCHREIBEN_AI_CORRECTION_METHOD,
  validateA2SchreibenAiCorrectionResponse,
} from "../../../src/data/utils/a2SchreibenAiCorrectionSchema.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

export const A2_SCHREIBEN_OPENAI_TIMEOUT_MS = 45_000;

/** @type {Map<string, object>} */
const idempotencyCache = new Map();

function explanationLanguage(uiLanguage) {
  const lang = String(uiLanguage || "de").toLowerCase();
  if (lang.startsWith("en")) return "English";
  if (lang.startsWith("ar")) return "Arabic";
  return "German";
}

/**
 * @param {object} input
 */
export function validateSchreibenCorrectionInput(input = {}) {
  const taskId = String(input.taskId || "").trim();
  const learnerEmail = String(input.learnerEmail || "").trim();
  if (!taskId || !A2_SCHREIBEN_EVALUATION_BY_TASK_ID[taskId]) {
    throw new AppError("VALIDATION_ERROR", "taskId ist ungültig.", 400);
  }
  if (!learnerEmail || learnerEmail.length < 8) {
    throw new AppError("VALIDATION_ERROR", "learnerEmail ist erforderlich.", 400);
  }
  if (!String(input.scenario || "").trim()) {
    throw new AppError("VALIDATION_ERROR", "scenario ist erforderlich.", 400);
  }
  return {
    taskId,
    scenario: String(input.scenario || "").trim(),
    recipient: String(input.recipient || "").trim(),
    requiredPoints: Array.isArray(input.requiredPoints)
      ? input.requiredPoints.map((p) => String(p).trim()).filter(Boolean)
      : [],
    deterministicCoveredPoints: Array.isArray(input.deterministicCoveredPoints)
      ? input.deterministicCoveredPoints.map((p) => String(p).trim()).filter(Boolean)
      : [],
    deterministicMissingPoints: Array.isArray(input.deterministicMissingPoints)
      ? input.deterministicMissingPoints.map((p) => String(p).trim()).filter(Boolean)
      : [],
    learnerEmail,
    learnerLevel: String(input.learnerLevel || "A2").trim(),
    uiLanguage: String(input.uiLanguage || "de").trim(),
  };
}

function buildSystemPrompt(uiLanguage) {
  const explanationLang = explanationLanguage(uiLanguage);
  return [
    "You are an A2 German writing coach for AustriaPath Weekly Plan Schreiben exercises.",
    "Return ONLY valid JSON matching the required schema. No markdown fences.",
    "Correct the learner's own email: grammar, spelling, word order, punctuation, and vocabulary.",
    "Preserve the learner's intended meaning and style where possible.",
    "Complete any required Stichpunkte listed as missing in deterministicMissingPoints.",
    "Keep language at A2 level — avoid unnecessarily advanced vocabulary or grammar.",
    "Do NOT invent a different scenario or claim content the learner did not submit.",
    "Do NOT change or output any official score — scoring is handled separately.",
    `Write explanations in ${explanationLang}, short and learner-friendly.`,
    "correctedEmail must be a polished, complete version of the learner's email (not a generic unrelated model).",
    "corrections: 1-4 important original→corrected examples from the learner text.",
    "addedMissingPoints: only for points listed in deterministicMissingPoints.",
    "positiveFeedback: 1-3 short encouraging notes about what worked.",
    "learningTip: one focused A2 tip related to the most important issue.",
    JSON.stringify({
      correctedEmail: "string",
      corrections: [{ original: "string", corrected: "string", explanation: "string" }],
      addedMissingPoints: [{ point: "string", addedText: "string" }],
      positiveFeedback: ["string"],
      learningTip: "string",
    }),
  ].join("\n");
}

/**
 * @param {object} input
 */
export function buildSchreibenCorrectionUserPrompt(input) {
  return JSON.stringify({
    taskId: input.taskId,
    scenario: input.scenario,
    recipient: input.recipient,
    requiredPoints: input.requiredPoints,
    deterministicCoveredPoints: input.deterministicCoveredPoints,
    deterministicMissingPoints: input.deterministicMissingPoints,
    learnerEmail: input.learnerEmail,
    learnerLevel: input.learnerLevel,
    uiLanguage: input.uiLanguage,
  });
}

async function callOpenAiJson({ system, user }) {
  if (!env.openaiApiKey) {
    throw new AppError("AI_UNAVAILABLE", "KI-Korrektur ist derzeit nicht verfügbar.", 503);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), A2_SCHREIBEN_OPENAI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("OPENAI_UPSTREAM_ERROR", "KI-Korrektur hat zu lange gedauert.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError("OPENAI_UPSTREAM_ERROR", "KI-Dienst vorübergehend nicht verfügbar.", 502);
  }

  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError("AI_INVALID_RESPONSE", "KI-Antwort war ungültig.", 502);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError("AI_INVALID_RESPONSE", "KI-Antwort war ungültig.", 502);
  }
}

/**
 * @param {object} params
 */
export async function correctA2SchreibenEmail({
  input,
  idempotencyKey,
  userId,
}) {
  const normalized = validateSchreibenCorrectionInput(input);
  const key = String(idempotencyKey || "").trim();
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(key)) {
    throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist ungültig.", 400);
  }

  const cacheKey = `${userId}:${key}`;
  if (idempotencyCache.has(cacheKey)) {
    return idempotencyCache.get(cacheKey);
  }

  const raw = await callOpenAiJson({
    system: buildSystemPrompt(normalized.uiLanguage),
    user: buildSchreibenCorrectionUserPrompt(normalized),
  });

  const validated = validateA2SchreibenAiCorrectionResponse(raw);
  if (!validated.ok) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      `KI-Antwort war ungültig: ${validated.errors.join(" ")}`,
      502
    );
  }

  const result = {
    ...validated.data,
    provider: "openai",
    model: env.openaiModel,
    method: A2_SCHREIBEN_AI_CORRECTION_METHOD,
    generatedAt: new Date().toISOString(),
    idempotencyKey: key,
    status: "ready",
  };

  idempotencyCache.set(cacheKey, result);
  return result;
}

/** Test helper — clears in-memory idempotency cache. */
export function resetSchreibenCorrectionCache() {
  idempotencyCache.clear();
}
