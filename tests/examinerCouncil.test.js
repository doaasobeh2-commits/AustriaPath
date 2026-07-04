import { describe, expect, it, beforeEach } from "vitest";
import { decideCouncil } from "../src/exam-platform/services/examinerCouncil.js";
import { buildFinalReport } from "../src/exam-platform/services/reportBuilder.js";
import {
  collectFusionReports,
  sectionEvaluationToJudgeReport,
} from "../src/exam-platform/services/examinerMindAdapter.js";
import {
  loadRuleRegistry,
  clearRuleRegistryCache,
  seedRuleRegistryFromKnowledge,
} from "../src/exam-platform/services/ruleRegistryService.js";
import { ExaminerKnowledge } from "../src/ai/examinerMind/knowledge/examinerKnowledge.js";

function readingEvaluation(overrides = {}) {
  return {
    sectionIndex: 1,
    skill: "reading",
    modelId: "r1",
    rawScore: 2,
    maxScore: 2,
    normalizedScore: 100,
    skillLevel: "B1+",
    strengths: ["Gute Antwortgenauigkeit"],
    weaknesses: [],
    evidence: [{ code: "CORRECT:31", label: "Lücke 31", passed: true, detail: "Richtig." }],
    lowConfidence: false,
    evaluatorId: "reading",
    evaluatorVersion: "1.0.0",
    rulesVersion: "1.0.0",
    ...overrides,
  };
}

function writingEvaluation(overrides = {}) {
  return {
    sectionIndex: 0,
    skill: "writing",
    modelId: "w1",
    rawScore: 0,
    maxScore: 1,
    normalizedScore: 0,
    strengths: [],
    weaknesses: ["Automatische Bewertung fuer writing noch nicht verfuegbar."],
    evidence: [{ code: "EVALUATOR_PENDING", label: "writing", passed: false }],
    lowConfidence: true,
    evaluatorId: "pending_writing",
    evaluatorVersion: "1.0.0",
    rulesVersion: "1.0.0",
    answerSnapshot: {
      sectionIndex: 0,
      skill: "writing",
      modelId: "w1",
      freeText:
        "Sehr geehrte Damen und Herren, ich schreibe Ihnen weil ich morgen leider nicht kommen kann. " +
        "Ich bin krank und deshalb bleibe ich zu Hause. Mit freundlichen Grüßen",
    },
    ...overrides,
  };
}

describe("ruleRegistryService", () => {
  beforeEach(() => clearRuleRegistryCache());

  it("seeds registry from Examiner Mind knowledge", () => {
    const registry = seedRuleRegistryFromKnowledge();
    expect(registry.levels.B1?.writing).toBeTruthy();
    expect(registry.globalPrinciples.length).toBeGreaterThan(0);
  });

  it("loads B1 writing rubric elements", () => {
    const registry = loadRuleRegistry(null);
    expect(registry.levels.B1.writing.expectedElements.length).toBeGreaterThan(0);
  });
});

describe("examinerMindAdapter", () => {
  it("converts MCQ section evaluation to judge report", () => {
    const report = sectionEvaluationToJudgeReport(readingEvaluation());
    expect(report.score).toBe(100);
    expect(report.source).toBe("skill_evaluator");
  });

  it("runs legacy judges for free-text writing section", () => {
    const reports = collectFusionReports([writingEvaluation()], "B1", null);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.some((r) => r.examiner === "taskCompletion")).toBe(true);
  });
});

describe("examinerCouncil Phase E", () => {
  beforeEach(() => clearRuleRegistryCache());

  it("fuses MCQ reading score via Examiner Mind decision engine", () => {
    const decision = decideCouncil({
      sectionEvaluations: [readingEvaluation(), writingEvaluation()],
      productType: "ai_exam",
      targetLevel: "B1",
    });

    expect(decision.overallScore).toBeGreaterThan(0);
    expect(decision.cefrLevel).toBeTruthy();
    expect(decision.fusionReports.length).toBeGreaterThan(1);
    expect(decision.examinerMindVersion).toBeTruthy();
    expect(decision.reflectionSummary).toContain("Examiner Mind");
  });

  it("uses practice council for weekly plan without lab escalation", () => {
    const decision = decideCouncil({
      sectionEvaluations: [readingEvaluation({ normalizedScore: 80 })],
      productType: "weekly_plan",
      targetLevel: "B1",
    });

    expect(decision.needsHumanReview).toBe(false);
    expect(decision.overallScore).toBe(80);
  });

  it("maps B2 context level from target level", () => {
    const decision = decideCouncil({
      sectionEvaluations: [readingEvaluation({ normalizedScore: 88, skillLevel: "B2" })],
      productType: "ai_exam",
      targetLevel: "B2",
    });

    expect(decision.cefrLevel).toBe("B2");
  });
});

describe("reportBuilder Phase E", () => {
  it("includes human-readable strengths from council", () => {
    const decision = decideCouncil({
      sectionEvaluations: [writingEvaluation()],
      productType: "ai_exam",
      targetLevel: "B1",
    });

    const report = buildFinalReport({
      decision,
      productType: "ai_exam",
      blueprintId: "bp_test",
    });

    expect(report.summary).toBeTruthy();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.councilDecision.decisionId).toBe(decision.decisionId);
    expect(report.disclaimer).toContain("ÖIF");
  });
});

describe("Examiner Mind knowledge availability", () => {
  it("has B1 writing knowledge for judges", () => {
    expect(ExaminerKnowledge.levels.B1.writing.expectedElements.length).toBeGreaterThan(0);
  });
});
