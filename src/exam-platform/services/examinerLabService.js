/**
 * Examiner Lab Service — selective high-value case queue only.
 *
 * @module exam-platform/services/examinerLabService
 */

import { shouldEnqueueLabCase } from "../examinerLabPolicy.js";
import { getProductPolicy } from "../productPolicies.js";

export const LAB_SERVICE_VERSION = "1.0.0";
export const LAB_QUEUE_STORAGE_KEY = "austriaPathExaminerLabQueue";

function uid(prefix = "lab") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @type {import('../contracts.js').LabQueueItem[]} */
let memoryQueue = [];

/**
 * @param {Storage|null|undefined} storage
 */
export function loadLabQueue(storage) {
  if (!storage) return [...memoryQueue];
  try {
    const raw = storage.getItem(LAB_QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {import('../contracts.js').LabQueueItem[]} queue
 * @param {Storage|null|undefined} storage
 */
export function saveLabQueue(queue, storage) {
  memoryQueue = [...queue];
  if (storage) {
    storage.setItem(LAB_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }
  return queue;
}

/**
 * @param {Object} params
 * @param {import('../contracts.js').CouncilDecision} params.decision
 * @param {import('../contracts.js').ProductType} params.productType
 * @param {string} params.reportId
 * @param {string} params.sessionId
 * @param {import('../contracts.js').SectionEvaluation[]} params.sectionEvaluations
 * @param {Storage|null|undefined} [params.storage]
 * @param {number} [params.nowMs]
 * @returns {{ enqueued: boolean, labItem?: import('../contracts.js').LabQueueItem, reason: string }}
 */
export function maybeEnqueueLabCase({
  decision,
  productType,
  reportId,
  sessionId,
  sectionEvaluations,
  storage,
  nowMs = Date.now(),
}) {
  const policy = getProductPolicy(productType);
  if (!policy.labEligible || !decision.needsHumanReview) {
    return { enqueued: false, reason: "not_lab_eligible_or_no_review" };
  }

  const queue = loadLabQueue(storage);
  const recentQueue = queue.map((item) => ({
    queuedAt: item.queuedAt,
    classification: item.councilDecision?.humanReviewReason || "unknown",
  }));

  const gate = shouldEnqueueLabCase({
    decision,
    recentQueue,
    nowMs,
  });

  if (!gate.enqueue) {
    return { enqueued: false, reason: gate.reason || "policy_rejected" };
  }

  /** @type {import('../contracts.js').LabQueueItem} */
  const labItem = {
    labItemId: uid(),
    reportId,
    sessionId,
    councilDecision: decision,
    sectionEvaluations,
    status: "pending",
    queuedAt: new Date(nowMs).toISOString(),
    classification: gate.classification,
  };

  saveLabQueue([labItem, ...queue].slice(0, 50), storage);
  return { enqueued: true, labItem, reason: gate.reason || "high_value_learning_case" };
}

export function clearLabQueue() {
  memoryQueue = [];
}

export const examinerLabService = {
  version: LAB_SERVICE_VERSION,
  loadLabQueue,
  saveLabQueue,
  maybeEnqueueLabCase,
  clearLabQueue,
  LAB_QUEUE_STORAGE_KEY,
};
