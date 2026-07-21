/**
 * Placement learner report — deterministic + AI polish sanitize (no OpenAI).
 */
import { describe, expect, it } from "vitest";
import {
  assemblePlacementLearnerProfile,
  applyPolishedLearnerReport,
  buildDeterministicLearnerReport,
  buildEvidenceSummary,
  mapFocusListForWeeklyPlan,
} from "../src/data/utils/placementReport.js";
import { sanitizePolishedOutput } from "../server/src/services/placementReportService.js";
import { buildHistoricalPlacementResult } from "../src/data/placementLogic.js";

describe("deterministic Placement report", () => {
  const bands = {
    selbstvorstellung: "strong",
    bildbeschreibung: "medium",
    lesenHoeren: "weak",
    planung: "medium",
  };

  it("preserves learner transcripts in learner-safe evidence", () => {
    const summary = buildEvidenceSummary(
      {
        selbstvorstellung: [
          {
            band: "medium",
            question: "Stellen Sie sich bitte kurz vor.",
            transcript: "Ich heiße Sara und wohne in Wien.",
            inputMode: "voice_transcript",
          },
        ],
      },
      { selbstvorstellung: "medium" }
    );
    expect(summary.selbstvorstellung.transcripts).toEqual([
      {
        question: "Stellen Sie sich bitte kurz vor.",
        transcript: "Ich heiße Sara und wohne in Wien.",
        inputMode: "voice_transcript",
      },
    ]);
  });

  it("builds learner-friendly report without exposing numeric scores", () => {
    const report = buildDeterministicLearnerReport({
      level: "B1-",
      skillBands: bands,
      strengths: ["selbstvorstellung"],
      weaknesses: ["lesenHoeren"],
      evidenceSummary: {
        lesenHoeren: {
          band: "weak",
          coveredTopics: ["Ort"],
          missingTopics: ["Zeit", "Person"],
        },
      },
    });

    expect(report.level).toBe("B1-");
    expect(report.levelExplanation).toMatch(/B1/);
    expect(report.areas).toHaveLength(4);
    expect(report.areas.find((a) => a.skill === "lesenHoeren").label).toBe("Hören");
    expect(report.areas.find((a) => a.skill === "lesenHoeren").performanceLabel).toBe(
      "Noch unsicher"
    );
    expect(JSON.stringify(report)).not.toMatch(/35|65|90|bandScoreMapping/);
    expect(report.studyPlan[0].focus).toBe("hoeren");
  });

  it("sanitizes evidence and drops notes", () => {
    const summary = buildEvidenceSummary(
      {
        hoeren: [
          {
            coveredTopics: ["Ort"],
            missingTopics: ["Zeit"],
            notes: ["SECRET INTERNAL"],
            band: "weak",
          },
        ],
      },
      bands
    );
    expect(summary.lesenHoeren.coveredTopics).toContain("Ort");
    expect(JSON.stringify(summary)).not.toMatch(/SECRET/);
  });

  it("maps lesenHoeren to hoeren for Weekly Plan", () => {
    expect(mapFocusListForWeeklyPlan(["lesenHoeren", "planung", "lesenHoeren"])).toEqual([
      "hoeren",
      "planung",
    ]);
  });

  it("assembles profile with internal scoring bag hidden from learnerReport", () => {
    const historical = buildHistoricalPlacementResult({
      selectedLevel: "A2",
      numericScores: {
        selbstvorstellung: 90,
        bildbeschreibung: 65,
        lesenHoeren: 35,
        planung: 65,
      },
      bands,
    });
    const profile = assemblePlacementLearnerProfile({
      historicalResult: historical,
      turnEvidence: {
        hoeren: [{ coveredTopics: ["Ort"], missingTopics: ["Zeit"], notes: ["x"] }],
      },
    });

    expect(profile.level).toBe(historical.level);
    expect(profile.skillBands).toEqual(bands);
    expect(profile.reportSource).toBe("deterministic");
    expect(profile.learnerReport.areas).toHaveLength(4);
    expect(profile.internal.skillScores.lesenHoeren).toBe(35);
    expect(profile.learnerReport.levelExplanation).toBeTruthy();
    expect(JSON.stringify(profile.learnerReport)).not.toMatch(/placementScore|35|65|90/);
  });
});

describe("AI polish sanitize", () => {
  it("rejects invented strengths and keeps immutable level facts on apply", () => {
    const polished = sanitizePolishedOutput(
      {
        levelExplanation: "Sie sind auf einem guten Weg Richtung B1.",
        areas: [
          {
            skill: "lesenHoeren",
            performanceLabel: "Noch ausbaufähig",
            summary: "Zeitangaben waren unsicher.",
          },
        ],
        strengths: [
          { skill: "selbstvorstellung", text: "Sie stellen sich klar vor." },
          { skill: "diskussion", text: "INVENTED" },
        ],
        improvements: [{ skill: "lesenHoeren", text: "Üben Sie Uhrzeiten." }],
        recommendations: ["Täglich 10 Minuten Hören."],
        studyPlan: [
          {
            day: "Tag 1",
            skill: "lesenHoeren",
            focus: "hoeren",
            task: "Kurze Hörtexte mit Zeitangaben üben.",
          },
        ],
      },
      {
        level: "B1-",
        strengths: ["selbstvorstellung"],
        weaknesses: ["lesenHoeren"],
      }
    );

    expect(polished.strengths.map((s) => s.skill)).toEqual(["selbstvorstellung"]);
    expect(polished.strengths.find((s) => s.skill === "diskussion")).toBeUndefined();

    const base = assemblePlacementLearnerProfile({
      historicalResult: buildHistoricalPlacementResult({
        selectedLevel: "A2",
        numericScores: {
          selbstvorstellung: 90,
          bildbeschreibung: 65,
          lesenHoeren: 35,
          planung: 65,
        },
        bands: {
          selbstvorstellung: "strong",
          bildbeschreibung: "medium",
          lesenHoeren: "weak",
          planung: "medium",
        },
      }),
    });
    const frozenLevel = base.level;
    const merged = applyPolishedLearnerReport(base, polished);
    expect(merged.level).toBe(frozenLevel);
    expect(merged.reportSource).toBe("ai");
    expect(merged.learnerReport.level).toBe(frozenLevel);
    expect(merged.skillBands.lesenHoeren).toBe("weak");
  });
});
