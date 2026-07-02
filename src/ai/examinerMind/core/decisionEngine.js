/**
 * AustriaPath Decision Engine
 * Version: 1.4
 *
 * Produces the final decision from examiner reports.
 * Adds:
 * - Critical rules
 * - Warnings
 * - Reflection summary
 * - Dynamic strengths / weaknesses / focus areas
 * - Conflict detection
 */

export class DecisionEngine {
  constructor() {
    this.name = "AustriaPath Decision Engine";
    this.version = "1.4";
  }

  decide(reports = []) {
    const validReports = reports.filter(
      (report) => typeof report.score === "number"
    );

    if (!validReports.length) {
      return this.getEmptyResult();
    }

    const rawScore = this.calculateWeightedScore(validReports);
    const criticalResult = this.applyCriticalRules(validReports, rawScore);

    const score = criticalResult.score;
    const level = this.mapScoreToLevel(score);

    const warnings = this.detectWarnings(validReports, score);
    const conflicts = this.detectConflicts(validReports);
    const reflection = this.buildReflection(validReports, score, criticalResult, conflicts);

    const confidence = this.calculateConfidence(
      validReports,
      score,
      conflicts,
      criticalResult
    );

    const strengths = this.extractStrengths(validReports);
    const weaknesses = this.extractWeaknesses(validReports);
    const focusAreas = this.extractFocusAreas(validReports);

    const evidence = validReports.map((report) => ({
      examiner: report.examiner,
      score: report.score,
      evidence: report.evidence || null,
      reasoning: report.reasoning || [],
    }));

    return {
      level,
      score,
      rawScore,
      confidence,

      strengths,
      weaknesses,
      focusAreas,

      warnings,
      conflicts,
      reflection,

      reports: validReports,
      evidence,

      criticalRulesApplied: criticalResult.appliedRules,

      needsDeepReview:
        confidence < 65 ||
        conflicts.length > 0 ||
        criticalResult.appliedRules.length > 0,

      decidedBy: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }
mapScoreToLevel(score) {
  if (score >= 85) return "B1+";
  if (score >= 70) return "B1";
  if (score >= 55) return "A2+";
  return "A2";
}
  getWeight(examiner) {
    const weights = {
      taskCompletion: 1.5,
      reasoning: 1.25,
      communication: 1.2,
      vocabulary: 1.1,
      basicStructure: 1.1,
      grammar: 1.1,
      answerLength: 0.7,
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

  applyCriticalRules(reports, score) {
    const appliedRules = [];

    const task = this.findReport(reports, "taskCompletion");
    const reasoning = this.findReport(reports, "reasoning");
    const communication = this.findReport(reports, "communication");

    let finalScore = score;

    if (task && task.score < 40) {
      finalScore = Math.min(finalScore, 54);
      appliedRules.push(
        "Task completion is critically weak, so the final level is capped."
      );
    }

    if (task && task.score < 50 && score >= 70) {
      finalScore = Math.min(finalScore, 64);
      appliedRules.push(
        "Good language cannot fully compensate for missing task requirements."
      );
    }

    if (reasoning && reasoning.score < 45 && score >= 70) {
      finalScore = Math.min(finalScore, 66);
      appliedRules.push(
        "Reasoning is too weak for a stable B1 decision."
      );
    }

    if (communication && communication.score < 45 && score >= 70) {
      finalScore = Math.min(finalScore, 66);
      appliedRules.push(
        "Communication problems limit the final result."
      );
    }

    return {
      score: finalScore,
      appliedRules,
    };
  }

  calculateConfidence(reports, score, conflicts = [], criticalResult = null) {
    if (!reports.length) return 0;

    let confidence = 84;

    const lowReports = reports.filter((report) => report.score < 50);

    if (lowReports.length > 0) {
      confidence -= lowReports.length * 12;
    }

    const scoreSpread = this.calculateScoreSpread(reports);

    if (scoreSpread > 35) {
      confidence -= 15;
    }

    if (score >= 55 && score <= 72) {
      confidence -= 10;
    }

    if (conflicts.length > 0) {
      confidence -= conflicts.length * 10;
    }

    if (criticalResult?.appliedRules?.length) {
      confidence -= criticalResult.appliedRules.length * 8;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  calculateScoreSpread(reports) {
    if (!reports.length) return 0;

    const scores = reports.map((report) => report.score);
    return Math.max(...scores) - Math.min(...scores);
  }

  detectConflicts(reports) {
    const conflicts = [];

    const task = this.findReport(reports, "taskCompletion");
    const grammar =
      this.findReport(reports, "grammar") ||
      this.findReport(reports, "basicStructure");

    const vocabulary = this.findReport(reports, "vocabulary");
    const reasoning = this.findReport(reports, "reasoning");

    if (task && grammar && grammar.score - task.score >= 35) {
      conflicts.push({
        type: "strong_language_weak_task",
        message:
          "The language quality is strong, but the task was not completed well.",
      });
    }

    if (vocabulary && reasoning && vocabulary.score - reasoning.score >= 35) {
      conflicts.push({
        type: "good_words_weak_logic",
        message:
          "The student uses good vocabulary, but the answer is not logically developed.",
      });
    }

    if (task && reasoning && Math.abs(task.score - reasoning.score) >= 35) {
      conflicts.push({
        type: "task_reasoning_disagreement",
        message:
          "Task completion and reasoning judges strongly disagree.",
      });
    }

    return conflicts;
  }

  detectWarnings(reports, score) {
    const warnings = [];

    const taskCompletion = this.findReport(reports, "taskCompletion");
    const reasoning = this.findReport(reports, "reasoning");
    const basicStructure =
      this.findReport(reports, "basicStructure") ||
      this.findReport(reports, "grammar");

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

  buildReflection(reports, score, criticalResult, conflicts) {
    const task = this.findReport(reports, "taskCompletion");
    const grammar =
      this.findReport(reports, "grammar") ||
      this.findReport(reports, "basicStructure");
    const vocabulary = this.findReport(reports, "vocabulary");
    const reasoning = this.findReport(reports, "reasoning");

    const notes = [];

    if (conflicts.length > 0) {
      notes.push("The judges did not fully agree.");
    } else {
      notes.push("The judges are mostly consistent.");
    }

    if (task && task.score < 50) {
      notes.push("The main task was only partially completed.");
    }

    if (grammar && grammar.score >= 75) {
      notes.push("The student shows good sentence control.");
    }

    if (vocabulary && vocabulary.score >= 75) {
      notes.push("Vocabulary is appropriate for the level.");
    }

    if (reasoning && reasoning.score < 55) {
      notes.push("The answer needs clearer reasoning and connection between ideas.");
    }

    if (criticalResult.appliedRules.length > 0) {
      notes.push("A critical rule limited the final result.");
    }

    if (score >= 70) {
      notes.push("Overall, the result is close to B1 performance.");
    } else if (score >= 55) {
      notes.push("Overall, the result is between A2 and B1.");
    } else {
      notes.push("Overall, the result is still closer to A2.");
    }

    return {
      summary: notes.join(" "),
      notes,
    };
  }

  extractStrengths(reports) {
  const allStrengths = reports.flatMap((report) => {
    const list = report.strengths || [];

    if (list.length) {
      return list;
    }

    const strengths = [];

    if (report.score >= 90) {
      strengths.push(
        "Alle Aufgabenpunkte beantwortet",
        "Sehr gute Begründung",
        "Klare Struktur",
        "Sehr guter Wortschatz",
        "Sehr gute Grammatik"
      );
    } else if (report.score >= 75) {
      strengths.push(
        "Aufgabe gut erfüllt",
        "Klare Struktur",
        "Guter Wortschatz",
        "Gute Grammatik"
      );
    } else if (report.score >= 60) {
      strengths.push(
        "Grundidee verständlich",
        "Teilweise richtige Struktur"
      );
    }

    return strengths;
  });

  return this.unique(allStrengths);
}

 extractWeaknesses(reports) {
  const allWeaknesses = reports.flatMap((report) => {
    const list = Array.isArray(report.weaknesses)
      ? report.weaknesses
      : [];

    if (list.length) {
      return list;
    }

    if (report.score < 60) {
      return [this.humanLabel(report.examiner)];
    }

    return [];
  });

  const priority = [
  "Aufgabenerfüllung",
  "Aufgabenpunkt fehlt",
  "Meinung ohne Begründung",
  "Keine klare Struktur",
  "Antwort zu kurz für B1",
  "Begründung nicht ausreichend entwickelt",
  "Wortschatz",
  "Grammatik",
  "Kommunikation",
];

  const uniqueItems = this.unique(allWeaknesses);

  return uniqueItems
    .sort((a, b) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);

      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;

      return ai - bi;
    })
    .slice(0, 5);
}

  extractFocusAreas(reports) {
    return this.unique(
      reports.flatMap((report) => {
        if (Array.isArray(report.focusAreas) && report.focusAreas.length) {
          return report.focusAreas;
        }

        if (report.score < 65) {
          return [this.humanLabel(report.skill || report.examiner)];
        }

        return [];
      })
    );
  }

  findReport(reports, examiner) {
    return reports.find((report) => report.examiner === examiner);
  }

  humanLabel(value) {
    const labels = {
  taskCompletion: "Aufgabenerfüllung",
  reasoning: "Begründung",
  basicStructure: "Satzstruktur",
  grammar: "Grammatik",
  vocabulary: "Wortschatz",
  communication: "Kommunikation",
  answerLength: "Antwortlänge",
};

    return labels[value] || value;
  }

  unique(items = []) {
    const normalized = items
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean);

    return [...new Set(normalized)];
  }

  getEmptyResult() {
    return {
      level: "A2",
      score: 0,
      rawScore: 0,
      confidence: 0,
      strengths: [],
      weaknesses: [],
      focusAreas: [],
      warnings: ["No valid examiner reports provided."],
      conflicts: [],
      reflection: {
        summary: "No valid reports were available for a reliable decision.",
        notes: [],
      },
      reports: [],
      evidence: [],
      criticalRulesApplied: [],
      needsDeepReview: true,
      decidedBy: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }
}