/**
 * Weekly B1 Coach language policy — weak-to-average integration-course learners.
 * @module weekly-training-ai/core/b1CoachLanguagePolicy
 */

/** @type {readonly string[]} */
export const B1_COACH_LANGUAGE_POLICY_LINES = Object.freeze([
  "Weekly B1 Coach targets weak-to-average B1 learners (typical integration-course level), not advanced B1 students.",
  "Use simple, natural, everyday German in every assistantMessage.",
  "Prefer common vocabulary; keep sentences short and easy to understand.",
  "Avoid rare verbs, abstract expressions, difficult adjectives, idioms, and unnecessarily complex grammar.",
  "Ask only ONE clear question at a time.",
  "Do NOT make the language harder when the student answers well.",
  "If the student performs well, deepen the conversation with follow-up questions — not with harder vocabulary.",
  "Goal: evaluate and improve spoken communication, not reading comprehension of difficult language.",
]);

/**
 * @returns {string}
 */
export function buildB1CoachLanguagePolicySection() {
  return ["LANGUAGE POLICY:", ...B1_COACH_LANGUAGE_POLICY_LINES].join("\n");
}
