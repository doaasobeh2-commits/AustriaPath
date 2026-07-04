import { ExaminerCouncil } from "./examinerCouncil";
import { DecisionEngine } from "./decisionEngine";
import { ExamModes } from "../modes/examModes";
import { AuditEngine } from "../audit/auditEngine";
import { getExamStructure } from "../knowledge/examStructure";
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
  if (import.meta.env.DEV) {
    console.log(`🧠 Brain started in ${mode} mode`);
  }
const examType = examContext.examType || "OEIF";
const level = examContext.level || "B1";

const structure = getExamStructure(examType, level);

const currentSection =
  structure?.sections?.[examContext.sectionIndex || 0] || null;

const studentProfile = this.studentProfileEngine.getProfile();

let currentKnowledge = null;

if (currentSection?.skill) {
  currentKnowledge =
    ExaminerKnowledge?.levels?.[level]?.[
      currentSection.skill.toLowerCase()
    ] || null;
}

const reports = this.council.collect({
  ...examContext,
  structure,
  currentSection,
  currentKnowledge,
  studentProfile,
});
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
    strengths: decision.strengths || [],
    weaknesses: decision.weaknesses || [],
    focusAreas: decision.focusAreas || [],
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
  currentSection,
  knowledge: ExaminerKnowledge,
  studentProfile,
  decision,
};
  }
}

