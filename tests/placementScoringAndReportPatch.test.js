/**
 * Placement scoring-plane + report-quality patch regressions.
 */
import { describe, expect, it } from "vitest";
import {
  getFinalBandFromTurnEvidence,
  scorePlacementListeningAnswers,
} from "../src/data/placementLogic.js";
import {
  resolvePlacementProductiveBand,
} from "../src/data/utils/placementBandResolution.js";
import {
  mapPlacementPracticeFocus,
} from "../src/data/utils/placementReportFocus.js";
import {
  assemblePlacementLearnerProfile,
  applyPolishedLearnerReport,
  buildDeterministicLearnerReport,
  buildEvidenceSummary,
} from "../src/data/utils/placementReport.js";
import { sanitizePlacementEvaluation } from "../server/src/services/placementEvaluateService.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";
import { buildHistoricalPlacementResult } from "../src/data/placementLogic.js";

describe("productive accuracy floor", () => {
  it("gives communicative credit but caps strong when accuracy is weak (A2)", () => {
    expect(
      resolvePlacementProductiveBand({
        communicativeBand: "strong",
        accuracyBand: "weak",
        proposedBand: "strong",
        modelLevel: "A2",
      })
    ).toBe("medium");
  });

  it("requires accuracy strong for B1 strong evidence", () => {
    expect(
      resolvePlacementProductiveBand({
        communicativeBand: "strong",
        accuracyBand: "medium",
        proposedBand: "strong",
        modelLevel: "B1",
      })
    ).toBe("medium");
    expect(
      resolvePlacementProductiveBand({
        communicativeBand: "strong",
        accuracyBand: "strong",
        proposedBand: "strong",
        modelLevel: "B1",
      })
    ).toBe("strong");
  });

  it("allows A2 strong with communicative strong + accuracy medium", () => {
    expect(
      resolvePlacementProductiveBand({
        communicativeBand: "strong",
        accuracyBand: "medium",
        proposedBand: "strong",
        modelLevel: "A2",
      })
    ).toBe("strong");
  });

  it("sanitizer applies the accuracy floor on Selbstvorstellung", () => {
    const model = getPlacementModel("a2_self_mittel");
    const result = sanitizePlacementEvaluation(
      {
        communicativeBand: "strong",
        accuracyBand: "weak",
        band: "strong",
        coveredTopics: ["name", "origin", "work"],
        missingTopics: [],
        diagnosticFocus: ["satzbau", "verbposition"],
        needsFollowUp: false,
        notes: ["Satzbau und Verbposition sind noch unsicher."],
      },
      model,
      0,
      [{
        question: "Stellen Sie sich vor.",
        transcript:
          "Guten Morgen, mein Name ist Fadi. Ich komme aus Syrien. Ich bin verheiratet, ich habe 4 Kinder. Ich arbeite als Logistik.",
      }]
    );
    expect(result.band).toBe("medium");
    expect(result.communicativeBand).toBe("strong");
    expect(result.accuracyBand).toBe("weak");
    expect(result.diagnosticFocus).toEqual(["satzbau", "verbposition"]);
  });
});

describe("Hören stays comprehension-first", () => {
  it("scores MCQ correctness and ignores spoken grammar quality", () => {
    const model = {
      listeningQuestions: [
        { id: "q1", question: "Wo wurde das Handy gefunden?", correctOption: "A" },
        { id: "q2", question: "Wann?", correctOption: "B" },
      ],
    };
    const scored = scorePlacementListeningAnswers(model, { q1: "A", q2: "B" });
    expect(scored.band).toBe("strong");
    expect(scored.correct).toBe(2);
    // No path from transcript/grammar into listening band.
    expect(scored).not.toHaveProperty("accuracyBand");
  });
});

describe("Bildbeschreibung partial + fragmentation", () => {
  it("maps communicative medium + accuracy weak to medium with language diagnostics", () => {
    expect(
      resolvePlacementProductiveBand({
        communicativeBand: "medium",
        accuracyBand: "weak",
        proposedBand: "medium",
        modelLevel: "A2",
      })
    ).toBe("medium");
  });
});

describe("Planung full-stage aggregation", () => {
  it("does not let a strong closing turn erase earlier weak turns", () => {
    expect(
      getFinalBandFromTurnEvidence([
        { band: "weak" },
        { band: "weak" },
        { band: "medium" },
        { band: "strong", planningComplete: true },
      ])
    ).toBe("medium");
  });

  it("does not let a weak closing turn erase earlier strong turns", () => {
    expect(
      getFinalBandFromTurnEvidence([
        { band: "strong" },
        { band: "strong" },
        { band: "medium" },
        { band: "weak", planningComplete: true },
      ])
    ).toBe("medium");
  });
});

describe("final report quality", () => {
  it("shows relative strengths without absolute strong bands", () => {
    const bands = {
      selbstvorstellung: "weak",
      bildbeschreibung: "medium",
      lesenHoeren: "medium",
      planung: "medium",
    };
    const evidenceSummary = buildEvidenceSummary(
      {
        selbstvorstellung: [{
          band: "weak",
          coveredTopics: ["name", "origin", "family", "work"],
          missingTopics: [],
          diagnosticFocus: ["satzbau"],
          transcript: "Mein Name ist Fadi. Ich komme aus Syrien. Ich habe 4 Kinder.",
        }],
        bildbeschreibung: [{
          bildAssessmentPackKey: "A2:6",
          coveredTopics: ["place", "woman_action"],
          missingTopics: ["shop_details", "travel_preference"],
          diagnosticFocus: ["fragmentierung", "wortschatz"],
          transcript: "Auf dem Bild sehe ich 2 Personen eine Frau. Sie ist auf der Geschäfts. Koffer.",
        }],
        hoeren: [{
          listeningResult: {
            questionResults: [
              { questionId: "q1", question: "Wo wurde das Handy gefunden?", isCorrect: false },
              { questionId: "q2", question: "Wer hat angerufen?", isCorrect: true },
            ],
          },
        }],
        planung: [{
          planningPackId: "a2_planung_mittel",
          coveredTopics: ["place", "date_time"],
          missingTopics: ["attendance_problem"],
          transcript: "Am Samstag treffen wir uns am Bahnhof und fahren mit dem Zug.",
        }],
      },
      bands
    );

    const report = buildDeterministicLearnerReport({
      level: "A2+",
      skillBands: bands,
      strengths: [],
      weaknesses: ["selbstvorstellung"],
      evidenceSummary,
    });

    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.strengths.every((s) => s.text.length > 10)).toBe(true);
    expect(JSON.stringify(report.strengths)).not.toMatch(/Noch keine klaren Stärken/i);

    const allLearnerText = JSON.stringify({
      improvements: report.improvements,
      recommendations: report.recommendations,
      areas: report.areas,
      studyPlan: report.studyPlan,
    });
    expect(allLearnerText).not.toContain("Wo wurde das Handy gefunden?");
    expect(allLearnerText).not.toContain("Koffer und Taschen im Geschäft");
    expect(allLearnerText).not.toContain("Persönliche Reiseerfahrung");
    expect(allLearnerText).not.toContain("Lösung bei geringer Teilnahme");
    expect(allLearnerText).not.toMatch(/tragfähig/i);

    expect(evidenceSummary.lesenHoeren.practiceFocuses.join(" ")).toMatch(/Ortsangaben|Details/);
    expect(mapPlacementPracticeFocus("lesenHoeren", "Wo wurde das Handy gefunden?")).toBe(
      "Ortsangaben gezielt verstehen"
    );
  });

  it("passes learner-safe diagnostic notes into evidence summary", () => {
    const summary = buildEvidenceSummary(
      {
        selbstvorstellung: [{
          coveredTopics: ["name"],
          missingTopics: [],
          notes: ["Satzbau noch unsicher.", "SECRET SYSTEM PROMPT"],
          diagnosticFocus: ["satzbau"],
        }],
      },
      { selbstvorstellung: "medium" }
    );
    expect(summary.selbstvorstellung.learnerNotes).toContain("Satzbau noch unsicher.");
    expect(JSON.stringify(summary)).not.toMatch(/SECRET SYSTEM PROMPT/);
    expect(summary.selbstvorstellung.diagnosticFocus).toEqual(["satzbau"]);
  });

  it("applies polished strength/improvement text for allowed skills", () => {
    const profile = assemblePlacementLearnerProfile({
      historicalResult: buildHistoricalPlacementResult({
        selectedLevel: "A2",
        numericScores: {
          selbstvorstellung: 35,
          bildbeschreibung: 65,
          lesenHoeren: 65,
          planung: 65,
        },
        bands: {
          selbstvorstellung: "weak",
          bildbeschreibung: "medium",
          lesenHoeren: "medium",
          planung: "medium",
        },
      }),
      turnEvidence: {
        selbstvorstellung: [{
          coveredTopics: ["name", "origin", "work"],
          transcript: "Ich heiße Fadi und komme aus Syrien.",
        }],
        bildbeschreibung: [{
          bildAssessmentPackKey: "A2:6",
          coveredTopics: ["place", "woman"],
          missingTopics: ["shop_details"],
        }],
      },
    });

    expect(profile.learnerReport.strengths.length).toBeGreaterThan(0);
    const skill = profile.learnerReport.strengths[0].skill;
    const merged = applyPolishedLearnerReport(profile, {
      strengths: [{ skill, text: "Polierte relative Stärke." }],
      improvements: profile.learnerReport.improvements.map((item) => ({
        skill: item.skill,
        text: `Poliert: ${item.skill}`,
      })),
    });
    expect(merged.learnerReport.strengths.find((s) => s.skill === skill)?.text).toBe(
      "Polierte relative Stärke."
    );
    expect(merged.learnerReport.improvements[0].text).toMatch(/^Poliert:/);
  });
});

describe("closed pools / routing untouched smoke", () => {
  it("keeps listening objective thresholds", () => {
    const model = {
      listeningQuestions: [
        { id: "a", correctOption: "1" },
        { id: "b", correctOption: "1" },
      ],
    };
    expect(scorePlacementListeningAnswers(model, { a: "1", b: "0" }).band).toBe("medium");
    expect(scorePlacementListeningAnswers(model, { a: "0", b: "0" }).band).toBe("weak");
  });
});
