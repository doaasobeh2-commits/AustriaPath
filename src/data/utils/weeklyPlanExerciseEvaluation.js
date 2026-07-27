/**
 * Coach-friendly evaluation for weekly plan exercises — reuses exam-platform MCQ evaluators.
 * Does not expose scores, CEFR, or examiner language.
 * @module data/utils/weeklyPlanExerciseEvaluation
 */

import { evaluateListening } from '../../exam-platform/evaluators/listeningEvaluator.js';
import { evaluateReading } from '../../exam-platform/evaluators/readingEvaluator.js';
import {
  compareAnswer,
  normalizeText,
} from '../../exam-platform/evaluators/mcqCore.js';
import {
  extractListeningQuestions,
  extractReadingQuestions,
} from '../../exam-platform/evaluators/questionExtractors.js';
import {
  extractGuidedCatalogCompletion,
  isCanonicalA2GuidedCatalogTask,
  validateGuidedCatalogCompletion,
} from './a2GuidedCatalogCompletion.js';
import {
  B1_HOEREN_QUESTIONS_PER_MODEL,
  flattenB1HoerenQuestions,
  isB1WeeklyPlanHoerenTask,
  isB1WeeklyPlanSchreibenTask,
  isB1WeeklyPlanBildbeschreibungTask,
  isB1WeeklyPlanInteractiveSpeakingTask,
} from './b1WeeklyPlanCoachTaskAdapter.js';
import { isB1SchreibenResponseReady } from './b1SchreibenTaskParser.js';
import {
  evaluateA2EmailWriting,
  isA2SchreibenEvaluationTask,
} from './a2EmailWritingEvaluation.js';

/**
 * @typedef {Object} CoachExerciseFeedback
 * @property {string} summary
 * @property {Array<{ text: string, tone: 'success'|'partial'|'retry'|'neutral'|'info', correction?: string }>} lines
 * @property {string[]} [followUps]
 * @property {boolean} [showSolution]
 * @property {string} [solution]
 */

/**
 * @param {Record<string, string>} selectedAnswers
 * @param {import('../../exam-platform/evaluators/mcqCore.js').NormalizedQuestion[]} questions
 */
export function selectedAnswersToMcqMap(selectedAnswers = {}, questions = []) {
  /** @type {Record<string, string>} */
  const mcq = {};
  questions.forEach((q, index) => {
    const key = String(index);
    const id = String(q.id ?? index);
    const value = selectedAnswers[id] ?? selectedAnswers[key] ?? '';
    if (String(value).trim()) {
      mcq[id] = String(value).trim();
    }
  });
  return mcq;
}

/**
 * @param {import('../../exam-platform/evaluators/mcqCore.js').NormalizedQuestion[]} questions
 * @param {import('../../exam-platform/contracts.js').SectionEvaluation} evaluation
 * @returns {CoachExerciseFeedback}
 */
function mcqEvaluationToFeedback(questions, evaluation) {
  /** @type {CoachExerciseFeedback['lines']} */
  const lines = [];

  (evaluation.evidence || []).forEach((ev) => {
    const qId = String(ev.code || '').split(':').pop();
    const question = questions.find((q) => String(q.id) === qId);
    const prompt = question?.prompt || ev.label || 'Frage';

    if (ev.passed) {
      lines.push({ text: `${prompt}: Richtig beantwortet`, tone: 'success' });
      return;
    }

    if (String(ev.code || '').startsWith('UNANSWERED')) {
      lines.push({ text: `${prompt}: Bitte noch beantworten`, tone: 'info' });
      return;
    }

    if (String(ev.code || '').startsWith('PARTIAL')) {
      lines.push({
        text: `${prompt}: Fast richtig`,
        tone: 'partial',
        correction: question?.expected,
      });
      return;
    }

    lines.push({
      text: `${prompt}: Schau dir diese Stelle noch einmal an`,
      tone: 'retry',
      correction: question?.expected,
    });
  });

  const allCorrect = lines.length > 0 && lines.every((l) => l.tone === 'success');
  const hasPartial = lines.some((l) => l.tone === 'partial');

  let summary = 'Deine Antworten wurden ausgewertet.';
  if (allCorrect) summary = 'Sehr gut – alles richtig beantwortet.';
  else if (hasPartial) summary = 'Fast richtig – schau dir die Hinweise an.';
  else if (lines.some((l) => l.tone === 'retry')) summary = 'Einige Antworten kannst du noch verbessern.';

  return { summary, lines };
}

/**
 * @param {object} task
 * @param {Record<string, string>} selectedAnswers
 * @returns {CoachExerciseFeedback}
 */
function evaluateB1HoerenResponse(task, selectedAnswers = {}) {
  const questions = flattenB1HoerenQuestions(task);
  /** @type {CoachExerciseFeedback['lines']} */
  const lines = questions.map((question) => {
    const student = String(selectedAnswers[question.id] || '').trim().toUpperCase();
    const expected = String(question.expected || '').trim().toUpperCase();
    const correct = Boolean(student) && student === expected;

    if (correct) {
      return { text: `${question.prompt}: Richtig beantwortet`, tone: 'success' };
    }

    return {
      text: `${question.prompt}: Schau dir diese Stelle noch einmal an`,
      tone: 'retry',
    };
  });

  const allCorrect = lines.length > 0 && lines.every((line) => line.tone === 'success');
  const hasRetry = lines.some((line) => line.tone === 'retry');

  let summary = 'Deine Antworten wurden ausgewertet.';
  if (allCorrect) summary = 'Sehr gut – alles richtig beantwortet.';
  else if (hasRetry) summary = 'Einige Antworten kannst du noch verbessern.';

  return { summary, lines };
}

/**
 * @param {object} task
 * @param {{ selectedAnswers?: Record<string, string>, b1HoerenClipProgress?: { clip1Played?: boolean, clip2Played?: boolean } }} payload
 * @returns {{ ok: boolean, reason?: string }}
 */
function validateB1HoerenSubmission(task, payload = {}) {
  const questions = flattenB1HoerenQuestions(task);
  if (questions.length !== B1_HOEREN_QUESTIONS_PER_MODEL) {
    return { ok: false, reason: 'Diese Hören-Übung ist unvollständig konfiguriert.' };
  }

  const progress = payload.b1HoerenClipProgress || {};
  if (!progress.clip1Played || !progress.clip2Played) {
    return { ok: false, reason: 'Bitte höre beide Hörteile vollständig.' };
  }

  const selectedAnswers = payload.selectedAnswers || {};
  const unanswered = questions.filter((question) => !String(selectedAnswers[question.id] || '').trim());
  if (unanswered.length > 0) {
    return { ok: false, reason: 'Bitte beantworte alle vier Fragen.' };
  }

  return { ok: true };
}

/**
 * @param {object} task
 * @param {string} learnerResponse
 * @returns {{ ok: boolean, reason?: string }}
 */
function validateB1SchreibenSubmission(task, learnerResponse = '') {
  const text = String(learnerResponse || '');
  if (!text.trim()) {
    return { ok: false, reason: 'Bitte schreibe deine E-Mail, bevor du abschließt.' };
  }
  const minimumLength = Number(task?.minimumLength) || 80;
  if (!isB1SchreibenResponseReady(text, minimumLength)) {
    return {
      ok: false,
      reason: `Bitte schreiben Sie mindestens ${minimumLength} Zeichen.`,
    };
  }
  return { ok: true };
}

/**
 * @param {string} learnerResponse
 * @returns {CoachExerciseFeedback}
 */
function evaluateB1SchreibenResponse(learnerResponse) {
  return {
    summary: 'Ihre E-Mail wurde gespeichert.',
    lines: [{ text: 'Ihre Antwort wurde ohne Korrektur gespeichert.', tone: 'neutral' }],
  };
}

/**
 * @param {object} task
 * @param {string} learnerResponse
 * @returns {CoachExerciseFeedback}
 */
function evaluateWritingResponse(task, learnerResponse) {
  if (isA2SchreibenEvaluationTask(task)) {
    return evaluateA2EmailWriting(task, learnerResponse);
  }

  const solution = task.solution ? String(task.solution).trim() : '';
  const response = String(learnerResponse || '').trim();

  if (!solution) {
    return {
      summary: 'Deine Antwort wurde gespeichert.',
      lines: [{ text: 'Gut – du hast die Aufgabe bearbeitet.', tone: 'neutral' }],
      followUps: Array.isArray(task.followUps) ? task.followUps.slice(0, 2) : undefined,
    };
  }

  const result = compareAnswer(solution, response, 'text_fuzzy');
  if (result.correct) {
    return {
      summary: 'Sehr gut – deine Lösung passt.',
      lines: [{ text: 'Richtig beantwortet', tone: 'success' }],
      showSolution: true,
      solution,
      followUps: Array.isArray(task.followUps) ? task.followUps.slice(0, 2) : undefined,
    };
  }

  if (result.partial) {
    return {
      summary: 'Fast richtig – vergleiche deine Antwort mit der Musterlösung.',
      lines: [{ text: 'Fast richtig', tone: 'partial' }],
      showSolution: true,
      solution,
      followUps: Array.isArray(task.followUps) ? task.followUps.slice(0, 2) : undefined,
    };
  }

  return {
    summary: 'Schau dir die Musterlösung an und vergleiche sie mit deiner Antwort.',
    lines: [{ text: 'Schau dir diese Stelle noch einmal an', tone: 'retry' }],
    showSolution: true,
    solution,
    followUps: Array.isArray(task.followUps) ? task.followUps.slice(0, 2) : undefined,
  };
}

/**
 * @param {object} task
 * @param {'speaking'} coachType
 * @param {{ learnerResponse?: string, speakingSubmitted?: boolean }} payload
 * @returns {CoachExerciseFeedback}
 */
function evaluateSpeakingResponse(task, payload) {
  const note = String(payload.learnerResponse || '').trim();
  const lines = [{ text: 'Deine Antwort wurde gespeichert.', tone: 'neutral' }];

  if (task?.skill === 'bildbeschreibung') {
    return {
      summary: 'Gut – du hast die Bildbeschreibung abgeschlossen.',
      lines: [{ text: 'Deine Übung wurde gespeichert.', tone: 'success' }],
    };
  }

  if (note) {
    lines.push({ text: 'Du hast eine schriftliche Notiz hinterlegt.', tone: 'info' });
  }
  if (payload.speakingSubmitted) {
    lines.unshift({ text: 'Deine gesprochene Antwort wurde gespeichert.', tone: 'success' });
  }

  return {
    summary: 'Gut – du hast die Sprechübung abgeschlossen.',
    lines,
    followUps: Array.isArray(task.followUps) ? task.followUps.slice(0, 2) : undefined,
  };
}

/**
 * @param {object} params
 * @param {object} params.task
 * @param {string} params.coachType
 * @param {Record<string, string>} [params.selectedAnswers]
 * @param {string} [params.learnerResponse]
 * @param {boolean} [params.speakingSubmitted]
 * @param {string} [params.level]
 * @returns {{ evaluationStatus: string, feedback: CoachExerciseFeedback }}
 */
export function evaluateWeeklyPlanExercise({
  task,
  coachType,
  selectedAnswers = {},
  learnerResponse = '',
  speakingSubmitted = false,
  guidedCompleted = false,
  correctCount,
  totalQuestions,
  canonicalModelId,
  level = 'B1',
}) {
  const guidedPayload = extractGuidedCatalogCompletion({
    selectedAnswers,
    guidedCompleted,
    correctCount,
    totalQuestions,
    canonicalModelId,
  });

  if (
    isCanonicalA2GuidedCatalogTask(task, coachType) &&
    guidedPayload.guidedCompleted
  ) {
    const { correctCount: score, totalQuestions: total } = guidedPayload;
    const allCorrect = score === total;
    return {
      evaluationStatus: 'evaluated',
      feedback: {
        summary: allCorrect
          ? 'Sehr gut – alles richtig beantwortet.'
          : `Du hast ${score} von ${total} Fragen richtig beantwortet.`,
        lines: [
          {
            text: `${score} von ${total} Fragen richtig`,
            tone: allCorrect ? 'success' : 'partial',
          },
        ],
      },
    };
  }

  if (coachType === 'listening' && isB1WeeklyPlanHoerenTask(task)) {
    return {
      evaluationStatus: 'evaluated',
      feedback: evaluateB1HoerenResponse(task, selectedAnswers),
    };
  }

  if (coachType === 'listening') {
    const questions = extractListeningQuestions(task);
    const mcqAnswers = selectedAnswersToMcqMap(selectedAnswers, questions);
    const evaluation = evaluateListening({
      answer: {
        sectionIndex: 0,
        skill: 'listening',
        modelId: task.id,
        mcqAnswers,
      },
      sectionContent: task,
      targetLevel: level,
    });
    return {
      evaluationStatus: 'evaluated',
      feedback: mcqEvaluationToFeedback(questions, evaluation),
    };
  }

  if (coachType === 'reading') {
    const questions = extractReadingQuestions(task);
    const mcqAnswers = selectedAnswersToMcqMap(selectedAnswers, questions);
    const evaluation = evaluateReading({
      answer: {
        sectionIndex: 0,
        skill: 'reading',
        modelId: task.id,
        mcqAnswers,
      },
      sectionContent: task,
      targetLevel: level,
    });
    return {
      evaluationStatus: 'evaluated',
      feedback: mcqEvaluationToFeedback(questions, evaluation),
    };
  }

  if (coachType === 'grammar' || coachType === 'email') {
    if (isB1WeeklyPlanSchreibenTask(task)) {
      return {
        evaluationStatus: 'saved',
        feedback: evaluateB1SchreibenResponse(learnerResponse),
      };
    }
    return {
      evaluationStatus: 'evaluated',
      feedback: evaluateWritingResponse(task, learnerResponse),
    };
  }

  if (coachType === 'speaking') {
    return {
      evaluationStatus: 'saved',
      feedback: evaluateSpeakingResponse(task, { learnerResponse, speakingSubmitted }),
    };
  }

  return {
    evaluationStatus: 'saved',
    feedback: {
      summary: 'Deine Antwort wurde gespeichert.',
      lines: [{ text: 'Übung abgeschlossen.', tone: 'neutral' }],
    },
  };
}

/**
 * @param {object} task
 * @param {string} coachType
 * @param {{ selectedAnswers?: Record<string, string>, learnerResponse?: string, speakingSubmitted?: boolean }} payload
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateExerciseSubmission(task, coachType, payload = {}) {
  if (isCanonicalA2GuidedCatalogTask(task, coachType)) {
    return validateGuidedCatalogCompletion(task, coachType, payload);
  }

  const selectedAnswers = payload.selectedAnswers || {};
  const learnerResponse = String(payload.learnerResponse || '').trim();
  const speakingSubmitted = Boolean(payload.speakingSubmitted);

  if (coachType === 'listening' && isB1WeeklyPlanHoerenTask(task)) {
    return validateB1HoerenSubmission(task, payload);
  }

  if (coachType === 'listening' || coachType === 'reading') {
    const questions =
      coachType === 'listening'
        ? extractListeningQuestions(task)
        : extractReadingQuestions(task);
    if (!questions.length) {
      return { ok: false, reason: 'Diese Übung hat keine bewertbaren Fragen.' };
    }
    const answered = questions.some((q, index) => {
      const id = String(q.id ?? index);
      const value = selectedAnswers[id] ?? selectedAnswers[String(index)] ?? '';
      return String(value).trim().length > 0;
    });
    if (!answered) {
      return { ok: false, reason: 'Bitte beantworte mindestens eine Frage.' };
    }
    return { ok: true };
  }

  if (coachType === 'grammar' || coachType === 'email') {
    if (isB1WeeklyPlanSchreibenTask(task)) {
      return validateB1SchreibenSubmission(task, learnerResponse);
    }
    if (!learnerResponse) {
      return { ok: false, reason: 'Bitte schreibe deine Antwort, bevor du abschließt.' };
    }
    return { ok: true };
  }

  if (coachType === 'speaking') {
    if (isB1WeeklyPlanInteractiveSpeakingTask(task)) {
      const dialogue = payload.b1InteractiveState?.dialogue || [];
      const hasLearnerTurn = dialogue.some(
        (entry) => entry?.role === 'learner' && String(entry?.text || '').trim()
      );
      if (!hasLearnerTurn && !learnerResponse.trim()) {
        return {
          ok: false,
          reason: 'Bitte antworten Sie Ihrem Coach, bevor Sie die Übung abschließen.',
        };
      }
      if (!payload.b1InteractiveState?.conversationComplete) {
        return {
          ok: false,
          reason: 'Bitte führen Sie das Gespräch mit Ihrem Coach zu Ende, bevor Sie abschließen.',
        };
      }
      if (!learnerResponse.trim()) {
        return {
          ok: false,
          reason: 'Bitte senden Sie Ihre Antworten an den Coach, bevor Sie abschließen.',
        };
      }
      return { ok: true };
    }

    if (task?.skill === 'bildbeschreibung') {
      if (!learnerResponse.trim()) {
        return {
          ok: false,
          reason: 'Bitte nehmen Sie Ihre Bildbeschreibung auf oder geben Sie einen Text ein.',
        };
      }
      return { ok: true };
    }

    if (!speakingSubmitted && !learnerResponse) {
      return {
        ok: false,
        reason: 'Bitte nimm deine Antwort auf oder schreibe eine kurze Notiz.',
      };
    }
    return { ok: true };
  }

  if (!learnerResponse) {
    return { ok: false, reason: 'Bitte bearbeite die Aufgabe, bevor du abschließt.' };
  }
  return { ok: true };
}

/**
 * @param {object|null|undefined} exercise
 * @returns {boolean}
 */
export function exerciseHasSubmission(exercise) {
  if (!exercise) return false;
  return Boolean(
    exercise.submittedAt ||
      exercise.evaluationStatus === 'evaluated' ||
      exercise.evaluationStatus === 'saved' ||
      exercise.evaluationStatus === 'submitted'
  );
}

/**
 * @param {object} task
 * @param {string} coachType
 * @returns {boolean}
 */
export function shouldShowSolution(task, coachType, exercise) {
  if (!exerciseHasSubmission(exercise)) return false;
  if (coachType === 'grammar' || coachType === 'email') {
    if (isA2SchreibenEvaluationTask(task)) {
      return Boolean(exercise?.feedback?.showSolution && exercise?.feedback?.solution);
    }
    if (isB1WeeklyPlanSchreibenTask(task)) {
      return false;
    }
    return Boolean(task?.solution && exercise?.feedback?.showSolution);
  }
  if (coachType === 'listening' || coachType === 'reading') {
    return exerciseHasSubmission(exercise);
  }
  return false;
}
