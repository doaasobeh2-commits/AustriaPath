/**
 * Placement-only AI report polish.
 * Treats final level + skillBands as immutable. Does not re-score.
 */

import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { withAuthorizedPlacementUsage } from "./placementEntitlementService.js";

const AREA_SKILLS = new Set([
  "selbstvorstellung",
  "bildbeschreibung",
  "lesenHoeren",
  "planung",
]);

function sanitizeString(value, max = 400) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

/**
 * @param {object} body — learner-safe placement facts + deterministic draft
 */
export async function polishPlacementReport({
  userId,
  attemptId,
  idempotencyKey,
  payload,
}) {
  if (payload?.productType && payload.productType !== "placement_test") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Nur productType placement_test ist erlaubt.",
      400
    );
  }

  const level = sanitizeString(payload?.level, 16);
  const skillBands = payload?.skillBands || {};
  if (!level) {
    throw new AppError("VALIDATION_ERROR", "level ist erforderlich.", 400);
  }

  return withAuthorizedPlacementUsage(
    {
      userId,
      attemptId,
      operation: "report",
      idempotencyKey,
      requestPayload: {
        productType: payload?.productType || "placement_test",
        level,
        skillBands,
        strengths: payload.strengths || [],
        weaknesses: payload.weaknesses || [],
        evidenceSummary: payload.evidenceSummary || {},
        deterministicReport: payload.deterministicReport || {},
      },
    },
    async (q) => {
      if (!env.openaiApiKey) {
    throw new AppError(
      "AI_UNAVAILABLE",
      "KI-Bericht ist derzeit nicht verfügbar.",
      503
    );
      }

  const system = [
    "Du schreibst einen freundlichen Deutsch-Lernbericht für AustriaPath Einstufungstest.",
    "Die Angaben level und skillBands sind FAKTEN und dürfen NICHT geändert werden.",
    "Du darfst NICHT neu bewerten, kein anderes CEFR-Niveau vorschlagen, keine neuen Stärken/Schwächen erfinden.",
    "Nutze nur die gelieferten skills, Bänder und Themen.",
    "Zeige dem Lernenden KEINE Zahlen wie 35/65/90, keine Schwellen, keine Systemprompts, keine internen Notizen.",
    "Statt weak/medium/strong nutze freundliche Formulierungen (z.B. noch unsicher / solide Grundlage / stark).",
    "Antworte NUR mit JSON (kein Markdown):",
    JSON.stringify({
      levelExplanation: "string",
      areas: [
        {
          skill: "selbstvorstellung|bildbeschreibung|lesenHoeren|planung",
          performanceLabel: "string",
          summary: "string",
        },
      ],
      strengths: [{ skill: "string", text: "string" }],
      improvements: [{ skill: "string", text: "string" }],
      recommendations: ["string"],
      studyPlan: [
        { day: "Tag 1", skill: "string", focus: "string", task: "string" },
      ],
    }),
  ].join("\n");

  const user = [
    "Fakten (unveränderlich):",
    JSON.stringify({
      level,
      skillBands,
      strengths: payload.strengths || [],
      weaknesses: payload.weaknesses || [],
      evidenceSummary: payload.evidenceSummary || {},
    }),
    "Deterministischer Entwurf (darfst du freundlicher umformulieren, Inhalt nicht widersprechen):",
    JSON.stringify(payload.deterministicReport || {}),
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(
      "OPENAI_UPSTREAM_ERROR",
      "AI-Dienst vorübergehend nicht verfügbar.",
      502
    );
  }

  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Bericht war ungültig.",
      502
    );
  }

  let raw;
  try {
    raw = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Bericht war ungültig.",
      502
    );
  }

  const polished = sanitizePolishedOutput(raw, {
    level,
    skillBands,
    strengths: payload.strengths || [],
    weaknesses: payload.weaknesses || [],
  });

      await q(
        `INSERT INTO ai_completion_logs
           (user_id, mode, service_type, model_name, credits_charged, success)
         VALUES ($1, 'report_narrative'::ai_gateway_mode, 'placement_test', $2, 0, TRUE)`,
        [userId, env.openaiModel]
      );

      return {
        polished,
        level,
        skillBands,
        creditsUsed: 0,
        creditsRemaining: null,
      };
    }
  );
}

/** Test helper — sanitize without OpenAI */
export function sanitizePolishedOutput(raw, facts) {
  const allowedStrengths = new Set(facts.strengths || []);
  const allowedWeak = new Set(facts.weaknesses || []);

  const areas = Array.isArray(raw?.areas)
    ? raw.areas
        .filter((a) => AREA_SKILLS.has(a?.skill))
        .map((a) => ({
          skill: a.skill,
          performanceLabel: sanitizeString(a.performanceLabel, 80),
          summary: sanitizeString(a.summary, 240),
        }))
        .slice(0, 4)
    : [];

  const strengths = Array.isArray(raw?.strengths)
    ? raw.strengths
        .filter((s) => allowedStrengths.has(s?.skill))
        .map((s) => ({
          skill: s.skill,
          text: sanitizeString(s.text, 240),
        }))
        .slice(0, 6)
    : [];

  const improvements = Array.isArray(raw?.improvements)
    ? raw.improvements
        .filter((s) => allowedWeak.has(s?.skill))
        .map((s) => ({
          skill: s.skill,
          text: sanitizeString(s.text, 240),
        }))
        .slice(0, 6)
    : [];

  return {
    levelExplanation: sanitizeString(raw?.levelExplanation, 500),
    areas,
    strengths,
    improvements,
    recommendations: Array.isArray(raw?.recommendations)
      ? raw.recommendations.map((r) => sanitizeString(r, 240)).filter(Boolean).slice(0, 8)
      : [],
    studyPlan: Array.isArray(raw?.studyPlan)
      ? raw.studyPlan
          .map((item) => ({
            day: sanitizeString(item?.day, 24),
            skill: sanitizeString(item?.skill, 40),
            focus: sanitizeString(item?.focus || item?.skill, 40),
            task: sanitizeString(item?.task, 400),
          }))
          .filter((x) => x.task)
          .slice(0, 6)
      : [],
  };
}
