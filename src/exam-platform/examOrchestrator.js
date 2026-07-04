/**
 * Exam Orchestrator — section order, answer capture, per-section evaluation.
 *
 * @module exam-platform/examOrchestrator
 */

import { getProductPolicy } from "./productPolicies.js";
import { evaluateSection } from "./evaluators/skillEvaluatorRegistry.js";
import { proposeSectionAnalysis } from "./services/llmGateway.js";
import { resolveSectionContentForBlueprint } from "./modelCatalogService.js";

export const ORCHESTRATOR_VERSION = "1.0.0";

/**
 * @typedef {Object} OrchestratorDeps
 * @property {import('./contracts.js').ModelCatalogEntry[]} [catalog]
 */

/**
 * @param {import('./contracts.js').ExamSessionState} session
 */
export function getCurrentSection(session) {
  const section = session.blueprint.sections[session.currentSectionIndex];
  if (!section) return null;
  return section;
}

/**
 * @param {import('./contracts.js').ExamSessionState} session
 */
export function isSessionComplete(session) {
  return session.currentSectionIndex >= session.blueprint.sections.length;
}

/**
 * @param {import('./contracts.js').ExamSessionState} session
 * @param {import('./contracts.js').ProductType} productType
 * @param {number} [nowMs]
 */
export function isSessionTimedOut(session, productType, nowMs = Date.now()) {
  const policy = getProductPolicy(productType);
  if (policy.timingPolicy !== "hard" || !session.deadlineAt) return false;
  return nowMs > session.deadlineAt;
}

/**
 * @param {import('./contracts.js').ExamSessionState} session
 * @param {OrchestratorDeps} [deps]
 */
export function resolveCurrentSectionContent(session, deps = {}) {
  const section = getCurrentSection(session);
  if (!section) return {};
  return resolveSectionContentForBlueprint(deps.catalog || [], section);
}

/**
 * @param {Object} params
 * @param {import('./contracts.js').ExamSessionState} params.session
 * @param {import('./contracts.js').SectionAnswer} params.answer
 * @param {Record<string, unknown>} [params.sectionContent]
 * @param {OrchestratorDeps} [params.deps]
 * @returns {Promise<{ session: import('./contracts.js').ExamSessionState, evaluation: import('./contracts.js').SectionEvaluation, llmProposals: import('./contracts.js').LLMProposal[] }>}
 */
export async function submitSectionAnswer({
  session,
  answer,
  sectionContent,
  deps = {},
}) {
  if (session.status !== "active") {
    throw new Error(`Session ist nicht aktiv (Status: ${session.status}).`);
  }

  const expected = getCurrentSection(session);
  if (!expected) {
    throw new Error("Keine weitere Sektion in dieser Prüfung.");
  }

  if (answer.sectionIndex !== expected.sectionIndex) {
    throw new Error(
      `Falsche Sektion: erwartet ${expected.sectionIndex}, erhalten ${answer.sectionIndex}.`
    );
  }

  if (answer.skill !== expected.skill || answer.modelId !== expected.modelId) {
    throw new Error("Antwort passt nicht zur aktuellen Sektion.");
  }

  const policy = getProductPolicy(session.productType);
  const content =
    sectionContent ||
    resolveSectionContentForBlueprint(deps.catalog || [], expected);

  const evaluation = evaluateSection({
    answer,
    sectionContent: content,
    targetLevel: session.blueprint.targetLevel,
    rulesVersion: session.blueprint.rulesVersion,
  });

  /** @type {import('./contracts.js').LLMProposal[]} */
  let llmProposals = [];
  if (policy.llmProposalsAllowed) {
    llmProposals = await proposeSectionAnalysis({
      answer,
      evaluation,
      skill: answer.skill,
      productType: session.productType,
      sectionContent: content,
    });
  }

  const answers = [...session.answers.filter((a) => a.sectionIndex !== answer.sectionIndex), answer];
  const evaluations = [
    ...session.evaluations.filter((e) => e.sectionIndex !== evaluation.sectionIndex),
    { ...evaluation, answerSnapshot: answer },
  ];

  const nextIndex = session.currentSectionIndex + 1;
  const nextSession = {
    ...session,
    answers,
    evaluations,
    currentSectionIndex: nextIndex,
    status: nextIndex >= session.blueprint.sections.length ? "awaiting_review" : "active",
  };

  return { session: nextSession, evaluation, llmProposals };
}

/**
 * @param {import('./contracts.js').ExamSessionState} session
 * @param {import('./contracts.js').ProductType} productType
 */
export function applySessionTiming(session, productType) {
  const policy = getProductPolicy(productType);
  if (policy.timingPolicy !== "hard" || !policy.defaultDurationMinutes) {
    return session;
  }
  const deadlineAt =
    (session.startedAt || Date.now()) + policy.defaultDurationMinutes * 60 * 1000;
  return { ...session, deadlineAt };
}

export const examOrchestrator = {
  version: ORCHESTRATOR_VERSION,
  getCurrentSection,
  isSessionComplete,
  isSessionTimedOut,
  resolveCurrentSectionContent,
  submitSectionAnswer,
  applySessionTiming,
};
