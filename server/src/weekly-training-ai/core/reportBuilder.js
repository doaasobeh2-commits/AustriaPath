/**
 * Final report builder for B1 Weekly Training AI sessions.
 * @module weekly-training-ai/core/reportBuilder
 */

import { B1_SCHREIBEN_HANDLER_VERSION } from "../handlers/b1-schreiben.handler.js";

export const B1_WEEKLY_TRAINING_REPORT_VERSION = "b1-weekly-training-ai-v1";

/**
 * @param {object} session
 */
export function buildPlaceholderFinalReport(session) {
  return {
    version: B1_WEEKLY_TRAINING_REPORT_VERSION,
    status: "placeholder",
    category: session.category,
    modelId: session.modelId,
    modelVersion: session.modelVersion,
    message: "Phase 1 lifecycle complete — category AI report not yet implemented.",
  };
}

/**
 * @param {object} session
 * @param {object} correction
 */
export function buildB1SchreibenFinalReport(session, correction) {
  return {
    version: B1_SCHREIBEN_HANDLER_VERSION,
    category: "schreiben",
    modelId: correction.modelId,
    modelVersion: correction.modelVersion,
    selectedEmailIndex: correction.selectedEmailIndex,
    originalText: correction.originalText,
    correctedText: correction.correctedText,
    coveredPoints: correction.coveredPoints,
    missingPoints: correction.missingPoints,
    learnerTextHash: correction.learnerTextHash,
    submission: correction.submission,
    generatedAt: correction.generatedAt,
    sessionId: session.id,
  };
}
