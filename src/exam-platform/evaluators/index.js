/**
 * Skill Evaluators — Phase C entry point.
 * @module exam-platform/evaluators
 */

export {
  normalizeText,
  compareAnswer,
  scoreQuestionSet,
  mapScoreToSkillLevel,
  MCQ_CORE_VERSION,
} from "./mcqCore.js";

export {
  extractReadingQuestions,
  extractListeningQuestions,
} from "./questionExtractors.js";

export {
  evaluateReading,
  readingEvaluator,
  READING_EVALUATOR_ID,
} from "./readingEvaluator.js";

export {
  evaluateListening,
  listeningEvaluator,
  LISTENING_EVALUATOR_ID,
} from "./listeningEvaluator.js";

export {
  evaluateSection,
  hasEvaluator,
  hasAutomatedEvaluator,
  skillEvaluatorRegistry,
  IMPLEMENTED_EVALUATOR_SKILLS,
} from "./skillEvaluatorRegistry.js";

export {
  evaluatePendingSkill,
  createPendingEvaluator,
  PENDING_EVALUATOR_VERSION,
} from "./pendingSkillEvaluator.js";
