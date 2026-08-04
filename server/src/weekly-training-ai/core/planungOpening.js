/**
 * Planung conversation opening — AI partner speaks first.
 * @module weekly-training-ai/core/planungOpening
 */

/**
 * @param {object} modelSnapshot
 */
export function buildPlanungOpeningMessage(modelSnapshot) {
  const candidates =
    modelSnapshot?.examinerPrompts ||
    modelSnapshot?.followUpBranches ||
    modelSnapshot?.dialog ||
    [];

  for (const line of candidates) {
    const text = String(line || "").trim();
    if (!text) continue;
    const cleaned = text.replace(/^[AB]:\s*/i, "").trim();
    if (cleaned) return cleaned;
  }

  const title = String(modelSnapshot?.title || "die Planung").trim();
  return `Hallo. Lassen Sie uns ${title} planen.`;
}
