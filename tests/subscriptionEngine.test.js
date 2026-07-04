import { describe, expect, it } from "vitest";
import { getPermissionsByPlan } from "../src/data/subscriptionEngine.js";

describe("getPermissionsByPlan", () => {
  it("grants weekly plan permissions", () => {
    const permissions = getPermissionsByPlan("weekly_plan");
    expect(permissions.weeklyPlan).toBe(true);
    expect(permissions.reports).toBe(true);
  });

  it("grants ai_exam full AI permissions", () => {
    const permissions = getPermissionsByPlan("ai_exam");
    expect(permissions.aiExam).toBe(true);
    expect(permissions.readingAI).toBe(true);
    expect(permissions.listeningAI).toBe(true);
  });

  it("returns free defaults", () => {
    const permissions = getPermissionsByPlan("free");
    expect(permissions.aiExam).toBe(false);
    expect(permissions.placementTest).toBe(false);
  });
});
