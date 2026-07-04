/**
 * Subscription integrity — product policies, not UI logic.
 * @module exam-platform/subscriptionPolicy
 */

/** @typedef {import('./contracts.js').ProductType} ProductType */

/**
 * @typedef {Object} SubscriptionRecord
 * @property {ProductType|string} type
 * @property {'active'|'inactive'|'expired'} status
 * @property {number} remainingExams
 * @property {string|null} startDate
 * @property {string|null} endDate
 * @property {{ date: string, productType: string, examIndex?: number }[]} [usageHistory]
 */

/**
 * @typedef {Object} SubscriptionValidationResult
 * @property {boolean} allowed
 * @property {string} [reasonCode]
 * @property {string} [message]
 */

export const PREMIUM_EXAM_PRODUCTS = Object.freeze([
  "ai_exam",
  "intensive_week",
  "premium_month",
]);

/** @param {ProductType} productType */
export function requiresSubscriptionValidation(productType) {
  return PREMIUM_EXAM_PRODUCTS.includes(productType);
}

/**
 * @param {Object} params
 * @param {ProductType} params.productType
 * @param {SubscriptionRecord|null|undefined} params.subscription
 * @param {number} [params.nowMs]
 */
export function validateSubscriptionForExam({
  productType,
  subscription,
  nowMs = Date.now(),
}) {
  if (!requiresSubscriptionValidation(productType)) {
    return { allowed: true };
  }

  if (!subscription || subscription.status !== "active") {
    return {
      allowed: false,
      reasonCode: "SUBSCRIPTION_INACTIVE",
      message: "Kein aktives Abonnement für diese Prüfung.",
    };
  }

  if (productType === "intensive_week" || productType === "premium_month") {
    if (subscription.type !== productType) {
      return {
        allowed: false,
        reasonCode: "SUBSCRIPTION_TYPE_MISMATCH",
        message: "Abonnement-Typ passt nicht zu dieser Prüfung.",
      };
    }
  }

  if (subscription.endDate) {
    const end = new Date(subscription.endDate).getTime();
    if (end < nowMs) {
      return {
        allowed: false,
        reasonCode: "SUBSCRIPTION_EXPIRED",
        message: "Das Abonnement ist abgelaufen.",
      };
    }
  }

  if ((subscription.remainingExams ?? 0) <= 0) {
    return {
      allowed: false,
      reasonCode: "NO_REMAINING_EXAMS",
      message: "Keine verbleibenden Prüfungsversuche.",
    };
  }

  return { allowed: true };
}

/** @param {SubscriptionRecord} subscription @param {ProductType} productType @param {number} [examIndex] */
export function consumeExamAttempt(subscription, productType, examIndex = 1) {
  return {
    ...subscription,
    remainingExams: Math.max(0, (subscription.remainingExams ?? 0) - 1),
    usageHistory: [
      {
        date: new Date().toISOString(),
        productType,
        examIndex,
      },
      ...(subscription.usageHistory || []),
    ],
  };
}
