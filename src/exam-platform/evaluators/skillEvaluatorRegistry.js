/**
 * Skill Evaluator Registry — plug-in point for Exam Engine (Phase C+).
 * @module exam-platform/evaluators/skillEvaluatorRegistry
 */

import { readingEvaluator } from "./readingEvaluator.js";
import { listeningEvaluator } from "./listeningEvaluator.js";
import { createPendingEvaluator } from "./pendingSkillEvaluator.js";
import { SKILL_EVALUATOR_IDS } from "../lifecycle.js";

/** @typedef {import('./readingEvaluator.js').EvaluatorContext} EvaluatorContext */

/** @type {Record<string, { skillId: string, evaluate: Function }>} */
const registry = {
  reading: readingEvaluator,
  listening: listeningEvaluator,
};

SKILL_EVALUATOR_IDS.forEach((skillId) => {
  if (!registry[skillId]) {
    registry[skillId] = createPendingEvaluator(skillId);
  }
});

export const IMPLEMENTED_EVALUATOR_SKILLS = Object.freeze(["reading", "listening"]);

/**
 * @param {import('../contracts.js').SkillId} skillId
 */
export function hasEvaluator(skillId) {
  return Boolean(registry[skillId]);
}

/**
 * @param {import('../contracts.js').SkillId} skillId
 */
export function hasAutomatedEvaluator(skillId) {
  return IMPLEMENTED_EVALUATOR_SKILLS.includes(skillId);
}

/**
 * @param {EvaluatorContext} context
 * @returns {import('../contracts.js').SectionEvaluation}
 */
export function evaluateSection(context) {
  const skillId = context?.answer?.skill;
  const evaluator = registry[skillId];

  if (!evaluator) {
    throw new Error(
      `Kein Skill Evaluator für „${skillId}". Registrieren Sie einen Evaluator.`
    );
  }

  return evaluator.evaluate(context);
}

/**
 * @param {import('../contracts.js').SkillId} skillId
 * @param {{ skillId: string, evaluate: Function }} evaluator
 */
export function registerEvaluator(skillId, evaluator) {
  registry[skillId] = evaluator;
}

export const skillEvaluatorRegistry = {
  hasEvaluator,
  hasAutomatedEvaluator,
  evaluateSection,
  registerEvaluator,
  IMPLEMENTED_EVALUATOR_SKILLS,
};
