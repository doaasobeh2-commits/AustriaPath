import { describe, expect, it } from "vitest";
import {
  buildPlacementProfile,
  evaluateSkillLevel,
} from "../src/data/utils/placementEngine.js";

describe("evaluateSkillLevel", () => {
  it("returns B2 when two B2 skills", () => {
    expect(
      evaluateSkillLevel({
        skillScores: { a: "B2", b: "B2", c: "A2" },
      })
    ).toBe("B2");
  });

  it("returns A2 for weak profile", () => {
    expect(
      evaluateSkillLevel({
        skillScores: { a: "A2", b: "A2" },
      })
    ).toBe("A2");
  });
});

describe("buildPlacementProfile", () => {
  it("includes study plan and focus areas", () => {
    const profile = buildPlacementProfile({
      selectedLevel: "B1",
      skillScores: { hoeren: "A2", lesen: "B1" },
    });

    expect(profile.level).toBeTruthy();
    expect(profile.studyPlan.length).toBeGreaterThan(0);
    expect(profile.selectedStartLevel).toBe("B1");
  });
});
