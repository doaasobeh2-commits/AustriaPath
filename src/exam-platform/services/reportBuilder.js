/**
 * Report Builder — constructs FinalReport from CouncilDecision (Phase E).
 *
 * @module exam-platform/services/reportBuilder
 */

import { REPORT_DISCLAIMER } from "../contracts.js";
import { getProductPolicy } from "../productPolicies.js";

export const REPORT_BUILDER_VERSION = "2.0.0-phase-e";

function uid(prefix = "rep") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {import('../contracts.js').CouncilDecision & { humanReadableStrengths?: string[], humanReadableWeaknesses?: string[], narrativeNotes?: string[] }} decision
 * @param {import('../contracts.js').ProductType} productType
 */
function buildStrengthsList(decision, productType) {
  const human = decision.humanReadableStrengths || [];
  if (human.length) return human.slice(0, 6);
  return (decision.strengths || []).map((skill) => `Stärke: ${skill}`);
}

/**
 * @param {import('../contracts.js').CouncilDecision & { humanReadableWeaknesses?: string[] }} decision
 */
function buildWeaknessesList(decision) {
  const human = decision.humanReadableWeaknesses || [];
  if (human.length) return human.slice(0, 6);
  return (decision.weaknesses || []).map((skill) => `Schwäche: ${skill}`);
}

/**
 * @param {import('../contracts.js').CouncilDecision} decision
 * @param {import('../contracts.js').ProductType} productType
 */
function buildRecommendations(decision, productType) {
  const recs = [];
  const weaknesses = buildWeaknessesList(decision);

  weaknesses.forEach((item) => {
    recs.push(`Gezielt üben: ${item}`);
  });

  if (productType === "weekly_plan") {
    recs.push("Nächste Woche: Schwächen aus diesem Übungslauf wiederholen.");
  } else if (productType === "placement_test") {
    recs.push("Empfohlenes Startniveau für Premium-Prüfungen beachten.");
  } else {
    recs.push("Akademie-Themen zu den Schwächen durcharbeiten.");
  }

  (decision.narrativeNotes || []).slice(0, 2).forEach((note) => {
    recs.push(note);
  });

  return recs.slice(0, 8);
}

/**
 * @param {import('../contracts.js').CouncilDecision & { narrativeNotes?: string[] }} decision
 */
function buildSummary(decision) {
  const parts = [decision.reflectionSummary].filter(Boolean);
  if (decision.narrativeNotes?.length) {
    parts.push(decision.narrativeNotes.slice(0, 2).join(" "));
  }
  return parts.join(" ");
}

/**
 * @param {Object} params
 * @param {import('../contracts.js').CouncilDecision} params.decision
 * @param {import('../contracts.js').ProductType} params.productType
 * @param {string} params.blueprintId
 * @param {import('../contracts.js').SkillId[]} [params.weeklyFocusSkills]
 * @returns {import('../contracts.js').FinalReport}
 */
export function buildFinalReport({
  decision,
  productType,
  blueprintId,
  weeklyFocusSkills,
}) {
  const policy = getProductPolicy(productType);
  const skillResults = Object.fromEntries(
    Object.entries(decision.skillResults || {}).map(([skill, data]) => [
      skill,
      { score: data.score, level: data.level },
    ])
  );

  const strengths = buildStrengthsList(decision, productType);
  const weaknesses = buildWeaknessesList(decision);
  const focusAreas = decision.focusAreas?.length
    ? decision.focusAreas.map(String)
    : weaknesses;
  const recommendations = buildRecommendations(decision, productType);
  const evaluationMethod =
    /** @type {import('../contracts.js').EvaluationMethod} */ (
      decision.evaluationMethod || policy.evaluationMethodDefault
    );

  return {
    reportId: uid(),
    productType,
    mode: policy.mode,
    evaluationMethod,
    cefrLevel: decision.cefrLevel,
    overallScore: decision.overallScore,
    confidence: decision.confidence,
    readinessBand: decision.readinessBand,
    skillResults,
    strengths,
    weaknesses,
    recurringMistakes: decision.recurringMistakes || [],
    focusAreas,
    summary: buildSummary(decision),
    recommendations,
    studyAdvice: recommendations.slice(0, 4),
    improvementPriorities: focusAreas.slice(0, 3),
    cefrReadiness: decision.readinessBand,
    weeklyFocusSkills: weeklyFocusSkills || decision.weaknesses?.slice(0, 3),
    weeklyPlanMapping: productType === "weekly_plan" ? focusAreas : undefined,
    councilDecision: decision,
    disclaimer: REPORT_DISCLAIMER,
    rulesVersion: decision.rulesVersion,
    blueprintId,
    createdAt: new Date().toISOString(),
  };
}

export const reportBuilder = {
  version: REPORT_BUILDER_VERSION,
  build: buildFinalReport,
};
