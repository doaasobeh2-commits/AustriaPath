/**
 * AustriaPath Examiner Council
 * Version: 1.2
 *
 * Collects examiner reports.
 */

export class ExaminerCouncil {
  constructor() {
    this.name = "AustriaPath Examiner Council";
    this.version = "1.2";
  }

  collect(examContext = {}) {
    const text = examContext.answerText || "";
    const wordCount = this.countWords(text);

    return [
      this.checkTaskCompletion(examContext),
      this.checkAnswerLength(wordCount),
      this.checkReasoning(text),
      this.checkBasicStructure(text),
    ];
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  checkTaskCompletion(examContext) {
    return {
      examiner: "taskCompletion",
      score: examContext.taskAnswered ? 80 : 40,
      evidence: examContext.taskAnswered
        ? "The student answered the task."
        : "The student did not clearly answer the task.",
    };
  }

  checkAnswerLength(wordCount) {
    return {
      examiner: "answerLength",
      score: wordCount >= 40 ? 75 : wordCount >= 20 ? 60 : 40,
      evidence: `The answer contains ${wordCount} words.`,
    };
  }

  checkReasoning(text) {
    const hasReason =
      text.includes("weil") ||
      text.includes("denn") ||
      text.includes("deshalb") ||
      text.includes("darum");

    return {
      examiner: "reasoning",
      score: hasReason ? 75 : 50,
      evidence: hasReason
        ? "The student gave a reason or explanation."
        : "The student did not give a clear reason.",
    };
  }

  checkBasicStructure(text) {
    const hasConnector =
      text.includes("und") ||
      text.includes("aber") ||
      text.includes("weil") ||
      text.includes("dass");

    return {
      examiner: "basicStructure",
      score: hasConnector ? 70 : 45,
      evidence: hasConnector
        ? "The answer contains basic sentence connectors."
        : "The answer has limited sentence structure.",
    };
  }
}