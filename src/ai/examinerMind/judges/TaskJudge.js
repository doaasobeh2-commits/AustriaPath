/**
 * AustriaPath Task Judge
 * Version 2.0
 *
 * Uses Knowledge files only.
 * No exam rules are hardcoded here.
 */

export class TaskJudge {

  constructor() {
    this.name = "Task Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {

    const knowledge = context.currentKnowledge;
    const answer = context.answerText || "";

    if (!knowledge) {
      return this.emptyResult();
    }

    const checks = knowledge.examinerChecks || [];
    const expected = knowledge.expectedElements || [];

    let score = 40;

    const strengths = [];
    const weaknesses = [];

    expected.forEach(item => {

      if (this.detect(answer, item)) {

        score += 8;

        strengths.push(item);

      } else {

        weaknesses.push(item);

      }

    });

    if (score > 95) score = 95;

    return {

      examiner: "taskCompletion",

      score,

      strengths,

      weaknesses,

      focusAreas:
        weaknesses.length
          ? [knowledge.metadata.skill]
          : [],

      evidence:
        weaknesses.length === 0
          ? "All expected task elements were detected."
          : "Some required task elements are missing.",

      checks,

      knowledgeVersion:
        knowledge.metadata.version

    };

  }

  detect(answer, keyword) {

    return answer
      .toLowerCase()
      .includes(keyword.toLowerCase());

  }

  emptyResult() {

    return {

      examiner: "taskCompletion",

      score: 0,

      strengths: [],

      weaknesses: ["Knowledge missing"],

      focusAreas: [],

      evidence: "Knowledge file not found."

    };

  }

}