/**
 * Exam Engine Bridge — wires legacy screens to the unified Exam Engine (Phase F).
 *
 * @module exam-platform/adapters/examEngineBridge
 */

import { createExamEngine } from "../examEngine.js";
import { selectBlueprint } from "../modelSelectionService.js";
import { loadProfile, saveProfile } from "../studentProfileService.js";
import { getProductPolicy } from "../productPolicies.js";
import { loadRuleRegistry } from "../services/ruleRegistryService.js";
import { getModelCatalog } from "./modelCatalogBuilder.js";
import {
  blueprintToUiParts,
  groupPartsByPlatformSection,
  buildSectionAnswerFromUiParts,
  buildSectionContentFromUiParts,
  partTypeToSkill,
} from "./blueprintPartsMapper.js";
import {
  persistLegacyReport,
  syncLegacyPlacementProfile,
} from "./legacyReportAdapter.js";
import { findCatalogEntry, resolveSectionContentForBlueprint } from "../modelCatalogService.js";
import { useBackend } from "../../api/useBackend.js";
import {
  startExamSession as apiStartExamSession,
  submitExamSection as apiSubmitExamSection,
  completeExamSession as apiCompleteExamSession,
} from "../../api/repositories/index.js";
import { backendCache } from "../../api/backendCache.js";
import { finalReportToLegacyShape } from "./legacyReportAdapter.js";

export const BRIDGE_VERSION = "1.0.0-phase-f";

const PLATFORM_SESSION_KEY = "austriaPathPlatformSessionMeta";

/**
 * @param {Storage|null|undefined} [storage]
 */
export function loadSubscriptionRecord(storage = localStorage) {
  try {
    return JSON.parse(storage.getItem("austriaPathSubscription") || "null");
  } catch {
    return null;
  }
}

/**
 * @param {Storage|null|undefined} [storage]
 */
export function saveSubscriptionRecord(subscription, storage = localStorage) {
  if (subscription) {
    storage.setItem("austriaPathSubscription", JSON.stringify(subscription));
  }
}

/**
 * @param {import('../contracts.js').ProductType} productType
 * @param {Object} [options]
 */
export function createBridgeEngine(productType, options = {}) {
  const catalog = options.catalog || getModelCatalog();
  const storage = options.storage ?? localStorage;
  const registry = loadRuleRegistry(storage);
  const subscription = options.subscription ?? loadSubscriptionRecord(storage);

  return createExamEngine({
    catalog,
    storage,
    subscription,
    rulesVersion: registry.meta.registryVersion,
  });
}

/**
 * Preview blueprint + UI parts without starting a session (no subscription consume).
 *
 * @param {Object} params
 * @param {import('../contracts.js').ProductType} params.productType
 * @param {string} [params.level]
 * @param {number} [params.examIndex]
 * @param {number} [params.examTotal]
 */
export function previewExamContent({
  productType,
  level = "B1",
  examIndex = 1,
  examTotal,
}) {
  const catalog = getModelCatalog();
  const profile = loadProfile(localStorage);
  const policy = getProductPolicy(productType);
  const total = examTotal || policy.examCount || 1;

  const blueprint = selectBlueprint({
    productType,
    profile: { ...profile, officialExamLevel: level },
    catalog,
    examIndex,
    examTotal: total,
  });

  const parts = blueprintToUiParts(blueprint, catalog);

  return { blueprint, parts, catalog };
}

/**
 * @param {Object} params
 * @param {import('../contracts.js').ProductType} params.productType
 * @param {string} [params.level]
 * @param {number} [params.examIndex]
 * @param {import('../contracts.js').ExamBlueprint} [params.blueprint]
 */
export async function startPlatformSession({
  productType,
  level = "B1",
  examIndex = 1,
  blueprint,
}) {
  if (useBackend()) {
    const data = await apiStartExamSession({
      productType,
      levelOverride: level,
      examIndex,
      blueprint,
    });
    const catalog = getModelCatalog();
    const meta = {
      sessionId: data.sessionId,
      productType,
      level,
      examIndex,
      blueprintId: data.session?.blueprint?.blueprintId,
    };
    localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(meta));
    return {
      engine: null,
      catalog,
      sessionId: data.sessionId,
      session: data.session,
      parts: blueprint
        ? blueprintToUiParts(blueprint, catalog)
        : blueprintToUiParts(data.session.blueprint, catalog),
    };
  }

  const engine = createBridgeEngine(productType);
  const catalog = getModelCatalog();

  const startResult = engine.start({
    productType,
    levelOverride: level,
    examIndex,
    blueprint,
  });

  const subscription = loadSubscriptionRecord(localStorage);
  saveSubscriptionRecord(subscription, localStorage);

  const meta = {
    sessionId: startResult.sessionId,
    productType,
    level,
    examIndex,
    blueprintId: startResult.session.blueprint.blueprintId,
  };

  localStorage.setItem(PLATFORM_SESSION_KEY, JSON.stringify(meta));

  return {
    engine,
    catalog,
    ...startResult,
    parts: blueprint
      ? blueprintToUiParts(blueprint, catalog)
      : blueprintToUiParts(startResult.session.blueprint, catalog),
  };
}

/**
 * @param {string} sessionId
 */
export function getBridgeEngineForSession(sessionId) {
  const meta = JSON.parse(localStorage.getItem(PLATFORM_SESSION_KEY) || "null");
  const productType = meta?.sessionId === sessionId ? meta.productType : "ai_exam";
  return createBridgeEngine(productType);
}

/**
 * Submit all UI parts grouped by platform section, then complete.
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {Record<string, unknown>[]} params.parts
 * @param {Record<string, string>} params.uiAnswers
 * @param {Object} [params.legacyMeta]
 */
export async function finalizePlatformSession({
  sessionId,
  parts,
  uiAnswers,
  legacyMeta = {},
}) {
  if (useBackend()) {
    const groups = groupPartsByPlatformSection(parts);
    let stepOffset = 0;
    const sectionIndexes = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);

    for (const sectionIndex of sectionIndexes) {
      const sectionParts = groups[sectionIndex];
      const answer = buildSectionAnswerFromUiParts(sectionParts, uiAnswers, stepOffset);
      const sectionContent = buildSectionContentFromUiParts(sectionParts);
      await apiSubmitExamSection(sessionId, { answer, sectionContent });
      stepOffset += sectionParts.length;
    }

    const result = await apiCompleteExamSession(sessionId);
    const legacy = finalReportToLegacyShape(result.report, {
      ...legacyMeta,
      partsCount: parts.length,
    });
    backendCache.reports = [legacy, ...(backendCache.reports || [])];
    if (result.profile) backendCache.profile = result.profile;
    localStorage.removeItem(PLATFORM_SESSION_KEY);
    return { ...result, legacyReport: legacy };
  }

  const engine = getBridgeEngineForSession(sessionId);
  const catalog = getModelCatalog();
  const groups = groupPartsByPlatformSection(parts);

  let stepOffset = 0;
  const sectionIndexes = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  for (const sectionIndex of sectionIndexes) {
    const sectionParts = groups[sectionIndex];
    const answer = buildSectionAnswerFromUiParts(sectionParts, uiAnswers, stepOffset);
    const sectionContent = buildSectionContentFromUiParts(sectionParts);

    const entry = findCatalogEntry(catalog, answer.modelId);
    const resolvedContent = entry
      ? { ...resolveSectionContentForBlueprint(catalog, { modelId: answer.modelId, skill: answer.skill, sectionIndex }), ...sectionContent }
      : sectionContent;

    await engine.submitSection(sessionId, answer, resolvedContent);
    stepOffset += sectionParts.length;
  }

  const result = await engine.complete(sessionId);
  const legacy = persistLegacyReport(result.report, {
    ...legacyMeta,
    partsCount: parts.length,
  });

  if (result.report.productType === "placement_test") {
    syncLegacyPlacementProfile(result.profile);
  }

  saveProfile(result.profile, localStorage);
  localStorage.removeItem(PLATFORM_SESSION_KEY);

  return { ...result, legacyReport: legacy };
}

/**
 * Build a premium exam package using model selection (no random pick).
 *
 * @param {Object} params
 * @param {string} [params.level]
 * @param {import('../contracts.js').ProductType} [params.packageType]
 */
export function buildPlatformPremiumPackage({
  level = "B1",
  packageType = "ai_exam",
} = {}) {
  const policy = getProductPolicy(packageType);
  const examCount = policy.examCount > 0 ? policy.examCount : 1;

  const exams = Array.from({ length: examCount }).map((_, index) => {
    const examIndex = index + 1;
    const { blueprint, parts } = previewExamContent({
      productType: packageType,
      level,
      examIndex,
      examTotal: examCount,
    });

    return {
      id: `${packageType}-${level}-${examIndex}`,
      title:
        packageType === "premium_month"
          ? `Premium Monat · Prüfung ${examIndex}`
          : packageType === "intensive_week"
            ? `Intensive Woche · Prüfung ${examIndex}`
            : `AI Probeprüfung ${level}`,
      level,
      packageType,
      examNumber: examIndex,
      parts,
      platformBlueprint: blueprint,
      platformProductType: packageType,
      createdAt: new Date().toISOString(),
      status: "ready",
    };
  });

  return {
    level,
    packageType,
    title:
      packageType === "premium_month"
        ? `Premium Monat ${level}`
        : packageType === "intensive_week"
          ? `Intensive Woche ${level}`
          : `AI Probeprüfung ${level}`,
    durationMinutes: level === "A2" ? 12 : level === "B1" ? 20 : 25,
    totalExams: examCount,
    exams,
    createdAt: new Date().toISOString(),
    source: "exam-platform",
  };
}

/**
 * AISessionScreen helper — map session parts to platform flow.
 */
export async function finalizeAiSessionParts({
  sessionType = "weekly_plan",
  level = "B1",
  parts = [],
  uiAnswers = {},
  legacyMeta = {},
}) {
  const productType =
    sessionType === "placement_test"
      ? "placement_test"
      : sessionType === "ai_exam" ||
          sessionType === "intensive_week" ||
          sessionType === "premium_month"
        ? sessionType
        : "weekly_plan";

  const mappedParts = parts.map((part, index) => ({
    ...part,
    platformSectionIndex: index,
    platformSkill: partTypeToSkill(part.type),
    modelId: part.modelId || `${productType}-${part.type}-${index}`,
  }));

  const blueprint = buildBlueprintFromFlow(
    mappedParts.map((part) => ({
      id: part.modelId,
      skill: part.platformSkill,
      difficulty: "mittel",
    })),
    productType,
    level
  );

  const { sessionId } = await startPlatformSession({ productType, level, blueprint });

  return finalizePlatformSession({
    sessionId,
    parts: mappedParts,
    uiAnswers,
    legacyMeta: {
      ...legacyMeta,
      title: legacyMeta.title,
      type: sessionType,
      results: legacyMeta.results,
    },
  });
}

/**
 * Build blueprint from a predefined flow (e.g. placement test UI).
 *
 * @param {Object[]} flow
 * @param {import('../contracts.js').ProductType} productType
 * @param {string} level
 */
export function buildBlueprintFromFlow(flow, productType, level) {
  const skillMap = {
    selbstvorstellung: "self_introduction",
    bildbeschreibung: "picture_description",
    hoeren: "listening",
    planung: "planning",
    diskussion: "discussion",
    grafikbeschreibung: "picture_description",
  };

  const registry = loadRuleRegistry(localStorage);

  return {
    blueprintId: `flow_${Date.now()}`,
    productType,
    mode: getProductPolicy(productType).mode,
    targetLevel: level,
    sections: flow.map((model, index) => ({
      sectionIndex: index,
      modelId: model.id,
      skill: skillMap[model.skill] || model.skill || "self_introduction",
      difficulty: model.difficulty || "mittel",
    })),
    rulesVersion: registry.meta.registryVersion,
    createdAt: new Date().toISOString(),
  };
}

/**
 * @param {Object} params
 * @param {string} params.selectedLevel
 * @param {Record<string, string>} params.skillScores
 * @param {Object[]} params.flow
 */
export async function finalizePlacementTest({ selectedLevel, skillScores, flow }) {
  const skillMap = {
    selbstvorstellung: "self_introduction",
    bildbeschreibung: "picture_description",
    hoeren: "listening",
    planung: "planning",
    diskussion: "discussion",
    grafikbeschreibung: "picture_description",
  };

  const mappedParts = flow.map((model, index) => ({
    ...model,
    platformSectionIndex: index,
    platformSkill: skillMap[model.skill] || "self_introduction",
    modelId: model.id || `placement-${index}`,
  }));

  const uiAnswers = {};
  mappedParts.forEach((model) => {
    const simulatedLevel = skillScores[model.skill] || "A2";
    uiAnswers[model.modelId] =
      `[Einstufung ${simulatedLevel}] ${model.studentPreview || model.prompt || ""}`;
  });

  const blueprint = buildBlueprintFromFlow(flow, "placement_test", selectedLevel);

  if (useBackend()) {
    const { sessionId } = await startPlatformSession({
      productType: "placement_test",
      level: selectedLevel,
      blueprint,
    });

    const result = await finalizePlatformSession({
      sessionId,
      parts: mappedParts,
      uiAnswers,
      legacyMeta: {
        title: `Einstufungstest ${selectedLevel}`,
        type: "placement_test",
      },
    });

    syncLegacyPlacementProfile(result.profile);
    if (result.profile) saveProfile(result.profile, localStorage);

    return {
      ...result,
      placementProfile: {
        level: result.report?.cefrLevel || selectedLevel,
        selectedStartLevel: selectedLevel,
        date: result.report?.createdAt || new Date().toISOString(),
        skillScores,
        strengths: result.report?.strengths || [],
        weaknesses: result.report?.weaknesses || [],
        focusAreas: result.report?.focusAreas || [],
        recommendedFocus: result.report?.focusAreas || [],
        studyPlan: [],
      },
    };
  }

  const { sessionId } = await startPlatformSession({
    productType: "placement_test",
    level: selectedLevel,
    blueprint,
  });

  const engine = getBridgeEngineForSession(sessionId);

  for (let i = 0; i < flow.length; i++) {
    const model = flow[i];
    const skillMap = {
      selbstvorstellung: "self_introduction",
      bildbeschreibung: "picture_description",
      hoeren: "listening",
      planung: "planning",
      diskussion: "discussion",
      grafikbeschreibung: "picture_description",
    };
    const skill = skillMap[model.skill] || "self_introduction";
    const simulatedLevel = skillScores[model.skill] || "A2";

    await engine.submitSection(
      sessionId,
      {
        sectionIndex: i,
        skill,
        modelId: model.id,
        freeText: `[Einstufung ${simulatedLevel}] ${model.studentPreview || model.prompt || ""}`,
      },
      { prompt: model.studentPreview, kind: "placement" }
    );
  }

  const result = await engine.complete(sessionId);
  const legacy = persistLegacyReport(result.report, {
    title: `Einstufungstest ${result.report.cefrLevel}`,
    type: "placement_test",
  });

  syncLegacyPlacementProfile(result.profile);
  saveProfile(result.profile, localStorage);

  return {
    ...result,
    legacyReport: legacy,
    placementProfile: {
      level: result.report.cefrLevel,
      selectedStartLevel: selectedLevel,
      date: result.report.createdAt,
      skillScores,
      strengths: result.report.strengths,
      weaknesses: result.report.weaknesses,
      focusAreas: result.report.focusAreas,
      recommendedFocus: result.report.focusAreas,
      studyPlan: [],
    },
  };
}

export const examEngineBridge = {
  version: BRIDGE_VERSION,
  createBridgeEngine,
  previewExamContent,
  startPlatformSession,
  finalizePlatformSession,
  buildPlatformPremiumPackage,
  buildBlueprintFromFlow,
  finalizeAiSessionParts,
  finalizePlacementTest,
};
