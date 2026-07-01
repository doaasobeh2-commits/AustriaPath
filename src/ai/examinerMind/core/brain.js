import { ExaminerCouncil } from "./examinerCouncil";
import { DecisionEngine } from "./decisionEngine";
import { ExamModes } from "../modes/examModes";
import { AuditEngine } from "../audit/auditEngine";
import { ExamStructure } from "../knowledge/examStructure";
import { ExaminerKnowledge } from "../knowledge/examinerKnowledge";
import { StudentProfileEngine } from "../student/studentProfileEngine";
/**
 * AustriaPath Examiner Brain
 * Version: 1.1
 *
 * Main coordinator of the examiner mind.
 */

export class Brain {
  constructor() {
    this.name = "AustriaPath Examiner Brain";
    this.version = "1.1";
this.studentProfileEngine = new StudentProfileEngine();
    this.council = new ExaminerCouncil();
    this.decisionEngine = new DecisionEngine();
    this.auditEngine = new AuditEngine();
  }

  async think(examContext, mode = ExamModes.FAST) {
    console.log(`🧠 Brain started in ${mode} mode`);
const examType = examContext.examType || "OEIF";
const level = examContext.level || "B1";
const structure = ExamStructure[examType]?.[level] || null;
const studentProfile = this.studentProfileEngine.getProfile();
    const reports = this.council.collect(examContext);
    let decision = this.decisionEngine.decide(reports);
if (examContext.saveToProfile === true) {
  this.studentProfileEngine.addExamResult({
    level: decision.level,
    score: decision.score,
    confidence: decision.confidence,
    service: mode,
    examType,
    examLevel: level,
    reports,
    weaknesses: [],
    strengths: [],
    repeatedMistakes: [],
  });
}
    if (mode === ExamModes.DEEP || decision.needsDeepReview === true) {
      const audit = this.auditEngine.review(decision);

      decision = {
        ...decision,
        audit,
      };
    }

    if (mode === ExamModes.LEARNING) {
      decision.learningScheduled = true;
    }

return {
  success: true,
  brainVersion: this.version,
  mode,
  structure,
  knowledge: ExaminerKnowledge,
  studentProfile,
  decision,
};
  }
}

