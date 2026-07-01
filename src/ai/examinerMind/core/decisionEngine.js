/**
 * AustriaPath Decision Engine
 * Version: 1.2
 *
 * Produces the final decision from examiner reports.
 */

export class DecisionEngine {
  constructor() {
    this.name = "AustriaPath Decision Engine";
    this.version = "1.2";
  }

  decide(examReports = []) {
    const validReports = examReports.filter((report) => {
      return typeof report.score === "number";
    });

    const totalScore = validReports.reduce((sum, report) => {
      return sum + report.score;
    }, 0);

    const averageScore = validReports.length
      ? Math.round(totalScore / validReports.length)
      : 0;

    const confidence = this.calculateConfidence(validReports, averageScore);

    const needsDeepReview =
      confidence < 65 ||
      averageScore >= 58 && averageScore <= 72;

    return {
      level: this.mapScoreToLevel(averageScore),
      score: averageScore,
      confidence,
      needsDeepReview,
      explanation: validReports.map((report) => report.evidence),
      reports: validReports,
      decidedBy: "AustriaPath Decision Engine",
    };
  }

  mapScoreToLevel(score) {
    if (score >= 85) return "B1+";
    if (score >= 70) return "B1";
    if (score >= 55) return "A2+";
    return "A2";
  }

  calculateConfidence(reports, averageScore) {
    if (!reports.length) return 0;

    let confidence = 80;

    if (averageScore >= 58 && averageScore <= 72) {
      confidence -= 20;
    }

    const lowReports = reports.filter((report) => report.score < 50).length;

    if (lowReports > 0) {
      confidence -= lowReports * 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }
}