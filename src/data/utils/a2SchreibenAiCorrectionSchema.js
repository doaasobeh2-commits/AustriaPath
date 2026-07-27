/**
 * Shared schema + validation for A2 Schreiben AI correction responses.
 * @module data/utils/a2SchreibenAiCorrectionSchema
 */

export const A2_SCHREIBEN_AI_CORRECTION_METHOD = 'a2-schreiben-ai-correction-v1';

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, data: object } | { ok: false, errors: string[] }}
 */
export function validateA2SchreibenAiCorrectionResponse(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Response is not an object.'] };
  }

  const correctedEmail = String(raw.correctedEmail || '').trim();
  if (!correctedEmail || correctedEmail.length < 20) {
    errors.push('correctedEmail is missing or too short.');
  }

  const corrections = Array.isArray(raw.corrections) ? raw.corrections : [];
  corrections.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`corrections[${index}] is invalid.`);
      return;
    }
    if (!String(item.original || '').trim()) errors.push(`corrections[${index}].original is required.`);
    if (!String(item.corrected || '').trim()) errors.push(`corrections[${index}].corrected is required.`);
    if (!String(item.explanation || '').trim()) errors.push(`corrections[${index}].explanation is required.`);
  });

  const addedMissingPoints = Array.isArray(raw.addedMissingPoints) ? raw.addedMissingPoints : [];
  addedMissingPoints.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`addedMissingPoints[${index}] is invalid.`);
      return;
    }
    if (!String(item.point || '').trim()) errors.push(`addedMissingPoints[${index}].point is required.`);
    if (!String(item.addedText || '').trim()) errors.push(`addedMissingPoints[${index}].addedText is required.`);
  });

  const positiveFeedback = asStringArray(raw.positiveFeedback);
  const learningTip = String(raw.learningTip || '').trim();
  if (!learningTip) {
    errors.push('learningTip is required.');
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      correctedEmail,
      corrections: corrections.map((item) => ({
        original: String(item.original).trim(),
        corrected: String(item.corrected).trim(),
        explanation: String(item.explanation).trim(),
      })),
      addedMissingPoints: addedMissingPoints.map((item) => ({
        point: String(item.point).trim(),
        addedText: String(item.addedText).trim(),
      })),
      positiveFeedback,
      learningTip,
    },
  };
}

/**
 * @param {object} params
 */
export function buildSchreibenCorrectionRequest({
  taskId,
  scenario,
  recipient,
  requiredPoints = [],
  deterministicCoveredPoints = [],
  deterministicMissingPoints = [],
  learnerEmail,
  learnerLevel = 'A2',
  uiLanguage = 'de',
}) {
  return {
    taskId: String(taskId || '').trim(),
    scenario: String(scenario || '').trim(),
    recipient: String(recipient || '').trim(),
    requiredPoints: requiredPoints.map((point) => String(point).trim()).filter(Boolean),
    deterministicCoveredPoints: deterministicCoveredPoints
      .map((point) => String(point).trim())
      .filter(Boolean),
    deterministicMissingPoints: deterministicMissingPoints
      .map((point) => String(point).trim())
      .filter(Boolean),
    learnerEmail: String(learnerEmail || '').trim(),
    learnerLevel: String(learnerLevel || 'A2').trim(),
    uiLanguage: String(uiLanguage || 'de').trim(),
  };
}

/**
 * @param {number} planIndex
 * @param {number} slot
 * @param {string} submittedAt
 */
export function buildSchreibenCorrectionIdempotencyKey(planIndex, slot, submittedAt) {
  const stamp = String(submittedAt || '').replace(/[^\d]/g, '').slice(0, 14);
  return `wp-schreiben:${planIndex}:${slot}:${stamp || 'draft'}`;
}
