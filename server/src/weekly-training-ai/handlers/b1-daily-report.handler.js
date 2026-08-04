/**
 * Final Daily Report — ONE AI call after all exercises, no per-exercise reports during training.
 * @module weekly-training-ai/handlers/b1-daily-report
 */

import { createHash } from "node:crypto";
import { createB1WeeklyTrainingJsonCompletion } from "../core/openaiClient.js";
import { buildDeterministicDailyReport } from "../core/dailyReportFallback.js";
import {
  REPEATED_GRAMMAR_PATTERNS_SECTION_TITLE,
  normalizeRepeatedGrammarPatterns,
  validateRepeatedGrammarPatterns,
} from "../core/repeatedGrammarPatterns.js";
import { AppError } from "../../middleware/errorHandler.js";

export const B1_DAILY_REPORT_VERSION = "b1-daily-report-v3";

const DAILY_REPORT_MAX_ATTEMPTS = 3;
const DAILY_REPORT_RETRY_DELAY_MS = 1200;
const DAILY_REPORT_MAX_COMPLETION_TOKENS = 4000;

const FORBIDDEN_FIELDS = [
  "cefrLevel",
  "level",
  "recommendations",
  "grammarLesson",
  "idealEmail",
  "modelAnswer",
];

/** @type {Map<string, object>} */
const dailyReportCache = new Map();

function buildSystemPrompt() {
  return [
    "You are the B1 Weekly Training Final Daily Report generator for AustriaPath.",
    "Return ONLY valid JSON. No markdown fences.",
    "Use ALL provided training memory from the day.",
    "For EVERY exercise in trainingMemories, produce one entry in exercises[].",
    "Correct German grammar, spelling and sentence structure ONLY — preserve learner meaning and content.",
    "Do NOT rewrite ideas, add new facts, or change what the learner intended to say.",
    "For speaking exercises: combine learner turns into originalText; correctedText is the same content with grammar fixes only.",
    "Mark coveredPoints with semantic task coverage; missingPoints for uncovered required items.",
    "feedback per exercise: 2-3 short sentences in German about language performance (not exam scores).",
    "cefrPerformance per exercise: estimated CEFR band for that exercise only (A2, A2+, B1, B1+).",
    "overallPerformance: one sentence summarizing the whole training day.",
    "strongestSkill and weakestSkill: name the best and weakest skill area today (Schreiben, Hören, Sprechen, etc.).",
    "tomorrowPriorities: exactly three short German priorities for tomorrow's training.",
    `repeatedGrammarPatterns: final short section titled "${REPEATED_GRAMMAR_PATTERNS_SECTION_TITLE}".`,
    "Compare grammar mistakes across ALL exercises from today (writing + speaking).",
    "Include ONLY grammar topics that repeat in at least TWO different exercises.",
    "Ignore isolated or one-time mistakes completely.",
    "items: maximum 3 entries — grammar topic labels ONLY (no explanations, no sentences).",
    "Examples of valid items: Artikel, Präpositionen, Verbposition, Akkusativ, Dativ, Genitiv, Verbkonjugation, Trennbare Verben.",
    "encouragement: exactly one short German sentence urging the learner to focus on these recurring patterns in the next training session.",
    "If no repeated patterns exist, set items to [] and still provide a brief encouraging sentence.",
    JSON.stringify({
      summary: "string",
      overallPerformance: "string",
      strongestSkill: "string",
      weakestSkill: "string",
      tomorrowPriorities: ["priority 1", "priority 2", "priority 3"],
      repeatedGrammarPatterns: {
        items: ["Artikel", "Präpositionen"],
        encouragement:
          "Konzentrieren Sie sich im nächsten Training besonders auf diese wiederholten Grammatikmuster.",
      },
      exercises: [
        {
          category: "schreiben|hoeren|bildbeschreibung|planung|selbstvorstellung",
          title: "string",
          originalText: "string",
          correctedText: "string",
          coveredPoints: [{ id: "point-1", text: "string" }],
          missingPoints: [{ id: "point-2", text: "string" }],
          feedback: "string",
          cefrPerformance: "B1",
        },
      ],
      writing: {
        originalText: "string",
        correctedText: "string",
        coveredPoints: [{ id: "point-1", text: "string" }],
        missingPoints: [{ id: "point-2", text: "string" }],
      },
      listening: { notes: "string" },
      speaking: { notes: "string" },
    }),
  ].join("\n");
}

/**
 * @param {object} input
 */
export function buildDailyReportUserPrompt(input) {
  return JSON.stringify({
    planIndex: input.planIndex,
    trainingMemories: input.trainingMemories,
  });
}

/**
 * @param {unknown} raw
 */
export function validateDailyReportResponse(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Antwort ist kein Objekt."] };
  }

  for (const field of FORBIDDEN_FIELDS) {
    if (raw[field] !== undefined) {
      errors.push(`Verbotenes Feld: ${field}`);
    }
  }

  if (!String(raw.summary || "").trim()) {
    errors.push("summary fehlt.");
  }

  const exercises = Array.isArray(raw.exercises) ? raw.exercises : [];
  if (!exercises.length && !raw.writing?.originalText) {
    errors.push("exercises oder writing fehlt.");
  }

  if (!String(raw.overallPerformance || "").trim()) {
    errors.push("overallPerformance fehlt.");
  }

  if (!String(raw.strongestSkill || "").trim()) {
    errors.push("strongestSkill fehlt.");
  }

  if (!String(raw.weakestSkill || "").trim()) {
    errors.push("weakestSkill fehlt.");
  }

  const priorities = Array.isArray(raw.tomorrowPriorities) ? raw.tomorrowPriorities : [];
  if (priorities.length < 3) {
    errors.push("tomorrowPriorities benötigt mindestens 3 Einträge.");
  }

  const grammarPatterns = validateRepeatedGrammarPatterns(raw.repeatedGrammarPatterns);
  if (!grammarPatterns.ok) {
    errors.push(...grammarPatterns.errors);
  }

  return {
    ok: errors.length === 0,
    errors,
    data:
      errors.length === 0
        ? {
            ...raw,
            repeatedGrammarPatterns: grammarPatterns.data,
          }
        : raw,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} params
 */
export async function runB1DailyReportGeneration({
  userId,
  planIndex,
  planHash,
  trainingMemories,
  idempotencyKey,
}) {
  if (!Array.isArray(trainingMemories) || trainingMemories.length === 0) {
    throw new AppError("VALIDATION_ERROR", "trainingMemories ist erforderlich.", 400);
  }

  const cacheKey = `${userId}:${idempotencyKey || createHash("sha256").update(JSON.stringify(trainingMemories)).digest("hex")}`;
  if (dailyReportCache.has(cacheKey)) {
    return dailyReportCache.get(cacheKey);
  }

  let lastValidationErrors = [];
  let lastError = null;

  for (let attempt = 1; attempt <= DAILY_REPORT_MAX_ATTEMPTS; attempt += 1) {
    try {
      const raw = await createB1WeeklyTrainingJsonCompletion({
        system: buildSystemPrompt(),
        user: buildDailyReportUserPrompt({ planIndex, trainingMemories }),
        maxCompletionTokens: DAILY_REPORT_MAX_COMPLETION_TOKENS,
      });

      const validated = validateDailyReportResponse(raw);
      if (!validated.ok) {
        lastValidationErrors = validated.errors;
        console.warn(
          `[weekly-training-b1] daily report validation failed (attempt ${attempt}):`,
          validated.errors.join(" ")
        );
      } else {
        const result = {
          version: B1_DAILY_REPORT_VERSION,
          planIndex,
          planHash: planHash || null,
          generatedAt: new Date().toISOString(),
          idempotencyKey: idempotencyKey || null,
          source: "ai",
          ...validated.data,
          repeatedGrammarPatterns: normalizeRepeatedGrammarPatterns(
            validated.data.repeatedGrammarPatterns
          ),
        };
        dailyReportCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      lastError = error;
      console.warn(
        `[weekly-training-b1] daily report generation failed (attempt ${attempt}):`,
        error instanceof Error ? error.message : String(error)
      );
    }

    if (attempt < DAILY_REPORT_MAX_ATTEMPTS) {
      await sleep(DAILY_REPORT_RETRY_DELAY_MS * attempt);
    }
  }

  console.warn("[weekly-training-b1] daily report using deterministic fallback", {
    validationErrors: lastValidationErrors,
    lastError: lastError instanceof Error ? lastError.message : lastValidationErrors.join(" "),
  });

  const fallback = buildDeterministicDailyReport({
    planIndex,
    planHash,
    trainingMemories,
    idempotencyKey,
  });
  dailyReportCache.set(cacheKey, fallback);
  return fallback;
}

/** Test helper */
export function resetB1DailyReportCache() {
  dailyReportCache.clear();
}
