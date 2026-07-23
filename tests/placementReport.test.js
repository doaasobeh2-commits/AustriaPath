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
    expect(JSON.stringify(report)).not.toMatch(/35|65|90|100|bandScoreMapping/);
    expect(report.studyPlan[0].focus).toBe("hoeren");
  });

  it("keeps internal notes out of learner-facing summary while allowing safe diagnostics", () => {
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
        selbstvorstellung: [
          {
            coveredTopics: ["name"],
            notes: ["Satzbau noch unsicher."],
            diagnosticFocus: ["satzbau"],
            band: "medium",
          },
        ],
      },
      bands
    );
    expect(summary.lesenHoeren.coveredTopics).toContain("Ort");
    expect(JSON.stringify(summary.lesenHoeren)).not.toMatch(/SECRET/);
    expect(summary.selbstvorstellung.learnerNotes).toContain("Satzbau noch unsicher.");
  });

  it("maps validated Koffergeschäft topic IDs to learner labels", () => {
    const summary = buildEvidenceSummary(
      {
        bildbeschreibung: [{
          bildAssessmentPackKey: "A2:6",
          coveredTopics: ["place", "woman_action"],
          missingTopics: ["shop_details", "travel_preference"],
        }],
      },
      { bildbeschreibung: "medium" }
    );

    expect(summary.bildbeschreibung).toMatchObject({
      coveredTopicIds: ["place", "woman_action"],
      missingTopicIds: ["shop_details", "travel_preference"],
      coveredTopics: ["Ort", "Handlung der Frau"],
      missingTopics: ["Koffer und Taschen im Geschäft", "Persönliche Reiseerfahrung"],
      bildAssessmentPackKeys: ["A2:6"],
    });
    expect(JSON.stringify(summary.bildbeschreibung)).not.toContain("Lebensmittel");
  });

  it("rejects cross-pack and stale Bild topics during report assembly", () => {
    const summary = buildEvidenceSummary(
      {
        bildbeschreibung: [{
          bildAssessmentPackKey: "A2:6",
          coveredTopics: ["place", "market_goods"],
          missingTopics: ["Lebensmittel", "cooking_preference", "travel_preference"],
        }],
      },
      { bildbeschreibung: "medium" }
    );

    expect(summary.bildbeschreibung.coveredTopicIds).toEqual(["place"]);
    expect(summary.bildbeschreibung.missingTopicIds).toEqual(["travel_preference"]);
    expect(summary.bildbeschreibung.missingTopics).toEqual(["Persönliche Reiseerfahrung"]);
  });

  it("omits unresolvable legacy Bild topics instead of using generic model metadata", () => {
    const summary = buildEvidenceSummary(
      {
        bildbeschreibung: [{
          coveredTopics: ["Ort"],
          missingTopics: ["Eigene Erfahrung", "Lebensmittel"],
        }],
      },
      { bildbeschreibung: "medium" }
    );

    expect(summary.bildbeschreibung.coveredTopics).toEqual([]);
    expect(summary.bildbeschreibung.missingTopics).toEqual([]);
    expect(JSON.stringify(summary.bildbeschreibung)).not.toContain("Lebensmittel");
  });

  it("reconciles Selbstvorstellung missing topics against the full semantic conversation", () => {
    const summary = buildEvidenceSummary(
      {
        selbstvorstellung: [
          {
            question: "Stellen Sie sich bitte vor.",
            transcript: "Ich heiße Samira und arbeite im Hotel.",
            coveredTopics: ["Name"],
            missingTopics: ["Berufliche Ziele", "Begründung"],
          },
          {
            question: "Was möchten Sie in Zukunft machen?",
            transcript: "Später möchte ich eine Ausbildung machen, weil ich beruflich weiterkommen möchte.",
            coveredTopics: ["Zukunftspläne"],
            missingTopics: ["Berufliche Ziele"],
          },
        ],
      },
      { selbstvorstellung: "strong" }
    );

    expect(summary.selbstvorstellung.coveredTopicIds).toEqual(
      expect.arrayContaining(["name", "work", "future_plan", "professional_goal", "reason"])
    );
    expect(summary.selbstvorstellung.missingTopics).not.toEqual(
      expect.arrayContaining(["Berufliche Ziele", "Begründung"])
    );
  });

  it("reports a Selbstvorstellung topic missing only after a fair assessment opportunity", () => {
    const notAsked = buildEvidenceSummary(
      {
        selbstvorstellung: [{
          question: "Stellen Sie sich bitte kurz vor.",
          transcript: "Ich heiße Mina und wohne in Graz.",
          missingTopics: ["Berufliche Ziele", "Freizeit"],
        }],
      },
      { selbstvorstellung: "medium" }
    );
    expect(notAsked.selbstvorstellung.missingTopics).toEqual([]);

    const askedButMissing = buildEvidenceSummary(
      {
        selbstvorstellung: [{
          question: "Was möchten Sie beruflich in Zukunft machen?",
          transcript: "Das weiß ich noch nicht.",
          missingTopics: ["Berufliche Ziele"],
        }],
      },
      { selbstvorstellung: "medium" }
    );
    expect(askedButMissing.selbstvorstellung.missingTopics).toEqual(["Berufliche Ziele"]);
  });

  it("derives Hören evidence only from the selected model question results", () => {
    const summary = buildEvidenceSummary(
      {
        hoeren: [{
          modelId: "a2_listening_02",
          modelLevel: "A2",
          coveredTopics: ["Herr Müller fährt nach Berlin"],
          missingTopics: ["Frau Becker verpasst den Zug"],
          listeningModel: {
            id: "a2_listening_02",
            title: "Termin in der Apotheke",
            level: "A2",
            difficulty: "mittel",
            audioRef: "/audio/placement/listening/Listening_02.mp3",
          },
          listeningResult: {
            questionResults: [
              { questionId: "q1", question: "Warum ruft die Person an?", isCorrect: true },
              { questionId: "q2", question: "Wann ist der Termin?", isCorrect: false },
            ],
          },
        }],
      },
      { lesenHoeren: "medium" }
    );

    expect(summary.lesenHoeren.coveredTopics).toEqual(["Warum ruft die Person an?"]);
    expect(summary.lesenHoeren.missingTopics).toEqual(["Wann ist der Termin?"]);
    expect(summary.lesenHoeren.listeningModels[0]).toMatchObject({
      id: "a2_listening_02",
      title: "Termin in der Apotheke",
    });
    expect(JSON.stringify(summary.lesenHoeren)).not.toMatch(/Müller|Becker|Berlin|Zug/);
  });

  it("builds relative strengths and skill-facing improvements from evidence", () => {
    const report = buildDeterministicLearnerReport({
      level: "B1",
      skillBands: {
        selbstvorstellung: "strong",
        bildbeschreibung: "medium",
        lesenHoeren: "strong",
        planung: "strong",
      },
      strengths: ["selbstvorstellung", "lesenHoeren", "planung"],
      weaknesses: [],
      evidenceSummary: {
        selbstvorstellung: { coveredTopics: [], missingTopics: [], transcripts: [] },
        bildbeschreibung: {
          coveredTopics: ["Ort"],
          missingTopics: ["Persönliche Reiseerfahrung"],
          missingTopicIds: ["travel_preference"],
          bildAssessmentPackKeys: ["A2:6"],
          coveredTopicIds: ["place"],
        },
        lesenHoeren: { coveredTopics: [], missingTopics: [], listeningQuestionResults: [] },
        planung: {
          coveredTopics: ["Gemeinsame Entscheidung"],
          missingTopics: [],
          planningPackIds: ["b1_planung_mittel"],
          transcripts: [{ question: "Abschluss", transcript: "Unser Plan steht." }],
        },
      },
    });

    expect(report.strengths.map((item) => item.skill)).toEqual(
      expect.arrayContaining(["bildbeschreibung", "planung"])
    );
    expect(report.improvements).toEqual(expect.arrayContaining([
      expect.objectContaining({ skill: "bildbeschreibung" }),
    ]));
    expect(report.improvements[0].text).not.toMatch(/keine.*schwäche/i);
    expect(report.improvements.find((i) => i.skill === "bildbeschreibung")?.text).not.toMatch(
      /tragfähig/i
    );
    expect(report.recommendations.join(" ")).not.toContain("Persönliche Reiseerfahrung");
    expect(report.recommendations.join(" ")).toMatch(/Erfahrungen|zusammenhängend/i);
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

  it("blocks legacy Hören prose and prevents Planning polish from replacing grounded evidence", () => {
    const base = assemblePlacementLearnerProfile({
      historicalResult: buildHistoricalPlacementResult({
        selectedLevel: "A2",
        numericScores: {
          selbstvorstellung: 65,
          bildbeschreibung: 65,
          lesenHoeren: 35,
          planung: 35,
        },
        bands: {
          selbstvorstellung: "medium",
          bildbeschreibung: "medium",
          lesenHoeren: "weak",
          planung: "weak",
        },
      }),
      turnEvidence: {
        hoeren: [{
          modelId: "a2_listening_02",
          listeningModel: { id: "a2_listening_02", title: "Apothekentermin", level: "A2" },
          listeningResult: {
            questionResults: [
              { questionId: "q1", question: "Wann ist der Termin?", isCorrect: false },
            ],
          },
        }],
        planung: [{
          modelId: "a2_planung_mittel",
          planningPackId: "a2_planung_mittel",
          coveredTopics: [],
          missingTopics: ["date_time"],
          transcript: "Ich weiß noch nicht.",
        }],
      },
    });
    const planningBefore = base.learnerReport.areas.find((area) => area.skill === "planung");
    const merged = applyPolishedLearnerReport(base, {
      areas: [
        { skill: "lesenHoeren", performanceLabel: "Perfekt", summary: "Herr Müller fährt nach Berlin." },
        { skill: "planung", performanceLabel: "Planung individuell", summary: "Planungstext unverändert polierbar." },
      ],
      recommendations: [
        "Herr Müller und alte Bahnhofsereignisse wiederholen.",
        "Planung: Zeit und Entscheidung weiter üben.",
      ],
    });

    const listening = merged.learnerReport.areas.find((area) => area.skill === "lesenHoeren");
    const planning = merged.learnerReport.areas.find((area) => area.skill === "planung");
    expect(listening.summary).toContain("Apothekentermin");
    expect(JSON.stringify(merged.learnerReport)).not.toMatch(/Herr Müller|Berlin|Bahnhofsereignisse/);
    expect(planning).toEqual(planningBefore);
    expect(merged.learnerReport.recommendations).not.toContain(
      "Planung: Zeit und Entscheidung weiter üben."
    );
  });
});
