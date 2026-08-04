/**
 * Interactive coach turns for Bildbeschreibung, Planung, Selbstvorstellung.
 * Tracks coverage silently — no per-exercise correction shown to learner.
 * @module weekly-training-ai/handlers/b1-interactive-turn
 */

import { createB1WeeklyTrainingJsonCompletion } from "../core/openaiClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  MAX_SPEAKING_FOLLOW_UPS,
  MIN_SPEAKING_FOLLOW_UPS,
  buildForcedClosingTurn,
  buildMandatoryFollowUpTurn,
  countAssistantTurns,
  filterDialogueTranscript,
} from "../core/conversationTranscript.js";
import { buildB1CoachLanguagePolicySection } from "../core/b1CoachLanguagePolicy.js";

/**
 * @param {string} category
 */
export function buildInteractiveSystemPrompt(category) {
  const shared = [
    `You are a B1 German interactive coach for AustriaPath Weekly Training (${category}).`,
    buildB1CoachLanguagePolicySection(),
    "Return ONLY valid JSON. No markdown fences.",
    "Evaluate semantic coverage silently in coveredPoints/missingPoints — never show scores or feedback to the learner.",
    "Grammar mistakes do NOT invalidate semantic coverage.",
    "Never ask again about information the learner already provided in any prior turn.",
    "Never repeat a question about a point already marked covered.",
    "Never ask about picture elements, topics, or planning points listed in alreadyCoveredPointIds.",
    "assistantMessage must be natural spoken German only — no evaluation, no praise lists, no correction.",
    "Do NOT provide correction reports, scores, CEFR, or recommendations in assistantMessage.",
  ];

  if (category === "bildbeschreibung") {
    shared.push(
      "Required picture elements are internal — never list them to the learner.",
      'The learner task is only: "Bitte beschreiben Sie das Bild."',
      `After the first description you MUST ask at least one follow-up question — never end immediately.`,
      "If important picture elements are missing, ask about one missing element.",
      "If all obvious elements are covered, ask a natural communicative question (opinion, personal experience, or evaluation).",
      `Ask at most ${MAX_SPEAKING_FOLLOW_UPS} follow-up questions in the entire exercise.`,
      "Set conversationComplete true only after at least one follow-up has been asked and answered.",
      "If followUpQuestionsAsked is already at the limit, set conversationComplete true with a brief closing."
    );
  }

  if (category === "planung") {
    shared.push(
      "You are the learner's planning partner in a spoken dialogue.",
      "Read the full transcript — remember every detail the learner already mentioned (destination, date, transport, items, etc.).",
      "Never ask again about a discussion point the learner already addressed.",
      "Move to the next incomplete required discussion point naturally.",
      "Ask for clarification only when genuinely needed.",
      "Set conversationComplete true only when ALL required planning points are semantically covered.",
      "Use a friendly partner tone — not an examiner.",
      "If maxConversationTurns is reached, close politely with conversationComplete true."
    );
  }

  if (category === "selbstvorstellung") {
    shared.push(
      "Evaluate semantic topic coverage for self-introduction.",
      `After the first introduction you MUST ask at least one follow-up question — never end immediately.`,
      "Choose the follow-up from missing or interesting topics (work, daily life, German learning, future goals).",
      `Ask at most ${MAX_SPEAKING_FOLLOW_UPS} follow-up questions total.`,
      "Never re-ask about topics already covered.",
      "Set conversationComplete true only after at least one follow-up has been asked and answered.",
      "If followUpQuestionsAsked is already at the limit, set conversationComplete true with a brief closing."
    );
  }

  shared.push(
    JSON.stringify({
      assistantMessage: "string",
      coveredPoints: [{ id: "point-1", text: "string" }],
      missingPoints: [{ id: "point-2", text: "string" }],
      allRequiredCovered: false,
      conversationComplete: false,
    })
  );

  shared.push(
    "Set conversationComplete to true ONLY when the speaking exercise should end — no further questions for the learner."
  );

  return shared.join("\n");
}

/**
 * @param {object} modelSnapshot
 */
function resolveRequiredPoints(modelSnapshot) {
  if (Array.isArray(modelSnapshot?.coveragePoints) && modelSnapshot.coveragePoints.length) {
    return modelSnapshot.coveragePoints;
  }
  if (Array.isArray(modelSnapshot?.requiredPoints) && modelSnapshot.requiredPoints.length) {
    return modelSnapshot.requiredPoints;
  }
  if (Array.isArray(modelSnapshot?.writingTask?.requiredPoints)) {
    return modelSnapshot.writingTask.requiredPoints;
  }
  if (Array.isArray(modelSnapshot?.requiredDiscussionPoints)) {
    return modelSnapshot.requiredDiscussionPoints.map((text, index) => ({
      id: `point-${index + 1}`,
      text: String(text),
    }));
  }
  if (Array.isArray(modelSnapshot?.semanticTopics)) {
    return modelSnapshot.semanticTopics.map((topic) => ({
      id: String(topic.id || topic.label || `topic-${topic.label}`),
      text: String(topic.label || topic.description || topic.id || ""),
    }));
  }
  return [];
}

/**
 * @param {object} params
 */
export async function runB1InteractiveTurn({
  category,
  modelSnapshot,
  session,
  learnerMessage,
  followUpQuestionsAsked = 0,
  maxConversationTurns = null,
}) {
  const dialogueTranscript = filterDialogueTranscript(session.transcript || []);
  const requiredPoints = resolveRequiredPoints(modelSnapshot);
  const alreadyCoveredPointIds = (session.coveredPoints || []).map((point) =>
    String(point.id || point.text || "")
  );

  if (
    (category === "bildbeschreibung" || category === "selbstvorstellung") &&
    followUpQuestionsAsked >= MAX_SPEAKING_FOLLOW_UPS
  ) {
    return buildForcedClosingTurn(category, session.coveredPoints || []);
  }

  if (
    category === "planung" &&
    maxConversationTurns &&
    dialogueTranscript.filter((entry) => entry.role === "learner").length >= maxConversationTurns
  ) {
    return buildForcedClosingTurn(category, session.coveredPoints || []);
  }

  const raw = await createB1WeeklyTrainingJsonCompletion({
    system: buildInteractiveSystemPrompt(category),
    user: JSON.stringify({
      category,
      scenario: modelSnapshot?.scenario || modelSnapshot?.title,
      requiredPoints,
      alreadyCoveredPointIds,
      transcript: dialogueTranscript,
      learnerMessage: String(learnerMessage || ""),
      coveredPoints: session.coveredPoints || [],
      followUpQuestionsAsked,
      minimumFollowUps:
        category === "bildbeschreibung" || category === "selbstvorstellung"
          ? MIN_SPEAKING_FOLLOW_UPS
          : null,
      followUpLimit:
        category === "bildbeschreibung" || category === "selbstvorstellung"
          ? MAX_SPEAKING_FOLLOW_UPS
          : null,
      maxConversationTurns: category === "planung" ? maxConversationTurns : null,
    }),
  });

  const assistantMessage = String(raw?.assistantMessage || "").trim();
  if (!assistantMessage) {
    throw new AppError("AI_INVALID_RESPONSE", "assistantMessage fehlt.", 502);
  }

  const coveredPoints = Array.isArray(raw?.coveredPoints) ? raw.coveredPoints : [];
  const missingPoints = Array.isArray(raw?.missingPoints) ? raw.missingPoints : [];
  let conversationComplete = Boolean(raw?.conversationComplete);

  const requiresMandatoryFollowUp =
    (category === "bildbeschreibung" || category === "selbstvorstellung") &&
    followUpQuestionsAsked < MIN_SPEAKING_FOLLOW_UPS;

  if (requiresMandatoryFollowUp) {
    const looksLikeQuestion = /[?？]\s*$/.test(assistantMessage);
    if (conversationComplete || !looksLikeQuestion) {
      return buildMandatoryFollowUpTurn(
        category,
        modelSnapshot,
        { ...session, coveredPoints: coveredPoints.length ? coveredPoints : session.coveredPoints },
        missingPoints,
        followUpQuestionsAsked
      );
    }
    conversationComplete = false;
  }

  if (
    (category === "bildbeschreibung" || category === "selbstvorstellung") &&
    followUpQuestionsAsked >= MAX_SPEAKING_FOLLOW_UPS - 1 &&
    !conversationComplete
  ) {
    return buildForcedClosingTurn(
      category,
      coveredPoints.length ? coveredPoints : session.coveredPoints || []
    );
  }

  if (
    category === "planung" &&
    maxConversationTurns &&
    dialogueTranscript.filter((entry) => entry.role === "learner").length >= maxConversationTurns - 1 &&
    !conversationComplete
  ) {
    return buildForcedClosingTurn(
      category,
      coveredPoints.length ? coveredPoints : session.coveredPoints || []
    );
  }

  return {
    assistantMessage,
    coveredPoints,
    missingPoints,
    allRequiredCovered: Boolean(raw?.allRequiredCovered),
    conversationComplete,
    transcriptEntry: {
      role: "assistant",
      text: assistantMessage,
      conversationComplete,
      at: new Date().toISOString(),
    },
  };
}
