/**
 * AustriaPath Examiner Council — Phase E.
 * Fuses Skill Evaluator output with Examiner Mind judges + Decision Engine.
 * Engine calls `decideCouncil()` — interface unchanged since Phase D.
 *
 * @module exam-platform/services/examinerCouncil
 */

import { EXAMINER_MIND_VERSION } from "../contracts.js";
import { getProductPolicy } from "../productPolicies.js";
import { mapScoreToSkillLevel } from "../evaluators/mcqCore.js";
import { loadRuleRegistry } from "./ruleRegistryService.js";
import {
  collectFusionReports,
  runDecisionEngine,
  buildSkillResultsFromEvaluations,
  extractSkillStrengthsWeaknesses,
  mapLegacyConflicts,
  mapFusionReports,
} from "./examinerMindAdapter.js";

export const COUNCIL_VERSION = "2.0.0-phase-e";

function uid(prefix = "dec") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapReadinessBand(score) {
  if (score >= 85) return "strong";
  if (score >= 70) return "approaching";
  if (score >= 55) return "developing";
  return "building";
}

/**
 * @param {import('../contracts.js').ProductType} productType
 */
function resolveEvaluationMethod(productType) {
  return getProductPolicy(productType).evaluationMethodDefault;
}

/**
 * Practice-mode council — lighter fusion, no Examiner Lab escalation by default.
 *
 * @param {Object} params
 */
function decidePracticeCouncil(params) {
  const {
    sectionEvaluations = [],
    productType,
    targetLevel = "B1",
    rulesVersion = "0.0.0",
  } = params;

  const policy = getProductPolicy(productType);
  const scorable = sectionEvaluations.filter(
    (e) => !String(e.evaluatorId || "").startsWith("pending_")
  );
  const pool = scorable.length ? scorable : sectionEvaluations;
  const overallScore = pool.length
    ? Math.round(pool.reduce((s, e) => s + (e.normalizedScore ?? 0), 0) / pool.length)
    : 0;

  const { strengths, weaknesses } = extractSkillStrengthsWeaknesses(sectionEvaluations, {
    score: overallScore,
  });

  return {
    decisionId: uid(),
    overallScore,
    cefrLevel: mapScoreToSkillLevel(overallScore, targetLevel),
    confidence: Math.min(85, overallScore > 0 ? 75 : 40),
    strengths,
    weaknesses,
    focusAreas: weaknesses,
    recurringMistakes: weaknesses.slice(0, 3),
    readinessBand: undefined,
    skillResults: buildSkillResultsFromEvaluations(sectionEvaluations, targetLevel),
    fusionReports: mapFusionReports(
      pool.map((ev) => ({
        examiner: ev.skill,
        score: ev.normalizedScore,
        strengths: ev.strengths,
        weaknesses: ev.weaknesses,
      }))
    ),
    conflicts: [],
    warnings: [],
    criticalRulesApplied: [],
    needsHumanReview: false,
    reflectionSummary: `Übungsfeedback (${sectionEvaluations.length} Abschnitte).`,
    examinerMindVersion: EXAMINER_MIND_VERSION,
    rulesVersion,
    decidedAt: new Date().toISOString(),
    evaluationMethod: resolveEvaluationMethod(productType),
  };
}

/**
 * @param {Object} params
 * @param {import('../contracts.js').SectionEvaluation[]} params.sectionEvaluations
 * @param {import('../contracts.js').ProductType} params.productType
 * @param {import('../contracts.js').CEFRLabel} [params.targetLevel]
 * @param {string} [params.rulesVersion]
 * @param {import('../contracts.js').LLMProposal[]} [params.llmProposals]
 * @param {Storage|null|undefined} [params.storage]
 * @returns {import('../contracts.js').CouncilDecision}
 */
export function decideCouncil({
  sectionEvaluations = [],
  productType,
  targetLevel = "B1",
  rulesVersion = "0.0.0",
  llmProposals = [],
  storage,
}) {
  const policy = getProductPolicy(productType);
  const registry = loadRuleRegistry(storage);
  const effectiveRulesVersion = rulesVersion || registry.meta.registryVersion;

  if (productType === "weekly_plan") {
    return decidePracticeCouncil({
      sectionEvaluations,
      productType,
      targetLevel,
      rulesVersion: effectiveRulesVersion,
    });
  }

  const fusionReports = collectFusionReports(
    sectionEvaluations,
    targetLevel,
    storage
  );

  const legacyDecision = runDecisionEngine(fusionReports);
  const overallScore = legacyDecision.score ?? 0;
  const cefrLevel = mapScoreToSkillLevel(overallScore, targetLevel);
  const { strengths, weaknesses } = extractSkillStrengthsWeaknesses(
    sectionEvaluations,
    legacyDecision
  );

  const skillResults = buildSkillResultsFromEvaluations(
    sectionEvaluations,
    targetLevel
  );

  Object.entries(skillResults).forEach(([skill, data]) => {
    const mindReports = fusionReports.filter((r) => r.skill === skill && r.source === "examiner_mind");
    if (mindReports.length && isPendingSkill(sectionEvaluations, skill)) {
      const avg = Math.round(
        mindReports.reduce((s, r) => s + (r.score ?? 0), 0) / mindReports.length
      );
      skillResults[skill] = {
        ...data,
        score: avg,
        level: mapScoreToSkillLevel(avg, targetLevel),
      };
    }
  });

  const conflicts = mapLegacyConflicts(legacyDecision.conflicts);
  const warnings = [...(legacyDecision.warnings || [])];

  if (llmProposals.length) {
    warnings.push(`${llmProposals.length} LLM-Vorschlag/Vorschläge zur Prüfung.`);
  }

  sectionEvaluations
    .filter((e) => String(e.evaluatorId || "").startsWith("pending_"))
    .forEach((e) => {
      warnings.push(`Skill „${e.skill}" — Evaluator noch nicht vollständig automatisiert.`);
    });

  const needsHumanReview =
    policy.labEligible &&
    (legacyDecision.needsDeepReview === true ||
      (legacyDecision.confidence ?? 0) < policy.confidenceReviewThreshold ||
      conflicts.length > 0);

  let humanReviewReason;
  if (needsHumanReview) {
    if (conflicts.length) humanReviewReason = "conflicting_evaluations";
    else if ((legacyDecision.confidence ?? 0) < policy.confidenceReviewThreshold) {
      humanReviewReason = "low_confidence";
    } else if (legacyDecision.criticalRulesApplied?.length) {
      humanReviewReason = "critical_rule_applied";
    } else humanReviewReason = "quality_review";
  }

  const reflectionSummary = legacyDecision.reflection?.summary
    ? `Examiner Mind: ${legacyDecision.reflection.summary}`
    : `Examiner Mind Council: ${sectionEvaluations.length} Abschnitte fusioniert.`;

  return {
    decisionId: uid(),
    overallScore,
    cefrLevel,
    confidence: legacyDecision.confidence ?? 0,
    strengths,
    weaknesses,
    focusAreas: legacyDecision.focusAreas?.length
      ? legacyDecision.focusAreas
      : weaknesses,
    recurringMistakes: (legacyDecision.weaknesses || []).slice(0, 5),
    readinessBand: policy.showReadinessBand
      ? mapReadinessBand(overallScore)
      : undefined,
    skillResults,
    fusionReports: mapFusionReports(fusionReports),
    conflicts,
    warnings,
    criticalRulesApplied: legacyDecision.criticalRulesApplied || [],
    needsHumanReview,
    humanReviewReason,
    reflectionSummary,
    examinerMindVersion: EXAMINER_MIND_VERSION,
    rulesVersion: effectiveRulesVersion,
    decidedAt: legacyDecision.timestamp || new Date().toISOString(),
    evaluationMethod: resolveEvaluationMethod(productType),
    narrativeNotes: legacyDecision.reflection?.notes || [],
    humanReadableStrengths: legacyDecision.strengths || [],
    humanReadableWeaknesses: legacyDecision.weaknesses || [],
  };
}

/**
 * @param {import('../contracts.js').SectionEvaluation[]} evaluations
 * @param {string} skill
 */
function isPendingSkill(evaluations, skill) {
  const ev = evaluations.find((e) => e.skill === skill);
  return ev && String(ev.evaluatorId || "").startsWith("pending_");
}

export const examinerCouncil = {
  version: COUNCIL_VERSION,
  decide: decideCouncil,
};
