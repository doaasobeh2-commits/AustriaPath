/**
 * Placement-only AI report polish.
 * Treats final level + skillBands as immutable. Does not re-score.
 */

import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { AI_COSTS } from "../utils/permissions.js";
import { query, withTransaction } from "../db/client.js";
import { isAdminUser } from "../utils/adminAccess.js";

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
export async function polishPlacementReport({ userId, payload, authUser = null }) {
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

  const adminBypass = isAdminUser(authUser);
  const cost = adminBypass ? 0 : AI_COSTS.placement_test || 1;
  const { rows } = await query(`SELECT ai_credits FROM users WHERE id = $1`, [
    userId,
  ]);
  if (!adminBypass && (rows[0]?.ai_credits ?? 0) < cost) {
    throw new AppError(
      "AI_CREDITS_EXHAUSTED",
      "Keine AI-Credits mehr verfügbar.",
      402
    );
  }

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

  let billing = { cost: 0, creditsRemaining: rows[0]?.ai_credits ?? 0 };
  if (cost > 0) {
    billing = await withTransaction(async (q) => {
      const locked = await q(
        `SELECT ai_credits FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      const current = locked.rows[0]?.ai_credits ?? 0;
      if (current < cost) {
        throw new AppError(
          "AI_CREDITS_EXHAUSTED",
          "Keine AI-Credits mehr verfügbar.",
          402
        );
      }
      await q(
        `UPDATE users SET ai_credits = ai_credits - $2, used_ai_credits = used_ai_credits + $2, last_ai_usage_at = NOW() WHERE id = $1`,
        [userId, cost]
      );
      const remaining = current - cost;
      await q(
        `INSERT INTO ai_credits (user_id, amount, balance_after, reason, service_type)
         VALUES ($1, $2, $3, 'placement_report_polish', 'placement_test')`,
        [userId, -cost, remaining]
      );
      await q(
        `INSERT INTO ai_completion_logs (user_id, mode, service_type, model_name, credits_charged, success)
         VALUES ($1, 'report_narrative'::ai_gateway_mode, 'placement_test', $2, $3, TRUE)`,
        [userId, env.openaiModel, cost]
      );
      return { cost, creditsRemaining: remaining };
    });
  }

  return {
    polished,
    level,
    skillBands,
    creditsUsed: billing.cost,
    creditsRemaining: billing.creditsRemaining,
  };
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
