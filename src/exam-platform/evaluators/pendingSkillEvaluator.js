/**
 * Placeholder evaluator for skills not yet automated (Phase C+).
 * Produces deterministic, low-confidence SectionEvaluation — never invents rubric scores.
 *
 * @module exam-platform/evaluators/pendingSkillEvaluator
 */

import { MCQ_CORE_VERSION } from "./mcqCore.js";

export const PENDING_EVALUATOR_VERSION = "1.0.0";

/**
 * @param {import('../contracts.js').SkillId} skill
 * @param {import('./readingEvaluator.js').EvaluatorContext} context
 * @returns {import('../contracts.js').SectionEvaluation}
 */
export function evaluatePendingSkill(skill, context) {
  const { answer, rulesVersion = "0.0.0" } = context;
  const hasFreeText = Boolean(String(answer?.freeText || "").trim());
  const mcqCount = Object.keys(answer?.mcqAnswers || {}).filter((k) =>
    String(answer.mcqAnswers[k] ?? "").trim()
  ).length;
  const hasAnswer = hasFreeText || mcqCount > 0;

  return {
    sectionIndex: answer.sectionIndex,
    skill,
    modelId: answer.modelId,
    rawScore: 0,
    maxScore: 1,
    normalizedScore: 0,
    skillLevel: undefined,
    strengths: [],
    weaknesses: hasAnswer
      ? [`Automatische Bewertung für „${skill}" noch nicht verfügbar.`]
      : ["Keine Antwort für diese Aufgabe."],
    evidence: [
      {
        code: hasAnswer ? "EVALUATOR_PENDING" : "UNANSWERED",
        label: skill,
        passed: false,
        detail: hasAnswer
          ? "Antwort gespeichert; Bewertung erfolgt durch Examiner Council (Phase E)."
          : "Keine Antwort gegeben.",
      },
    ],
    needsFollowUp:
      skill === "picture_description" ||
      skill === "planning" ||
      skill === "discussion" ||
      skill === "self_introduction",
    lowConfidence: true,
    evaluatorId: `pending_${skill}`,
    evaluatorVersion: `${PENDING_EVALUATOR_VERSION}+mcq${MCQ_CORE_VERSION}`,
    rulesVersion,
  };
}

export function createPendingEvaluator(skill) {
  return {
    skillId: skill,
    evaluate: (context) => evaluatePendingSkill(skill, context),
  };
}
