import { describe, expect, it, beforeEach } from "vitest";
import {
  buildPlatformPremiumPackage,
  buildBlueprintFromFlow,
  previewExamContent,
} from "../src/exam-platform/adapters/examEngineBridge.js";
import {
  getModelCatalog,
  clearModelCatalogCache,
} from "../src/exam-platform/adapters/modelCatalogBuilder.js";
import { blueprintToUiParts } from "../src/exam-platform/adapters/blueprintPartsMapper.js";
import { finalReportToLegacyShape } from "../src/exam-platform/adapters/legacyReportAdapter.js";
import { createEmptyProfile, saveProfile } from "../src/exam-platform/studentProfileService.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

describe("modelCatalogBuilder", () => {
  beforeEach(() => clearModelCatalogCache());

  it("builds a non-empty catalog with B1 writing models", () => {
    const catalog = getModelCatalog();
    expect(catalog.length).toBeGreaterThan(20);
    expect(catalog.some((e) => e.skill === "writing" && e.level === "B1")).toBe(true);
    expect(catalog.some((e) => e.allowedProducts?.includes("weekly_plan"))).toBe(true);
  });
});

describe("examEngineBridge", () => {
  beforeEach(() => {
    clearModelCatalogCache();
    const storage = memoryStorage();
    saveProfile({ ...createEmptyProfile(), officialExamLevel: "B1" }, storage);
  });

  it("previews exam content via model selection", () => {
    const { blueprint, parts } = previewExamContent({
      productType: "ai_exam",
      level: "B1",
    });
    expect(blueprint.sections.length).toBeGreaterThan(0);
    expect(parts.length).toBeGreaterThan(0);
  });

  it("builds premium package with platform blueprints", () => {
    const pkg = buildPlatformPremiumPackage({ level: "B1", packageType: "ai_exam" });
    expect(pkg.exams).toHaveLength(1);
    expect(pkg.exams[0].platformBlueprint).toBeTruthy();
    expect(pkg.exams[0].parts.length).toBeGreaterThan(0);
    expect(pkg.source).toBe("exam-platform");
  });

  it("builds blueprint from placement flow", () => {
    const blueprint = buildBlueprintFromFlow(
      [
        { id: "a2_self_mittel", skill: "selbstvorstellung" },
        { id: "a2_bild_leicht", skill: "bildbeschreibung" },
      ],
      "placement_test",
      "A2"
    );
    expect(blueprint.sections).toHaveLength(2);
    expect(blueprint.sections[0].skill).toBe("self_introduction");
  });
});

describe("legacyReportAdapter", () => {
  it("maps FinalReport to legacy profile report shape", () => {
    const legacy = finalReportToLegacyShape(
      {
        reportId: "rep_1",
        productType: "weekly_plan",
        mode: "practice",
        cefrLevel: "B1",
        overallScore: 72,
        confidence: 80,
        strengths: ["reading"],
        weaknesses: ["listening"],
        focusAreas: ["listening"],
        summary: "Test summary",
        recommendations: ["Üben"],
        councilDecision: {},
        disclaimer: "test",
        rulesVersion: "1.0.0",
        blueprintId: "bp_1",
        createdAt: new Date().toISOString(),
      },
      { title: "Weekly" }
    );

    expect(legacy.title).toBe("Weekly");
    expect(legacy.platformReportId).toBe("rep_1");
    expect(legacy.level).toBe("B1");
  });
});

describe("blueprintPartsMapper", () => {
  it("expands B1 lesen model into cloze + ads parts", () => {
    const catalog = getModelCatalog();
    const entry = catalog.find((e) => e.id === "b1-lesen-01");
    expect(entry).toBeTruthy();

    const parts = blueprintToUiParts(
      {
        blueprintId: "bp_test",
        productType: "ai_exam",
        mode: "exam",
        targetLevel: "B1",
        sections: [{ sectionIndex: 0, modelId: "b1-lesen-01", skill: "reading", difficulty: "mittel" }],
        rulesVersion: "1.0.0",
        createdAt: new Date().toISOString(),
      },
      catalog
    );

    expect(parts.length).toBe(2);
    expect(parts[0].type).toBe("reading_cloze");
    expect(parts[1].type).toBe("reading_ads");
  });
});
