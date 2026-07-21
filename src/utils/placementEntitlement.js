import { useBackend } from "../api/useBackend.js";
import { getPlacementEntitlement } from "../api/repositories/index.js";

export async function fetchPlacementEntitlementView() {
  if (!useBackend()) {
    return { canTake: false, remainingExams: 0, source: "disabled" };
  }
  try {
    const data = await getPlacementEntitlement();
    const remainingExams = Number(data?.remainingExams ?? 0);
    const canTake = Boolean(data?.canTake) && remainingExams > 0;
    return {
      canTake,
      remainingExams: canTake ? remainingExams : 0,
      source: "backend",
    };
  } catch (error) {
    return {
      canTake: false,
      remainingExams: 0,
      source: "error",
      error: error?.message || "Entitlement check failed",
    };
  }
}

export function resolvePlacementCtaState({ loading, canTake }) {
  if (loading) {
    return { action: "none", buttonText: "Prüfe Freigabe…", disabled: true };
  }
  if (canTake) {
    return { action: "open_placement", buttonText: "Einstufungstest starten", disabled: false };
  }
  return { action: "coming_soon", buttonText: "Coming Soon", disabled: false };
}

export function isPlacementPlan(plan) {
  return Boolean(
    plan &&
      (plan.id === "placement" || plan.type === "placement" || plan.type === "placement_test")
  );
}
