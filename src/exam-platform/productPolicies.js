/**
 * Product policies — five products, one Exam Engine.
 * @module exam-platform/productPolicies
 */

/** @typedef {import('./contracts.js').ProductType} ProductType */

/**
 * @typedef {Object} ProductPolicy
 * @property {ProductType} productType
 * @property {'diagnostic'|'practice'|'exam'} mode
 * @property {boolean} updatesOfficialLevel
 * @property {boolean} updatesOfficialSkillLevels
 * @property {boolean} updatesPracticeStats
 * @property {'low'|'medium'|'high'} adaptivity
 * @property {'soft'|'hard'} timingPolicy
 * @property {number} [defaultDurationMinutes]
 * @property {number} [examCount]
 * @property {boolean} fullExamStructure
 * @property {boolean} labEligible
 * @property {boolean} llmProposalsAllowed
 * @property {boolean} showReadinessBand
 * @property {number} confidenceReviewThreshold
 * @property {number} difficultyProgressionStep
 * @property {string} evaluationMethodDefault
 */

/** @type {Record<ProductType, ProductPolicy>} */
export const ProductPolicies = Object.freeze({
  placement_test: Object.freeze({
    productType: "placement_test",
    mode: "diagnostic",
    updatesOfficialLevel: true,
    updatesOfficialSkillLevels: true,
    updatesPracticeStats: false,
    adaptivity: "high",
    timingPolicy: "soft",
    defaultDurationMinutes: 45,
    examCount: 1,
    fullExamStructure: false,
    labEligible: false,
    llmProposalsAllowed: false,
    showReadinessBand: true,
    confidenceReviewThreshold: 60,
    difficultyProgressionStep: 1,
    evaluationMethodDefault: "rule_placement",
  }),

  weekly_plan: Object.freeze({
    productType: "weekly_plan",
    mode: "practice",
    updatesOfficialLevel: false,
    updatesOfficialSkillLevels: false,
    updatesPracticeStats: true,
    adaptivity: "medium",
    timingPolicy: "soft",
    defaultDurationMinutes: 20,
    examCount: 0,
    fullExamStructure: false,
    labEligible: false,
    llmProposalsAllowed: false,
    showReadinessBand: false,
    confidenceReviewThreshold: 100,
    difficultyProgressionStep: 0,
    evaluationMethodDefault: "practice_heuristic",
  }),

  ai_exam: Object.freeze({
    productType: "ai_exam",
    mode: "exam",
    updatesOfficialLevel: true,
    updatesOfficialSkillLevels: true,
    updatesPracticeStats: false,
    adaptivity: "low",
    timingPolicy: "hard",
    defaultDurationMinutes: 90,
    examCount: 1,
    fullExamStructure: true,
    labEligible: true,
    llmProposalsAllowed: true,
    showReadinessBand: true,
    confidenceReviewThreshold: 65,
    difficultyProgressionStep: 0,
    evaluationMethodDefault: "examiner_mind",
  }),

  intensive_week: Object.freeze({
    productType: "intensive_week",
    mode: "exam",
    updatesOfficialLevel: true,
    updatesOfficialSkillLevels: true,
    updatesPracticeStats: false,
    adaptivity: "medium",
    timingPolicy: "hard",
    defaultDurationMinutes: 90,
    examCount: 3,
    fullExamStructure: true,
    labEligible: true,
    llmProposalsAllowed: true,
    showReadinessBand: true,
    confidenceReviewThreshold: 65,
    difficultyProgressionStep: 1,
    evaluationMethodDefault: "examiner_mind",
  }),

  premium_month: Object.freeze({
    productType: "premium_month",
    mode: "exam",
    updatesOfficialLevel: true,
    updatesOfficialSkillLevels: true,
    updatesPracticeStats: false,
    adaptivity: "medium",
    timingPolicy: "hard",
    defaultDurationMinutes: 90,
    examCount: 5,
    fullExamStructure: true,
    labEligible: true,
    llmProposalsAllowed: true,
    showReadinessBand: true,
    confidenceReviewThreshold: 65,
    difficultyProgressionStep: 1,
    evaluationMethodDefault: "examiner_mind",
  }),
});

/** @param {ProductType} productType */
export function getProductPolicy(productType) {
  const policy = ProductPolicies[productType];
  if (!policy) throw new Error(`Unknown product type: ${productType}`);
  return policy;
}

/** @param {ProductType} productType */
export function mayUpdateOfficialLevel(productType) {
  return ProductPolicies[productType]?.updatesOfficialLevel === true;
}

export const SelectionWeights = Object.freeze({
  placement_test: Object.freeze({
    weakSkillWeight: 1.5,
    neutralWeight: 1.0,
    strongSkillWeight: 0.8,
    dedupScope: "session",
  }),
  weekly_plan: Object.freeze({
    weakSkillWeight: 2.0,
    neutralWeight: 1.0,
    strongSkillWeight: 0.5,
    dedupScope: "global",
  }),
  ai_exam: Object.freeze({
    weakSkillWeight: 2.0,
    neutralWeight: 1.0,
    strongSkillWeight: 0.5,
    dedupScope: "global",
  }),
  intensive_week: Object.freeze({
    weakSkillWeight: 2.0,
    neutralWeight: 1.0,
    strongSkillWeight: 0.5,
    dedupScope: "package",
  }),
  premium_month: Object.freeze({
    weakSkillWeight: 2.2,
    neutralWeight: 1.0,
    strongSkillWeight: 0.4,
    dedupScope: "package",
  }),
});
