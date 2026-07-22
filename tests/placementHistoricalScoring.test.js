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
    expect(bandToPlacementScore("strong")).toBe(100);
    expect(bandToPlacementScore("stark")).toBe(100);
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

  it("keeps stable B1 medium/medium evidence at B1 listening", () => {
    expect(getReadingListeningStep("medium", "medium", "B1")).toMatchObject({
      level: "B1",
      difficulty: "mittel",
    });
  });

  it.each([
    ["weak", "medium", "B1", "A2"],
    ["medium", "weak", "B1", "A2"],
    ["strong", "strong", "B1", "B2"],
    ["weak", "weak", "B2", "A2"],
    ["medium", "medium", "B2", "B2"],
  ])("routes %s/%s from %s start to %s listening", (self, image, start, level) => {
    expect(getReadingListeningStep(self, image, start).level).toBe(level);
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

  it("routes consistently strong evidence to B1 planung mittel", () => {
    expect(
      getPlanningStep({
        selfIntroResult: "stark",
        imageResult: "strong",
        lesenHoerenResult: "medium",
      })
    ).toMatchObject({
      skill: "planung",
      level: "B1",
      difficulty: "mittel",
    });
  });

  it("routes mixed/emerging B1 evidence to B1 planung schwach", () => {
    expect(getPlanningStep({
      selfIntroResult: "strong", imageResult: "medium", lesenHoerenResult: "weak",
    })).toMatchObject({ level: "B1", difficulty: "leicht" });
  });

  it("routes lower evidence to A2 planung and never to B2 discussion", () => {
    const step = getPlanningStep({
      selfIntroResult: "strong", imageResult: "weak", lesenHoerenResult: "weak",
    });
    expect(step).toMatchObject({ level: "A2", difficulty: "mittel" });
    expect(resolvePlacementModelFromStep(step)?.id).toBe("a2_planung_mittel");
    expect(resolvePlacementModelFromStep(step)?.id).not.toBe("b2_diskussion_mittel");
  });

  it("makes b1_planung_mittel reachable", () => {
    const step = getPlanningStep({
      selfIntroResult: "strong", imageResult: "strong", lesenHoerenResult: "strong",
    });
    expect(resolvePlacementModelFromStep(step)?.id).toBe("b1_planung_mittel");
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

  it.each([
    [[35, 35, 35, 35], 35, "A2"],
    [[65, 65, 65, 65], 65, "B1-"],
    [[100, 100, 100, 100], 100, "B2-"],
    [[100, 100, 100, 65], 90, "B1+"],
    [[100, 100, 65, 100], 93, "B1+"],
    [[100, 100, 100, 35], 81, "B1"],
    [[100, 35, 100, 100], 84, "B1"],
  ])("scores %j as %i / %s", (values, expectedScore, expectedLevel) => {
    const score = calculatePlacementScore({
      selbstvorstellung: values[0],
      bildbeschreibung: values[1],
      lesenHoeren: values[2],
      planung: values[3],
    });
    expect(score).toBe(expectedScore);
    expect(getFinalInternalLevel(score)).toBe(expectedLevel);
  });

  it.each(["A2", "B1", "B2"])(
    "selected start %s creates no score floor or ceiling",
    (selectedLevel) => {
      const weak = buildHistoricalPlacementResult({
        selectedLevel,
        numericScores: {
          selbstvorstellung: 35, bildbeschreibung: 35,
          lesenHoeren: 35, planung: 35,
        },
      });
      const strong = buildHistoricalPlacementResult({
        selectedLevel,
        numericScores: {
          selbstvorstellung: 100, bildbeschreibung: 100,
          lesenHoeren: 100, planung: 100,
        },
      });
      expect(weak.level).toBe("A2");
      expect(strong.level).toBe("B2-");
    }
  );

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
