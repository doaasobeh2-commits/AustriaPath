/**
 * Dialogue transcript helpers for B1 interactive speaking sessions.
 * @module weekly-training-ai/core/conversationTranscript
 */

/**
 * @param {Array<{ role?: string }>} transcript
 */
export function filterDialogueTranscript(transcript = []) {
  return (transcript || []).filter((entry) => entry?.role === "learner" || entry?.role === "assistant");
}

/**
 * @param {Array<{ role?: string }>} transcript
 */
export function countAssistantTurns(transcript = []) {
  return filterDialogueTranscript(transcript).filter((entry) => entry.role === "assistant").length;
}

/**
 * @param {Array<{ role?: string }>} transcript
 */
export function countLearnerTurns(transcript = []) {
  return filterDialogueTranscript(transcript).filter((entry) => entry.role === "learner").length;
}

/**
 * @param {Array<{ role?: string, conversationComplete?: boolean }>} transcript
 */
export function isConversationMarkedComplete(transcript = []) {
  return filterDialogueTranscript(transcript).some(
    (entry) => entry.role === "assistant" && entry.conversationComplete === true
  );
}

export const MIN_SPEAKING_FOLLOW_UPS = 1;
export const MAX_SPEAKING_FOLLOW_UPS = 2;

const BILD_COMMUNICATIVE_FALLBACKS = [
  "Wie wirkt die Situation auf Sie?",
  "Haben Sie schon einmal etwas Ähnliches erlebt?",
  "Warum ist dieser Beruf wichtig?",
  "Würden Sie dort arbeiten wollen?",
];

/**
 * @param {string} category
 * @param {object} modelSnapshot
 * @param {Array<{ id?: string, text?: string }>} missingPoints
 * @param {number} followUpIndex
 */
export function pickMandatoryFollowUpQuestion(
  category,
  modelSnapshot,
  missingPoints = [],
  followUpIndex = 0
) {
  if (category === "selbstvorstellung") {
    const pool = Array.isArray(modelSnapshot?.followUpQuestions)
      ? modelSnapshot.followUpQuestions
      : [];
    if (missingPoints.length) {
      const topic = missingPoints[followUpIndex % missingPoints.length];
      const label = String(topic?.text || topic?.id || "").trim();
      if (label) return `Können Sie noch etwas zu „${label}“ erzählen?`;
    }
    if (pool.length) return String(pool[followUpIndex % pool.length]);
    return "Was machen Sie beruflich, und wie sieht Ihr Alltag aus?";
  }

  if (category === "bildbeschreibung") {
    const pool = modelSnapshot?.followUpQuestionPool;
    if (pool && typeof pool === "object") {
      const flat = [
        ...(pool.opinion || []),
        ...(pool.personalExperience || []),
        ...(pool.homelandComparison || []),
        ...(pool.general || []),
      ]
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
      if (flat.length) return flat[followUpIndex % flat.length];
    }
    if (missingPoints.length) {
      const point = missingPoints[followUpIndex % missingPoints.length];
      const label = String(point?.text || point?.id || "").trim();
      if (label) return `Können Sie noch etwas zu „${label}“ sagen?`;
    }
    return BILD_COMMUNICATIVE_FALLBACKS[followUpIndex % BILD_COMMUNICATIVE_FALLBACKS.length];
  }

  return "Können Sie das bitte genauer erklären?";
}

/**
 * @param {string} category
 * @param {object} modelSnapshot
 * @param {object} session
 * @param {Array<{ id?: string, text?: string }>} missingPoints
 * @param {number} followUpIndex
 */
export function buildMandatoryFollowUpTurn(
  category,
  modelSnapshot,
  session,
  missingPoints = [],
  followUpIndex = 0
) {
  const assistantMessage = pickMandatoryFollowUpQuestion(
    category,
    modelSnapshot,
    missingPoints,
    followUpIndex
  );

  return {
    assistantMessage,
    coveredPoints: session.coveredPoints || [],
    missingPoints: Array.isArray(missingPoints) ? missingPoints : [],
    allRequiredCovered: false,
    conversationComplete: false,
    transcriptEntry: {
      role: "assistant",
      text: assistantMessage,
      conversationComplete: false,
      mandatoryFollowUp: true,
      at: new Date().toISOString(),
    },
  };
}

/**
 * @param {string} category
 */
export function buildForcedClosingTurn(category, coveredPoints = []) {
  const closings = {
    bildbeschreibung:
      "Vielen Dank für Ihre Beschreibung. Wir können die Übung jetzt abschließen.",
    selbstvorstellung: "Danke für Ihre Vorstellung. Das reicht für heute.",
    planung: "Super, wir haben alle wichtigen Punkte besprochen. Vielen Dank!",
  };
  const assistantMessage = closings[category] || closings.selbstvorstellung;

  return {
    assistantMessage,
    coveredPoints: Array.isArray(coveredPoints) ? coveredPoints : [],
    missingPoints: [],
    allRequiredCovered: true,
    conversationComplete: true,
    transcriptEntry: {
      role: "assistant",
      text: assistantMessage,
      conversationComplete: true,
      forcedClose: true,
      at: new Date().toISOString(),
    },
  };
}
