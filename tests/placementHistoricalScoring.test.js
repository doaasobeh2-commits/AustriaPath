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
  resolvePlacementFinalLevel,
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
  it("maps self performance to bild level capped at B1 after Selbstvorstellung", () => {
    expect(getImageStepAfterSelfIntro("weak")).toMatchObject({
      skill: "bildbeschreibung",
      level: "A2",
      difficulty: "leicht",
    });
    expect(getImageStepAfterSelfIntro("medium")).toMatchObject({
      level: "A2",
      difficulty: "mittel",
    });
    expect(getImageStepAfterSelfIntro("strong")).toMatchObject({
      level: "B1",
      difficulty: "mittel",
    });
  });

  it("routes listening from speaking working level without downgrade", () => {
    expect(
      getReadingListeningStep("medium", "medium", { speakingWorkingLevel: "B1" })
    ).toMatchObject({
      skill: "lesenHoeren",
      level: "B1",
      difficulty: "bridge",
    });
    expect(
      getReadingListeningStep("weak", "weak", { speakingWorkingLevel: "A2" })
    ).toMatchObject({
      level: "A2",
      difficulty: "leicht",
    });
  });

  it("routes stable B1 planung without B2 unless confirmation qualifies", () => {
    expect(
      getPlanningStep({
        selfIntroResult: "strong",
        imageResult: "medium",
        lesenHoerenResult: "weak",
      })
    ).toMatchObject({
      skill: "planung",
      level: "B1",
    });
  });

  it("routes B2 confirmation when strong repeated B1 evidence and listening allows", () => {
    expect(
      getPlanningStep({
        selfIntroResult: "medium",
        imageResult: "strong",
        lesenHoerenResult: "strong",
      })
    ).toMatchObject({
      skill: "diskussion",
      level: "B2",
      mode: "b2_confirmation",
    });
  });

  it("routes lower evidence to A2 planung", () => {
    const step = getPlanningStep({
      selfIntroResult: "weak",
      imageResult: "weak",
      lesenHoerenResult: "weak",
    });
    expect(step).toMatchObject({ level: "A2", difficulty: "mittel" });
    expect(resolvePlacementModelFromStep(step)?.id).toBe("a2_planung_mittel");
  });

  it("makes b1_planung_mittel reachable at B1 working level", () => {
    const step = getPlanningStep({
      selfIntroResult: "strong",
      imageResult: "medium",
      lesenHoerenResult: "weak",
    });
    expect(step).toMatchObject({ skill: "planung", level: "B1" });
    expect(resolvePlacementModelFromStep(step)?.id).toBe("b1_planung_mittel");
  });
});

describe("B2 confirmation final level (Rule 7)", () => {
  it("confirms B2- after successful diskussion without changing weighted score", () => {
    const level = resolvePlacementFinalLevel({
      score: 91,
      bands: { planung: "strong" },
      modelsUsed: [
        {
          stage: "diskussion",
          requested: { mode: "b2_confirmation" },
        },
      ],
    });
    expect(level).toBe("B2-");
    expect(getFinalInternalLevel(91)).toBe("B1+");
  });

  it("keeps B1 when B2 confirmation is weak", () => {
    expect(
      resolvePlacementFinalLevel({
        score: 91,
        bands: { planung: "weak" },
        modelsUsed: [{ stage: "diskussion" }],
      })
    ).toBe("B1+");
  });

  it("floors stable B1 speaking to B1- when weak listening lowers score only", () => {
    expect(
      resolvePlacementFinalLevel({
        score: 59,
        bands: {
          selbstvorstellung: "strong",
          bildbeschreibung: "medium",
          lesenHoeren: "weak",
          planung: "medium",
        },
        modelsUsed: [{ stage: "planung", requested: { skill: "planung", level: "B1" } }],
      })
    ).toBe("B1-");
    expect(getFinalInternalLevel(59)).toBe("A2+");
  });
});

describe("missing-model fallbacks", () => {
  it("always starts at a2_self_mittel", () => {
    expect(getPlacementStartModel()?.id).toBe("a2_self_mittel");
    expect(getPlacementStartModel("B2")?.id).toBe("a2_self_mittel");
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
