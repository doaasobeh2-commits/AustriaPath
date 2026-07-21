import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/api/useBackend.js", () => ({ useBackend: vi.fn(() => true) }));
vi.mock("../src/api/repositories/index.js", () => ({
  getPlacementEntitlement: vi.fn(),
}));

import { useBackend } from "../src/api/useBackend.js";
import { getPlacementEntitlement } from "../src/api/repositories/index.js";
import {
  fetchPlacementEntitlementView,
  isPlacementPlan,
  resolvePlacementCtaState,
} from "../src/utils/placementEntitlement.js";

describe("Placement entitlement CTA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBackend.mockReturnValue(true);
  });

  it("opens only with server canTake and a remaining attempt", async () => {
    getPlacementEntitlement.mockResolvedValue({ canTake: true, remainingExams: 1 });
    const view = await fetchPlacementEntitlementView();
    expect(view).toMatchObject({ canTake: true, remainingExams: 1, source: "backend" });
    expect(resolvePlacementCtaState({ loading: false, canTake: view.canTake }).action)
      .toBe("open_placement");
  });

  it("fails closed for missing attempts, errors, and frontend-only mode", async () => {
    getPlacementEntitlement.mockResolvedValue({ canTake: true, remainingExams: 0 });
    await expect(fetchPlacementEntitlementView()).resolves.toMatchObject({ canTake: false });

    getPlacementEntitlement.mockRejectedValue(new Error("offline"));
    await expect(fetchPlacementEntitlementView()).resolves.toMatchObject({
      canTake: false,
      source: "error",
    });

    useBackend.mockReturnValue(false);
    await expect(fetchPlacementEntitlementView()).resolves.toMatchObject({
      canTake: false,
      source: "disabled",
    });
  });

  it("does not treat other plans as Placement", () => {
    expect(isPlacementPlan({ id: "placement", type: "placement" })).toBe(true);
    expect(isPlacementPlan({ id: "ai-exam", type: "ai_exam" })).toBe(false);
  });
});
