/**
 * Focused tests from Placement QA scenario findings (2026-07).
 */
import { describe, expect, it } from "vitest";
import {
  calculatePlacementScore,
  getFinalInternalLevel,
  getImageStepAfterSelfIntro,
  resolvePlacementFinalLevel,
  workingLevelAfterSelf,
} from "../src/data/placementLogic.js";
import { buildWeeklySession } from "../src/data/weeklyPlanLibrary.js";

describe("QA scenario 1 — planung cannot overpromote when Bild and Hören are weak", () => {
  const scenario1Bands = {
    selbstvorstellung: "medium",
    bildbeschreibung: "weak",
    lesenHoeren: "weak",
    planung: "strong",
  };

  it("keeps final level at A2 despite strong Planung", () => {
    const score = calculatePlacementScore({
      selbstvorstellung: 65,
      bildbeschreibung: 35,
      lesenHoeren: 35,
      planung: 100,
    });
    expect(score).toBe(62);
    expect(getFinalInternalLevel(score)).toBe("B1-");
    expect(
      resolvePlacementFinalLevel({
        score,
        bands: scenario1Bands,
        modelsUsed: [{ stage: "planung", requested: { skill: "planung", level: "A2" } }],
      })
    ).toBe("A2");
  });
});

describe("QA scenario 3 — B2 confirmation outcomes preserved", () => {
  it("confirms B2- on successful diskussion", () => {
    expect(
      resolvePlacementFinalLevel({
        score: 91,
        bands: { planung: "strong" },
        modelsUsed: [
          { stage: "diskussion", requested: { mode: "b2_confirmation" } },
        ],
      })
    ).toBe("B2-");
  });

  it("preserves B1+ when B2 confirmation is weak", () => {
    expect(
      resolvePlacementFinalLevel({
        score: 91,
        bands: { planung: "weak" },
        modelsUsed: [
          { stage: "diskussion", requested: { mode: "b2_confirmation" } },
        ],
      })
    ).toBe("B1+");
  });
});

describe("conservative B1 routing after Selbstvorstellung", () => {
  it("does not promote on medium self band alone", () => {
    expect(workingLevelAfterSelf("medium")).toBe("A2");
    expect(getImageStepAfterSelfIntro("medium")).toMatchObject({
      level: "A2",
      difficulty: "mittel",
    });
  });

  it("promotes to B1 only on strong self band", () => {
    expect(workingLevelAfterSelf("strong")).toBe("B1");
    expect(getImageStepAfterSelfIntro("strong")).toMatchObject({ level: "B1" });
  });
});

describe("weekly plan level normalization", () => {
  it.each([
    ["A2", "A2+"],
    ["A2", "A2"],
    ["B1", "B1-"],
    ["B1", "B1"],
    ["B1", "B1+"],
    ["B2", "B2-"],
    ["B2", "B2"],
  ])("buildWeeklySession(%s tasks) for placement label %s", (base, label) => {
    const tasks = buildWeeklySession({ level: label, weaknesses: [], maxMinutes: 20 });
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((task) => task.level === base)).toBe(true);
  });
});
