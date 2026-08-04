/**
 * Placeholder coverage engine — category AI not implemented in Phase 1.
 * @module weekly-training-ai/core/coverageEngine
 */

/**
 * @param {object} _session
 * @param {object} [_turn]
 */
export function computeCoveragePlaceholder(_session, _turn = {}) {
  return {
    coveredPoints: [],
    pendingPoints: [],
    phase: "placeholder",
  };
}
