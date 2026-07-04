/**
 * Examiner Lab bridge — admin screen adapter (Phase G).
 */

import { EXAMINER_LAB_POLICY } from "../examinerLabPolicy.js";
import { getPendingLabItems, resolveLabItem, loadLabResolutions } from "../services/labResolutionService.js";
import { loadRuleRegistry } from "../services/ruleRegistryService.js";
import { loadRuleProposals } from "../services/rulePromotionService.js";
import { loadLabQueue } from "../services/examinerLabService.js";
import { useBackend } from "../../api/useBackend.js";
import { backendCache } from "../../api/backendCache.js";
import {
  fetchLabDashboard,
  resolveLabItem as apiResolveLabItem,
} from "../../api/repositories/index.js";
import { hydrateBackendFromApi } from "../../api/hydrateBackend.js";

export const LAB_BRIDGE_VERSION = "1.0.0-phase-g";

/**
 * @param {Storage|null|undefined} [storage]
 */
export async function loadLabDashboard(storage = localStorage) {
  if (useBackend()) {
    if (!backendCache.labDashboard) {
      await hydrateBackendFromApi();
    }
    const dash = backendCache.labDashboard || {};
    return {
      policy: EXAMINER_LAB_POLICY,
      pendingCases: dash.pendingCases || [],
      pendingCount: dash.queueStats?.pending ?? dash.pendingCases?.length ?? 0,
      totalQueued: dash.pendingCases?.length ?? 0,
      resolvedCount: dash.queueStats?.resolvedThisWeek ?? 0,
      registryVersion: dash.registryStats?.registryVersion || "0.0.0",
      promotedRulesCount: dash.registryStats?.promotedRulesCount ?? 0,
      pendingProposalsCount: dash.registryStats?.pendingProposalsCount ?? 0,
      recentResolutions: dash.recentResolutions || [],
    };
  }

  const pending = getPendingLabItems(storage);
  const registry = loadRuleRegistry(storage);
  const proposals = loadRuleProposals(storage);
  const resolutions = loadLabResolutions(storage);
  const allQueue = loadLabQueue(storage);

  return {
    policy: EXAMINER_LAB_POLICY,
    pendingCases: pending,
    pendingCount: pending.length,
    totalQueued: allQueue.length,
    resolvedCount: allQueue.filter((i) => i.status === "resolved").length,
    registryVersion: registry.meta.registryVersion,
    promotedRulesCount: (registry.promotedRules || []).length,
    pendingProposalsCount: proposals.filter((p) => p.status === "pending").length,
    recentResolutions: resolutions.slice(0, 10),
  };
}

/**
 * @param {Object} params
 */
export async function submitLabReview({
  labItemId,
  action,
  reviewerId = "admin",
  rationale = "",
  correctedDecision,
  ruleProposal,
  storage = localStorage,
}) {
  if (useBackend()) {
    const result = await apiResolveLabItem(labItemId, {
      action,
      rationale,
      correctedDecision,
      ruleProposal,
    });
    backendCache.labDashboard = await fetchLabDashboard();
    return result;
  }

  return resolveLabItem({
    labItemId,
    action,
    reviewerId,
    rationale,
    correctedDecision,
    ruleProposal,
    storage,
  });
}

export const labBridge = {
  version: LAB_BRIDGE_VERSION,
  loadLabDashboard,
  submitLabReview,
};
