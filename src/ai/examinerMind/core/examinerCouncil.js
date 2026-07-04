import { TaskJudge } from "../judges/TaskJudge.js";
import { GrammarJudge } from "../judges/GrammarJudge.js";
import { VocabularyJudge } from "../judges/VocabularyJudge.js";
import { StructureJudge } from "../judges/StructureJudge.js";
import { CommunicationJudge } from "../judges/CommunicationJudge.js";
import { ReasoningJudge } from "../judges/ReasoningJudge.js";

/**
 * AustriaPath Examiner Council
 * Version: 2.0
 *
 * Coordinates all judges and collects their reports.
 */

export class ExaminerCouncil {
  constructor() {
    this.name = "AustriaPath Examiner Council";
    this.version = "2.0";

    this.judges = [
      new TaskJudge(),
      new GrammarJudge(),
      new VocabularyJudge(),
      new StructureJudge(),
      new CommunicationJudge(),
      new ReasoningJudge(),
    ];
  }

 collect(examContext = {}) {

  const reports = [];

  for (const judge of this.judges) {

    try {

      const report = judge.evaluate(examContext);

      if (report) {
        reports.push(report);
      }

    } catch (error) {

      reports.push({

        examiner: judge.name,

        score: 0,

        strengths: [],

        weaknesses: ["Judge execution failed"],

        focusAreas: [],

        evidence: error.message,

      });

    }

  }

  return reports;

}
}