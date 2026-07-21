/**
 * Placement-only evaluate-turn unit tests (no OpenAI, no DB).
 */
import { describe, expect, it } from "vitest";
import {
  buildAllowedFollowUps,
  matchAllowedFollowUp,
  sanitizePlacementEvaluation,
  evaluatePlacementTurnOffline,
  isRedundantImageFollowUp,
  PLACEMENT_MAX_FOLLOWUPS,
  PLACEMENT_EVAL_METHOD,
} from "../server/src/services/placementEvaluateService.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";

describe("placementEvaluateService — allowed follow-ups", () => {
  it("builds closed set from examinerQuestions only", () => {
    const model = getPlacementModel("a2_self_mittel");
    const allowed = buildAllowedFollowUps(model);

    expect(allowed.length).toBeGreaterThan(0);
    expect(allowed).toContain("Wie heißen Sie?");
    expect(allowed).toContain("Was sind Ihre Hobbys?");
    // followUpRules consequents must not become free-form questions
    expect(allowed.some((q) => /nach Kindern fragen/i.test(q))).toBe(false);
  });

  it("matches exact allowed follow-up", () => {
    const allowed = ["Was machen Sie am Wochenende?", "Was sind Ihre Hobbys?"];
    expect(matchAllowedFollowUp("Was machen Sie am Wochenende?", allowed)).toBe(
      "Was machen Sie am Wochenende?"
    );
  });

  it("rejects invented follow-up", () => {
    const allowed = ["Was machen Sie am Wochenende?"];
    expect(matchAllowedFollowUp("Erfinden Sie bitte eine neue Frage!", allowed)).toBe(
      null
    );
  });
});

describe("placementEvaluateService — sanitize", () => {
  const model = getPlacementModel("a2_self_mittel");

  it("returns structured evaluation and accepts allowed follow-up", () => {
    const result = sanitizePlacementEvaluation(
      {
        band: "weak",
        coveredTopics: ["Name"],
        missingTopics: ["Familie", "Freizeit"],
        needsFollowUp: true,
        followUpQuestion: "Erzählen Sie etwas über Ihre Familie.",
        followUpSource: "missingTopic",
        notes: ["kurze Antwort"],
      },
      model,
      0
    );

    expect(result).toEqual({
      productType: "placement_test",
      modelId: "a2_self_mittel",
      skill: "selbstvorstellung",
      modelLevel: "A2",
      band: "weak",
      coveredTopics: ["Name"],
      missingTopics: ["Familie", "Freizeit"],
      needsFollowUp: true,
      followUpQuestion: "Erzählen Sie etwas über Ihre Familie.",
      followUpSource: "missingTopic",
      notes: ["kurze Antwort"],
      evaluationMethod: PLACEMENT_EVAL_METHOD,
    });
  });

  it("fails closed on invented follow-up — needsFollowUp false", () => {
    const result = sanitizePlacementEvaluation(
      {
        band: "medium",
        coveredTopics: [],
        missingTopics: ["Hobby"],
        needsFollowUp: true,
        followUpQuestion: "Können Sie bitte mehr über Ihren Tagesablauf erzählen?",
        notes: [],
      },
      model,
      0
    );

    expect(result.needsFollowUp).toBe(false);
    expect(result.followUpQuestion).toBeNull();
    expect(result.followUpSource).toBeNull();
  });

  it("blocks follow-up after max turns", () => {
    const result = sanitizePlacementEvaluation(
      {
        band: "medium",
        needsFollowUp: true,
        followUpQuestion: "Was sind Ihre Hobbys?",
      },
      model,
      PLACEMENT_MAX_FOLLOWUPS
    );

    expect(result.needsFollowUp).toBe(false);
    expect(result.followUpQuestion).toBeNull();
  });

  it("fails closed on an invalid band", () => {
    expect(() =>
      sanitizePlacementEvaluation(
        { band: "legendary", needsFollowUp: false },
        model,
        0
      )
    ).toThrow(/gültige Bewertung/i);
  });

  it("does not repeat a question already present in conversation", () => {
    const conversation = [
      {
        question: "Was sind Ihre Hobbys?",
        transcript: "Ich spiele gern Fußball.",
        inputMode: "voice_transcript",
      },
    ];
    const allowed = buildAllowedFollowUps(model, conversation);
    expect(allowed).not.toContain("Was sind Ihre Hobbys?");
  });

  it("rejects redundant Bild location and action questions already answered semantically", () => {
    const bildModel = getPlacementModel("a2_bild_mittel");
    const conversation = [
      {
        question: "Beschreiben Sie bitte das Bild.",
        transcript:
          "Die Personen sind in einer Bank und eröffnen wahrscheinlich ein Konto.",
        inputMode: "voice_transcript",
      },
    ];

    expect(isRedundantImageFollowUp("Wo sind die Personen?", conversation)).toBe(
      true
    );
    expect(isRedundantImageFollowUp("Was machen sie?", conversation)).toBe(true);

    const result = sanitizePlacementEvaluation(
      {
        band: "medium",
        needsFollowUp: true,
        followUpQuestion: "Wo befinden sich die Personen?",
        followUpCandidates: [
          "Was machen die Personen?",
          "Warum ist ein Bankkonto im Alltag wichtig?",
        ],
        followUpSource: "missingTopic",
      },
      bildModel,
      0,
      conversation
    );

    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpQuestion).toBe(
      "Warum ist ein Bankkonto im Alltag wichtig?"
    );
  });

  it("asks no Bild follow-up when every proposed candidate is redundant", () => {
    const bildModel = getPlacementModel("a2_bild_mittel");
    const conversation = [
      {
        question: "Beschreiben Sie bitte das Bild.",
        transcript: "They are in a bank and are probably opening an account.",
        inputMode: "voice_transcript",
      },
    ];
    const result = sanitizePlacementEvaluation(
      {
        band: "medium",
        needsFollowUp: true,
        followUpQuestion: "Where are the people?",
        followUpCandidates: ["What are the people doing?"],
      },
      bildModel,
      0,
      conversation
    );

    expect(result.needsFollowUp).toBe(false);
    expect(result.followUpQuestion).toBeNull();
  });
});

describe("placementEvaluateService — offline helper", () => {
  it("produces example structured response for mocked AI raw", () => {
    const example = evaluatePlacementTurnOffline({
      modelId: "a2_self_mittel",
      followUpCount: 0,
      raw: {
        band: "strong",
        coveredTopics: ["Name", "Herkunftsland", "Wohnort", "Arbeit oder Kurs"],
        missingTopics: ["Freizeit"],
        needsFollowUp: true,
        followUpQuestion: "Was machen Sie am Wochenende?",
        followUpSource: "followUpRules",
        notes: ["Antwort deckt Kernangaben ab"],
      },
    });

    expect(example.productType).toBe("placement_test");
    expect(example.evaluationMethod).toBe("placement-ai-turn-v1");
    expect(example.needsFollowUp).toBe(true);
    expect(example.followUpQuestion).toBe("Was machen Sie am Wochenende?");
    expect(example.band).toBe("strong");
    // Evidence fields exist but must stay internal (UI must not render them)
    expect(Array.isArray(example.coveredTopics)).toBe(true);
    expect(Array.isArray(example.missingTopics)).toBe(true);
  });
});
