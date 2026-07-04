/**
 * LLM Gateway — proposals only; no direct scoring (Phase D stub).
 * Production OpenAI integration plugs in here without engine changes.
 *
 * @module exam-platform/services/llmGateway
 */

export const LLM_GATEWAY_VERSION = "1.0.0-stub";

/**
 * @typedef {Object} LLMGatewayContext
 * @property {import('../contracts.js').SectionAnswer} answer
 * @property {import('../contracts.js').SectionEvaluation} evaluation
 * @property {import('../contracts.js').SkillId} skill
 * @property {import('../contracts.js').ProductType} productType
 * @property {Record<string, unknown>} [sectionContent]
 */

/**
 * No-op stub — returns empty proposals until production gateway is wired.
 *
 * @param {LLMGatewayContext} _context
 * @returns {Promise<import('../contracts.js').LLMProposal[]>}
 */
export async function proposeSectionAnalysis(_context) {
  return [];
}

/**
 * Batch proposals for session completion (optional hook).
 *
 * @param {Object} _params
 * @param {import('../contracts.js').SectionEvaluation[]} _params.evaluations
 * @param {import('../contracts.js').ProductType} _params.productType
 * @returns {Promise<import('../contracts.js').LLMProposal[]>}
 */
export async function proposeSessionSummary(_params) {
  return [];
}

export const llmGateway = {
  version: LLM_GATEWAY_VERSION,
  proposeSectionAnalysis,
  proposeSessionSummary,
};
