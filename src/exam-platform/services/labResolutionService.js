/**
 * Examiner Lab resolution — human review actions and Rule Registry loop.
 *
 * @module exam-platform/services/labResolutionService
 */

import { classifyLabCase } from "../examinerLabPolicy.js";
import { loadLabQueue, saveLabQueue } from "./examinerLabService.js";
import { promoteRuleDirectly } from "./rulePromotionService.js";

export const LAB_RESOLUTIONS_STORAGE_KEY = "austriaPathExaminerLabResolutions";
export const LAB_RESOLUTION_VERSION = "1.0.0";

/**
 * @param {Storage|null|undefined} [storage]
 */
export function loadLabResolutions(storage) {
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(LAB_RESOLUTIONS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * @param {unknown[]} resolutions
 * @param {Storage|null|undefined} [storage]
 */
export function saveLabResolutions(resolutions, storage) {
  if (storage) {
    storage.setItem(LAB_RESOLUTIONS_STORAGE_KEY, JSON.stringify(resolutions.slice(0, 200)));
  }
  return resolutions;
}

/**
 * @param {import('../contracts.js').LabQueueItem} item
 */
export function enrichLabItem(item) {
  return {
    ...item,
    classification: classifyLabCase(item.councilDecision),
    summary: {
      score: item.councilDecision?.overallScore,
      confidence: item.councilDecision?.confidence,
      warnings: item.councilDecision?.warnings?.length || 0,
      conflicts: item.councilDecision?.conflicts?.length || 0,
      reason: item.councilDecision?.humanReviewReason,
    },
  };
}

/**
 * @param {Storage|null|undefined} [storage]
 */
export function getPendingLabItems(storage) {
  return loadLabQueue(storage)
    .filter((item) => item.status === "pending" || item.status === "in_review")
    .map(enrichLabItem);
}

/**
 * @param {Object} params
 * @param {string} params.labItemId
 * @param {import('../contracts.js').LabActionType} params.action
 * @param {string} params.reviewerId
 * @param {string} [params.rationale]
 * @param {import('../contracts.js').CouncilDecision} [params.correctedDecision]
 * @param {Object} [params.ruleProposal]
 * @param {Storage|null|undefined} [params.storage]
 */
export function resolveLabItem({
  labItemId,
  action,
  reviewerId,
  rationale = "",
  correctedDecision,
  ruleProposal,
  storage = localStorage,
}) {
  const queue = loadLabQueue(storage);
  const index = queue.findIndex((item) => item.labItemId === labItemId);
  if (index < 0) throw new Error(`Lab item not found: ${labItemId}`);

  const item = queue[index];
  /** @type {import('../contracts.js').LabResolution} */
  const resolution = {
    action,
    reviewerId,
    rationale,
    correctedDecision: correctedDecision || undefined,
    resolvedAt: new Date().toISOString(),
  };

  let promotedRule = null;
  let studentVisible = false;

  if (action === "approve") {
    studentVisible = false;
  }

  if (action === "reject") {
    studentVisible = false;
  }

  if (action === "correct") {
    studentVisible = true;
    resolution.correctedDecision = correctedDecision || item.councilDecision;
  }

  if (action === "propose_rule") {
    if (!ruleProposal?.ruleText) {
      throw new Error("Rule text required for propose_rule action");
    }
    const result = promoteRuleDirectly({
      labItemId,
      reviewerId,
      ruleText: ruleProposal.ruleText,
      skill: ruleProposal.skill,
      level: ruleProposal.level,
      patchType: ruleProposal.patchType || "append_scoring_rule",
      storage,
    });
    promotedRule = result.promotedRule;
    resolution.ruleProposal = {
      proposalId: result.promotedRule.id,
      labItemId,
      proposedBy: reviewerId,
      proposedAt: result.promotedRule.approvedAt,
      action: "add",
      targetPath: ruleProposal.targetPath || "levels",
      payload: ruleProposal,
      rationale,
      status: "approved",
    };
    studentVisible = Boolean(correctedDecision);
  }

  queue[index] = {
    ...item,
    status: "resolved",
    resolution,
    studentReviewStatus: studentVisible ? "corrected" : "confirmed",
  };

  saveLabQueue(queue, storage);

  const resolutions = [
    {
      labItemId,
      reportId: item.reportId,
      action,
      reviewerId,
      rationale,
      promotedRuleId: promotedRule?.id || null,
      studentVisible,
      resolvedAt: resolution.resolvedAt,
    },
    ...loadLabResolutions(storage),
  ];
  saveLabResolutions(resolutions, storage);

  return {
    item: enrichLabItem(queue[index]),
    resolution,
    promotedRule,
    studentVisible,
  };
}

export const labResolutionService = {
  version: LAB_RESOLUTION_VERSION,
  getPendingLabItems,
  resolveLabItem,
  loadLabResolutions,
};
