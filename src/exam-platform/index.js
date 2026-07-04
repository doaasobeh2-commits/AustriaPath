/**
 * AustriaPath Unified Exam Platform — public API (Phases A–F).
 * @module exam-platform
 */

export * from "./contracts.js";
export * from "./lifecycle.js";
export * from "./productPolicies.js";
export * from "./permanentPrinciples.js";
export * from "./subscriptionPolicy.js";
export * from "./examinerLabPolicy.js";
export * from "./notificationPolicy.js";

export { modelSelectionService, selectBlueprint } from "./modelSelectionService.js";
export { modelCatalogService, resolveSectionContentForBlueprint } from "./modelCatalogService.js";
export {
  studentProfileService,
  loadProfile,
  saveProfile,
  createEmptyProfile,
  mergeReportIntoProfile,
} from "./studentProfileService.js";

export { examOrchestrator } from "./examOrchestrator.js";
export { examEngine, createExamEngine } from "./examEngine.js";
export { sessionStore, EXAM_SESSION_STORAGE_KEY } from "./sessionStore.js";

export * from "./evaluators/index.js";

export { llmGateway } from "./services/llmGateway.js";
export { examinerCouncil, decideCouncil } from "./services/examinerCouncil.js";
export { reportBuilder, buildFinalReport } from "./services/reportBuilder.js";
export { examinerLabService } from "./services/examinerLabService.js";
export { labResolutionService, getPendingLabItems, resolveLabItem } from "./services/labResolutionService.js";
export { rulePromotionService, promoteRuleDirectly } from "./services/rulePromotionService.js";
export { registryKnowledgeMerge, getEffectiveKnowledgeForJudge } from "./services/registryKnowledgeMerge.js";
export { coachingEvents } from "./services/coachingEvents.js";
export {
  ruleRegistryService,
  loadRuleRegistry,
  seedRuleRegistryFromKnowledge,
} from "./services/ruleRegistryService.js";
export { examinerMindAdapter } from "./services/examinerMindAdapter.js";
export * from "./adapters/examEngineBridge.js";
export { getModelCatalog, buildModelCatalog } from "./adapters/modelCatalogBuilder.js";
export { blueprintToUiParts } from "./adapters/blueprintPartsMapper.js";
export { persistLegacyReport } from "./adapters/legacyReportAdapter.js";
