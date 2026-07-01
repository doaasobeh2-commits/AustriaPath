/**
 * AustriaPath Grammar Judge
 * Version 2.0
 *
 * Uses Grammar Knowledge only.
 */

export class GrammarJudge {
  constructor() {
    this.name = "Grammar Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {
    const knowledge = context.currentKnowledge;
    const answer = (context.answerText || "").toLowerCase();

    if (!knowledge) {
      return this.emptyResult();
    }

    const structures = knowledge.expectedStructures || [];

    let score = 40;

    const strengths = [];
    const weaknesses = [];

    structures.forEach((structure) => {
      if (this.detect(answer, structure)) {
        score += 5;
        strengths.push(structure);
      }
    });

    (knowledge.commonMistakes || []).forEach((mistake) => {
      if (!strengths.includes(mistake.title)) {
        weaknesses.push(mistake.title);
      }
    });

    return {
      examiner: "grammar",
      skill: knowledge.metadata.skill,
      level: knowledge.metadata.level,
      score: Math.min(score, 95),
      strengths: this.unique(strengths),
      weaknesses: this.unique(weaknesses),
      focusAreas:
        weaknesses.length > 0
          ? [knowledge.metadata.skill]
          : [],
      evidence:
        strengths.length
          ? "Grammar structures detected."
          : "Few grammar structures detected.",
      knowledgeVersion: knowledge.metadata.version,
    };
  }

  detect(answer, pattern) {
    return answer.includes(pattern.toLowerCase());
  }

  unique(items = []) {
    return [...new Set(items.filter(Boolean))];
  }

  emptyResult() {
    return {
      examiner: "grammar",
      score: 0,
      strengths: [],
      weaknesses: ["Grammar knowledge missing"],
      focusAreas: [],
      evidence: "Knowledge file not found.",
    };
  }
}