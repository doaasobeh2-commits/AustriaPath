/**
 * AustriaPath Audit Engine
 * Version: 1.1
 *
 * Reviews unclear or risky decisions.
 */

export class AuditEngine {
  constructor() {
    this.name = "AustriaPath Audit Engine";
    this.version = "1.1";
  }

  review(decision) {
    const notes = [];
    let hasConflict = false;

    if (decision.confidence < 65) {
      hasConflict = true;
      notes.push("Decision confidence is low.");
    }

    if (decision.score >= 58 && decision.score <= 72) {
      hasConflict = true;
      notes.push("Score is close to the A2+/B1 border.");
    }

    return {
      audited: true,
      hasConflict,
      notes,
      recommendation: hasConflict ? "ask_follow_up" : "accept",
      decision,
    };
  }
}