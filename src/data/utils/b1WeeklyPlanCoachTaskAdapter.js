/**
 * Weekly plan coach task adapter — A2-safe build surface without B1 catalog wiring.
 * B1 coach resolution stays disabled until B1 weekly training ships.
 */
import { getWeeklyPlanTaskById } from '../weeklyPlanLibrary.js';

export const B1_BILD_TASK_PROMPT = 'Bitte beschreiben Sie das Bild.';
export const B1_HOEREN_QUESTIONS_PER_MODEL = 4;

export function isB1WeeklyPlanExercise() {
  return false;
}

export function isB1WeeklyPlanHoerenTask() {
  return false;
}

export function isB1WeeklyPlanSchreibenTask() {
  return false;
}

export function isB1WeeklyPlanBildbeschreibungTask() {
  return false;
}

export function isB1WeeklyPlanInteractiveSpeakingTask() {
  return false;
}

export function isB1WeeklyPlanPlanungTask() {
  return false;
}

export function isB1WeeklyPlanSelbstvorstellungTask() {
  return false;
}

export function flattenB1HoerenQuestions() {
  return [];
}

/**
 * @param {{ taskId?: string } | null | undefined} exercise
 */
export function resolveCoachExerciseTask(exercise) {
  if (!exercise?.taskId) return undefined;
  return getWeeklyPlanTaskById(exercise.taskId);
}
