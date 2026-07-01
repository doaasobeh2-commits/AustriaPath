/**
 * AustriaPath Communication Judge
 * Version 2.0
 *
 * Uses Communication Knowledge only.
 */

export class CommunicationJudge {
  constructor() {
    this.name = "Communication Judge";
    this.version = "2.0";
  }

  evaluate(context = {}) {
    const knowledge = context.currentKnowledge;
    const answer = (context.answerText || "").trim();

    if (!knowledge) {
      return this.emptyResult();
    }

    const objectives = knowledge.objectives || [];
    const checks = knowledge.examinerChecks || [];

    const strengths = [];
    const weaknesses = [];

    let score = 40;

    if (answer.length > 0) {
      score += 20;
      strengths.push("Kommunikation begonnen");
    } else {
      weaknesses.push("Keine Kommunikation");
    }

    if (answer.split(/\s+/).length >= 10) {
      score += 15;
      strengths.push("Verständliche Antwort");
    } else {
      weaknesses.push("Antwort zu kurz");
    }

    if (objectives.length > 0) {
      score += 10;
    }

    return {
      examiner: "communication",
      skill: knowledge.metadata.skill,
      level: knowledge.metadata.level,
      score: Math.min(score, 95),
      strengths: this.unique(strengths),
      weaknesses: this.unique(weaknesses),
      focusAreas: weaknesses.length ? [knowledge.metadata.skill] : [],
      evidence:
        weaknesses.length === 0
          ? "Communication is understandable."
          : "Communication needs improvement.",
      objectives,
      examinerChecks: checks,
      knowledgeVersion: knowledge.metadata.version,
    };
  }

  unique(items = []) {
    return [...new Set(items.filter(Boolean))];
  }

  emptyResult() {
    return {
      examiner: "communication",
      score: 0,
      strengths: [],
      weaknesses: ["Communication knowledge missing"],
      focusAreas: [],
      evidence: "Knowledge file not found.",
    };
  }
}