/**
 * AustriaPath Vocabulary Judge
 * Version 2.0
 *
 * Uses Vocabulary Knowledge only.
 */

export class VocabularyJudge {
  constructor() {
    this.name = "Vocabulary Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {
    const knowledge = context.currentKnowledge;
    const answer = (context.answerText || "").toLowerCase();

    if (!knowledge) {
      return this.emptyResult();
    }

    const objectives = knowledge.objectives || [];
    const expected = knowledge.expectedElements || [];

    const words = answer.split(/\s+/).filter(Boolean);
    const uniqueWords = [...new Set(words)];

    const diversity =
      words.length > 0
        ? uniqueWords.length / words.length
        : 0;

    let score = 40;

    const strengths = [];
    const weaknesses = [];

    if (diversity >= 0.60) {
      score += 20;
      strengths.push("Abwechslungsreicher Wortschatz");
    } else {
      weaknesses.push("Wortschatz erweitern");
    }

    if (words.length >= expected.length * 2) {
      score += 15;
      strengths.push("Ausreichender Wortschatz");
    } else {
      weaknesses.push("Zu wenig Wortschatz");
    }

    return {
      examiner: "vocabulary",
      skill: knowledge.metadata.skill,
      level: knowledge.metadata.level,
      score: Math.min(score, 95),
      strengths: this.unique(strengths),
      weaknesses: this.unique(weaknesses),
      focusAreas:
        weaknesses.length
          ? [knowledge.metadata.skill]
          : [],
      evidence: `Vocabulary diversity ${(diversity * 100).toFixed(0)}%`,
      objectives,
      knowledgeVersion: knowledge.metadata.version,
    };
  }

  unique(items = []) {
    return [...new Set(items.filter(Boolean))];
  }

  emptyResult() {
    return {
      examiner: "vocabulary",
      score: 0,
      strengths: [],
      weaknesses: ["Vocabulary knowledge missing"],
      focusAreas: [],
      evidence: "Knowledge file not found.",
    };
  }
}