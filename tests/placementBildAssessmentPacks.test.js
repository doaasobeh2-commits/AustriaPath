import { describe, expect, it } from "vitest";
import {
  getPlacementBildAssessmentPack,
  getPlacementBildReportTopic,
  listPlacementBildAssessmentPacks,
} from "../src/data/placementBildAssessmentPacks.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";
import {
  getBildEvidenceCoverage,
  getEligibleBildFollowUps,
  sanitizePlacementEvaluation,
  buildExaminerSystemPrompt,
  PLACEMENT_MAX_FOLLOWUPS,
} from "../server/src/services/placementEvaluateService.js";

const EXPECTED = [
  ["A2", 2], ["A2", 6], ["A2", 8], ["A2", 9], ["A2", 10],
  ["B1", 2], ["B1", 4], ["B1", 5], ["B1", 6], ["B1", 7],
  ["B1", 12], ["B1", 13], ["B1", 20],
  ["B2", 3], ["B2", 5], ["B2", 101],
];

const modelFor = (level) => getPlacementModel(
  level === "A2" ? "a2_bild_mittel" : level === "B1" ? "b1_bild_mittel" : "b2_bild_mittel"
);

const imageFor = (pack) => ({
  catalogLevel: pack.level,
  catalogId: pack.imageId,
  imagePath: `/images/${pack.level.toLowerCase()}/${pack.imageId}.jpeg`,
  title: pack.title,
  sceneDescription: pack.referenceAnswer,
});

const transcriptForAllEvidence = (pack, omitted = []) => pack.referenceEvidence
  .filter((item) => !omitted.includes(item.id))
  .map((item) => String(item.sufficient?.[0] || item.mention?.[0] || "").replaceAll(".*", " "))
  .join(". ");

describe("closed Placement Bild assessment packs", () => {
  it("contains exactly the 16 routing-reachable images", () => {
    const packs = listPlacementBildAssessmentPacks();
    expect(packs).toHaveLength(16);
    expect(packs.map((item) => [item.level, item.imageId])).toEqual(EXPECTED);
    expect(packs.every((item) => item.followUpBank.length >= 5)).toBe(true);
    expect(packs.every((item) =>
      item.referenceEvidence.every((unit) => Boolean(unit.reportLabel))
    )).toBe(true);
  });

  it("uses Koffergeschäft labels and rejects stale cooking topics", () => {
    const pack = getPlacementBildAssessmentPack("A2", 6);
    const result = sanitizePlacementEvaluation({
      band: "medium",
      coveredTopics: ["place", "Lebensmittel", "market_goods"],
      missingTopics: ["travel_preference", "Lebensmittel", "cooking_preference"],
      needsFollowUp: false,
    }, modelFor("A2"), 0, [], imageFor(pack));

    expect(result.coveredTopics).toEqual(["place"]);
    expect(result.missingTopics).toEqual(["travel_preference"]);
    expect(result.bildAssessmentPackKey).toBe("A2:6");
    expect(getPlacementBildReportTopic(pack, "place")).toEqual({ id: "place", label: "Ort" });
    expect(getPlacementBildReportTopic(pack, "woman_action")?.label).toBe("Handlung der Frau");
    expect(getPlacementBildReportTopic(pack, "shop_details")?.label)
      .toBe("Koffer und Taschen im Geschäft");
    expect(getPlacementBildReportTopic(pack, "seller_help")?.label)
      .toBe("Hilfe durch den Verkäufer");
    expect(getPlacementBildReportTopic(pack, "travel_preference")?.label)
      .toBe("Persönliche Reiseerfahrung");
    expect(getPlacementBildReportTopic(pack, "Lebensmittel")).toBeNull();
  });

  it("removes shared routed-model semantic metadata from a selected-image prompt", () => {
    const pack = getPlacementBildAssessmentPack("A2", 6);
    const prompt = buildExaminerSystemPrompt(
      modelFor("A2"), getEligibleBildFollowUps(pack, []), imageFor(pack), []
    );
    expect(prompt).not.toContain("Lebensmittel");
    expect(prompt).not.toContain("Kochen Sie gern?");
    expect(prompt).not.toContain("Wortschatz Essen");
    expect(prompt).toContain('"key":"A2:6"');
    expect(prompt).toContain("A2_KOFFER_01");
  });

  it("prompts with only the current closed pack and disables free-form questions", () => {
    const pack = getPlacementBildAssessmentPack("A2", 2);
    const image = imageFor(pack);
    const prompt = buildExaminerSystemPrompt(
      modelFor("A2"), getEligibleBildFollowUps(pack, []), image, []
    );
    expect(prompt).toContain("BILDFRAGEN SIND GESCHLOSSEN");
    expect(prompt).toContain("A2_BUCH_01");
    expect(prompt).not.toContain("A2_KOFFER_01");
    expect(prompt).not.toContain("BILDFRAGEN dürfen dynamisch formuliert werden");
    expect(prompt).toContain("referenceAnswer ist nur eine semantische Referenz und niemals ein Pflichttext");
  });

  it.each(EXPECTED)("isolates and validates %s:%i", (level, imageId) => {
    const pack = getPlacementBildAssessmentPack(level, imageId);
    const model = modelFor(level);
    const image = imageFor(pack);
    const firstQuestion = pack.followUpBank[0];

    // A reference-style answer suppresses the matching shallow core question.
    const referenceConversation = [{ transcript: pack.referenceAnswer }];
    expect(getEligibleBildFollowUps(pack, referenceConversation))
      .not.toContainEqual(expect.objectContaining({ id: firstQuestion.id }));

    // Missing core evidence selects only a question belonging to this image.
    const missingEligible = getEligibleBildFollowUps(pack, []);
    expect(missingEligible.length).toBeGreaterThan(0);
    expect(pack.followUpBank.map((item) => item.id)).toContain(missingEligible[0].id);

    // Mention-only evidence is retained as partial where the pack distinguishes it.
    const partialUnit = pack.referenceEvidence.find(
      (item) => item.mention?.some((value) => !(item.sufficient || []).includes(value))
    );
    if (partialUnit) {
      const mention = partialUnit.mention.find((value) => !(partialUnit.sufficient || []).includes(value));
      expect(getBildEvidenceCoverage(pack, [{ transcript: mention.replaceAll(".*", " ") }])[partialUnit.id])
        .toBe("partial");
    }

    // Sufficient evidence suppresses its intent.
    expect(getBildEvidenceCoverage(pack, referenceConversation)[firstQuestion.intent])
      .toBe("sufficient");

    // Wrong-image IDs and invented text are rejected and deterministically replaced
    // by the best eligible question from this pack only.
    const fallback = sanitizePlacementEvaluation({
      band: "medium",
      needsFollowUp: true,
      followUpQuestionId: "WRONG_IMAGE_99",
      followUpQuestion: "Welche Farbe hat das Flugzeug?",
    }, model, 0, [], image);
    expect(pack.followUpBank).toContainEqual(expect.objectContaining({
      id: fallback.followUpQuestionId,
      question: fallback.followUpQuestion,
    }));

    // A valid ID paired with text from another image also falls back locally.
    const mismatchedPair = sanitizePlacementEvaluation({
      band: "medium",
      needsFollowUp: true,
      followUpQuestionId: missingEligible[0].id,
      followUpQuestion: "Kochen Sie gern?",
    }, model, 0, [], image);
    expect(mismatchedPair.followUpQuestionId).toBe(missingEligible[0].id);
    expect(mismatchedPair.followUpQuestion).toBe(missingEligible[0].question);

    // Maximum remains two.
    const capped = sanitizePlacementEvaluation({
      band: "medium", needsFollowUp: true,
      followUpQuestionId: missingEligible[0].id,
      followUpQuestion: missingEligible[0].question,
    }, model, PLACEMENT_MAX_FOLLOWUPS, [], image);
    expect(capped.needsFollowUp).toBe(false);

    // With every evidence unit sufficient there is no question to borrow or invent.
    const completeConversation = [{ transcript: transcriptForAllEvidence(pack) }];
    expect(getEligibleBildFollowUps(pack, completeConversation)).toEqual([]);
    const complete = sanitizePlacementEvaluation({
      band: "strong", needsFollowUp: true,
      followUpQuestionId: "INVENTED", followUpQuestion: "Noch eine Frage?",
    }, model, 0, completeConversation, image);
    expect(complete).toMatchObject({
      needsFollowUp: false, followUpQuestionId: null, followUpQuestion: null,
    });
  });
});

describe("image-specific suppression and B2 dimensions", () => {
  it("Buchhandlung suppresses the woman's action", () => {
    const pack = getPlacementBildAssessmentPack("A2", 2);
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Die Frau schaut ein Buch an." }]))
      .not.toContainEqual(expect.objectContaining({ id: "A2_BUCH_02" }));
  });

  it("Salat suppresses preparation and vegetables", () => {
    const pack = getPlacementBildAssessmentPack("A2", 10);
    const eligible = getEligibleBildFollowUps(pack, [{
      transcript: "Die Frau macht Salat und schneidet Tomaten, Gurken und Paprika.",
    }]);
    expect(eligible.map((item) => item.id)).not.toEqual(expect.arrayContaining([
      "A2_SALAT_02", "A2_SALAT_03",
    ]));
  });

  it("Markt suppresses preference and reason after a justified comparison", () => {
    const pack = getPlacementBildAssessmentPack("B1", 6);
    const eligible = getEligibleBildFollowUps(pack, [{
      transcript: "Ich kaufe lieber auf dem Markt als im Supermarkt, weil das Gemüse frischer ist.",
    }]);
    expect(eligible.map((item) => item.id)).not.toEqual(expect.arrayContaining([
      "B1_MARKT_03", "B1_MARKT_04",
    ]));
  });

  it("Paketlieferung suppresses delivery scene and problem", () => {
    const pack = getPlacementBildAssessmentPack("B1", 2);
    const eligible = getEligibleBildFollowUps(pack, [{
      transcript: "Ein Paketbote liefert der Frau ein Paket. Manchmal kommt eine Lieferung zu spät.",
    }]);
    expect(eligible.map((item) => item.id)).not.toEqual(expect.arrayContaining([
      "B1_PAKET_01", "B1_PAKET_05",
    ]));
  });

  it("Hausarbeit moves past actions and sharing opinion", () => {
    const pack = getPlacementBildAssessmentPack("B1", 13);
    const eligible = getEligibleBildFollowUps(pack, [{
      transcript: "Eine Person saugt und die andere putzt. Ich finde, alle in der Familie sollen helfen.",
    }]);
    expect(eligible.map((item) => item.id)).not.toEqual(expect.arrayContaining([
      "B1_HAUS_01", "B1_HAUS_04",
    ]));
    expect(eligible.map((item) => item.id)).toContain("B1_HAUS_03");
  });

  it("AI keeps advantage and risk independent, and reason follows opinion", () => {
    const pack = getPlacementBildAssessmentPack("B2", 3);
    expect(getEligibleBildFollowUps(pack, [{ transcript: "KI hilft Menschen und arbeitet schnell." }])
      .map((item) => item.id)).toContain("B2_AI_03");
    expect(getEligibleBildFollowUps(pack, [{ transcript: "KI hat Risiken für den Datenschutz." }])
      .map((item) => item.id)).toContain("B2_AI_02");
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Meiner Meinung nach sollte man KI vorsichtig nutzen." }])
      .map((item) => item.id)).toContain("B2_AI_06");
  });

  it("Umwelt keeps cause and consequence separate and suppresses covered solution", () => {
    const pack = getPlacementBildAssessmentPack("B2", 5);
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Wir verbrauchen viele Ressourcen und produzieren viel Müll." }])
      .map((item) => item.id)).toContain("B2_UMWELT_03");
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Die Folgen sind Schäden für Klima und Gesundheit." }])
      .map((item) => item.id)).toContain("B2_UMWELT_02");
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Jeder kann weniger Plastik benutzen und Energie sparen." }])
      .map((item) => item.id)).not.toContain("B2_UMWELT_04");
  });

  it("Internet graphic suppresses trend questions but keeps cause and suppresses support", () => {
    const pack = getPlacementBildAssessmentPack("B2", 101);
    const trend = getEligibleBildFollowUps(pack, [{
      transcript: "Die Grafik zeigt Internetnutzung nach Alter. Junge Menschen nutzen es am meisten, ältere weniger.",
    }]).map((item) => item.id);
    expect(trend).not.toEqual(expect.arrayContaining(["B2_NET_01", "B2_NET_02"]));
    expect(trend).toContain("B2_NET_03");
    expect(getEligibleBildFollowUps(pack, [{ transcript: "Kurse und einfache Angebote unterstützen ältere Menschen." }])
      .map((item) => item.id)).not.toContain("B2_NET_06");
  });

  it("rejects a duplicate already-asked question and duplicate intent", () => {
    const pack = getPlacementBildAssessmentPack("A2", 2);
    const conversation = [{ question: "Wo ist die Frau?", transcript: "Frau." }];
    expect(getEligibleBildFollowUps(pack, conversation).map((item) => item.id))
      .not.toContain("A2_BUCH_01");
  });

  it("honors provider semantic coverage IDs for paraphrases while staying in-pack", () => {
    const pack = getPlacementBildAssessmentPack("B2", 3);
    const result = sanitizePlacementEvaluation({
      band: "strong",
      coveredTopics: ["interpretation"],
      needsFollowUp: true,
      followUpQuestionId: "B2_AI_01",
      followUpQuestion: "Was ist die wichtigste Aussage des Bildes?",
    }, modelFor("B2"), 0, [{ transcript: "Digitale Systeme prägen unser Leben immer stärker." }], imageFor(pack));
    expect(result.followUpQuestionId).not.toBe("B2_AI_01");
    expect(pack.followUpBank.map((item) => item.id)).toContain(result.followUpQuestionId);
  });
});

describe("Bild follow-up limit, semantic references, and rich answers", () => {
  it("returns zero follow-ups when no eligible question remains", () => {
    const pack = getPlacementBildAssessmentPack("A2", 2);
    const conversation = [{ transcript: transcriptForAllEvidence(pack) }];
    const result = sanitizePlacementEvaluation({
      band: "strong", needsFollowUp: true,
      followUpQuestionId: "INVENTED", followUpQuestion: "Noch etwas?",
    }, modelFor("A2"), 0, conversation, imageFor(pack));
    expect(getEligibleBildFollowUps(pack, conversation)).toEqual([]);
    expect(result).toMatchObject({
      needsFollowUp: false, followUpQuestionId: null, followUpQuestion: null,
    });
  });

  it("offers exactly one follow-up when only one useful intent remains", () => {
    const pack = getPlacementBildAssessmentPack("A2", 6);
    const conversation = [{
      transcript: transcriptForAllEvidence(pack, ["travel_preference"]),
    }];
    expect(getEligibleBildFollowUps(pack, conversation)).toEqual([expect.objectContaining({
      id: "A2_KOFFER_05", question: "Reisen Sie gern?",
    })]);
  });

  it("allows no third follow-up even with many missing units and hostile fallback output", () => {
    const pack = getPlacementBildAssessmentPack("B2", 5);
    expect(getEligibleBildFollowUps(pack, [])).toHaveLength(7);
    const result = sanitizePlacementEvaluation({
      band: "weak",
      needsFollowUp: true,
      followUpQuestionId: "WRONG_IMAGE_ID",
      followUpQuestion: "Welche Vorteile hat künstliche Intelligenz?",
      followUpCandidates: [{ id: "INVENTED", question: "Erfinden Sie eine dritte Frage?" }],
    }, modelFor("B2"), 2, [], imageFor(pack));
    expect(result).toMatchObject({
      needsFollowUp: false, followUpQuestionId: null, followUpQuestion: null,
    });
  });

  it("keeps the maximum at two after two different in-pack questions", () => {
    const pack = getPlacementBildAssessmentPack("B1", 7);
    const conversation = [
      { question: "Was macht die Frau?", transcript: "Eine Frau ist im Supermarkt." },
      { question: "Was sehen Sie im Supermarkt?", transcript: "Regale und Lebensmittel." },
    ];
    expect(getEligibleBildFollowUps(pack, conversation).length).toBeGreaterThan(0);
    const result = sanitizePlacementEvaluation({
      band: "medium", needsFollowUp: true,
      followUpQuestionId: "B1_SUPER_03",
      followUpQuestion: "Warum kaufen viele Menschen im Supermarkt ein?",
    }, modelFor("B1"), 2, conversation, imageFor(pack));
    expect(result.needsFollowUp).toBe(false);
  });

  it("accepts a substantially different A2 paraphrase and suppresses all covered intents", () => {
    const pack = getPlacementBildAssessmentPack("A2", 2);
    const conversation = [{
      transcript: "In einem Buchladen blättert eine Kundin in einem Roman. Hinter ihr stehen Regale. An der Kasse arbeitet ein Verkäufer.",
    }];
    const coverage = getBildEvidenceCoverage(pack, conversation);
    expect(coverage).toMatchObject({
      place: "sufficient", woman: "sufficient", woman_action: "sufficient", shop_details: "sufficient",
    });
    expect(getEligibleBildFollowUps(pack, conversation).map((item) => item.id))
      .not.toEqual(expect.arrayContaining(["A2_BUCH_01", "A2_BUCH_02", "A2_BUCH_03"]));
  });

  it("suppresses four B1 Markt intents from one rich answer and moves to comparison", () => {
    const pack = getPlacementBildAssessmentPack("B1", 6);
    const conversation = [{
      transcript: "Die Frau kauft Obst und Gemüse auf dem Markt. Ich kaufe lieber auf dem Markt, weil die Produkte frisch sind.",
    }];
    expect(getBildEvidenceCoverage(pack, conversation)).toMatchObject({
      woman_action: "sufficient", market_goods: "sufficient",
      market_preference: "sufficient", justification: "sufficient",
    });
    expect(getEligibleBildFollowUps(pack, conversation)).toEqual([expect.objectContaining({
      id: "B1_MARKT_05", question: "Wie ist das in Ihrem Heimatland?",
    })]);
  });

  it("suppresses multiple B2 AI dimensions while keeping independent risk and consequence", () => {
    const pack = getPlacementBildAssessmentPack("B2", 3);
    const conversation = [{
      transcript: "Das Bild zeigt einen Mann am Computer und dass KI im Alltag wichtiger wird. KI hilft, Informationen schnell zu bearbeiten. Meiner Meinung nach braucht man klare Regeln und menschliche Kontrolle, weil die Technik verantwortungsvoll genutzt werden muss.",
    }];
    const coverage = getBildEvidenceCoverage(pack, conversation);
    expect(coverage).toMatchObject({
      description: "sufficient", interpretation: "sufficient", advantage: "sufficient",
      opinion: "sufficient", justification: "sufficient", solution: "sufficient",
      risk: "not_covered", consequence: "not_covered",
    });
    const eligible = getEligibleBildFollowUps(pack, conversation).map((item) => item.id);
    expect(eligible).not.toEqual(expect.arrayContaining([
      "B2_AI_01", "B2_AI_02", "B2_AI_05", "B2_AI_06",
    ]));
    expect(eligible).toEqual(expect.arrayContaining(["B2_AI_03", "B2_AI_04"]));
  });

  it("keeps B2 Umwelt cause, consequence, solution, and problem evidence independent", () => {
    const pack = getPlacementBildAssessmentPack("B2", 5);
    const conversation = [{
      transcript: "Wir haben Umweltprobleme, weil wir viele Ressourcen verbrauchen. Ich trenne Müll und benutze weniger Plastik.",
    }];
    const coverage = getBildEvidenceCoverage(pack, conversation);
    expect(coverage).toMatchObject({
      cause: "sufficient", personal_solution: "sufficient", own_action: "sufficient",
      consequence: "not_covered",
    });
    const eligible = getEligibleBildFollowUps(pack, conversation).map((item) => item.id);
    expect(eligible).not.toEqual(expect.arrayContaining([
      "B2_UMWELT_02", "B2_UMWELT_04", "B2_UMWELT_06",
    ]));
    expect(eligible).toContain("B2_UMWELT_03");
  });
});
