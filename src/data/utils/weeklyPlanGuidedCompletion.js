/**
 * Weekly Plan completion helpers for guided A2 trainer screens.
 * @module data/utils/weeklyPlanGuidedCompletion
 */
import {
  loadWeeklyPlan,
  saveWeeklyPlan,
  submitExerciseResponse,
} from './weeklyPlanCoachState.js';
import {
  isActiveWeeklyPlanExerciseHandoff,
  readWeeklyPlanHandoff,
  returnToWeeklyPlanDashboard,
} from './weeklyPlanHandoff.js';
import { buildGuidedCatalogCompletionPayload } from './a2GuidedCatalogCompletion.js';

/**
 * @param {{ setActiveTab?: (tab: string) => void, modelId: string, correctCount: number, totalQuestions?: number, audioPlayed?: boolean }} params
 */
export function submitGuidedCatalogWeeklyPlanExercise({
  setActiveTab,
  modelId,
  correctCount,
  totalQuestions = 4,
  audioPlayed,
}) {
  const handoff = readWeeklyPlanHandoff();
  if (!isActiveWeeklyPlanExerciseHandoff(handoff)) {
    return { submitted: false, fromWeeklyPlan: false };
  }

  const plan = loadWeeklyPlan();
  if (!plan) {
    return { submitted: false, fromWeeklyPlan: true, error: 'Kein Wochenplan gefunden.' };
  }

  const payload = {
    ...buildGuidedCatalogCompletionPayload(correctCount, totalQuestions, modelId),
    ...(audioPlayed !== undefined ? { audioPlayed } : {}),
  };

  const result = submitExerciseResponse(plan, handoff.planIndex, handoff.slot, payload);
  if (result.changed) {
    saveWeeklyPlan(result.plan);
    returnToWeeklyPlanDashboard(setActiveTab);
  }

  return {
    submitted: result.changed,
    fromWeeklyPlan: true,
    error: result.error,
    planIndex: handoff.planIndex,
  };
}

/**
 * @param {{ setActiveTab?: (tab: string) => void, speakingSubmitted?: boolean, learnerResponse?: string }} params
 */
export function submitSpeakingWeeklyPlanExercise({
  setActiveTab,
  speakingSubmitted = true,
  learnerResponse = '',
}) {
  const handoff = readWeeklyPlanHandoff();
  if (!isActiveWeeklyPlanExerciseHandoff(handoff)) {
    return { submitted: false, fromWeeklyPlan: false };
  }

  const plan = loadWeeklyPlan();
  if (!plan) {
    return { submitted: false, fromWeeklyPlan: true, error: 'Kein Wochenplan gefunden.' };
  }

  const result = submitExerciseResponse(plan, handoff.planIndex, handoff.slot, {
    speakingSubmitted,
    learnerResponse,
  });

  if (result.changed) {
    saveWeeklyPlan(result.plan);
    returnToWeeklyPlanDashboard(setActiveTab);
  }

  return {
    submitted: result.changed,
    fromWeeklyPlan: true,
    error: result.error,
    planIndex: handoff.planIndex,
  };
}
