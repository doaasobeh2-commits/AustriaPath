/**
 * B1 Weekly Plan coach task adapter — resolves b1wp-* exercises from dedicated catalogs.
 * @module data/utils/b1WeeklyPlanCoachTaskAdapter
 */

import { getWeeklyPlanTaskById } from '../weeklyPlanLibrary.js';
import { resolveB1WeeklyPlanModel } from '../weekly-plan/b1/planGeneration.js';
import {
  buildB1SchreibenWritingMeta,
  selectB1SchreibenEmail,
} from './b1SchreibenTaskParser.js';

export const B1_BILD_TASK_PROMPT = 'Bitte beschreiben Sie das Bild.';
export const B1_HOEREN_QUESTIONS_PER_MODEL = 4;

/**
 * @param {unknown} plan
 * @param {{ b1Category?: string, taskId?: string } | null | undefined} exercise
 */
export function isB1WeeklyPlanExercise(plan, exercise) {
  return Boolean(
    plan?.planKind === 'b1-weekly-plan-v1' &&
      exercise?.b1Category &&
      String(exercise.taskId || '').startsWith('b1wp-')
  );
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanHoerenTask(task) {
  return Boolean(task?.isB1WeeklyPlanHoerenTask);
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanSchreibenTask(task) {
  return Boolean(task?.isB1WeeklyPlanSchreibenTask);
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanBildbeschreibungTask(task) {
  return Boolean(task?.isB1WeeklyPlanBildbeschreibungTask);
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanPlanungTask(task) {
  return Boolean(task?.isB1WeeklyPlanPlanungTask);
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanSelbstvorstellungTask(task) {
  return Boolean(task?.isB1WeeklyPlanSelbstvorstellungTask);
}

/**
 * @param {unknown} task
 */
export function isB1WeeklyPlanInteractiveSpeakingTask(task) {
  return (
    isB1WeeklyPlanBildbeschreibungTask(task) ||
    isB1WeeklyPlanPlanungTask(task) ||
    isB1WeeklyPlanSelbstvorstellungTask(task)
  );
}

/**
 * @param {unknown} options
 * @returns {Record<string, string>}
 */
function normalizeMcqOptions(options) {
  if (!Array.isArray(options)) {
    return typeof options === 'object' && options ? { ...options } : {};
  }
  return Object.fromEntries(
    options.map((option) => [String(option.id), String(option.text || '')])
  );
}

/**
 * @param {object} model
 */
function toCoachListeningTask(model) {
  const parts = (model.parts || []).map((part, partIndex) => ({
    id: part.id,
    title: part.title,
    audioPath: part.audioPath,
    questions: (part.questions || []).map((question, questionIndex) => ({
      id: `p${partIndex}-q${questionIndex}`,
      catalogQuestionId: question.id,
      q: question.question,
      answer: String(question.correctAnswer || '').trim(),
      options: normalizeMcqOptions(question.options),
    })),
  }));

  return {
    id: model.id,
    level: 'B1',
    skill: 'hoeren',
    coachType: 'listening',
    title: model.title,
    activityName: model.title,
    description: model.description,
    isB1WeeklyPlanHoerenTask: true,
    b1Category: 'hoeren',
    modelVersion: model.modelVersion,
    parts,
  };
}

/**
 * @param {object} model
 * @param {{ planIndex?: number, exerciseSlot?: number }} [context]
 */
function toCoachSchreibenTask(model, context = {}) {
  const planIndex = Number(context.planIndex) || 1;
  const exerciseSlot = Number(context.exerciseSlot) || 1;
  const selectedEmail = selectB1SchreibenEmail(model.emails || [], planIndex, exerciseSlot);

  if (!selectedEmail) {
    return null;
  }

  const writingMeta = buildB1SchreibenWritingMeta(selectedEmail);

  return {
    id: model.id,
    level: 'B1',
    skill: 'schreiben',
    coachType: 'email',
    title: model.title,
    activityName: writingMeta.emailTitle || model.title,
    description: model.description,
    isB1WeeklyPlanSchreibenTask: true,
    b1Category: 'schreiben',
    modelVersion: model.modelVersion,
    selectedEmailIndex: writingMeta.selectedEmailIndex,
    emailTitle: writingMeta.emailTitle,
    scenario: writingMeta.scenario,
    recipient: writingMeta.recipient,
    taskPoints: writingMeta.taskPoints,
    minimumLength: writingMeta.minimumLength,
    emails: model.emails,
  };
}

/**
 * @param {object} model
 */
function toCoachBildbeschreibungTask(model) {
  return {
    id: model.id,
    level: 'B1',
    skill: 'bildbeschreibung',
    coachType: 'speaking',
    title: model.title,
    activityName: model.title,
    description: model.description,
    isB1WeeklyPlanBildbeschreibungTask: true,
    b1Category: 'bildbeschreibung',
    modelVersion: model.modelVersion,
    imageAsset: model.imageAsset,
    imageId: model.source?.sourceId || String(model.id),
    task: B1_BILD_TASK_PROMPT,
    taskPrompts: model.taskPrompts || [],
    semanticCoveragePoints: model.semanticCoveragePoints || [],
  };
}

/**
 * @param {object} model
 */
function toCoachPlanungTask(model) {
  return {
    id: model.id,
    level: 'B1',
    skill: 'planung',
    coachType: 'speaking',
    title: model.title,
    activityName: model.title,
    description: model.description,
    isB1WeeklyPlanPlanungTask: true,
    b1Category: 'planung',
    modelVersion: model.modelVersion,
    scenario: model.scenario,
    requiredDiscussionPoints: model.requiredDiscussionPoints || [],
    conversationGoal:
      model.conversationGoal ||
      model.description ||
      model.scenario ||
      model.title,
    examinerPrompts: model.examinerPrompts || [],
    followUpBranches: model.followUpBranches || [],
  };
}

/**
 * @param {object} model
 */
function toCoachSelbstvorstellungTask(model) {
  return {
    id: model.id,
    level: 'B1',
    skill: 'selbstvorstellung',
    coachType: 'speaking',
    title: model.title,
    activityName: model.title,
    description: model.description,
    task: model.description || model.title,
    isB1WeeklyPlanSelbstvorstellungTask: true,
    b1Category: 'selbstvorstellung',
    modelVersion: model.modelVersion,
    semanticTopics: model.semanticTopics || [],
    followUpQuestions: model.followUpQuestions || [],
    maxFollowUpQuestions: model.maxFollowUpQuestions || 2,
  };
}

/**
 * @param {object} task
 * @returns {Array<{ id: string, prompt: string, expected: string, partIndex: number, questionIndex: number }>}
 */
export function flattenB1HoerenQuestions(task) {
  if (!isB1WeeklyPlanHoerenTask(task)) return [];

  /** @type {Array<{ id: string, prompt: string, expected: string, partIndex: number, questionIndex: number }>} */
  const questions = [];

  (task.parts || []).forEach((part, partIndex) => {
    (part.questions || []).forEach((question, questionIndex) => {
      questions.push({
        id: String(question.id || `p${partIndex}-q${questionIndex}`),
        prompt: String(question.q || ''),
        expected: String(question.answer || '').trim(),
        partIndex,
        questionIndex,
      });
    });
  });

  return questions;
}

/**
 * @param {{ taskId?: string, b1Category?: string } | null | undefined} exercise
 * @param {unknown} plan
 * @param {{ planIndex?: number, exerciseSlot?: number }} [context]
 * @returns {object | null}
 */
export function resolveB1CoachExerciseTask(exercise, plan, context = {}) {
  if (!isB1WeeklyPlanExercise(plan, exercise)) return null;

  const model = resolveB1WeeklyPlanModel(exercise.b1Category, exercise.taskId);
  if (!model) return null;

  switch (exercise.b1Category) {
    case 'hoeren':
      return toCoachListeningTask(model);
    case 'schreiben':
      return toCoachSchreibenTask(model, context);
    case 'bildbeschreibung':
      return toCoachBildbeschreibungTask(model);
    case 'planung':
      return toCoachPlanungTask(model);
    case 'selbstvorstellung':
      return toCoachSelbstvorstellungTask(model);
    default:
      return null;
  }
}

/**
 * Resolve a coach exercise task from plan context without changing legacy library lookup.
 * @param {{ taskId?: string, b1Category?: string } | null | undefined} exercise
 * @param {unknown} [plan]
 * @param {{ planIndex?: number, exerciseSlot?: number }} [context]
 * @returns {object | undefined | null}
 */
export function resolveCoachExerciseTask(exercise, plan, context = {}) {
  if (!exercise?.taskId) return undefined;

  if (isB1WeeklyPlanExercise(plan, exercise)) {
    return resolveB1CoachExerciseTask(exercise, plan, context);
  }

  return getWeeklyPlanTaskById(exercise.taskId);
}
