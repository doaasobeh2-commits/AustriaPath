/**
 * Lesen (Reading) Skill Evaluator — deterministic MCQ / cloze scoring.
 * @module exam-platform/evaluators/readingEvaluator
 */

import {
  scoreQuestionSet,
  mapScoreToSkillLevel,
  buildSkillFeedback,
  MCQ_CORE_VERSION,
} from "./mcqCore.js";
import { extractReadingQuestions } from "./questionExtractors.js";

export const READING_EVALUATOR_ID = "reading";
export const READING_EVALUATOR_VERSION = "1.0.0";

/**
 * @typedef {Object} EvaluatorContext
 * @property {import('../contracts.js').SectionAnswer} answer
 * @property {Record<string, unknown>} sectionContent
 * @property {import('../contracts.js').CEFRLabel} [targetLevel]
 * @property {string} [rulesVersion]
 */

/**
 * @param {EvaluatorContext} context
 * @returns {import('../contracts.js').SectionEvaluation}
 */
export function evaluateReading(context) {
  const { answer, sectionContent = {}, targetLevel = "B1", rulesVersion = "0.0.0" } =
    context;

  const questions = extractReadingQuestions(sectionContent);
  const studentAnswers = answer.mcqAnswers || {};

  if (!questions.length) {
    return {
      sectionIndex: answer.sectionIndex,
      skill: "reading",
      modelId: answer.modelId,
      rawScore: 0,
      maxScore: 1,
      normalizedScore: 0,
      skillLevel: mapScoreToSkillLevel(0, targetLevel),
      strengths: [],
      weaknesses: ["Keine bewertbaren Lesefragen im Modell gefunden."],
      evidence: [
        {
          code: "NO_QUESTIONS",
          label: "Lesen",
          passed: false,
          detail: "Section content enthält keine Antwortschlüssel.",
        },
      ],
      lowConfidence: true,
      evaluatorId: READING_EVALUATOR_ID,
      evaluatorVersion: READING_EVALUATOR_VERSION,
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
    skill: "reading",
    modelId: answer.modelId,
    rawScore: scored.rawScore,
    maxScore: scored.maxScore,
    normalizedScore: scored.normalizedScore,
    skillLevel: mapScoreToSkillLevel(scored.normalizedScore, targetLevel),
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    evidence: scored.evidence,
    lowConfidence: unansweredRatio > 0.5 || scored.totalCount === 0,
    evaluatorId: READING_EVALUATOR_ID,
    evaluatorVersion: `${READING_EVALUATOR_VERSION}+mcq${MCQ_CORE_VERSION}`,
    rulesVersion,
  };
}

export const readingEvaluator = {
  skillId: READING_EVALUATOR_ID,
  evaluate: evaluateReading,
};
