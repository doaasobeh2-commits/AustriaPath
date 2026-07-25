/**
 * Conservative Placement routing — highest stable level, not highest possible.
 */
import { describe, expect, it } from "vitest";
import {
  applyListeningToWorkingLevel,
  computeSpeakingWorkingLevelAfterBild,
  computeSpeakingWorkingLevelForPlanung,
  evaluateListeningRouting,
  getImageStepAfterSelfIntro,
  getPlacementStartModel,
  getPlanningStep,
  getReadingListeningStep,
  qualifiesForB2Confirmation,
  stepWorkingLevelByBand,
  workingLevelAfterSelf,
} from "../src/data/placementLogic.js";
import {
  PLACEMENT_ADAPTIVE_PLANNING_MAX_EXAMINER_TURNS,
  selectNextPlanningMove,
} from "../src/data/placementPlanningPacks.js";
import {
  getPlacementFollowUpLimit,
  PLACEMENT_SKILL_FOLLOWUP_LIMITS,
} from "../server/src/services/placementEvaluateService.js";
import { PLACEMENT_TURN_BOUNDS, PLACEMENT_TURN_LIMIT } from "../server/src/services/placementEntitlementService.js";

describe("conservative working level", () => {
  it("always starts at A2 Selbstvorstellung regardless of stored level", () => {
    expect(getPlacementStartModel()?.id).toBe("a2_self_mittel");
    expect(getPlacementStartModel("B2")?.id).toBe("a2_self_mittel");
  });

  it("caps Selbstvorstellung uplift at B1 only for strong evidence (Rule 2)", () => {
    expect(workingLevelAfterSelf("weak")).toBe("A2");
    expect(workingLevelAfterSelf("medium")).toBe("A2");
    expect(workingLevelAfterSelf("strong")).toBe("B1");
    expect(getImageStepAfterSelfIntro("strong")).toMatchObject({ level: "B1" });
    expect(getImageStepAfterSelfIntro("medium")).toMatchObject({ level: "A2" });
  });

  it("steps only one level at a time after Bild", () => {
    expect(computeSpeakingWorkingLevelAfterBild("weak", "strong")).toBe("B1");
    expect(computeSpeakingWorkingLevelAfterBild("medium", "strong")).toBe("B1");
    expect(computeSpeakingWorkingLevelAfterBild("strong", "medium")).toBe("B1");
    expect(stepWorkingLevelByBand("A2", "strong")).toBe("B1");
  });

  it("never lowers speaking level on weak listening (Rule 3)", () => {
    expect(
      evaluateListeningRouting("B1", "weak").speakingWorkingLevel
    ).toBe("B1");
    expect(applyListeningToWorkingLevel("B1", "weak")).toBe("B1");
  });

  it("routes planung from speaking evidence only (Rule 4)", () => {
    expect(
      getPlanningStep({
        selfIntroResult: "medium",
        imageResult: "medium",
        lesenHoerenResult: "weak",
      })
    ).toMatchObject({ skill: "planung", level: "A2" });
    expect(
      getPlanningStep({
        selfIntroResult: "strong",
        imageResult: "medium",
        lesenHoerenResult: "weak",
      })
    ).toMatchObject({ skill: "planung", level: "B1" });
    expect(computeSpeakingWorkingLevelForPlanung("medium", "medium")).toBe("A2");
    expect(computeSpeakingWorkingLevelForPlanung("strong", "medium")).toBe("B1");
  });

  it("offers B2 confirmation only with strong repeated B1 evidence", () => {
    expect(
      qualifiesForB2Confirmation("medium", "medium", "strong")
    ).toBe(false);
    expect(
      qualifiesForB2Confirmation("medium", "strong", "strong")
    ).toBe(true);
    expect(
      getPlanningStep({
        selfIntroResult: "medium",
        imageResult: "strong",
        lesenHoerenResult: "strong",
      })
    ).toMatchObject({ skill: "diskussion", level: "B2", mode: "b2_confirmation" });
  });
});

describe("adaptive turn caps", () => {
  it("enforces per-skill follow-up limits including B2 confirmation", () => {
    expect(PLACEMENT_SKILL_FOLLOWUP_LIMITS).toEqual({
      selbstvorstellung: 2,
      bildbeschreibung: 1,
      planung: 2,
      diskussion: 0,
    });
    expect(getPlacementFollowUpLimit("diskussion")).toBe(0);
  });

  it("fits the shortened exam within nine evaluate turns", () => {
    expect(PLACEMENT_TURN_LIMIT).toBe(9);
  });

  it("caps planung at three examiner turns", () => {
    const pack = "a2_planung_mittel";
    const afterTwo = [
      { moveId: "birthday-time", transcript: "Am Samstag." },
      { moveId: "birthday-place", transcript: "Zu Hause." },
    ];
    expect(selectNextPlanningMove(pack, afterTwo)?.closing).toBe(true);
    expect(PLACEMENT_ADAPTIVE_PLANNING_MAX_EXAMINER_TURNS).toBe(3);
  });
});
