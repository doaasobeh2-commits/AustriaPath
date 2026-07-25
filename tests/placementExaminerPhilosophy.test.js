/**
 * Placement examiner philosophy — task/comprehension vs language evidence,
 * routing safeguards, listening live pools, and planung aggregation.
 */
import { describe, expect, it } from "vitest";
import {
  applyProductiveBandWithTaskSeparation,
  conversationUsedSimplifiedRephrase,
  deriveBridgeProbeResult,
  detectMisunderstandingPhrase,
  sanitizeExaminerSignals,
  shouldOfferBridgeProbe,
  simplifiedRephraseForQuestion,
} from "../src/data/utils/placementExaminerSignals.js";
import {
  getFinalBandFromTurnEvidence,
  getImageStepAfterSelfIntro,
  getReadingListeningStep,
} from "../src/data/placementLogic.js";
import {
  evaluatePlacementTurnOffline,
} from "../server/src/services/placementEvaluateService.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";
import {
  isPlacementListeningLiveModel,
  listPlacementListeningModels,
  selectPlacementListeningModel,
} from "../src/data/utils/placementListeningPool.js";
import { buildAllowedFollowUps } from "../server/src/services/placementEvaluateService.js";

describe("Placement examiner philosophy", () => {
  it("1. off-topic B1-like German keeps language evidence while task fulfilment is low", () => {
    const signals = sanitizeExaminerSignals({
      taskFulfilment: "low",
      comprehension: "uncertain",
      communicativeBand: "medium",
      accuracyBand: "medium",
      responseRelevance: "low",
      usableLanguageEvidence: true,
    });
    const band = applyProductiveBandWithTaskSeparation({
      communicativeBand: "medium",
      accuracyBand: "medium",
      proposedBand: "medium",
      modelLevel: "B1",
      examinerSignals: signals,
    });
    expect(signals.taskFulfilment).toBe("low");
    expect(signals.usableLanguageEvidence).toBe(true);
    expect(band).not.toBe("weak");
    expect(band).toBe("medium");
  });

  it('2. "Ich habe nicht verstanden" triggers one simplified rephrase without leaking the answer', () => {
    expect(detectMisunderstandingPhrase("Ich habe nicht verstanden.")).toBe(true);
    const simplified = simplifiedRephraseForQuestion(
      "Was machen Sie normalerweise an einem Tag?",
      "selbstvorstellung"
    );
    expect(simplified).toBeTruthy();
    expect(simplified).not.toMatch(/zum Beispiel Arbeit/i);
    expect(
      conversationUsedSimplifiedRephrase(
        [{ question: "Was machen Sie normalerweise an einem normalen Tag?", simplifiedRephraseUsed: true }],
        "Was machen Sie normalerweise an einem normalen Tag?"
      )
    ).toBe(true);
  });

  it("3. memorized strong intro fails bridge probe and stays on stable A2 path", () => {
    expect(
      shouldOfferBridgeProbe({
        band: "strong",
        examinerSignals: { memorizationRisk: "high" },
        conversation: [],
        followUpCount: 0,
      })
    ).toBe(true);
    const failed = deriveBridgeProbeResult(
      sanitizeExaminerSignals({ taskFulfilment: "low", comprehension: "uncertain" }),
      "Ich habe nicht verstanden."
    );
    expect(failed).toBe("failed");
    expect(getImageStepAfterSelfIntro("strong", "A2", { bridgeProbeStatus: failed })).toMatchObject({
      level: "A2",
    });
  });

  it("4. many grammar errors with A2 meaning can still yield A2-strong productive band on A2 model", () => {
    const band = applyProductiveBandWithTaskSeparation({
      communicativeBand: "strong",
      accuracyBand: "weak",
      proposedBand: "strong",
      modelLevel: "A2",
      examinerSignals: sanitizeExaminerSignals({
        taskFulfilment: "high",
        grammarAccuracy: "low",
        usableLanguageEvidence: true,
      }),
    });
    expect(band).toBe("medium");
    expect(band).not.toBe("weak");
  });

  it("5. semantically confirmed self topic suppresses duplicate follow-up", () => {
    const model = getPlacementModel("a2_self_mittel");
    const conversation = [
      {
        question: "Stellen Sie sich vor.",
        transcript: "Ich heiße Mina und wohne in Wien.",
        selfTopicsConfirmed: ["german_learning"],
      },
    ];
    const allowed = buildAllowedFollowUps(model, conversation);
    expect(allowed).not.toContain("Warum lernen Sie Deutsch?");
  });

  it("6. medium self + medium Bild does not route to A2-stark medical listening", () => {
    expect(getReadingListeningStep("medium", "medium")).toMatchObject({
      difficulty: "mittel",
    });
    for (const random of [0, 0.5, 0.99]) {
      const selected = selectPlacementListeningModel(
        { level: "A2", difficulty: "mittel" },
        { random: () => random }
      );
      expect(selected.id).not.toBe("placement_listening_02");
    }
  });

  it("7. weak learner receives a lighter listening model with at most 3 questions", () => {
    const selected = selectPlacementListeningModel(
      { level: "A2", difficulty: "leicht" },
      { random: () => 0 }
    );
    expect(selected.listeningQuestions.length).toBeLessThanOrEqual(3);
    expect(["placement_listening_10", "placement_listening_a2_support"]).toContain(
      selected.id
    );
  });

  it("8. B2 listening without recorded audio is not live-selectable", () => {
    expect(listPlacementListeningModels("B2")).toEqual([]);
    expect(selectPlacementListeningModel({ level: "B2", difficulty: "mittel" })).toBeNull();
    for (const id of [
      "b2_hoeren_buerotermin",
      "b2_hoeren_bewerbung",
      "b2_hoeren_digitalisierung",
    ]) {
      expect(isPlacementListeningLiveModel(getPlacementModel(id))).toBe(false);
      expect(getPlacementModel(id)).toBeTruthy();
    }
  });

  it("9. off-topic Planung keeps language evidence separate from task fulfilment in offline sanitize", () => {
    const model = getPlacementModel("a2_planung_mittel");
    const evaluation = evaluatePlacementTurnOffline({
      modelId: model.id,
      raw: {
        communicativeBand: "medium",
        accuracyBand: "medium",
        band: "medium",
        taskFulfilment: "low",
        comprehension: "uncertain",
        responseRelevance: "low",
        usableLanguageEvidence: true,
        needsFollowUp: false,
      },
      followUpCount: 0,
      conversation: [
        {
          moveId: "birthday-place",
          question: "Wo können wir feiern?",
          transcript: "Ich mag Pizza sehr gern und esse sie oft.",
        },
      ],
    });
    expect(evaluation.examinerSignals.taskFulfilment).toBe("low");
    expect(evaluation.band).not.toBe("weak");
  });

  it("10. Planung final band uses full-stage evidence and does not let closing dominate", () => {
    const band = getFinalBandFromTurnEvidence(
      [
        { band: "medium" },
        { band: "medium" },
        { band: "medium" },
        { band: "strong", planningComplete: true, isClosingMove: true },
      ],
      { skill: "planung" }
    );
    expect(band).toBe("medium");
  });
});
