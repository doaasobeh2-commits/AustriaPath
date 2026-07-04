import { describe, expect, it } from "vitest";
import {
  compareAnswer,
  normalizeText,
  scoreQuestionSet,
  mapScoreToSkillLevel,
} from "../src/exam-platform/evaluators/mcqCore.js";
import {
  extractReadingQuestions,
  extractListeningQuestions,
} from "../src/exam-platform/evaluators/questionExtractors.js";
import { evaluateReading } from "../src/exam-platform/evaluators/readingEvaluator.js";
import { evaluateListening } from "../src/exam-platform/evaluators/listeningEvaluator.js";
import {
  evaluateSection,
  hasEvaluator,
  hasAutomatedEvaluator,
} from "../src/exam-platform/evaluators/skillEvaluatorRegistry.js";

describe("mcqCore", () => {
  it("normalizes German text for comparison", () => {
    expect(normalizeText("  Weil, ")).toBe("weil");
  });

  it("compares letter answers case-insensitively", () => {
    const result = compareAnswer("B", "b", "letter");
    expect(result.correct).toBe(true);
  });

  it("scores cloze answers with partial credit disabled for wrong", () => {
    const scored = scoreQuestionSet(
      [
        { id: "31", prompt: "Lücke 31", expected: "weil", matchMode: "exact" },
        { id: "32", prompt: "Lücke 32", expected: "dass", matchMode: "exact" },
      ],
      { 31: "weil", 32: "wenn" }
    );
    expect(scored.rawScore).toBe(1);
    expect(scored.normalizedScore).toBe(50);
    expect(scored.evidence[0].passed).toBe(true);
    expect(scored.evidence[1].passed).toBe(false);
  });

  it("maps B2 context levels correctly", () => {
    expect(mapScoreToSkillLevel(88, "B2")).toBe("B2");
    expect(mapScoreToSkillLevel(72, "B2")).toBe("B1+");
  });

  it("fuzzy-matches listening answers by keywords", () => {
    const result = compareAnswer(
      "Weil Herr Schneider zu einem Kundengespräch nach Linz fahren muss.",
      "Herr Schneider muss nach Linz fahren wegen Kundengespräch",
      "text_fuzzy"
    );
    expect(result.correct).toBe(true);
  });
});

describe("questionExtractors", () => {
  it("extracts B1 reading cloze gaps", () => {
    const questions = extractReadingQuestions({
      type: "reading_cloze",
      answers: { 31: "weil", 32: "dass" },
    });
    expect(questions).toHaveLength(2);
    expect(questions[0].id).toBe("31");
  });

  it("extracts B1 reading ad matching letters", () => {
    const questions = extractReadingQuestions({
      type: "reading_ads",
      questions: [{ q: "Situation 41", a: "B" }],
    });
    expect(questions[0].matchMode).toBe("letter");
  });

  it("extracts B2 reading MCQ option keys", () => {
    const questions = extractReadingQuestions({
      lesenTeil2: {
        questions: [
          {
            id: 1,
            question: "Worum geht es?",
            options: { a: "A", b: "B", c: "C" },
            answer: "a",
          },
        ],
      },
    });
    expect(questions[0].matchMode).toBe("option_key");
  });

  it("flattens B1 listening parts", () => {
    const questions = extractListeningQuestions({
      parts: [
        {
          questions: [{ q: "Warum?", a: "Wegen Unfall." }],
        },
      ],
    });
    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe("p0-q0");
    expect(questions[0].matchMode).toBe("text_fuzzy");
  });
});

describe("readingEvaluator", () => {
  it("returns full score for correct cloze section", () => {
    const evaluation = evaluateReading({
      answer: {
        sectionIndex: 1,
        skill: "reading",
        modelId: "b1-lesen-01",
        mcqAnswers: { 31: "weil", 32: "weil", 33: "dass", 34: "damit", 35: "sondern", 36: "wenn" },
      },
      sectionContent: {
        type: "reading_cloze",
        answers: {
          31: "weil",
          32: "weil",
          33: "dass",
          34: "damit",
          35: "sondern",
          36: "wenn",
        },
      },
      targetLevel: "B1",
    });

    expect(evaluation.normalizedScore).toBe(100);
    expect(evaluation.skillLevel).toBe("B1+");
    expect(evaluation.evaluatorId).toBe("reading");
    expect(evaluation.evidence.length).toBe(6);
  });

  it("flags low confidence when no questions in content", () => {
    const evaluation = evaluateReading({
      answer: { sectionIndex: 0, skill: "reading", modelId: "x", mcqAnswers: {} },
      sectionContent: {},
    });
    expect(evaluation.lowConfidence).toBe(true);
    expect(evaluation.normalizedScore).toBe(0);
  });
});

describe("listeningEvaluator", () => {
  it("scores B2 listening questions", () => {
    const evaluation = evaluateListening({
      answer: {
        sectionIndex: 2,
        skill: "listening",
        modelId: "b2-hoeren-01",
        mcqAnswers: {
          0: "Weil Herr Schneider zu einem Kundengespräch nach Linz fahren muss.",
          1: "Am Donnerstag um 14 Uhr.",
        },
      },
      sectionContent: {
        questions: [
          {
            q: "Warum wird der Termin verschoben?",
            a: "Weil Herr Schneider zu einem Kundengespräch nach Linz fahren muss.",
          },
          {
            q: "Wann soll der neue Termin stattfinden?",
            a: "Am Donnerstag um 14 Uhr.",
          },
        ],
      },
      targetLevel: "B2",
    });

    expect(evaluation.normalizedScore).toBe(100);
    expect(evaluation.skillLevel).toBe("B2");
  });
});

describe("skillEvaluatorRegistry", () => {
  it("routes reading and listening with automated evaluators", () => {
    expect(hasEvaluator("reading")).toBe(true);
    expect(hasEvaluator("listening")).toBe(true);
    expect(hasAutomatedEvaluator("reading")).toBe(true);
    expect(hasAutomatedEvaluator("writing")).toBe(false);
    expect(hasEvaluator("writing")).toBe(true);
  });

  it("evaluateSection dispatches to reading evaluator", () => {
    const result = evaluateSection({
      answer: {
        sectionIndex: 0,
        skill: "reading",
        modelId: "test",
        mcqAnswers: { 0: "B" },
      },
      sectionContent: {
        questions: [{ q: "Q1", a: "B" }],
      },
    });
    expect(result.normalizedScore).toBe(100);
  });

  it("throws for unknown skills", () => {
    expect(() =>
      evaluateSection({
        answer: { sectionIndex: 0, skill: "unknown_skill", modelId: "x" },
        sectionContent: {},
      })
    ).toThrow(/Kein Skill Evaluator/);
  });
});
