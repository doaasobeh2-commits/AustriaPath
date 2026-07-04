/**
 * Integration map — legacy modules → Unified Exam Platform.
 * Phase A documentation only.
 *
 * @module exam-platform/integrationMap
 */

/** @typedef {Object} IntegrationPoint */

export const SCREEN_INTEGRATIONS = Object.freeze([
  {
    legacyPath: "src/app/screens/PlacementTestScreen.jsx",
    platformComponent: "IExamEngine.start(placement_test)",
    strategy: "adapter",
    phase: "F",
    notes: "UI unchanged; replace manual stub with engine.",
  },
  {
    legacyPath: "src/app/screens/AISessionScreen.jsx",
    platformComponent: "IExamEngine.start(weekly_plan | ai_exam)",
    strategy: "replace",
    phase: "F",
    notes: "Retire heuristics; use Skill Evaluators.",
  },
  {
    legacyPath: "src/app/screens/WeeklyPlanSessionScreen.jsx",
    platformComponent: "IExamEngine.start(weekly_plan)",
    strategy: "merge",
    phase: "F",
    notes: "Consolidate with AISession path.",
  },
  {
    legacyPath: "src/app/screens/PremiumExamSessionScreen.jsx",
    platformComponent: "IExamEngine.start(premium products)",
    strategy: "adapter",
    phase: "D",
    notes: "Per-section evaluation; keep UI.",
  },
  {
    legacyPath: "src/app/screens/IntelligentExamScreen.jsx",
    platformComponent: "Orchestrator + ILLMGateway",
    strategy: "merge",
    phase: "D",
    notes: "No standalone examination path.",
  },
  {
    legacyPath: "src/app/screens/WeeklyPlanSetupScreen.jsx",
    platformComponent: "IStudentProfileService.load",
    strategy: "adapter",
    phase: "F",
    notes: "Defaults from profile; manual override kept.",
  },
  {
    legacyPath: "src/app/screens/ProfileScreen.jsx",
    platformComponent: "StudentProfile V2 + FinalReport",
    strategy: "adapter",
    phase: "E",
    notes: "Data source change only.",
  },
  {
    legacyPath: "src/app/screens/ExaminerLabScreen.jsx",
    platformComponent: "IExaminerLabService",
    strategy: "replace",
    phase: "G",
    notes: "Queue when needsHumanReview only.",
  },
]);

export const DATA_INTEGRATIONS = Object.freeze([
  {
    legacyPath: "src/data/premiumExamBuilder.js",
    platformComponent: "IModelSelectionService",
    strategy: "deprecate",
    phase: "B",
    notes: "Replace random selection.",
  },
  {
    legacyPath: "src/data/weeklyPlanLibrary.js",
    platformComponent: "Model Catalog",
    strategy: "adapter",
    phase: "F",
    notes: "Weekly tasks as catalog entries.",
  },
  {
    legacyPath: "src/data/aiPlacementLibrary.js",
    platformComponent: "ProductPolicy placement_test",
    strategy: "adapter",
    phase: "F",
    notes: "Wire adaptivity rules.",
  },
  {
    legacyPath: "src/data/aiPremiumLibrary.js",
    platformComponent: "Model Catalog + Rule Registry",
    strategy: "merge",
    phase: "B",
    notes: "Eliminate dual source.",
  },
  {
    legacyPath: "localStorage austriaPathAiPrueferLibrary",
    platformComponent: "austriaPathRuleRegistry",
    strategy: "merge",
    phase: "G",
    notes: "Single Rule Registry.",
  },
]);

export const EXAMINER_MIND_INTEGRATIONS = Object.freeze([
  {
    legacyPath: "src/ai/examinerMind/runExaminerMind.js",
    platformComponent: "IExaminerCouncil",
    strategy: "adapter",
    phase: "E",
    notes: "Input: SectionEvaluation[].",
  },
  {
    legacyPath: "src/ai/examinerMind/judges/*.js",
    platformComponent: "Fusion judges",
    strategy: "merge",
    phase: "E",
    notes: "Skill scores from evaluators.",
  },
  {
    legacyPath: "src/ai/examinerMind/knowledge/**/*.js",
    platformComponent: "Rule Registry seed",
    strategy: "merge",
    phase: "G",
    notes: "Seed austriaPathRuleRegistry.",
  },
  {
    legacyPath: "src/ai/examinerMind/core/decisionEngine.js",
    platformComponent: "DecisionEngine + ConfidenceManager",
    strategy: "adapter",
    phase: "E",
    notes: "B2 CEFR bands; judge ids.",
  },
  {
    legacyPath: "src/ai/examinerMind/learning/errorLearningEngine.js",
    platformComponent: "Internal telemetry",
    strategy: "adapter",
    phase: "G",
    notes: "Not the Lab queue.",
  },
  {
    legacyPath: "src/ai/examinerMind/student/studentProfileEngine.js",
    platformComponent: "IStudentProfileService",
    strategy: "replace",
    phase: "B",
    notes: "Official vs practice split.",
  },
]);

export const STORAGE_MIGRATION_MAP = Object.freeze({
  austriaPathPlacementProfile: "StudentProfile.officialExamLevel (initial)",
  austriaPathStudentProfile: "austriaPathStudentProfileV2",
  austriaPathAIReports: "austriaPathExamReports",
  austriaPathAiPrueferLibrary: "austriaPathRuleRegistry",
  austriaPathAIErrorLog: "internalTelemetry",
  austriaPathCurrentAISession: "austriaPathExamSession",
  austriaPathAiSession: "austriaPathExamSession",
});

export const PHASE_A_CONTRACTS_ONLY = Object.freeze([
  "IExamEngine",
  "IModelSelectionService",
  "IExamOrchestrator",
  "ILLMGateway",
  "IExaminerLabService",
]);
