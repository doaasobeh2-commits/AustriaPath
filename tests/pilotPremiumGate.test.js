import { describe, expect, it } from "vitest";
import { shouldBlockPremiumTab } from "../src/config/premiumFeaturesGate.js";

describe("pilot premium gate", () => {
  it("keeps the subscription catalog reachable while the kill switch is on", () => {
    expect(shouldBlockPremiumTab("premium", { placement: false, weeklyPlan: false })).toBe(
      false
    );
  });

  it("blocks placement and weekly destinations without server entitlements", () => {
    expect(shouldBlockPremiumTab("placementTest", { placement: false, weeklyPlan: false }))
      .toBe(true);
    expect(shouldBlockPremiumTab("weeklyPlanSetup", { placement: false, weeklyPlan: false }))
      .toBe(true);
    expect(shouldBlockPremiumTab("coachExercise", { placement: false, weeklyPlan: false }))
      .toBe(true);
  });

  it("opens only the granted pilot destination", () => {
    expect(shouldBlockPremiumTab("placementTest", { placement: true, weeklyPlan: false }))
      .toBe(false);
    expect(shouldBlockPremiumTab("weeklyPlanSetup", { placement: false, weeklyPlan: true }))
      .toBe(false);
    expect(shouldBlockPremiumTab("placementTest", { placement: false, weeklyPlan: true }))
      .toBe(true);
  });

  it("keeps legacy premium products blocked", () => {
    expect(shouldBlockPremiumTab("premiumExam", { placement: true, weeklyPlan: true }))
      .toBe(true);
    expect(shouldBlockPremiumTab("exams", { placement: true, weeklyPlan: true })).toBe(true);
  });
});
