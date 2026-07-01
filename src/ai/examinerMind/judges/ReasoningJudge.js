/**
 * AustriaPath Reasoning Judge
 * Version 2.0
 *
 * Uses Knowledge only.
 */

export class ReasoningJudge {
  constructor() {
    this.name = "Reasoning Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {
    const knowledge = context.currentKnowledge;
    const answer = (context.answerText || "").trim();

    if (!knowledge) {
      return this.emptyResult();
    }

    const checks = knowledge.examinerChecks || [];
    const objectives = knowledge.objectives || [];
    const expected = knowledge.expectedElements || [];

    let score = 40;

    const strengths = [];
    const weaknesses = [];

    expected.forEach((element) => {
      if (this.detect(answer, element)) {
        score += 6;
        strengths.push(element);
      }
    });

    if (strengths.length < Math.max(1, expected.length / 2)) {
      weaknesses.push("Reasoning not sufficiently developed");
    }

    return {
      examiner: "reasoning",
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
          ? "Reasoning matches the expected knowledge."
          : "Reasoning needs further development.",
      objectives,
      examinerChecks: checks,
      knowledgeVersion: knowledge.metadata.version,
    };
  }

  detect(answer, keyword) {
    return answer
      .toLowerCase()
      .includes(String(keyword).toLowerCase());
  }

  unique(items = []) {
    return [...new Set(items.filter(Boolean))];
  }

  emptyResult() {
    return {
      examiner: "reasoning",
      score: 0,
      strengths: [],
      weaknesses: ["Reasoning knowledge missing"],
      focusAreas: [],
      evidence: "Knowledge file not found.",
    };
  }
}