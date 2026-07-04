/**
 * Examiner Mind Adapter — bridges SectionEvaluation[] to legacy Examiner Council.
 *
 * @module exam-platform/services/examinerMindAdapter
 */

import { ExaminerCouncil } from "../../ai/examinerMind/core/examinerCouncil.js";
import { DecisionEngine } from "../../ai/examinerMind/core/decisionEngine.js";
import { ExaminerKnowledge } from "../../ai/examinerMind/knowledge/examinerKnowledge.js";
import { getSkillKnowledge, skillToKnowledgeKey } from "./ruleRegistryService.js";
import { getEffectiveKnowledgeForJudge } from "./registryKnowledgeMerge.js";
import { hasAutomatedEvaluator } from "../evaluators/skillEvaluatorRegistry.js";
import { mapScoreToSkillLevel } from "../evaluators/mcqCore.js";

export const ADAPTER_VERSION = "1.0.0";

/** @type {ExaminerCouncil|null} */
let legacyCouncil = null;
/** @type {DecisionEngine|null} */
let decisionEngine = null;

function getLegacyCouncil() {
  if (!legacyCouncil) legacyCouncil = new ExaminerCouncil();
  return legacyCouncil;
}

function getDecisionEngine() {
  if (!decisionEngine) decisionEngine = new DecisionEngine();
  return decisionEngine;
}

function isPendingEvaluation(evaluation) {
  return String(evaluation?.evaluatorId || "").startsWith("pending_");
}

/**
 * @param {import('../contracts.js').SectionEvaluation} evaluation
 * @returns {Object}
 */
export function sectionEvaluationToJudgeReport(evaluation) {
  return {
    examiner: evaluation.skill,
    skill: evaluation.skill,
    score: evaluation.normalizedScore ?? 0,
    strengths: evaluation.strengths || [],
    weaknesses: evaluation.weaknesses || [],
    focusAreas: evaluation.weaknesses?.length ? [evaluation.skill] : [],
    evidence: (evaluation.evidence || [])
      .map((e) => e.detail || e.label)
      .filter(Boolean)
      .join("; "),
    reasoning: [
      `Evaluator: ${evaluation.evaluatorId}@${evaluation.evaluatorVersion}`,
      `Raw: ${evaluation.rawScore}/${evaluation.maxScore}`,
    ],
    source: "skill_evaluator",
  };
}

/**
 * @param {import('../contracts.js').SectionEvaluation} evaluation
 * @param {import('../contracts.js').CEFRLabel} targetLevel
 * @param {Storage|null|undefined} [storage]
 * @returns {Object[]}
 */
export function buildJudgeReportsForSection(evaluation, targetLevel, storage) {
  if (hasAutomatedEvaluator(evaluation.skill) && !isPendingEvaluation(evaluation)) {
    return [sectionEvaluationToJudgeReport(evaluation)];
  }

  const answer = evaluation.answerSnapshot;
  const answerText = String(answer?.freeText || "").trim();
  const level = String(targetLevel).replace("+", "").trim().toUpperCase() || "B1";
  const knowledge =
    getEffectiveKnowledgeForJudge(level, evaluation.skill) ||
    ExaminerKnowledge.levels?.[level]?.[skillToKnowledgeKey(evaluation.skill)] ||
    getSkillKnowledge(level, evaluation.skill);

  if (!answerText) {
    return [
      {
        examiner: "taskCompletion",
        skill: evaluation.skill,
        score: 0,
        strengths: [],
        weaknesses: ["Keine Antwort gegeben"],
        focusAreas: [evaluation.skill],
        evidence: "No answer text provided.",
        source: "examiner_mind",
      },
    ];
  }

  const examContext = {
    answerText,
    taskAnswered: Boolean(answerText),
    level,
    examType: "OEIF",
    sectionIndex: evaluation.sectionIndex,
    currentSection: {
      skill: evaluation.skill,
      knowledgeKey: skillToKnowledgeKey(evaluation.skill),
    },
    currentKnowledge: knowledge,
    skillEvaluation: evaluation,
  };

  const judgeReports = getLegacyCouncil().collect(examContext);
  return judgeReports.map((report) => ({
    ...report,
    skill: evaluation.skill,
    source: "examiner_mind",
  }));
}

/**
 * @param {import('../contracts.js').SectionEvaluation[]} sectionEvaluations
 * @param {import('../contracts.js').CEFRLabel} targetLevel
 * @param {Storage|null|undefined} [storage]
 */
export function collectFusionReports(sectionEvaluations, targetLevel, storage) {
  return sectionEvaluations.flatMap((evaluation) =>
    buildJudgeReportsForSection(evaluation, targetLevel, storage)
  );
}

/**
 * @param {Object[]} fusionReports
 * @returns {import('../../ai/examinerMind/core/decisionEngine.js').DecisionEngine extends { decide: infer D } ? ReturnType<D> : never}
 */
export function runDecisionEngine(fusionReports) {
  return getDecisionEngine().decide(fusionReports);
}

/**
 * @param {Object} legacyDecision
 * @param {import('../contracts.js').SectionEvaluation[]} sectionEvaluations
 * @param {import('../contracts.js').CEFRLabel} targetLevel
 */
export function buildSkillResultsFromEvaluations(sectionEvaluations, targetLevel) {
  /** @type {Record<string, { score: number, level: import('../contracts.js').CEFRLabel, evidence: import('../contracts.js').EvaluationEvidence[] }>} */
  const skillResults = {};

  sectionEvaluations.forEach((ev) => {
    skillResults[ev.skill] = {
      score: ev.normalizedScore ?? 0,
      level: ev.skillLevel || mapScoreToSkillLevel(ev.normalizedScore ?? 0, targetLevel),
      evidence: ev.evidence || [],
    };
  });

  return skillResults;
}

/**
 * @param {Object} legacyDecision
 * @param {import('../contracts.js').SectionEvaluation[]} sectionEvaluations
 */
export function extractSkillStrengthsWeaknesses(sectionEvaluations, legacyDecision) {
  /** @type {import('../contracts.js').SkillId[]} */
  const strengths = [];
  /** @type {import('../contracts.js').SkillId[]} */
  const weaknesses = [];

  sectionEvaluations.forEach((ev) => {
    if (isPendingEvaluation(ev)) {
      weaknesses.push(ev.skill);
      return;
    }
    if ((ev.normalizedScore ?? 0) >= 75) strengths.push(ev.skill);
    if ((ev.normalizedScore ?? 0) < 60) weaknesses.push(ev.skill);
  });

  if (!strengths.length && legacyDecision.score >= 70) {
    sectionEvaluations
      .filter((e) => (e.normalizedScore ?? 0) >= 70)
      .forEach((e) => strengths.push(e.skill));
  }

  return {
    strengths: [...new Set(strengths)],
    weaknesses: [...new Set(weaknesses)],
  };
}

/**
 * @param {Object[]} legacyConflicts
 */
export function mapLegacyConflicts(legacyConflicts = []) {
  return legacyConflicts.map((conflict) => ({
    type: conflict.type || "judge_disagreement",
    description: conflict.message || conflict.description || "Judge disagreement.",
    involvedJudges: conflict.involvedJudges || [],
  }));
}

/**
 * @param {Object[]} fusionReports
 * @returns {import('../contracts.js').JudgeReport[]}
 */
export function mapFusionReports(fusionReports = []) {
  return fusionReports.map((report) => ({
    judgeId: report.examiner || report.skill || "unknown",
    score: report.score ?? 0,
    strengths: report.strengths || [],
    weaknesses: report.weaknesses || [],
    reasoning: report.reasoning || (report.evidence ? [String(report.evidence)] : []),
  }));
}

export const examinerMindAdapter = {
  version: ADAPTER_VERSION,
  collectFusionReports,
  runDecisionEngine,
  buildSkillResultsFromEvaluations,
  extractSkillStrengthsWeaknesses,
  mapLegacyConflicts,
  mapFusionReports,
  sectionEvaluationToJudgeReport,
};
