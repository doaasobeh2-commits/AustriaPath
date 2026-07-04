/**
 * Extract normalized questions from exam section content shapes.
 * @module exam-platform/evaluators/questionExtractors
 */

/** @typedef {import('./mcqCore.js').NormalizedQuestion} NormalizedQuestion */
/** @typedef {import('./mcqCore.js').MatchMode} MatchMode */

/** @param {unknown} q @param {number} index @param {string} [idPrefix] */
function mapQuestionItem(q, index, idPrefix = "") {
  const item = /** @type {Record<string, unknown>} */ (q || {});
  const id = String(item.id ?? `${idPrefix}${index}`);
  const prompt = String(item.question || item.q || item.frage || `Frage ${index + 1}`);
  const expected = String(item.answer || item.a || item.correct || "");

  let matchMode = /** @type {MatchMode} */ ("exact");
  if (item.options && typeof item.options === "object" && !Array.isArray(item.options)) {
    matchMode = "option_key";
  } else if (/^[a-hA-H]$/.test(expected.trim())) {
    matchMode = "letter";
  }

  return { id, prompt, expected, matchMode, options: item.options };
}

/** @param {Record<string, unknown>} content */
export function extractReadingQuestions(content = {}) {
  /** @type {NormalizedQuestion[]} */
  const questions = [];

  if (content.type === "reading_cloze" && content.answers) {
    Object.entries(content.answers).forEach(([gapId, expected]) => {
      questions.push({
        id: String(gapId),
        prompt: `Lücke ${gapId}`,
        expected: String(expected),
        matchMode: "exact",
      });
    });
    return questions;
  }

  if (Array.isArray(content.questions) && content.questions.length) {
    return content.questions.map((q, i) => mapQuestionItem(q, i));
  }

  if (content.lesenTeil2?.questions) {
    return content.lesenTeil2.questions.map((q, i) => mapQuestionItem(q, i));
  }

  if (content.teil1?.answers) {
    Object.entries(content.teil1.answers).forEach(([gapId, expected]) => {
      questions.push({
        id: String(gapId),
        prompt: `Lücke ${gapId}`,
        expected: String(expected),
        matchMode: "exact",
      });
    });
  }

  if (content.teil2?.questions) {
    content.teil2.questions.forEach((q, i) => {
      questions.push(mapQuestionItem(q, i, "t2-"));
    });
  }

  if (content.teil3?.questions) {
    content.teil3.questions.forEach((q, i) => {
      questions.push(mapQuestionItem(q, i, "t3-"));
    });
  }

  return questions;
}

/** @param {Record<string, unknown>} content */
export function extractListeningQuestions(content = {}) {
  /** @type {NormalizedQuestion[]} */
  const questions = [];

  if (Array.isArray(content.parts)) {
    content.parts.forEach((part, partIndex) => {
      const partObj = /** @type {Record<string, unknown>} */ (part || {});
      (partObj.questions || []).forEach((q, qIndex) => {
        questions.push({
          ...mapQuestionItem(q, qIndex, `p${partIndex}-`),
          id: `p${partIndex}-q${qIndex}`,
          matchMode: "text_fuzzy",
        });
      });
    });
    if (questions.length) return questions;
  }

  if (Array.isArray(content.questions) && content.questions.length) {
    return content.questions.map((q, i) => ({
      ...mapQuestionItem(q, i),
      matchMode: "text_fuzzy",
    }));
  }

  return questions;
}
