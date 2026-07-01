/**
 * AustriaPath Decision Engine
 * Version: 1.3
 *
 * Produces the final decision from examiner reports.
 * Uses weighted examiner logic instead of simple average only.
 */

export class DecisionEngine {
  constructor() {
    this.name = "AustriaPath Decision Engine";
    this.version = "1.3";
  }

  decide(reports = []) {

  const validReports = reports.filter(
    report => typeof report.score === "number"
  );

  const score = this.calculateWeightedScore(validReports);

  const confidence =
    this.calculateConfidence(validReports, score);

  const level =
    this.mapScoreToLevel(score);

  const strengths =
    this.unique(
      validReports.flatMap(r => r.strengths || [])
    );

  const weaknesses =
    this.unique(
      validReports.flatMap(r => r.weaknesses || [])
    );

  const focusAreas =
    this.unique(
      validReports.flatMap(r => r.focusAreas || [])
    );

  const evidence =
    validReports.map(r => ({
      examiner: r.examiner,
      evidence: r.evidence
    }));

  return {

    level,

    score,

    confidence,

    strengths,

    weaknesses,

    focusAreas,

    reports: validReports,

    evidence,

    needsDeepReview:
      confidence < 65,

    decidedBy:
      "AustriaPath Decision Engine"

  };

}

  getWeight(examiner) {
    const weights = {
      taskCompletion: 1.4,
      reasoning: 1.2,
      basicStructure: 1.1,
      answerLength: 0.8,
    };

    return weights[examiner] || 1;
  }

  calculateWeightedScore(reports) {
    if (!reports.length) return 0;

    const totalWeight = reports.reduce((sum, report) => {
      return sum + this.getWeight(report.examiner);
    }, 0);

    const weightedTotal = reports.reduce((sum, report) => {
      return sum + report.score * this.getWeight(report.examiner);
    }, 0);

    return Math.round(weightedTotal / totalWeight);
    
  }

  mapScoreToLevel(score) {
    if (score >= 85) return "B1+";
    if (score >= 70) return "B1";
    if (score >= 55) return "A2+";
    return "A2";
  }

  calculateConfidence(reports, score) {
    if (!reports.length) return 0;

    let confidence = 82;

    const lowReports = reports.filter((report) => report.score < 50);

    if (lowReports.length > 0) {
      confidence -= lowReports.length * 12;
    }

    if (score >= 58 && score <= 72) {
      confidence -= 18;
    }

    const scoreSpread = this.calculateScoreSpread(reports);

    if (scoreSpread > 35) {
      confidence -= 15;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  calculateScoreSpread(reports) {
    if (!reports.length) return 0;

    const scores = reports.map((report) => report.score);
    return Math.max(...scores) - Math.min(...scores);
  }

  detectWarnings(reports, score) {
    const warnings = [];

    const taskCompletion = reports.find(
      (report) => report.examiner === "taskCompletion"
    );

    const reasoning = reports.find(
      (report) => report.examiner === "reasoning"
    );

    const basicStructure = reports.find(
      (report) => report.examiner === "basicStructure"
    );

    if (taskCompletion && taskCompletion.score < 50) {
      warnings.push("Task completion is weak.");
    }

    if (reasoning && reasoning.score < 55 && score >= 70) {
      warnings.push("The score is high, but reasoning is weak.");
    }

    if (basicStructure && basicStructure.score < 55 && score >= 70) {
      warnings.push("The score is high, but sentence structure is limited.");
    }

    return warnings;

    
  }

extractStrengths(reports) {
  return this.unique(
    reports.flatMap((report) => {
      if (Array.isArray(report.strengths) && report.strengths.length) {
        return report.strengths;
      }

      if (report.score >= 70) {
        return [report.examiner];
      }

      return [];
    })
  );
}

extractWeaknesses(reports) {
  return this.unique(
    reports.flatMap((report) => {
      if (Array.isArray(report.weaknesses) && report.weaknesses.length) {
        return report.weaknesses;
      }

      if (report.score < 60) {
        return [report.examiner];
      }

      return [];
    })
  );
}

extractFocusAreas(reports) {
  return this.unique(
    reports.flatMap((report) => {
      if (Array.isArray(report.focusAreas) && report.focusAreas.length) {
        return report.focusAreas;
      }

      if (report.score < 65) {
        return [report.skill || report.examiner];
      }

      return [];
    })
  );
}

unique(items = []) {
  const normalized = items
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean);

  return [...new Set(normalized)];
}
}

