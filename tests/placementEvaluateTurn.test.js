/**
 * Placement-only evaluate-turn unit tests (no OpenAI, no DB).
 */
import { describe, expect, it } from "vitest";
import {
  buildAllowedFollowUps,
  getSelfTopicCoverage,
  getRecommendedSelfFollowUp,
  selfQuestionTopic,
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
    expect(allowed).toContain("Was machen Sie gern in Ihrer Freizeit?");
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
      "Was arbeiten Sie jetzt?"
    );
    expect(buildAllowedFollowUps(model, conversation)).toContain(
      "Was möchten Sie in Zukunft in Österreich machen?"
    );
  });

  it("does not repeat generic family after children were mentioned", () => {
    const model = getPlacementModel("a2_self_mittel");
    const allowed = buildAllowedFollowUps(model, [{
      transcript: "Ich wohne mit meinen zwei Kindern in Graz.",
    }]);
    expect(allowed).not.toContain("Haben Sie Familie oder Kinder?");
    expect(allowed).toContain("Was machen Sie gern in Ihrer Freizeit?");
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
      .toContain("Was arbeiten Sie jetzt?");
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

describe("placementEvaluateService — Self semantic evidence matrix", () => {
  const a2 = getPlacementModel("a2_self_mittel");
  const b1 = getPlacementModel("b1_self_mittel");
  const b2 = getPlacementModel("b2_self_mittel");
  const coverage = (transcript) => getSelfTopicCoverage([{ transcript }]);
  const allowed = (model, transcript, question = "Stellen Sie sich bitte kurz vor.") =>
    buildAllowedFollowUps(model, [{ question, transcript }]);

  it("asks a useful missing topic after name only", () => {
    expect(getRecommendedSelfFollowUp(a2, [{ transcript: "Ich heiße Mina." }]))
      .toBe("Woher kommen Sie?");
  });

  it("suppresses name, origin, residence and work from coordinated clauses", () => {
    const questions = allowed(a2, "Ich heiße Ahmad, komme aus Syrien, wohne in Wien und arbeite als Fahrer.");
    expect(questions).not.toEqual(expect.arrayContaining([
      "Wie heißen Sie?", "Woher kommen Sie?", "Wo wohnen Sie?", "Was arbeiten Sie?",
    ]));
  });

  it("suppresses family, leisure and German-reason duplicates in a rich A2 answer", () => {
    const questions = allowed(a2, "Ich bin verheiratet und habe zwei Kinder. In meiner Freizeit spiele ich Fußball. Ich lerne Deutsch, weil ich hier arbeite.");
    expect(questions).not.toEqual(expect.arrayContaining([
      "Haben Sie Familie oder Kinder?", "Was machen Sie gern in Ihrer Freizeit?", "Warum lernen Sie Deutsch?",
    ]));
  });

  it("keeps work clarification available for job seeking", () => {
    expect(coverage("Ich suche Arbeit.").work).toBe("partial");
    expect(allowed(a2, "Ich suche Arbeit.")).toContain("Arbeiten Sie oder gehen Sie in einen Kurs?");
  });

  it("blocks generic occupation after sufficient basic work", () => {
    expect(coverage("Ich arbeite im Lager.").work).toBe("sufficient");
    expect(allowed(a2, "Ich arbeite im Lager.")).not.toContain("Was arbeiten Sie?");
  });

  it("recognizes work and work details independently", () => {
    expect(coverage("Ich arbeite im Lager. Ich kontrolliere Waren.")).toMatchObject({
      work: "sufficient", work_details: "sufficient",
    });
  });

  it("recognizes a concrete leisure activity", () => {
    expect(coverage("Ich spiele Fußball.").leisure).toBe("sufficient");
  });

  it("treats fragmentary weekend football as partial, not absent", () => {
    expect(coverage("Am Wochenende ... Fußball.").leisure).toBe("partial");
  });

  it("recognizes coordinated clauses without repeating ich", () => {
    expect(coverage("Ich heiße Laila, komme aus Irak, wohne Graz und arbeite Hotel.")).toMatchObject({
      name: "sufficient", origin: "sufficient", residence: "sufficient", work: "sufficient",
    });
  });

  it("keeps semantic evidence despite understandable grammar errors", () => {
    expect(coverage("Ich Name Omar, komme Somalia, wohnen Linz, arbeiten Küche.")).toMatchObject({
      name: "sufficient", origin: "sufficient", residence: "sufficient", work: "sufficient",
    });
  });

  it("prefers deeper missing B1 evidence after strong basics", () => {
    const questions = allowed(b1, "Ich heiße Sara, komme aus Iran, wohne in Wien und arbeite im Hotel. In meiner Freizeit lese ich gern.");
    expect(questions[0]).toBe("Was machen Sie dort genau?");
    expect(questions).not.toContain("Was arbeiten Sie jetzt?");
  });

  it("suppresses future and why when a future plan already has a reason", () => {
    const questions = allowed(b1, "In Zukunft möchte ich eine Ausbildung machen, weil ich beruflich weiterkommen möchte.");
    expect(questions).not.toEqual(expect.arrayContaining([
      "Was möchten Sie in Zukunft in Österreich machen?", "Warum möchten Sie das?",
    ]));
  });

  it("suppresses German-difficulty duplicate", () => {
    expect(allowed(b1, "Beim Deutschlernen ist schnelles Sprechen für mich schwierig."))
      .not.toContain("Was ist für Sie beim Deutschlernen schwierig?");
  });

  it("suppresses daily-routine duplicate", () => {
    expect(allowed(b1, "Morgens bringe ich die Kinder zur Schule, tagsüber arbeite ich und abends lerne ich Deutsch."))
      .not.toContain("Was machen Sie normalerweise an einem Tag?");
  });

  it("maps both approved daily-routine phrasings to the same intent", () => {
    expect(selfQuestionTopic("Was machen Sie normalerweise an einem Tag?"))
      .toBe("daily_routine");
    expect(selfQuestionTopic("Was machen Sie morgens und abends?"))
      .toBe("daily_routine");
  });

  it("suppresses past-Austria-experience duplicate", () => {
    expect(allowed(b1, "Am Anfang in Österreich war der Dialekt für mich schwierig."))
      .not.toContain("Was war am Anfang in Österreich schwierig für Sie?");
  });

  it("maps the simplified Austria-experience question to past experience", () => {
    expect(selfQuestionTopic("Was war am Anfang in Österreich schwierig für Sie?"))
      .toBe("past_experience");
  });

  it("finishes a B2 bank when every higher-order intent is covered", () => {
    const answer = "Ich möchte später als Ingenieur arbeiten, weil ich Technik mag. Deutsch ist für meine Zukunft wichtig. Beim Lernen ist der Dialekt schwierig, Podcasts helfen mir dabei. Am Anfang in Österreich war vieles neu. Für mich ist Zugehören wichtig, weil Kontakte helfen. Zum Beispiel hilft mein Verein. In meiner Heimat ist das ähnlich.";
    expect(getRecommendedSelfFollowUp(b2, [{ transcript: answer }])).toBeNull();
  });

  it("does not ask generic why or example after both are present", () => {
    const questions = allowed(b2, "Ich denke, Deutsch ist wichtig, weil ich mit Kunden spreche. Zum Beispiel leite ich jede Woche ein Gespräch.");
    expect(questions).not.toEqual(expect.arrayContaining([
      "Warum denken Sie so?", "Warum möchten Sie das?", "Können Sie ein Beispiel nennen?",
    ]));
  });

  it("allows one simpler professional-goal rephrasing after apparent misunderstanding", () => {
    expect(buildAllowedFollowUps(b2, [])).not.toContain(
      "Welche Arbeit möchten Sie später machen?"
    );
    const conversation = [{
      question: "Was möchten Sie beruflich in Zukunft machen?",
      transcript: "Ich wohne in Wien.",
    }];
    expect(buildAllowedFollowUps(b2, conversation)).toContain("Welche Arbeit möchten Sie später machen?");
    conversation.push({ question: "Welche Arbeit möchten Sie später machen?", transcript: "Ich wohne in Wien." });
    expect(buildAllowedFollowUps(b2, conversation)).not.toContain("Welche Arbeit möchten Sie später machen?");
  });

  it("never exceeds the two-follow-up cap", () => {
    const result = sanitizePlacementEvaluation({
      band: "medium", needsFollowUp: true, followUpQuestion: "Woher kommen Sie?",
    }, a2, 2, [{ transcript: "Ich heiße Ali." }]);
    expect(result.needsFollowUp).toBe(false);
  });

  it("recognizes reason, example, comparison and opinion separately", () => {
    expect(coverage("Ich denke, das ist gut, weil Menschen Kontakte brauchen. Zum Beispiel hilft ein Verein. In meiner Heimat ist das anders.")).toMatchObject({
      opinion: "sufficient", reason: "sufficient", example: "sufficient", comparison: "sufficient",
    });
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
        followUpQuestion: "Haben Sie Familie oder Kinder?",
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
      communicativeBand: null,
      accuracyBand: null,
      diagnosticFocus: [],
      coveredTopics: ["Name"],
      missingTopics: ["Familie", "Freizeit"],
      needsFollowUp: true,
      followUpQuestion: "Haben Sie Familie oder Kinder?",
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
        followUpQuestion: "Was machen Sie gern in Ihrer Freizeit?",
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

  it("replaces an invalid Bild question only from the selected image pack", () => {
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
      conversation,
      {
        catalogLevel: "A2", catalogId: 9, imagePath: "/images/a2/bank.jpeg",
        title: "Bank", sceneDescription: "Ein Mann spricht in einer Bank mit einer Mitarbeiterin.",
      }
    );

    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpQuestionId).toBe("A2_BANK_04");
    expect(result.followUpQuestion).toBe("Was macht der Mann vielleicht bei der Bank?");
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
        followUpQuestion: "Was machen Sie gern in Ihrer Freizeit?",
        followUpSource: "followUpRules",
        notes: ["Antwort deckt Kernangaben ab"],
      },
    });

    expect(example.productType).toBe("placement_test");
    expect(example.evaluationMethod).toBe("placement-ai-turn-v1");
    expect(example.needsFollowUp).toBe(true);
    expect(example.followUpQuestion).toBe("Was machen Sie gern in Ihrer Freizeit?");
    expect(example.band).toBe("strong");
    // Evidence fields exist but must stay internal (UI must not render them)
    expect(Array.isArray(example.coveredTopics)).toBe(true);
    expect(Array.isArray(example.missingTopics)).toBe(true);
  });
});
