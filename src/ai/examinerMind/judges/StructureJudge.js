/**
 * AustriaPath Structure Judge
 * Version 2.0
 *
 * Uses Structure Knowledge only.
 */

export class StructureJudge {
  constructor() {
    this.name = "Structure Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {
    const knowledge = context.currentKnowledge;
    const answer = (context.answerText || "").trim();

    if (!knowledge) {
      return this.emptyResult();
    }

    const expected = knowledge.expectedElements || [];
    const checks = knowledge.examinerChecks || [];

    let score = 40;

    const strengths = [];
    const weaknesses = [];

    expected.forEach((element) => {
      if (this.detect(answer, element)) {
        score += 8;
        strengths.push(element);
      } else {
        weaknesses.push(element);
      }
    });

    return {
      examiner: "structure",
      skill: knowledge.metadata.skill,
      level: knowledge.metadata.level,
      score: Math.min(score, 95),
      strengths: this.unique(strengths),
      weaknesses: this.unique(weaknesses),
      focusAreas:
        weaknesses.length
          ? [knowledge.metadata.skill]
          : [],
      evidence:
        weaknesses.length === 0
          ? "Expected structure detected."
          : "Structure is incomplete.",
      examinerChecks: checks,
      knowledgeVersion: knowledge.metadata.version,
    };
  }

  detect(answer, keyword) {
    return answer
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  unique(items = []) {
    return [...new Set(items.filter(Boolean))];
  }

  emptyResult() {
    return {
      examiner: "structure",
      score: 0,
      strengths: [],
      weaknesses: ["Structure knowledge missing"],
      focusAreas: [],
      evidence: "Knowledge file not found.",
    };
  }
}