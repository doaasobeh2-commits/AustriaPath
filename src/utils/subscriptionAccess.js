import { getCurrentUser } from "../app/userAccess";
import { useBackend } from "../api/useBackend.js";
import { backendCache } from "../api/backendCache.js";

/**
 * Canonical premium detection — uses API user/subscription when backend enabled.
 */
export function isPremiumActive() {
  if (useBackend()) {
    const user = getCurrentUser();
    const sub = user?.subscription || backendCache.subscription;
    if (sub?.status === "active" && sub?.type && sub.type !== "free") {
      return true;
    }
    return false;
  }

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
  if (useBackend()) {
    const user = getCurrentUser();
    return user?.subscription?.type || backendCache.subscription?.type || "free";
  }

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
