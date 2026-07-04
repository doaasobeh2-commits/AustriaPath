/**
 * Examiner Lab — selective high-value learning cases only.
 * @module exam-platform/examinerLabPolicy
 */

/** @typedef {import('./contracts.js').CouncilDecision} CouncilDecision */

export const EXAMINER_LAB_POLICY = Object.freeze({
  maxNewCasesPerWeek: 1,
  neverStoreAllReports: true,
  priorityOrder: Object.freeze([
    "human_confirmed_or_corrected",
    "conflicting_evaluations",
    "exceptional_ai_mistake",
    "novel_situation",
  ]),
});

/**
 * @param {CouncilDecision} decision
 * @returns {string|null}
 */
export function classifyLabCase(decision) {
  if (!decision?.needsHumanReview) return null;

  if (
    decision.humanReviewReason?.includes("confirmed") ||
    decision.humanReviewReason?.includes("corrected")
  ) {
    return "human_confirmed_or_corrected";
  }
  if ((decision.conflicts?.length || 0) > 0) {
    return "conflicting_evaluations";
  }
  if ((decision.criticalRulesApplied?.length || 0) > 0 && decision.confidence < 50) {
    return "exceptional_ai_mistake";
  }
  if (decision.confidence < 55 && (decision.warnings?.length || 0) >= 2) {
    return "novel_situation";
  }
  if (decision.needsHumanReview) {
    return "exceptional_ai_mistake";
  }
  return null;
}

/**
 * @param {Object} params
 * @param {CouncilDecision} params.decision
 * @param {{ queuedAt: string, classification: string }[]} [params.recentQueue]
 * @param {number} [params.nowMs]
 */
export function shouldEnqueueLabCase({ decision, recentQueue = [], nowMs = Date.now() }) {
  const classification = classifyLabCase(decision);
  if (!classification) {
    return { enqueue: false, classification: null, reason: "not_needs_human_review" };
  }

  const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
  const casesThisWeek = recentQueue.filter(
    (item) => new Date(item.queuedAt).getTime() >= weekAgo
  ).length;

  if (casesThisWeek >= EXAMINER_LAB_POLICY.maxNewCasesPerWeek) {
    const isHighPriority =
      classification === "human_confirmed_or_corrected" ||
      classification === "conflicting_evaluations";
    if (!isHighPriority) {
      return {
        enqueue: false,
        classification,
        reason: "weekly_volume_cap_reached",
      };
    }
  }

  return { enqueue: true, classification, reason: "high_value_learning_case" };
}
