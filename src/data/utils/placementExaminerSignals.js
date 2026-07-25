/**
 * Placement examiner signal layer — separates task fulfilment / comprehension
 * from productive language evidence. Used for routing and diagnostic reports.
 */

import { normalizePlacementBand } from "../placementLogic.js";

export const PLACEMENT_LISTENING_INSUFFICIENT_LABEL =
  "Insufficient evidence / غير قابل للتقييم";

/** Closed A2→B1 bridge probe questions (unscripted pivot after a strong free intro). */
export const PLACEMENT_SELF_BRIDGE_QUESTIONS = Object.freeze([
  {
    id: "bridge_daily_routine",
    question: "Was machen Sie normalerweise an einem Tag?",
    simplified: "Erzählen Sie bitte: Was machen Sie am Tag?",
    targets: ["daily_routine"],
  },
  {
    id: "bridge_why_german",
    question: "Warum lernen Sie Deutsch?",
    simplified: "Warum lernen Sie Deutsch? Bitte in ein oder zwei Sätzen.",
    targets: ["german_learning"],
  },
]);

const MISUNDERSTANDING_RE =
  /\b(ich habe nicht verstanden|ich habe? das nicht verstanden|ich verstehe (?:die frage )?nicht|keine ahnung|was meinen sie|koennen sie das wiederholen|können sie das wiederholen|bitte wiederholen|ich weiss? nicht|ich weiß nicht)\b/i;

const LEVELS = new Set(["low", "medium", "high"]);
const CONFIDENCE = new Set(["low", "medium", "high", "uncertain"]);

function pickLevel(raw, fallback = "medium") {
  const v = String(raw || "").trim().toLowerCase();
  return LEVELS.has(v) ? v : fallback;
}

function pickConfidence(raw, fallback = "medium") {
  const v = String(raw || "").trim().toLowerCase();
  return CONFIDENCE.has(v) ? v : fallback;
}

export function detectMisunderstandingPhrase(transcript = "") {
  return MISUNDERSTANDING_RE.test(String(transcript || ""));
}

export function sanitizeExaminerSignals(raw = {}, transcript = "") {
  const misunderstood = detectMisunderstandingPhrase(transcript);
  const taskFulfilment = pickLevel(
    raw?.taskFulfilment,
    misunderstood ? "low" : "medium"
  );
  const comprehension = pickConfidence(
    raw?.comprehension,
    misunderstood ? "uncertain" : "medium"
  );
  return {
    taskFulfilment,
    comprehension,
    communicativeEffectiveness: pickLevel(raw?.communicativeEffectiveness, "medium"),
    vocabulary: pickLevel(raw?.vocabulary, "medium"),
    grammarAccuracy: pickLevel(raw?.grammarAccuracy, "medium"),
    fluency: pickLevel(raw?.fluency, "medium"),
    pronunciationIntelligibility: pickLevel(raw?.pronunciationIntelligibility, "medium"),
    responseRelevance: pickLevel(
      raw?.responseRelevance,
      taskFulfilment === "low" ? "low" : "medium"
    ),
    memorizationRisk: pickLevel(raw?.memorizationRisk, "low"),
    sttConfidence: pickConfidence(raw?.sttConfidence, "medium"),
    needsSimplifiedRephrase: Boolean(raw?.needsSimplifiedRephrase) || misunderstood,
    usableLanguageEvidence: raw?.usableLanguageEvidence !== false,
    ceilingSignal: Boolean(raw?.ceilingSignal),
  };
}

/**
 * Task misunderstanding must not zero out productive language evidence.
 * Comprehension weakness caps routing uplift; accuracy floor still applies separately.
 */
export function applyProductiveBandWithTaskSeparation({
  communicativeBand,
  accuracyBand,
  proposedBand,
  modelLevel = "A2",
  examinerSignals = {},
} = {}) {
  const communicative = normalizePlacementBand(communicativeBand);
  const accuracy = normalizePlacementBand(accuracyBand);
  const proposed = normalizePlacementBand(proposedBand);
  const level = String(modelLevel || "A2").toUpperCase();
  const isBLevel = level.startsWith("B");

  let band = proposed || communicative || null;
  if (communicative === "weak") band = "weak";
  else if (accuracy === "weak" && band === "strong") band = "medium";
  else if (isBLevel && accuracy === "medium" && band === "strong") band = "medium";
  else if (communicative === "strong" && accuracy === "strong") band = "strong";
  else if (communicative === "strong" && accuracy === "medium" && !isBLevel) band = "strong";
  else if (communicative === "medium") band = band || "medium";

  const taskLow =
    examinerSignals.taskFulfilment === "low" ||
    examinerSignals.responseRelevance === "low";
  const comprehensionWeak =
    examinerSignals.comprehension === "low" ||
    examinerSignals.comprehension === "uncertain";

  if (taskLow || comprehensionWeak) {
    if (band === "strong") band = "medium";
  }

  if (examinerSignals.usableLanguageEvidence === false && taskLow) {
    band = band === "strong" ? "medium" : band;
  }

  return band;
}

export function shouldOfferBridgeProbe({ band, examinerSignals, conversation = [], followUpCount = 0 }) {
  if (followUpCount >= 2) return false;
  const askedBridge = conversation.some((t) => t?.bridgeProbe);
  if (askedBridge) return false;
  const normalized = normalizePlacementBand(band);
  if (normalized !== "strong") return false;
  if (examinerSignals.memorizationRisk === "high") return true;
  if (examinerSignals.memorizationRisk === "medium" && normalized === "strong") return true;
  return false;
}

export function deriveBridgeProbeResult(examinerSignals, transcript = "") {
  if (detectMisunderstandingPhrase(transcript)) return "failed";
  if (
    examinerSignals.taskFulfilment === "low" ||
    examinerSignals.comprehension === "low" ||
    examinerSignals.comprehension === "uncertain"
  ) {
    return "failed";
  }
  if (
    examinerSignals.taskFulfilment === "high" ||
    (examinerSignals.taskFulfilment === "medium" &&
      examinerSignals.responseRelevance !== "low" &&
      examinerSignals.usableLanguageEvidence !== false)
  ) {
    return "confirmed";
  }
  return "failed";
}

export function getBridgeQuestion(conversation = []) {
  const asked = new Set(
    conversation.filter((t) => t?.bridgeProbe).map((t) => t?.followUpQuestionId)
  );
  return PLACEMENT_SELF_BRIDGE_QUESTIONS.find((q) => !asked.has(q.id)) || PLACEMENT_SELF_BRIDGE_QUESTIONS[0];
}

export function simplifiedRephraseForQuestion(question = "", skill = "selbstvorstellung") {
  const text = String(question || "").trim();
  if (!text) return null;
  const bridge = PLACEMENT_SELF_BRIDGE_QUESTIONS.find(
    (item) => item.question === text || item.simplified === text
  );
  if (bridge) return bridge.simplified;
  const generic = {
    selbstvorstellung: "Können Sie das bitte einfacher beantworten? " + text,
    bildbeschreibung: "Bitte antworten Sie nur auf diese Frage: " + text,
    planung: "Bitte antworten Sie kurz auf diese Frage: " + text,
  };
  return generic[skill] || generic.selbstvorstellung;
}

export function conversationUsedSimplifiedRephrase(conversation = [], question = "") {
  const q = String(question || "").trim();
  return conversation.some(
    (turn) =>
      turn?.simplifiedRephraseUsed &&
      (turn?.question === q || turn?.rephraseOf === q)
  );
}

export function normalizeRoutingContext(context = {}) {
  const status = String(context?.bridgeProbeStatus || "").trim().toLowerCase();
  const bridgeProbeStatus = ["due", "confirmed", "failed"].includes(status)
    ? status
    : null;
  return {
    bridgeProbeStatus,
    b1ListeningStable: Boolean(context?.b1ListeningStable),
  };
}
