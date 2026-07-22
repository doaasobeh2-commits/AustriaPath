/**
 * Placement-only evaluate-turn unit tests (no OpenAI, no DB).
 */
import { describe, expect, it } from "vitest";
import {
  buildAllowedFollowUps,
  getSelfTopicCoverage,
  getPlanningIntentCoverage,
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

  it("does not repeat generic occupation after occupation was answered", () => {
    const model = getPlacementModel("b1_self_mittel");
    const conversation = [{ transcript: "Seit drei Jahren arbeite ich in einem großen Lager." }];
    expect(getSelfTopicCoverage(conversation).work).toBe("sufficient");
    expect(buildAllowedFollowUps(model, conversation)).not.toContain(
      "Was machen Sie beruflich?"
    );
    expect(buildAllowedFollowUps(model, conversation)).toContain(
      "Welche Pläne haben Sie für die Zukunft?"
    );
  });

  it("does not repeat generic family after children were mentioned", () => {
    const model = getPlacementModel("a2_self_mittel");
    const allowed = buildAllowedFollowUps(model, [{
      transcript: "Ich wohne mit meinen zwei Kindern in Graz.",
    }]);
    expect(allowed).not.toContain("Erzählen Sie etwas über Ihre Familie.");
    expect(allowed).toContain("Was sind Ihre Hobbys?");
  });

  it("permits a deeper adjacent question when its intent is not already answered", () => {
    const model = getPlacementModel("b1_self_mittel");
    const allowed = buildAllowedFollowUps(model, [{
      transcript: "Ich arbeite im Lager und möchte später Teamleiter werden.",
    }]);
    expect(allowed).not.toContain("Was machen Sie beruflich?");
    expect(allowed).toContain("Warum lernen Sie Deutsch?");
  });

  it("recognizes coordinated clauses without repeated subjects", () => {
    const coverage = getSelfTopicCoverage([{
      transcript: "Ich heiße Ahmad, komme aus Syrien, wohne in Wien und arbeite als Fahrer.",
    }]);
    expect(coverage).toMatchObject({
      name: "sufficient", origin: "sufficient",
      residence: "sufficient", work: "sufficient",
    });
  });

  it.each([
    ["Von Beruf bin ich Lagerarbeiter.", "work"],
    ["Zurzeit bin ich bei einem Logistikunternehmen beschäftigt.", "work"],
    ["Nach der Arbeit spiele ich oft Schach.", "leisure"],
    ["Am Wochenende gehe ich gern wandern.", "leisure"],
    ["Ich bin verheiratet und habe zwei Kinder.", "family"],
    ["In Zukunft möchte ich eine Ausbildung machen.", "future"],
  ])("recognizes natural variant %s", (transcript, topic) => {
    expect(getSelfTopicCoverage([{ transcript }])[topic]).toBe("sufficient");
  });

  it("preserves meaning in grammatically imperfect information", () => {
    expect(getSelfTopicCoverage([{
      transcript: "Ich Name Ahmad. Ich komme Syrien. Ich wohnen Wien. Ich arbeiten Lager.",
    }])).toMatchObject({
      name: "sufficient", origin: "sufficient",
      residence: "sufficient", work: "sufficient",
    });
  });

  it.each([
    ["Ich arbeite manchmal.", "work"],
    ["Meine Familie ist hier.", "family"],
    ["Am Wochenende... Fußball.", "leisure"],
    ["Ich suche Arbeit.", "work"],
  ])("classifies ambiguous context as partial: %s", (transcript, topic) => {
    expect(getSelfTopicCoverage([{ transcript }])[topic]).toBe("partial");
  });

  it("keeps clarification eligible for partial occupation", () => {
    const model = getPlacementModel("b1_self_mittel");
    expect(buildAllowedFollowUps(model, [{ transcript: "Ich arbeite manchmal." }]))
      .toContain("Was machen Sie beruflich?");
  });

  it("suppresses covered Planning date and alternative intents", () => {
    const planning = getPlacementModel("b1_planung_mittel");
    const dateConversation = [{
      transcript: "Samstag wäre besser, weil ich am Freitag arbeiten muss.",
    }];
    expect(getPlanningIntentCoverage(dateConversation)).toMatchObject({
      date: "sufficient", reason: "sufficient",
    });
    expect(buildAllowedFollowUps(planning, dateConversation))
      .not.toContain("Wann passt es am besten?");

    const alternative = getPlanningIntentCoverage([{
      transcript: "Das Restaurant ist zu teuer. Wir können lieber im Park feiern.",
    }]);
    expect(alternative).toMatchObject({
      rejection: "sufficient", reason: "sufficient", alternative: "sufficient",
    });
  });

  it("blocks shallow Bild questions after advanced graphic evidence", () => {
    const conversation = [{
      transcript: "Die Grafik zeigt eine Entwicklung. Der technische Wandel ist die Ursache; deshalb entstehen Folgen. Im Vergleich zu früher ist die Arbeit flexibler.",
    }];
    expect(isRedundantImageFollowUp("Was machen die Personen?", conversation)).toBe(true);
    expect(isRedundantImageFollowUp("Wo sind die Personen?", conversation)).toBe(true);
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
