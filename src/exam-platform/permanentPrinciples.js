/**
 * Permanent product principles — authoritative reference for all phases.
 * @module exam-platform/permanentPrinciples
 */

export const PERMANENT_PRINCIPLES = Object.freeze({
  EXAMINER_LAB: Object.freeze({
    neverStoreAllReports: true,
    qualityOverQuantity: true,
    targetVolume: "approximately one valuable case per week",
    selectionCriteria: Object.freeze([
      "exceptional_ai_mistake",
      "conflicting_evaluations",
      "novel_situation",
      "human_confirmed_or_corrected",
    ]),
  }),

  NOTIFICATIONS: Object.freeze({
    intelligentAndMinimal: true,
    noDailyEngagementSpam: true,
    weeklyPlanMaxPerWeek: 2,
    mustUseActualWeaknesses: true,
    respectCooldowns: true,
    tone: "professional examiner, not marketing",
  }),

  REPORTS: Object.freeze({
    centralProduct: true,
    structuredForProgressComparison: true,
    requiredFields: Object.freeze([
      "cefrReadiness",
      "skillScores",
      "strengths",
      "weaknesses",
      "confidence",
      "improvementPriorities",
      "studyRecommendations",
      "weeklyPlanMapping",
    ]),
  }),

  SUBSCRIPTIONS: Object.freeze({
    productPolicyNotUiLogic: true,
    engineMustValidateBeforePremiumExam: true,
  }),

  STUDENT_PROFILE: Object.freeze({
    longTermMemory: true,
    avoidDuplicateStorage: true,
    storeReportSummariesNotFullDuplicates: true,
  }),

  EXAMINER_MIND: Object.freeze({
    aiProposes: true,
    councilDecides: true,
    approvedRulesPermanent: true,
    ruleRegistrySingleSourceOfTruth: true,
    learnOnlyFromHumanApprovedLabCorrections: true,
  }),

  SCALABILITY: Object.freeze({
    aiModelAgnostic: true,
    reusableWithoutOpenAI: true,
  }),

  MISSION: Object.freeze({
    goal: "trustworthy digital examiner — consistent exams, reliable reports, continuous learning, explainable and production-ready",
  }),
});
