import { getCurrentUser } from "../app/userAccess";

/**
 * Canonical premium detection for upsell hints and feature gating (client-side beta only).
 * Backend must enforce subscription server-side in production.
 */
export function isPremiumActive() {
  if (localStorage.getItem("premiumActive") === "true") {
    return true;
  }

  try {
    const subscription = JSON.parse(
      localStorage.getItem("austriaPathSubscription") || "null"
    );
    if (subscription?.status === "active") {
      return true;
    }
  } catch {
    // ignore malformed storage
  }

  if (localStorage.getItem("isPremiumUser") === "true") {
    return true;
  }

  if (localStorage.getItem("placementPaid") === "true") {
    return true;
  }

  if (localStorage.getItem("premiumPlan")) {
    return true;
  }

  const user = getCurrentUser();
  const subscriptionType = user?.subscription?.type;
  if (
    subscriptionType &&
    subscriptionType !== "free" &&
    user?.subscription?.status === "active"
  ) {
    return true;
  }

  return false;
}

export function getActiveSubscriptionType() {
  try {
    const subscription = JSON.parse(
      localStorage.getItem("austriaPathSubscription") || "null"
    );
    if (subscription?.type) {
      return subscription.type;
    }
  } catch {
    // ignore
  }

  return getCurrentUser()?.subscription?.type || localStorage.getItem("userPlan") || "free";
}
