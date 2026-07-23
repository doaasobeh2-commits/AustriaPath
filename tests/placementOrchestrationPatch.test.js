/**
 * Placement orchestration patch regressions:
 * Bild semantic coverage, listening calibration, Planung closings, report consistency.
 */
import { describe, expect, it } from "vitest";
import {
  getBildEvidenceCoverage,
  getEligibleBildFollowUps,
  sanitizePlacementEvaluation,
} from "../server/src/services/placementEvaluateService.js";
import { getPlacementBildAssessmentPack } from "../src/data/placementBildAssessmentPacks.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";
import {
  selectCoveredAwareClosingMove,
  selectNextPlanningMove,
  getPlacementPlanningPack,
} from "../src/data/placementPlanningPacks.js";
import {
  selectPlacementListeningModel,
} from "../src/data/utils/placementListeningPool.js";
import {
  mapPlacementPracticeFocus,
  buildRelativeStrengthItems,
} from "../src/data/utils/placementReportFocus.js";
import {
  buildDeterministicLearnerReport,
} from "../src/data/utils/placementReport.js";

// Recommendations consistency is exercised via buildDeterministicLearnerReport.

describe("Bild salad semantic coverage", () => {
  const pack = getPlacementBildAssessmentPack("A2", 10);
  const saladTranscript =
    "Auf dem Bild sehe ich eine Frau und einen Mann. Sie kochen zusammen. Sie mischt alle Gemüse. Weil sie Salat macht. Er schneidet Gurke.";

  it("marks salad_action sufficient with imperfect A2 word order", () => {
    const coverage = getBildEvidenceCoverage(pack, [{ transcript: saladTranscript }]);
    expect(coverage.salad_action).toBe("sufficient");
  });

  it("does not ask Was macht die Frau when salad is covered and other intents remain", () => {
    const eligible = getEligibleBildFollowUps(
      pack,
      [{ transcript: saladTranscript }],
      [],
      { productiveBand: "medium" }
    );
    expect(eligible.map((q) => q.id)).not.toContain("A2_SALAT_02");
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible[0].id).not.toBe("A2_SALAT_02");
  });

  it("prefers uncovered intents over clarifying PARTIAL when band is medium", () => {
    // Partial place mention without sufficient kitchen word; salad fully covered
    const conversation = [{
      transcript: "Sie mischt alle Gemüse und macht Salat. Der Mann schneidet Gurke.",
    }];
    const coverage = getBildEvidenceCoverage(pack, conversation);
    expect(coverage.salad_action).toBe("sufficient");
    const eligible = getEligibleBildFollowUps(pack, conversation, [], {
      productiveBand: "medium",
    });
    expect(eligible.map((q) => q.intent)).not.toContain("salad_action");
    // Uncovered intents like place/cooking_preference should rank first
    if (eligible.length) {
      const firstCoverage = getBildEvidenceCoverage(pack, conversation)[eligible[0].intent];
      expect(firstCoverage).toBe("not_covered");
    }
  });

  it("sanitizer keeps closed bank and skips salad action follow-up", () => {
    const model = getPlacementModel("a2_bild_mittel");
    const result = sanitizePlacementEvaluation(
      {
        band: "medium",
        communicativeBand: "medium",
        accuracyBand: "medium",
        coveredTopics: ["salad_action"],
        missingTopics: ["place"],
        needsFollowUp: true,
        followUpQuestionId: "A2_SALAT_02",
        followUpQuestion: "Was macht die Frau?",
      },
      model,
      0,
      [{ transcript: saladTranscript }],
      {
        catalogLevel: "A2",
        catalogId: 10,
        imagePath: "/img/a2-10.jpg",
        title: "Küche",
        sceneDescription: "Küche mit Salat",
      }
    );
    expect(result.followUpQuestion).not.toBe("Was macht die Frau?");
    if (result.needsFollowUp) {
      expect(result.followUpQuestionId).not.toBe("A2_SALAT_02");
    }
  });
});

describe("Hören practice focus + A2 calibration", () => {
  it("maps Wann to Zeitangaben", () => {
    expect(
      mapPlacementPracticeFocus("lesenHoeren", "Wann kann Frau Gerber den Befund abholen?")
    ).toBe("Zeitangaben gezielt verstehen");
  });

  it("does not map Warum+Frau to Personenangaben", () => {
    expect(
      mapPlacementPracticeFocus("lesenHoeren", "Warum ruft Frau Schuster an?")
    ).toBe("Gründe im Hörtext erkennen");
  });

  it("keeps hard-A2 Befund off A2-mittel random draws", () => {
    expect(getPlacementModel("placement_listening_02").difficulty).toBe("stark");
    for (const random of [0, 0.33, 0.66, 0.99]) {
      expect(
        selectPlacementListeningModel(
          { level: "A2", difficulty: "mittel" },
          { random: () => random }
        ).id
      ).not.toBe("placement_listening_02");
    }
  });
});

describe("Planung covered-aware closing", () => {
  const EINZUG_CLOSING_AUDIO_TEXT = Object.freeze({
    combined: {
      id: "move-close",
      filename: "a2_einzug_06_abschluss.mp3",
      text: "Also, wann kommen wir und wer macht was?",
    },
    time_only: {
      id: "move-close-time",
      filename: "a2_einzug_01_termin.mp3",
      text: "Wann können wir unserem Freund beim Einzug helfen?",
    },
    tasks_only: {
      id: "move-close-tasks",
      filename: "a2_einzug_03_aufgaben.mp3",
      text: "Welche Aufgaben können Sie übernehmen?",
    },
    summary: {
      id: "move-close-summary",
      filename: "a2_picknick_06_abschluss.mp3",
      text: "Gut, was ist jetzt unser gemeinsamer Plan?",
    },
  });

  const baseTurns = [
    { moveId: "move-time", transcript: "Am Samstag." },
    { moveId: "move-meet", transcript: "Bei mir zu Hause." },
    { moveId: "move-tasks", transcript: "Ich trage Kartons und du packst." },
    { moveId: "move-transport", transcript: "Mit dem Auto." },
    { moveId: "move-food", transcript: "Ja, Pizza ist gut." },
  ];

  it("pairs each Einzug closing variant text exactly to its reused MP3 transcript", () => {
    const pack = getPlacementPlanningPack("a2_planung_umzugshilfe");
    for (const [profile, expected] of Object.entries(EINZUG_CLOSING_AUDIO_TEXT)) {
      const move = pack.moves.find((item) => item.id === expected.id);
      expect(move).toMatchObject({
        closing: true,
        closingProfile: profile,
        filename: expected.filename,
        text: expected.text,
        audioUrl: `/audio/placement/planning/${expected.filename}`,
      });
      expect(move.targets).toContain("final_agreement");
    }
  });

  it("uses summary close when date_time and tasks are covered", () => {
    const closing = selectCoveredAwareClosingMove("a2_planung_umzugshilfe", baseTurns);
    expect(closing).toMatchObject(EINZUG_CLOSING_AUDIO_TEXT.summary);
    expect(selectNextPlanningMove("a2_planung_umzugshilfe", baseTurns).id).toBe(
      "move-close-summary"
    );
  });

  it("asks only tasks when date_time is covered", () => {
    const closing = selectCoveredAwareClosingMove("a2_planung_umzugshilfe", [
      { moveId: "move-time", transcript: "Am Samstag um zehn Uhr." },
      { moveId: "move-meet", transcript: "Am Bahnhof." },
      { moveId: "move-transport", transcript: "Mit dem Auto." },
      { moveId: "move-food", transcript: "Pizza und Wasser." },
    ]);
    expect(closing).toMatchObject(EINZUG_CLOSING_AUDIO_TEXT.tasks_only);
  });

  it("asks only time when tasks are covered but date_time is not", () => {
    const closing = selectCoveredAwareClosingMove("a2_planung_umzugshilfe", [
      { moveId: "move-time", transcript: "Vielleicht später." },
      { moveId: "move-meet", transcript: "Am Bahnhof." },
      { moveId: "move-tasks", transcript: "Ich übernehme die Kartons und du packst." },
      { moveId: "move-transport", transcript: "Mit dem Auto." },
      { moveId: "move-food", transcript: "Pizza." },
    ]);
    expect(closing).toMatchObject(EINZUG_CLOSING_AUDIO_TEXT.time_only);
  });

  it("keeps combined close when neither date_time nor tasks are covered", () => {
    const closing = selectCoveredAwareClosingMove("a2_planung_umzugshilfe", [
      { moveId: "move-time", transcript: "Vielleicht." },
      { moveId: "move-meet", transcript: "Irgendwo." },
      { moveId: "move-tasks", transcript: "Mal sehen." },
      { moveId: "move-transport", transcript: "Irgendwie." },
      { moveId: "move-food", transcript: "Ok." },
    ]);
    expect(closing).toMatchObject(EINZUG_CLOSING_AUDIO_TEXT.combined);
  });
});

describe("Report: weak area not listed as Stärken beibehalten", () => {
  it("keeps relative strength text but omits weak area from maintained-strength rec", () => {
    const relative = buildRelativeStrengthItems(
      {
        selbstvorstellung: "medium",
        bildbeschreibung: "weak",
        lesenHoeren: "weak",
        planung: "weak",
      },
      {
        selbstvorstellung: {
          coveredTopicIds: ["name", "origin", "work"],
          transcripts: [{ transcript: "Ich heiße Fadi und komme aus Syrien." }],
        },
        bildbeschreibung: {
          coveredTopicIds: ["place", "salad_action"],
          transcripts: [{ transcript: "Sie macht Salat." }],
        },
      }
    );
    expect(relative.some((item) => item.skill === "bildbeschreibung")).toBe(true);

    const report = buildDeterministicLearnerReport({
      level: "A2+",
      skillBands: {
        selbstvorstellung: "medium",
        bildbeschreibung: "weak",
        lesenHoeren: "weak",
        planung: "weak",
      },
      strengths: [],
      weaknesses: ["bildbeschreibung", "lesenHoeren", "planung"],
      evidenceSummary: {
        selbstvorstellung: {
          coveredTopicIds: ["name", "origin", "work"],
          practiceFocuses: [],
          transcripts: [{ transcript: "Ich heiße Fadi." }],
        },
        bildbeschreibung: {
          coveredTopicIds: ["place", "salad_action"],
          practiceFocuses: ["Gegenstände und Situationen genauer beschreiben"],
          transcripts: [{ transcript: "Sie macht Salat." }],
        },
        lesenHoeren: { practiceFocuses: ["Zeitangaben gezielt verstehen"] },
        planung: { practiceFocuses: ["Ort und Zeit konkret vereinbaren"] },
      },
    });

    expect(report.strengths.some((s) => s.skill === "bildbeschreibung")).toBe(true);
    const recText = report.recommendations.join(" ");
    expect(recText).toMatch(/Stärken beibehalten:.*Selbstvorstellung/);
    expect(recText).not.toMatch(/Stärken beibehalten:[^.]*(Bildbeschreibung)/);
  });
});
