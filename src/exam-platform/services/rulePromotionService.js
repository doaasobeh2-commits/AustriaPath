/**
 * Rule promotion — human-approved Lab corrections → permanent Registry knowledge.
 *
 * @module exam-platform/services/rulePromotionService
 */

import { RULE_PROPOSALS_STORAGE_KEY } from "../ruleRegistrySchema.js";
import {
  loadRuleRegistry,
  saveRuleRegistry,
  clearRuleRegistryCache,
  skillToKnowledgeKey,
} from "./ruleRegistryService.js";

export const RULE_PROMOTION_VERSION = "1.0.0";

function uid(prefix = "rule") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function bumpVersion(version = "1.0.0") {
  const parts = String(version).split(".");
  const minor = Number(parts[1] || 0) + 1;
  return `${parts[0] || "1"}.${minor}.0`;
}

/**
 * @param {Storage|null|undefined} [storage]
 */
export function loadRuleProposals(storage) {
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(RULE_PROPOSALS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * @param {import('../ruleRegistrySchema.js').RuleProposal[]} proposals
 * @param {Storage|null|undefined} [storage]
 */
export function saveRuleProposals(proposals, storage) {
  if (storage) {
    storage.setItem(RULE_PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  }
  return proposals;
}

/**
 * @param {import('../ruleRegistrySchema.js').RuleProposal} proposal
 * @param {import('../ruleRegistrySchema.js').RuleRegistry} registry
 */
export function checkRuleConflicts(proposal, registry) {
  const conflicts = [];
  const conflictingRuleIds = [];
  const payload = /** @type {Record<string, unknown>} */ (proposal.payload || {});

  (registry.promotedRules || []).forEach((existing) => {
    if (existing.ruleText === payload.ruleText && existing.skill === payload.skill) {
      conflicts.push(`Duplicate rule already promoted: ${existing.id}`);
      conflictingRuleIds.push(existing.id);
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflictDescriptions: conflicts,
    conflictingRuleIds,
  };
}

/**
 * @param {Object} params
 */
export function proposeRuleFromLab({
  labItemId,
  proposedBy,
  ruleText,
  skill,
  level,
  patchType = "append_scoring_rule",
  rationale = "",
  storage = localStorage,
}) {
  const registry = loadRuleRegistry(storage);
  /** @type {import('../ruleRegistrySchema.js').RuleProposal} */
  const proposal = {
    proposalId: uid("proposal"),
    labItemId,
    proposedBy,
    proposedAt: new Date().toISOString(),
    action: "add",
    targetPath: skill && level ? `levels.${level}.${skillToKnowledgeKey(skill)}` : "global",
    payload: { ruleText, skill, level, patchType },
    rationale,
    status: "pending",
  };

  const conflict = checkRuleConflicts(proposal, registry);
  if (conflict.hasConflicts) {
    proposal.conflictsWith = conflict.conflictingRuleIds;
  }

  const proposals = [proposal, ...loadRuleProposals(storage)].slice(0, 100);
  saveRuleProposals(proposals, storage);

  return { proposal, conflict };
}

/**
 * @param {Object} params
 */
export function approveRuleProposal({
  proposalId,
  reviewerId,
  storage = localStorage,
}) {
  const proposals = loadRuleProposals(storage);
  const proposal = proposals.find((p) => p.proposalId === proposalId);
  if (!proposal) throw new Error(`Rule proposal not found: ${proposalId}`);
  if (proposal.status !== "pending") throw new Error(`Proposal already ${proposal.status}`);

  const registry = loadRuleRegistry(storage);
  const conflict = checkRuleConflicts(proposal, registry);
  if (conflict.hasConflicts) {
    throw new Error(`Rule conflict: ${conflict.conflictDescriptions.join("; ")}`);
  }

  const payload = /** @type {Record<string, unknown>} */ (proposal.payload || {});
  /** @type {import('../ruleRegistrySchema.js').PromotedRule} */
  const promotedRule = {
    id: uid("promoted"),
    sourceLabItemId: proposal.labItemId,
    approvedBy: reviewerId,
    approvedAt: new Date().toISOString(),
    skill: payload.skill,
    level: payload.level,
    ruleText: payload.ruleText || String(proposal.rationale || ""),
    structuredPatch: {
      type: payload.patchType || "append_scoring_rule",
      value: payload.ruleText,
    },
  };

  const nextRegistry = {
    ...registry,
    meta: {
      ...registry.meta,
      registryVersion: bumpVersion(registry.meta.registryVersion),
      updatedAt: new Date().toISOString(),
      approvedBy: reviewerId,
    },
    promotedRules: [promotedRule, ...(registry.promotedRules || [])],
  };

  saveRuleRegistry(nextRegistry, storage);
  clearRuleRegistryCache();

  saveRuleProposals(
    proposals.map((p) =>
      p.proposalId === proposalId ? { ...p, status: /** @type {'approved'} */ ("approved") } : p
    ),
    storage
  );

  return { promotedRule, registry: nextRegistry };
}

export function rejectRuleProposal(proposalId, reviewerId, storage = localStorage) {
  const proposals = loadRuleProposals(storage);
  saveRuleProposals(
    proposals.map((p) =>
      p.proposalId === proposalId
        ? { ...p, status: /** @type {'rejected'} */ ("rejected"), rejectedBy: reviewerId }
        : p
    ),
    storage
  );
  return proposals.find((p) => p.proposalId === proposalId);
}

export function promoteRuleDirectly(params) {
  const { proposal } = proposeRuleFromLab({
    ...params,
    proposedBy: params.reviewerId,
    rationale: "Direct Lab promotion",
  });
  return approveRuleProposal({
    proposalId: proposal.proposalId,
    reviewerId: params.reviewerId,
    storage: params.storage,
  });
}

export const rulePromotionService = {
  version: RULE_PROMOTION_VERSION,
  proposeRuleFromLab,
  approveRuleProposal,
  rejectRuleProposal,
  promoteRuleDirectly,
  checkRuleConflicts,
  loadRuleProposals,
};
