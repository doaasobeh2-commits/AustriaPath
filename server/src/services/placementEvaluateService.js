/**
 * Placement-only AI turn evaluation.
 * Does NOT modify shared /ai/completions behavior.
 * Uses aiPlacementLibrary models read-only. No ExaminerMind / council.
 */

import { getPlacementModel } from "../../../src/data/aiPlacementLibrary.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { AI_COSTS } from "../utils/permissions.js";
import { query, withTransaction } from "../db/client.js";
import { isAdminUser } from "../utils/adminAccess.js";

export const PLACEMENT_MAX_FOLLOWUPS = 2;
export const PLACEMENT_EVAL_METHOD = "placement-ai-turn-v1";

const BANDS = new Set(["weak", "medium", "strong"]);
const FOLLOW_UP_SOURCES = new Set([
  "followUpRules",
  "examinerQuestions",
  "missingTopic",
]);

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Closed set of learner-facing follow-up questions for a model.
 * Only examinerQuestions — followUpRules govern selection, not invent text.
 * @param {object} model
 * @returns {string[]}
 */
export function buildAllowedFollowUps(model, conversation = []) {
  const allowed = [];
  const seen = new Set();
  const alreadyAsked = new Set(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => normalizeText(turn?.question || ""))
      .filter(Boolean)
  );

  for (const q of model?.examinerQuestions || []) {
    const text = String(q || "").trim();
    if (!text) continue;
    const key = normalizeText(text);
    if (alreadyAsked.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    allowed.push(text);
  }

  return allowed;
}

/**
 * Pick an allowed follow-up that best matches a proposed string, or null.
 * Never invents a replacement.
 * @param {string|null|undefined} proposed
 * @param {string[]} allowed
 */
export function matchAllowedFollowUp(proposed, allowed = []) {
  const prop = normalizeText(proposed || "");
  if (!prop || !allowed.length) return null;

  for (const q of allowed) {
    if (normalizeText(q) === prop) return q;
  }

  for (const q of allowed) {
    const n = normalizeText(q);
    if (n.length >= 12 && (prop.includes(n) || n.includes(prop))) return q;
  }

  return null;
}

/**
 * Validate/normalize model JSON into the public Placement evaluate schema.
 * Rejects invented follow-ups; never invents replacements.
 * @param {object} raw
 * @param {object} model
 * @param {number} followUpCount
 */
export function sanitizePlacementEvaluation(
  raw,
  model,
  followUpCount = 0,
  conversation = []
) {
  const allowed = buildAllowedFollowUps(model, conversation);
  if (!BANDS.has(raw?.band)) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Antwort enthält keine gültige Bewertung.",
      502
    );
  }
  const band = raw.band;

  const coveredTopics = Array.isArray(raw?.coveredTopics)
    ? raw.coveredTopics.map((t) => String(t)).filter(Boolean).slice(0, 20)
    : [];
  const missingTopics = Array.isArray(raw?.missingTopics)
    ? raw.missingTopics.map((t) => String(t)).filter(Boolean).slice(0, 20)
    : [];
  const notes = Array.isArray(raw?.notes)
    ? raw.notes.map((t) => String(t)).filter(Boolean).slice(0, 8)
    : [];

  let needsFollowUp = Boolean(raw?.needsFollowUp);
  let followUpQuestion = null;
  let followUpSource = null;

  if (followUpCount >= PLACEMENT_MAX_FOLLOWUPS) {
    needsFollowUp = false;
  }

  if (needsFollowUp) {
    const matched = matchAllowedFollowUp(raw?.followUpQuestion, allowed);
    if (matched) {
      followUpQuestion = matched;
      const claimed = String(raw?.followUpSource || "");
      followUpSource = FOLLOW_UP_SOURCES.has(claimed)
        ? claimed
        : "examinerQuestions";
    } else {
      needsFollowUp = false;
      followUpQuestion = null;
      followUpSource = null;
    }
  }

  // A short dialogue is part of the task, not an optional parallel flow.
  // If the model omitted a requested early follow-up, continue with a remaining
  // existing examiner question. Never invent question text.
  const minimumFollowUps = model?.skill === "planung" ? 2 : 1;
  if (
    !needsFollowUp &&
    !Boolean(raw?.needsFollowUp) &&
    followUpCount < minimumFollowUps &&
    followUpCount < PLACEMENT_MAX_FOLLOWUPS &&
    allowed.length
  ) {
    needsFollowUp = true;
    followUpQuestion = allowed[0];
    followUpSource = "examinerQuestions";
  }

  return {
    productType: "placement_test",
    modelId: model.id,
    skill: model.skill,
    modelLevel: model.level,
    band,
    coveredTopics,
    missingTopics,
    needsFollowUp,
    followUpQuestion,
    followUpSource,
    notes,
    evaluationMethod: PLACEMENT_EVAL_METHOD,
  };
}

/**
 * Learner-safe factual image context for Bildbeschreibung evaluation.
 * Never includes vocab lists, model answers, tips, or pool metadata.
 */
export function sanitizeSelectedImageContext(raw) {
  if (!raw || typeof raw !== "object") return null;
  const catalogLevel = String(raw.catalogLevel || "").trim();
  const catalogId = Number(raw.catalogId);
  const imagePath = String(raw.imagePath || "").trim();
  const title = String(raw.title || "").trim().slice(0, 120);
  const sceneDescription = String(raw.sceneDescription || "")
    .trim()
    .slice(0, 800);

  if (!catalogLevel || !Number.isFinite(catalogId) || catalogId <= 0) return null;
  if (!imagePath || !sceneDescription) return null;

  // Reject accidental helper fields if a client ever sends them
  return {
    catalogLevel,
    catalogId,
    imagePath: imagePath.slice(0, 240),
    title,
    sceneDescription,
  };
}

export function buildExaminerSystemPrompt(
  model,
  allowedFollowUps,
  selectedImageContext = null,
  conversation = []
) {
  const isBild = model?.skill === "bildbeschreibung";
  const modelPayload = {
    id: model.id,
    skill: model.skill,
    level: model.level,
    difficulty: model.difficulty,
    requiredTopics: model.requiredTopics || [],
    examinerQuestions: model.examinerQuestions || [],
    followUpRules: model.followUpRules || [],
    benchmarkMarkers: model.benchmarkMarkers || {},
  };

  if (isBild && selectedImageContext) {
    modelPayload.prompt =
      "Der Lernende beschreibt das ausgewählte Placement-Bild. Bewerte nur gegen selectedImage.";
  } else {
    modelPayload.prompt = model.prompt;
  }

  const lines = [
    "Du bist ausschließlich der AustriaPath Placement-Prüfer für EIN Placement-Modell.",
    "Du bewertest nur die aktuelle Lernenden-Antwort gegen die bereitgestellten Modellfelder.",
    "Bewerte dabei die GESAMTE bisherige Skill-Unterhaltung, nicht nur die letzte Antwort.",
    "voice_transcript ist automatische Spracherkennung und kann einzelne Erkennungsfehler enthalten. Behandle den Text als Evidenz, aber bestrafe wahrscheinliche Transkriptionsfehler nicht als Sprachfehler.",
    "Du darfst KEINE neuen Szenarien, Themen oder freien Prüfungsfragen erfinden.",
    "selectedLevel / Startniveau darf die Bewertung NICHT beeinflussen — nur die Antwort und die Modellfelder.",
    "Antworte NUR mit einem JSON-Objekt (kein Markdown), Schema:",
    '{"band":"weak|medium|strong","coveredTopics":[],"missingTopics":[],"needsFollowUp":boolean,"followUpQuestion":string|null,"followUpSource":"examinerQuestions|followUpRules|missingTopic"|null,"notes":[]}',
    "band: weak/medium/strong nur anhand der Antwort vs requiredTopics und benchmarkMarkers.",
    "needsFollowUp=true nur wenn eine Nachfrage sinnvoll ist UND followUpQuestion EXAKT einer erlaubten Frage entspricht.",
    "followUpRules und fehlende requiredTopics dürfen nur helfen, eine erlaubte examinerQuestions-Frage auszuwählen.",
    "Wenn keine erlaubte Nachfrage passt: needsFollowUp=false und followUpQuestion=null.",
    "Erlaubte followUpQuestion-Werte (geschlossen — nur diese Texte):",
    JSON.stringify(allowedFollowUps),
  ];

  if (isBild && selectedImageContext) {
    lines.push(
      "BILDBESCHREIBUNG — verbindliche Szene:",
      "Bewerte die Antwort AUSSCHLIESSLICH gegen selectedImage (title + sceneDescription).",
      "Ignoriere jedes model.imagePrompt vollständig — es gehört möglicherweise zu einer anderen Szene.",
      "Wortlisten, Modellantworten oder alternative Formulierungen sind KEINE Pflicht.",
      "Eine gültige Beschreibung mit anderen Wörtern darf nicht bestraft werden, wenn die sichtbare Szene korrekt erfasst ist.",
      "selectedImage:",
      JSON.stringify(selectedImageContext)
    );
  }

  lines.push(
    "Bisherige Skill-Unterhaltung (Fragen und Lernenden-Transkripte):",
    JSON.stringify(conversation)
  );

  lines.push("Aktuelles Modell:", JSON.stringify(modelPayload));
  return lines.join("\n");
}

async function callOpenAiJson({ system, user }) {
  if (!env.openaiApiKey) {
    throw new AppError(
      "AI_UNAVAILABLE",
      "KI-Prüfer ist derzeit nicht verfügbar.",
      503
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.2,
      max_tokens: 500,
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
      "KI-Antwort war ungültig.",
      502
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Antwort war ungültig.",
      502
    );
  }
}

async function assertHasCredits(userId, userRow = null) {
  if (isAdminUser(userRow)) {
    return 0;
  }
  const cost = AI_COSTS.placement_test || 1;
  const { rows } = await query(`SELECT ai_credits FROM users WHERE id = $1`, [
    userId,
  ]);
  const balance = rows[0]?.ai_credits ?? 0;
  if (balance < cost) {
    throw new AppError(
      "AI_CREDITS_EXHAUSTED",
      "Keine AI-Credits mehr verfügbar.",
      402
    );
  }
  return cost;
}

async function chargePlacementCredits(userId, cost) {
  if (!cost || cost <= 0) {
    return { cost: 0, creditsRemaining: null };
  }
  return withTransaction(async (q) => {
    const locked = await q(`SELECT ai_credits FROM users WHERE id = $1 FOR UPDATE`, [
      userId,
    ]);
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
       VALUES ($1, $2, $3, 'placement_evaluate_turn', 'placement_test')`,
      [userId, -cost, remaining]
    );
    await q(
      `INSERT INTO ai_completion_logs (user_id, mode, service_type, model_name, credits_charged, success)
       VALUES ($1, 'conversational'::ai_gateway_mode, 'placement_test', $2, $3, TRUE)`,
      [userId, env.openaiModel, cost]
    );
    return { cost, creditsRemaining: remaining };
  });
}

/**
 * @param {{ userId: string, productType: string, modelId: string, answerText: string, followUpCount?: number, selectedImage?: object }} input
 */
export async function evaluatePlacementTurn({
  userId,
  productType,
  modelId,
  answerText,
  followUpCount = 0,
  conversation = [],
  currentQuestion = null,
  inputMode = "typed",
  selectedImage = null,
  authUser = null,
}) {
  if (productType !== "placement_test") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Nur productType placement_test ist erlaubt.",
      400
    );
  }

  const model = getPlacementModel(modelId);
  if (!model || model.service !== "placement") {
    throw new AppError("VALIDATION_ERROR", "Unbekanntes Placement-Modell.", 400);
  }

  const text = String(answerText || "").trim();
  if (text.length < 8) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Antwort ist zu kurz für die Auswertung.",
      400
    );
  }

  let imageContext = null;
  if (model.skill === "bildbeschreibung") {
    imageContext = sanitizeSelectedImageContext(selectedImage);
    if (!imageContext) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Bildkontext fehlt für die Bildbeschreibung-Auswertung.",
        400
      );
    }
  }

  const count = Math.max(0, Number(followUpCount) || 0);
  const safeConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-6)
    .map((turn) => ({
      question: String(turn?.question || "").trim().slice(0, 300),
      transcript: String(turn?.transcript || "").trim().slice(0, 3000),
      inputMode: turn?.inputMode === "voice_transcript" ? "voice_transcript" : "typed",
    }))
    .filter((turn) => turn.transcript);
  const currentTurn = {
    question: String(currentQuestion || "").trim().slice(0, 300),
    transcript: text.slice(0, 3000),
    inputMode: inputMode === "voice_transcript" ? "voice_transcript" : "typed",
  };
  const fullConversation = [...safeConversation, currentTurn];
  const cost = await assertHasCredits(userId, authUser);

  const allowedFollowUps = buildAllowedFollowUps(model, fullConversation);
  const system = buildExaminerSystemPrompt(
    model,
    allowedFollowUps,
    imageContext,
    fullConversation
  );
  const userMsg = [
    "Lernenden-Antwort (Transkription/Text):",
    text,
    `Bisherige Nachfragen in diesem Skill: ${count} (Maximum ${PLACEMENT_MAX_FOLLOWUPS}).`,
    count >= PLACEMENT_MAX_FOLLOWUPS
      ? "Keine weitere Nachfrage erlaubt."
      : "Nachfrage nur wenn nötig und nur aus der erlaubten Liste.",
  ].join("\n");

  const raw = await callOpenAiJson({ system, user: userMsg });
  const evaluation = sanitizePlacementEvaluation(
    raw,
    model,
    count,
    fullConversation
  );
  const billing = await chargePlacementCredits(userId, cost);

  return {
    ...evaluation,
    creditsUsed: billing.cost,
    creditsRemaining: billing.creditsRemaining,
  };
}

/** Test helper: dry sanitize without OpenAI */
export function evaluatePlacementTurnOffline({
  modelId,
  raw,
  followUpCount = 0,
  conversation = [],
}) {
  const model = getPlacementModel(modelId);
  if (!model) throw new Error("model not found");
  return sanitizePlacementEvaluation(raw || {}, model, followUpCount, conversation);
}
