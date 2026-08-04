/**
 * Repeated Grammar Patterns section for the Final Daily Report.
 * @module weekly-training-ai/core/repeatedGrammarPatterns
 */

export const MAX_REPEATED_GRAMMAR_PATTERNS = 3;

export const REPEATED_GRAMMAR_PATTERNS_SECTION_TITLE = "Repeated Grammar Patterns";

const DEFAULT_ENCOURAGEMENT_WITH_ITEMS =
  "Konzentrieren Sie sich im nächsten Training besonders auf diese wiederholten Grammatikmuster.";

const DEFAULT_ENCOURAGEMENT_WITHOUT_ITEMS =
  "Heute gab es keine klar wiederholten Grammatikfehler — bleiben Sie im nächsten Training genauso dran.";

/**
 * @param {unknown} raw
 */
export function normalizeRepeatedGrammarPatterns(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const seen = new Set();
  const items = [];

  for (const entry of Array.isArray(source.items) ? source.items : []) {
    const topic = String(entry || "")
      .trim()
      .replace(/\s+/g, " ");
    if (!topic || seen.has(topic.toLowerCase())) continue;
    seen.add(topic.toLowerCase());
    items.push(topic.slice(0, 60));
    if (items.length >= MAX_REPEATED_GRAMMAR_PATTERNS) break;
  }

  const encouragement = String(source.encouragement || "").trim().slice(0, 240);

  return { items, encouragement };
}

/**
 * @param {unknown} raw
 */
export function validateRepeatedGrammarPatterns(raw) {
  const normalized = normalizeRepeatedGrammarPatterns(raw);
  const errors = [];

  if (!normalized.encouragement) {
    errors.push("repeatedGrammarPatterns.encouragement fehlt.");
  }

  for (const item of normalized.items) {
    if (item.length > 60) {
      errors.push("repeatedGrammarPatterns.items enthält zu lange Einträge.");
      break;
    }
    if (/[.!?]{2,}/.test(item) || item.split(" ").length > 6) {
      errors.push("repeatedGrammarPatterns.items darf nur kurze Grammatikthemen enthalten.");
      break;
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    data: normalized,
  };
}

/**
 * @param {{ items?: string[] }} [input]
 */
export function buildDefaultRepeatedGrammarPatterns(input = {}) {
  const items = normalizeRepeatedGrammarPatterns({ items: input.items || [] }).items;
  return {
    items,
    encouragement:
      items.length > 0
        ? DEFAULT_ENCOURAGEMENT_WITH_ITEMS
        : DEFAULT_ENCOURAGEMENT_WITHOUT_ITEMS,
  };
}
