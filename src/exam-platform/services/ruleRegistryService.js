/**
 * Rule Registry Service — single source of truth loader (Phase E).
 * Seeds from Examiner Mind knowledge; merges promoted rules from storage.
 *
 * @module exam-platform/services/ruleRegistryService
 */

import { ExaminerKnowledge } from "../../ai/examinerMind/knowledge/examinerKnowledge.js";
import {
  EMPTY_RULE_REGISTRY,
  RULE_REGISTRY_STORAGE_KEY,
} from "../ruleRegistrySchema.js";

export const RULE_REGISTRY_SERVICE_VERSION = "1.0.0";

/** @typedef {import('../ruleRegistrySchema.js').RuleRegistry} RuleRegistry */
/** @typedef {import('../contracts.js').SkillId} SkillId */
/** @typedef {import('../contracts.js').CEFRLabel} CEFRLabel */

/** @type {RuleRegistry|null} */
let cachedRegistry = null;

/**
 * @param {Storage|null|undefined} [storage]
 * @returns {RuleRegistry}
 */
export function loadRuleRegistry(storage) {
  if (cachedRegistry) return cachedRegistry;

  if (storage) {
    try {
      const raw = storage.getItem(RULE_REGISTRY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.meta?.registryVersion) {
          cachedRegistry = parsed;
          return cachedRegistry;
        }
      }
    } catch {
      /* fall through to seed */
    }
  }

  cachedRegistry = seedRuleRegistryFromKnowledge();
  return cachedRegistry;
}

/**
 * @returns {RuleRegistry}
 */
export function seedRuleRegistryFromKnowledge() {
  /** @type {Record<string, Record<string, import('../ruleRegistrySchema.js').SkillRubric>>} */
  const levels = {};

  Object.entries(ExaminerKnowledge.levels || {}).forEach(([level, skills]) => {
    levels[level] = {};
    Object.entries(skills || {}).forEach(([skillKey, knowledge]) => {
      if (!knowledge) return;
      levels[level][skillKey] = {
        skill: mapKnowledgeSkillToSkillId(skillKey),
        level: /** @type {CEFRLabel} */ (level),
        expectedElements: (knowledge.expectedElements || []).map((label, index) => ({
          id: `${skillKey}_${index}`,
          label: String(label),
          weight: 1,
        })),
        examinerChecks: knowledge.examinerChecks || [],
        scoringRules: knowledge.scoringRules || [],
        commonMistakes: knowledge.commonMistakes || [],
        examinerFeedback: knowledge.examinerFeedback || [],
        followUpRules: knowledge.followUpRules || [],
      };
    });
  });

  return {
    meta: {
      registryVersion: "1.0.0-seed",
      updatedAt: new Date().toISOString(),
      schemaVersion: "1.0.0",
    },
    globalPrinciples: (ExaminerKnowledge.principles || []).map((text, index) => ({
      id: `principle_${index}`,
      text: String(text),
      priority: index + 1,
    })),
    criticalRules: [],
    levels,
    promotedRules: [],
  };
}

/**
 * @param {string} knowledgeSkill
 * @returns {SkillId}
 */
function mapKnowledgeSkillToSkillId(knowledgeSkill) {
  if (knowledgeSkill === "speaking") return "picture_description";
  return /** @type {SkillId} */ (knowledgeSkill);
}

/**
 * @param {CEFRLabel|string} level
 * @param {SkillId|string} skill
 * @param {Storage|null|undefined} [storage]
 */
export function getSkillKnowledge(level = "B1", skill = "writing", storage) {
  loadRuleRegistry(storage);
  const levelKey = String(level).replace("+", "").trim().toUpperCase() || "B1";
  const knowledgeKey = skillToKnowledgeKey(skill);
  const rubric = cachedRegistry?.levels?.[levelKey]?.[knowledgeKey];
  if (rubric) return rubric;

  return ExaminerKnowledge.levels?.[levelKey]?.[knowledgeKey] || null;
}

/**
 * @param {SkillId|string} skill
 */
export function skillToKnowledgeKey(skill) {
  const map = {
    writing: "writing",
    reading: "reading",
    listening: "listening",
    picture_description: "speaking",
    planning: "speaking",
    discussion: "speaking",
    self_introduction: "speaking",
  };
  return map[skill] || String(skill);
}

/**
 * @param {RuleRegistry} registry
 * @param {Storage|null|undefined} [storage]
 */
export function saveRuleRegistry(registry, storage) {
  cachedRegistry = registry;
  if (storage) {
    storage.setItem(RULE_REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  }
  return registry;
}

export function clearRuleRegistryCache() {
  cachedRegistry = null;
}

export const ruleRegistryService = {
  version: RULE_REGISTRY_SERVICE_VERSION,
  loadRuleRegistry,
  seedRuleRegistryFromKnowledge,
  getSkillKnowledge,
  saveRuleRegistry,
  clearRuleRegistryCache,
};
