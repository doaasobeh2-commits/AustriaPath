import { describe, expect, it } from "vitest";
import {
  createEmptyProfile,
  mergeExamReport,
  mergePracticeReport,
  getUsedModelIds,
  recordPackageModelUsage,
} from "../src/exam-platform/studentProfileService.js";
import { selectBlueprint } from "../src/exam-platform/modelSelectionService.js";
import {
  validateSubscriptionForExam,
  consumeExamAttempt,
} from "../src/exam-platform/subscriptionPolicy.js";
import { shouldEnqueueLabCase } from "../src/exam-platform/examinerLabPolicy.js";

const mockCatalog = [
  { id: "w1", skill: "writing", level: "B1", difficulty: "mittel", selectionWeight: 1 },
  { id: "r1", skill: "reading", level: "B1", difficulty: "mittel", selectionWeight: 1 },
  { id: "r2", skill: "reading", level: "B1", difficulty: "stark", selectionWeight: 1 },
  { id: "l1", skill: "listening", level: "B1", difficulty: "mittel", selectionWeight: 1 },
  { id: "p1", skill: "picture_description", level: "B1", difficulty: "mittel", selectionWeight: 1 },
  { id: "pl1", skill: "planning", level: "B1", difficulty: "mittel", selectionWeight: 1 },
  { id: "s1", skill: "self_introduction", level: "B1", difficulty: "mittel", selectionWeight: 1 },
];

function mockReport(overrides = {}) {
  return {
    reportId: "rep_1",
    productType: "ai_exam",
    mode: "exam",
    evaluationMethod: "examiner_mind",
    cefrLevel: "B1",
    overallScore: 72,
    confidence: 78,
    strengths: ["writing"],
    weaknesses: ["listening"],
    focusAreas: ["listening"],
    recommendations: ["Mehr Hören üben"],
    studyAdvice: ["Täglich 10 Minuten Hören"],
    skillResults: { listening: { score: 55, level: "A2+" } },
    councilDecision: {},
    disclaimer: "test",
    rulesVersion: "1.0.0",
    blueprintId: "bp_1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("studentProfileService", () => {
  it("mergeExamReport updates officialExamLevel", () => {
    const profile = createEmptyProfile();
    const next = mergeExamReport(profile, mockReport({ cefrLevel: "B1+" }), ["w1"]);
    expect(next.officialExamLevel).toBe("B1+");
    expect(next.globalUsedModelIds).toContain("w1");
    expect(next.examHistory.length).toBe(1);
  });

  it("mergePracticeReport never changes officialExamLevel", () => {
    const profile = { ...createEmptyProfile(), officialExamLevel: "B1" };
    const next = mergePracticeReport(
      profile,
      mockReport({ productType: "weekly_plan", mode: "practice", cefrLevel: "A2" }),
      ["w1"]
    );
    expect(next.officialExamLevel).toBe("B1");
    expect(next.practiceHistory.length).toBe(1);
    expect(next.practiceStats.sessionsCompleted).toBe(1);
  });

  it("recordPackageModelUsage tracks package ids", () => {
    let profile = createEmptyProfile();
    profile = recordPackageModelUsage(
      { ...profile, activePackage: { type: "premium_month", examIndex: 1, examTotal: 5, usedModelIdsInPackage: [] } },
      ["r1"]
    );
    expect(getUsedModelIds(profile, "package")).toContain("r1");
  });
});

describe("modelSelectionService", () => {
  it("selects models without repeating used ids", () => {
    let profile = createEmptyProfile();
    profile.officialExamLevel = "B1";
    profile.globalUsedModelIds = ["r1"];
    profile.weakSkills = ["listening"];

    const bp = selectBlueprint({
      productType: "ai_exam",
      profile,
      catalog: mockCatalog,
    });

    const ids = bp.sections.map((s) => s.modelId);
    expect(ids).not.toContain("r1");
    expect(bp.sections.some((s) => s.skill === "listening")).toBe(true);
  });

  it("rotates emphasis for exam 2 in premium month", () => {
    const profile = { ...createEmptyProfile(), officialExamLevel: "B1" };
    const bp1 = selectBlueprint({
      productType: "premium_month",
      profile,
      catalog: mockCatalog,
      examIndex: 1,
      examTotal: 5,
    });
    const bp2 = selectBlueprint({
      productType: "premium_month",
      profile,
      catalog: mockCatalog,
      examIndex: 2,
      examTotal: 5,
    });
    expect(bp1.sections[0]?.skill).not.toBe(bp2.sections[0]?.skill);
  });
});

describe("subscriptionPolicy", () => {
  it("blocks premium exam when no attempts remain", () => {
    const result = validateSubscriptionForExam({
      productType: "ai_exam",
      subscription: {
        type: "ai_exam",
        status: "active",
        remainingExams: 0,
        startDate: null,
        endDate: null,
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("NO_REMAINING_EXAMS");
  });

  it("consumeExamAttempt decrements remaining", () => {
    const sub = consumeExamAttempt(
      { type: "intensive_week", status: "active", remainingExams: 3, startDate: null, endDate: null },
      "intensive_week",
      1
    );
    expect(sub.remainingExams).toBe(2);
    expect(sub.usageHistory?.length).toBe(1);
  });
});

describe("examinerLabPolicy", () => {
  it("does not enqueue when needsHumanReview is false", () => {
    const result = shouldEnqueueLabCase({
      decision: { needsHumanReview: false, confidence: 80, conflicts: [] },
    });
    expect(result.enqueue).toBe(false);
  });

  it("respects weekly volume cap for low-priority cases", () => {
    const result = shouldEnqueueLabCase({
      decision: {
        needsHumanReview: true,
        confidence: 40,
        conflicts: [],
        warnings: ["a"],
        criticalRulesApplied: [],
      },
      recentQueue: [{ queuedAt: new Date().toISOString(), classification: "novel_situation" }],
    });
    expect(result.enqueue).toBe(false);
    expect(result.reason).toBe("weekly_volume_cap_reached");
  });
});
