/**
 * Placement historical routing + approved band→score product decision tests.
 */
import { describe, expect, it } from "vitest";
import {
  bandToPlacementScore,
  buildHistoricalPlacementResult,
  calculatePlacementScore,
  getFinalBandFromTurnEvidence,
  getFinalInternalLevel,
  getImageStepAfterSelfIntro,
  getPlanningStep,
  getPlacementStartModel,
  getReadingListeningStep,
  PLACEMENT_BAND_TO_SCORE,
  resolvePlacementModelFromStep,
  scorePlacementListeningAnswers,
} from "../src/data/placementLogic.js";

describe("approved band → score mapping", () => {
  it("maps weak/medium/strong and German aliases", () => {
    expect(bandToPlacementScore("weak")).toBe(35);
    expect(bandToPlacementScore("schwach")).toBe(35);
    expect(bandToPlacementScore("medium")).toBe(65);
    expect(bandToPlacementScore("mittel")).toBe(65);
    expect(bandToPlacementScore("strong")).toBe(90);
    expect(bandToPlacementScore("stark")).toBe(90);
    expect(PLACEMENT_BAND_TO_SCORE.weak).toBe(35);
  });

  it("rejects unknown bands", () => {
    expect(bandToPlacementScore("legendary")).toBeNull();
  });
});

describe("final band from turnEvidence", () => {
  it("aggregates all valid evaluation bands", () => {
    const band = getFinalBandFromTurnEvidence([
      { band: "weak", needsFollowUp: true },
      { band: "strong", needsFollowUp: false },
    ]);
    expect(band).toBe("medium");
  });

  it("returns null when empty", () => {
    expect(getFinalBandFromTurnEvidence([])).toBeNull();
  });
});

describe("historical routing", () => {
  it("routes strong self-intro to B1 bild leicht", () => {
    expect(getImageStepAfterSelfIntro("strong")).toMatchObject({
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "leicht",
    });
  });

  it("routes a confirmed B2 start to the real B2 bild model step", () => {
    expect(getImageStepAfterSelfIntro("medium", "B2")).toMatchObject({
      skill: "bildbeschreibung",
      level: "B2",
      difficulty: "mittel",
    });
  });

  it("routes a weak B2 start down to B1 bild", () => {
    expect(getImageStepAfterSelfIntro("weak", "B2")).toMatchObject({
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "mittel",
    });
  });

  it("lets a strong B1 start reach B2 bild", () => {
    expect(getImageStepAfterSelfIntro("strong", "B1")).toMatchObject({
      skill: "bildbeschreibung",
      level: "B2",
      difficulty: "mittel",
    });
  });

  it("routes medium+medium to A2 lesenHoeren stark", () => {
    expect(getReadingListeningStep("medium", "medium")).toMatchObject({
      skill: "lesenHoeren",
      level: "A2",
      difficulty: "stark",
    });
  });

  it("routes a stable B2 start to B2 listening", () => {
    expect(getReadingListeningStep("medium", "strong", "B2")).toMatchObject({
      skill: "lesenHoeren",
      level: "B2",
      difficulty: "mittel",
    });
  });

  it("routes a very strong B1 path to B2 listening", () => {
    expect(getReadingListeningStep("strong", "strong", "B1")).toMatchObject({
      skill: "lesenHoeren",
      level: "B2",
      difficulty: "mittel",
    });
  });

  it("does not keep a weak B2 start at B2 listening", () => {
    expect(getReadingListeningStep("weak", "medium", "B2").level).toBe("A2");
  });

  it("routes strong path to B1 planung leicht", () => {
    expect(
      getPlanningStep({
        selfIntroResult: "stark",
        imageResult: "mittel",
        lesenHoerenResult: "mittel",
      })
    ).toMatchObject({
      skill: "planung",
      level: "B1",
      difficulty: "leicht",
    });
  });
});

describe("missing-model fallbacks", () => {
  it("starts at a2_self_mittel", () => {
    expect(getPlacementStartModel()?.id).toBe("a2_self_mittel");
  });

  it("uses the selected starting level model", () => {
    expect(getPlacementStartModel("B1")?.id).toBe("b1_self_mittel");
    expect(getPlacementStartModel("B2")?.id).toBe("b2_self_mittel");
  });

  it("resolves B1 bild leicht via documented fallback b1_bild_mittel", () => {
    const model = resolvePlacementModelFromStep({
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "leicht",
    });
    expect(model?.id).toBe("b1_bild_mittel");
  });

  it("resolves A2 hoeren stark via a2_hoeren_mittel", () => {
    const model = resolvePlacementModelFromStep({
      skill: "lesenHoeren",
      level: "A2",
      difficulty: "stark",
    });
    expect(model?.id).toBe("a2_hoeren_mittel");
  });

  it("resolves B1 planung leicht via b1_planung_schwach", () => {
    const model = resolvePlacementModelFromStep({
      skill: "planung",
      level: "B1",
      difficulty: "leicht",
    });
    expect(model?.id).toBe("b1_planung_schwach");
  });

  it("resolves exact A2 bild mittel without fallback", () => {
    const model = resolvePlacementModelFromStep({
      skill: "bildbeschreibung",
      level: "A2",
      difficulty: "mittel",
    });
    expect(model?.id).toBe("a2_bild_mittel");
  });

  it("resolves exact B2 bild mittel without a B1 fallback", () => {
    const model = resolvePlacementModelFromStep({
      skill: "bildbeschreibung",
      level: "B2",
      difficulty: "mittel",
    });
    expect(model?.id).toBe("b2_bild_mittel");
    expect(model?.level).toBe("B2");
    expect(model?.skill).toBe("bildbeschreibung");
  });
});

describe("objective listening scoring", () => {
  it("scores all keyed comprehension answers", () => {
    const listeningModel = resolvePlacementModelFromStep({
      skill: "lesenHoeren",
      level: "A2",
      difficulty: "mittel",
    });
    const answers = Object.fromEntries(
      listeningModel.listeningQuestions.map((question) => [
        question.id,
        question.correctOption,
      ])
    );
    expect(scorePlacementListeningAnswers(listeningModel, answers)).toMatchObject({
      band: "strong",
      correct: listeningModel.listeningQuestions.length,
      total: listeningModel.listeningQuestions.length,
    });
  });
});

describe("historical weighted final", () => {
  it("preserves thresholds", () => {
    expect(getFinalInternalLevel(39)).toBe("A2");
    expect(getFinalInternalLevel(40)).toBe("A2+");
    expect(getFinalInternalLevel(59)).toBe("A2+");
    expect(getFinalInternalLevel(60)).toBe("B1-");
    expect(getFinalInternalLevel(74)).toBe("B1-");
    expect(getFinalInternalLevel(75)).toBe("B1");
    expect(getFinalInternalLevel(87)).toBe("B1");
    expect(getFinalInternalLevel(88)).toBe("B1+");
    expect(getFinalInternalLevel(94)).toBe("B1+");
    expect(getFinalInternalLevel(95)).toBe("B2-");
  });

  it("weights 25/25/20/30 with approved band scores", () => {
    // all medium: 65 → 65
    expect(
      calculatePlacementScore({
        selbstvorstellung: 65,
        bildbeschreibung: 65,
        lesenHoeren: 65,
        planung: 65,
      })
    ).toBe(65);
    expect(getFinalInternalLevel(65)).toBe("B1-");

    // strong path example
    const score = calculatePlacementScore({
      selbstvorstellung: 90,
      bildbeschreibung: 90,
      lesenHoeren: 65,
      planung: 90,
    });
    // 90*0.25 + 90*0.25 + 65*0.20 + 90*0.30 = 22.5+22.5+13+27 = 85
    expect(score).toBe(85);
    expect(getFinalInternalLevel(score)).toBe("B1");
  });

  it("buildHistoricalPlacementResult does not use majority CEFR", () => {
    const profile = buildHistoricalPlacementResult({
      selectedLevel: "B2",
      numericScores: {
        selbstvorstellung: 35,
        bildbeschreibung: 35,
        lesenHoeren: 35,
        planung: 35,
      },
      bands: {
        selbstvorstellung: "weak",
        bildbeschreibung: "weak",
        lesenHoeren: "weak",
        planung: "weak",
      },
    });
    expect(profile.level).toBe("A2");
    expect(profile.selectedStartLevel).toBe("B2");
    expect(profile.scoringMethod).toBe("placement-historical-weighted-v1");
    // selectedLevel must not raise the result
    expect(profile.level).not.toBe("B2");
  });
});
