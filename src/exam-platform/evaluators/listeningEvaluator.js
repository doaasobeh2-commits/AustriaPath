/**
 * Hören (Listening) Skill Evaluator — deterministic answer-key scoring.
 * @module exam-platform/evaluators/listeningEvaluator
 */

import {
  scoreQuestionSet,
  mapScoreToSkillLevel,
  buildSkillFeedback,
  MCQ_CORE_VERSION,
} from "./mcqCore.js";
import { extractListeningQuestions } from "./questionExtractors.js";

export const LISTENING_EVALUATOR_ID = "listening";
export const LISTENING_EVALUATOR_VERSION = "1.0.0";

/**
 * @typedef {import('./readingEvaluator.js').EvaluatorContext} EvaluatorContext
 */

/**
 * @param {EvaluatorContext} context
 * @returns {import('../contracts.js').SectionEvaluation}
 */
export function evaluateListening(context) {
  const { answer, sectionContent = {}, targetLevel = "B1", rulesVersion = "0.0.0" } =
    context;

  const questions = extractListeningQuestions(sectionContent);
  const studentAnswers = answer.mcqAnswers || {};

  if (!questions.length) {
    return {
      sectionIndex: answer.sectionIndex,
      skill: "listening",
      modelId: answer.modelId,
      rawScore: 0,
      maxScore: 1,
      normalizedScore: 0,
      skillLevel: mapScoreToSkillLevel(0, targetLevel),
      strengths: [],
      weaknesses: ["Keine bewertbaren Hörfragen im Modell gefunden."],
      evidence: [
        {
          code: "NO_QUESTIONS",
          label: "Hören",
          passed: false,
          detail: "Section content enthält keine Antwortschlüssel.",
        },
      ],
      lowConfidence: true,
      evaluatorId: LISTENING_EVALUATOR_ID,
      evaluatorVersion: LISTENING_EVALUATOR_VERSION,
      rulesVersion,
    };
  }

  const scored = scoreQuestionSet(questions, studentAnswers);
  const feedback = buildSkillFeedback(
    scored.normalizedScore,
    scored.answeredCount,
    scored.totalCount
  );

  const unansweredRatio =
    scored.totalCount > 0
      ? (scored.totalCount - scored.answeredCount) / scored.totalCount
      : 1;

  return {
    sectionIndex: answer.sectionIndex,
    skill: "listening",
    modelId: answer.modelId,
    rawScore: scored.rawScore,
    maxScore: scored.maxScore,
    normalizedScore: scored.normalizedScore,
    skillLevel: mapScoreToSkillLevel(scored.normalizedScore, targetLevel),
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    evidence: scored.evidence,
    lowConfidence: unansweredRatio > 0.5,
    evaluatorId: LISTENING_EVALUATOR_ID,
    evaluatorVersion: `${LISTENING_EVALUATOR_VERSION}+mcq${MCQ_CORE_VERSION}`,
    rulesVersion,
  };
}

export const listeningEvaluator = {
  skillId: LISTENING_EVALUATOR_ID,
  evaluate: evaluateListening,
};
