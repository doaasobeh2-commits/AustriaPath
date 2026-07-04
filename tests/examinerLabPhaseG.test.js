import { describe, expect, it, beforeEach } from "vitest";
import { maybeEnqueueLabCase, saveLabQueue, clearLabQueue } from "../src/exam-platform/services/examinerLabService.js";
import {
  resolveLabItem,
  getPendingLabItems,
} from "../src/exam-platform/services/labResolutionService.js";
import {
  promoteRuleDirectly,
  loadRuleProposals,
} from "../src/exam-platform/services/rulePromotionService.js";
import {
  loadRuleRegistry,
  clearRuleRegistryCache,
  seedRuleRegistryFromKnowledge,
  saveRuleRegistry,
} from "../src/exam-platform/services/ruleRegistryService.js";
import { getEffectiveKnowledgeForJudge } from "../src/exam-platform/services/registryKnowledgeMerge.js";
import { loadLabDashboard } from "../src/exam-platform/adapters/labBridge.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function sampleDecision(overrides = {}) {
  return {
    needsHumanReview: true,
    confidence: 40,
    overallScore: 58,
    conflicts: [{ type: "test", description: "disagreement", involvedJudges: [] }],
    warnings: ["low confidence"],
    humanReviewReason: "conflicting_evaluations",
    ...overrides,
  };
}

describe("examinerLab Phase G", () => {
  let storage;

  beforeEach(() => {
    storage = memoryStorage();
    clearLabQueue();
    clearRuleRegistryCache();
    saveRuleRegistry(seedRuleRegistryFromKnowledge(), storage);
  });

  it("enqueues only policy-approved lab cases", () => {
    const result = maybeEnqueueLabCase({
      decision: sampleDecision(),
      productType: "ai_exam",
      reportId: "rep_1",
      sessionId: "sess_1",
      sectionEvaluations: [],
      storage,
    });
    expect(result.enqueued).toBe(true);
    expect(result.labItem?.classification).toBeTruthy();
  });

  it("does not enqueue weekly plan cases", () => {
    const result = maybeEnqueueLabCase({
      decision: sampleDecision(),
      productType: "weekly_plan",
      reportId: "rep_2",
      sessionId: "sess_2",
      sectionEvaluations: [],
      storage,
    });
    expect(result.enqueued).toBe(false);
  });

  it("resolves lab item with rule promotion into registry", () => {
    maybeEnqueueLabCase({
      decision: sampleDecision(),
      productType: "ai_exam",
      reportId: "rep_3",
      sessionId: "sess_3",
      sectionEvaluations: [],
      storage,
    });

    const pending = getPendingLabItems(storage);
    expect(pending).toHaveLength(1);

    const resolved = resolveLabItem({
      labItemId: pending[0].labItemId,
      action: "propose_rule",
      reviewerId: "reviewer_1",
      ruleProposal: {
        ruleText: "Wenn Aufgabenerfüllung unter 40 liegt, darf B1 nicht vergeben werden.",
        skill: "writing",
        level: "B1",
        patchType: "append_scoring_rule",
      },
      storage,
    });

    expect(resolved.promotedRule).toBeTruthy();
    expect(getPendingLabItems(storage)).toHaveLength(0);

    const registry = loadRuleRegistry(storage);
    expect(registry.promotedRules.length).toBe(1);
    expect(registry.meta.registryVersion).not.toBe("1.0.0-seed");
  });

  it("materializes promoted rules into effective judge knowledge", () => {
    promoteRuleDirectly({
      labItemId: "lab_test",
      reviewerId: "admin",
      ruleText: "Prüfe Konnektoren explizit bei B1 Schreiben.",
      skill: "writing",
      level: "B1",
      storage,
    });

    clearRuleRegistryCache();
    const knowledge = getEffectiveKnowledgeForJudge("B1", "writing", storage);
    expect(knowledge.scoringRules.some((r) => r.includes("Konnektoren"))).toBe(true);
  });

  it("loadLabDashboard exposes queue and registry stats", async () => {
    maybeEnqueueLabCase({
      decision: sampleDecision(),
      productType: "ai_exam",
      reportId: "rep_4",
      sessionId: "sess_4",
      sectionEvaluations: [],
      storage,
    });

    const dashboard = await loadLabDashboard(storage);
    expect(dashboard.pendingCount).toBe(1);
    expect(dashboard.promotedRulesCount).toBe(0);
    expect(dashboard.policy.maxNewCasesPerWeek).toBe(1);
  });
});

describe("rulePromotionService", () => {
  it("tracks proposals in storage", () => {
    const storage = memoryStorage();
    clearRuleRegistryCache();
    saveRuleRegistry(seedRuleRegistryFromKnowledge(), storage);

    promoteRuleDirectly({
      labItemId: "lab_x",
      reviewerId: "admin",
      ruleText: "Test rule",
      skill: "listening",
      level: "B1",
      storage,
    });

    const proposals = loadRuleProposals(storage);
    expect(proposals.some((p) => p.status === "approved")).toBe(true);
  });
});
