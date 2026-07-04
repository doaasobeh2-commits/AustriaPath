/**
 * Applies promoted Lab rules into effective Examiner Mind knowledge.
 *
 * @module exam-platform/services/registryKnowledgeMerge
 */

import {
  loadRuleRegistry,
  skillToKnowledgeKey,
} from "./ruleRegistryService.js";
import { ExaminerKnowledge } from "../../ai/examinerMind/knowledge/examinerKnowledge.js";

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [String(value)];
}

/**
 * @param {import('../ruleRegistrySchema.js').PromotedRule} rule
 * @param {import('../ruleRegistrySchema.js').RuleRegistry} registry
 */
function applyStructuredPatch(registry, rule) {
  const patch = rule.structuredPatch;
  if (!patch || !patch.type) return registry;

  const next = {
    ...registry,
    levels: { ...registry.levels },
    criticalRules: [...(registry.criticalRules || [])],
  };

  if (patch.type === "append_scoring_rule" && rule.level && rule.skill) {
    const levelKey = String(rule.level).replace("+", "").trim().toUpperCase();
    const skillKey = skillToKnowledgeKey(rule.skill);
    const rubric = next.levels[levelKey]?.[skillKey];
    if (rubric) {
      next.levels[levelKey] = { ...next.levels[levelKey] };
      next.levels[levelKey][skillKey] = {
        ...rubric,
        scoringRules: [...asArray(rubric.scoringRules), patch.value || rule.ruleText],
      };
    }
  }

  if (patch.type === "append_examiner_check" && rule.level && rule.skill) {
    const levelKey = String(rule.level).replace("+", "").trim().toUpperCase();
    const skillKey = skillToKnowledgeKey(rule.skill);
    const rubric = next.levels[levelKey]?.[skillKey];
    if (rubric) {
      next.levels[levelKey] = { ...next.levels[levelKey] };
      next.levels[levelKey][skillKey] = {
        ...rubric,
        examinerChecks: [...asArray(rubric.examinerChecks), patch.value || rule.ruleText],
      };
    }
  }

  if (patch.type === "append_common_mistake" && rule.level && rule.skill) {
    const levelKey = String(rule.level).replace("+", "").trim().toUpperCase();
    const skillKey = skillToKnowledgeKey(rule.skill);
    const rubric = next.levels[levelKey]?.[skillKey];
    if (rubric) {
      next.levels[levelKey] = { ...next.levels[levelKey] };
      next.levels[levelKey][skillKey] = {
        ...rubric,
        commonMistakes: [...asArray(rubric.commonMistakes), patch.value || rule.ruleText],
      };
    }
  }

  if (patch.type === "add_critical_rule") {
    next.criticalRules.push({
      id: patch.id || `critical_${rule.id}`,
      description: patch.value || rule.ruleText,
      condition: patch.condition || "human_approved",
      maxScoreCap: patch.maxScoreCap,
      forceHumanReview: patch.forceHumanReview,
    });
  }

  return next;
}

/**
 * Returns registry with all promoted rules materialized into rubrics.
 *
 * @param {Storage|null|undefined} [storage]
 */
export function getMaterializedRegistry(storage) {
  let registry = loadRuleRegistry(storage);
  (registry.promotedRules || []).forEach((rule) => {
    registry = applyStructuredPatch(registry, rule);
  });
  return registry;
}

/**
 * Legacy-compatible knowledge object for Examiner Mind judges.
 *
 * @param {string} level
 * @param {string} skill
 * @param {Storage|null|undefined} [storage]
 */
export function getEffectiveKnowledgeForJudge(level = "B1", skill = "writing", storage) {
  const levelKey = String(level).replace("+", "").trim().toUpperCase() || "B1";
  const skillKey = skillToKnowledgeKey(skill);
  const registry = getMaterializedRegistry(storage);
  const rubric = registry.levels?.[levelKey]?.[skillKey];
  const base = ExaminerKnowledge.levels?.[levelKey]?.[skillKey];

  if (!rubric && !base) return null;

  const expectedElements = rubric?.expectedElements?.length
    ? rubric.expectedElements.map((el) => el.label || el.id)
    : base?.expectedElements || [];

  return {
    ...(base || {}),
    expectedElements,
    examinerChecks: asArray(rubric?.examinerChecks || base?.examinerChecks),
    scoringRules: asArray(rubric?.scoringRules || base?.scoringRules),
    commonMistakes: asArray(rubric?.commonMistakes || base?.commonMistakes),
    examinerFeedback: asArray(rubric?.examinerFeedback || base?.examinerFeedback),
    followUpRules: rubric?.followUpRules || base?.followUpRules || [],
    metadata: {
      ...(base?.metadata || {}),
      skill: skillKey,
      level: levelKey,
      registryVersion: registry.meta.registryVersion,
      promotedRuleCount: (registry.promotedRules || []).length,
    },
  };
}

export const registryKnowledgeMerge = {
  getMaterializedRegistry,
  getEffectiveKnowledgeForJudge,
};
