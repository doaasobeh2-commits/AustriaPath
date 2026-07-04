/**
 * Rule Registry — single source of truth for AustriaPath Examiner Mind.
 * @module exam-platform/ruleRegistrySchema
 */

/** @typedef {import('./contracts.js').SkillId} SkillId */
/** @typedef {import('./contracts.js').CEFRLabel} CEFRLabel */

/**
 * @typedef {Object} RuleRegistryMeta
 * @property {string} registryVersion
 * @property {string} updatedAt
 * @property {string} [approvedBy]
 * @property {string} schemaVersion
 */

/**
 * @typedef {Object} RubricElement
 * @property {string} id
 * @property {string} label
 * @property {number} weight
 * @property {string[]} [keywords]
 * @property {string} [description]
 */

/**
 * @typedef {Object} SkillRubric
 * @property {SkillId} skill
 * @property {CEFRLabel} level
 * @property {RubricElement[]} expectedElements
 * @property {string[]} examinerChecks
 * @property {string[]} scoringRules
 * @property {string[]} commonMistakes
 * @property {string[]} examinerFeedback
 * @property {Object[]} [followUpRules]
 */

/**
 * @typedef {Object} CriticalRule
 * @property {string} id
 * @property {string} description
 * @property {string} condition
 * @property {number} [maxScoreCap]
 * @property {boolean} [forceHumanReview]
 */

/**
 * @typedef {Object} GlobalPrinciple
 * @property {string} id
 * @property {string} text
 * @property {number} priority
 */

/**
 * @typedef {Object} PromotedRule
 * @property {string} id
 * @property {string} sourceLabItemId
 * @property {string} approvedBy
 * @property {string} approvedAt
 * @property {SkillId} [skill]
 * @property {CEFRLabel} [level]
 * @property {string} ruleText
 * @property {Object} [structuredPatch]
 */

/**
 * @typedef {Object} RuleRegistry
 * @property {RuleRegistryMeta} meta
 * @property {GlobalPrinciple[]} globalPrinciples
 * @property {CriticalRule[]} criticalRules
 * @property {Record<string, Record<string, SkillRubric>>} levels
 * @property {PromotedRule[]} promotedRules
 */

/**
 * @typedef {Object} RuleProposal
 * @property {string} proposalId
 * @property {string} labItemId
 * @property {string} proposedBy
 * @property {string} proposedAt
 * @property {'add'|'modify'|'deprecate'} action
 * @property {string} targetPath
 * @property {unknown} payload
 * @property {string} rationale
 * @property {'pending'|'approved'|'rejected'} status
 * @property {string[]} [conflictsWith]
 */

/**
 * @typedef {Object} RuleConflictCheckResult
 * @property {boolean} hasConflicts
 * @property {string[]} conflictDescriptions
 * @property {string[]} conflictingRuleIds
 */

export const RULE_REGISTRY_STORAGE_KEY = "austriaPathRuleRegistry";
export const RULE_PROPOSALS_STORAGE_KEY = "austriaPathRuleProposals";

export const EMPTY_RULE_REGISTRY = Object.freeze({
  meta: Object.freeze({
    registryVersion: "0.0.0-phase-a",
    updatedAt: new Date(0).toISOString(),
    schemaVersion: "1.0.0",
  }),
  globalPrinciples: Object.freeze([]),
  criticalRules: Object.freeze([]),
  levels: Object.freeze({}),
  promotedRules: Object.freeze([]),
});
