/**
 * Weekly Plan coach-v1 state — completion-based progression, no timers or scores.
 * @module data/utils/weeklyPlanCoachState
 */

import { planWeek, getWeeklyPlanTaskById } from '../weeklyPlanLibrary.js';
import { resolveCoachExerciseTask } from './b1WeeklyPlanCoachTaskAdapter.js';
import { buildExerciseTrainingMemory } from './weeklyPlanTrainingMemory.js';
import { WEEKLY_PLAN_STORAGE_KEY } from '../../constants/storageKeys.js';
import { getExerciseCardTitle } from './weeklyPlanLabels.js';
import {
  evaluateWeeklyPlanExercise,
  exerciseHasSubmission,
  validateExerciseSubmission,
} from './weeklyPlanExerciseEvaluation.js';
import { buildSchreibenCorrectionIdempotencyKey } from './a2SchreibenAiCorrectionSchema.js';
import { isAdminQaMode } from '../../utils/adminQaMode.js';

export const COACH_SCHEMA_VERSION = 'coach-v1';
export const TOTAL_PLANS = 7;
export const EXERCISES_PER_PLAN = 4;

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanPlan | null | undefined} planEntry
 * @returns {number}
 */
export function getPlanExerciseCount(planEntry) {
  const count = planEntry?.exercises?.length;
  return count && count > 0 ? count : EXERCISES_PER_PLAN;
}

/**
 * @param {unknown} plan
 * @returns {boolean}
 */
export function isCoachV1Plan(plan) {
  return Boolean(plan && plan.schemaVersion === COACH_SCHEMA_VERSION && Array.isArray(plan.plans));
}

/**
 * @param {unknown} plan
 * @returns {boolean}
 */
export function isLegacyWeeklyPlan(plan) {
  if (!plan || typeof plan !== 'object') return false;
  if (isCoachV1Plan(plan)) return false;
  return Boolean(
    plan.appointments?.length ||
      plan.aiSessionEngine ||
      plan.sessionReports?.length ||
      plan.dailyMessages ||
      plan.type === 'ki-wochenplan'
  );
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {number}
 */
export function countCompletedPlans(plan) {
  if (!plan?.plans?.length) return 0;
  return plan.plans.filter((p) => p.status === 'completed').length;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {number}
 */
export function remainingPlans(plan) {
  return TOTAL_PLANS - countCompletedPlans(plan);
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanPlan | null}
 */
export function getPlanByIndex(plan, planIndex) {
  return plan?.plans?.find((p) => p.planIndex === planIndex) || null;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanPlan | null}
 */
export function getCurrentPlan(plan) {
  if (!plan?.plans?.length) return null;
  const current = getPlanByIndex(plan, plan.currentPlanIndex);
  if (current && current.status !== 'locked') return current;
  const firstOpen = plan.plans.find(
    (p) =>
      p.status === 'available' ||
      p.status === 'in_progress' ||
      p.status === 'ready_to_finish'
  );
  return firstOpen || null;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanPlan} planEntry
 * @returns {number}
 */
export function countCompletedExercises(planEntry) {
  return planEntry.exercises.filter((e) => e.status === 'completed').length;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanPlan} planEntry
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanExercise | null}
 */
export function getInProgressExercise(planEntry) {
  return planEntry.exercises.find((e) => e.status === 'in_progress') || null;
}

/**
 * @param {{ level?: string, focusSkills?: string[] }} params
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState}
 */
export function createCoachWeeklyPlan({ level = 'B1', focusSkills = [] } = {}) {
  const weekSlots = planWeek({
    level,
    weaknesses: focusSkills,
    totalPlans: TOTAL_PLANS,
    exercisesPerPlan: EXERCISES_PER_PLAN,
  });

  const plans = weekSlots.map((planTasks, index) => {
    const planIndex = index + 1;
    return {
      planIndex,
      status: planIndex === 1 ? 'available' : 'locked',
      exercises: planTasks.map((task, slotIndex) => ({
        slot: slotIndex + 1,
        taskId: task.id,
        activityName: getExerciseCardTitle(task),
        coachType: task.coachType,
        status: 'not_started',
        placeholderCompleted: false,
      })),
      planSummary: null,
    };
  });

  return {
    schemaVersion: COACH_SCHEMA_VERSION,
    totalPlans: TOTAL_PLANS,
    currentPlanIndex: 1,
    completedPlans: 0,
    level,
    focusSkills,
    status: 'active',
    plans,
    weeklyReport: null,
    activatedAt: new Date().toISOString(),
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState}
 */
export function syncDerivedPlanFields(plan) {
  const completedPlans = countCompletedPlans(plan);
  let currentPlanIndex = plan.currentPlanIndex || 1;

  const openPlan = plan.plans.find(
    (p) => p.status === 'available' || p.status === 'in_progress'
  );
  if (openPlan) {
    currentPlanIndex = openPlan.planIndex;
  } else if (completedPlans >= TOTAL_PLANS) {
    currentPlanIndex = TOTAL_PLANS;
  }

  return {
    ...plan,
    completedPlans,
    currentPlanIndex,
    status: completedPlans >= TOTAL_PLANS ? 'completed' : plan.status || 'active',
  };
}

/**
 * @param {Date} [fromDate]
 * @returns {string}
 */
export function getNextPlanEligibleAt(fromDate = new Date()) {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState}
 */
export function syncTrainingPlanDayUnlocks(plan) {
  let changed = false;
  const plans = plan.plans.map((entry) => {
    if (
      entry.status === 'locked' &&
      entry.availableFrom &&
      Date.now() >= new Date(entry.availableFrom).getTime()
    ) {
      changed = true;
      const { availableFrom: _removed, ...rest } = entry;
      return { ...rest, status: 'available' };
    }
    return entry;
  });
  return changed ? syncDerivedPlanFields({ ...plan, plans }) : plan;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} completedPlanIndex
 */
export function getNextTrainingPlanAccess(plan, completedPlanIndex) {
  const synced = syncTrainingPlanDayUnlocks(plan);
  const nextIndex = completedPlanIndex + 1;
  const next = getPlanByIndex(synced, nextIndex);
  if (!next) {
    return {
      plan: synced,
      nextIndex,
      canOpen: false,
      waitingForTomorrow: false,
      message: '',
    };
  }

  const canOpen = next.status === 'available' || next.status === 'in_progress';
  const waitingForTomorrow = next.status === 'locked' && Boolean(next.availableFrom);

  return {
    plan: synced,
    nextIndex,
    canOpen,
    waitingForTomorrow,
    message: waitingForTomorrow
      ? 'Der nächste Trainingsplan ist morgen verfügbar.'
      : '',
  };
}

/**
 * Admin QA only — unlock the next training plan immediately for testing.
 */
export function adminQaUnlockNextTrainingPlan(plan, completedPlanIndex) {
  if (!isAdminQaMode()) {
    return { plan, changed: false };
  }

  const nextIndex = completedPlanIndex + 1;
  const next = getPlanByIndex(plan, nextIndex);
  if (!next || next.status !== 'locked') {
    return { plan, changed: false };
  }

  const plans = plan.plans.map((entry) => {
    if (entry.planIndex !== nextIndex) return entry;
    const { availableFrom: _removed, ...rest } = entry;
    return { ...rest, status: 'available' };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans, currentPlanIndex: nextIndex }),
    changed: true,
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanPlan} planEntry
 * @returns {{ improved: string[], practice: string[] }}
 */
export function buildPlaceholderPlanSummary(planEntry) {
  const total = getPlanExerciseCount(planEntry);
  const titles = planEntry.exercises.map((e) => e.taskId);
  return {
    improved: [
      `Du hast alle ${total} Übungen durchgearbeitet.`,
      'Deine Antworten wurden Schritt für Schritt gespeichert.',
    ],
    practice: [
      'Im nächsten Trainingsplan üben wir weiter mit neuen Aufgaben.',
      titles.length ? `Weiter mit ähnlichen Übungstypen.` : 'Bleib dran – Übung macht den Meister.',
    ],
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanWeeklyReport}
 */
export function buildPlaceholderWeeklyReport(plan) {
  return {
    improved: [
      'Du hast alle 7 Trainingspläne abgeschlossen.',
      'Du hast regelmäßig an deinen Übungen gearbeitet.',
    ],
    practice: [
      'Wiederhole gelegentlich die Korrekturen aus deinen abgeschlossenen Plänen.',
      'Achte weiter auf Verbposition und vollständige Sätze.',
    ],
    recommendation:
      'Starte einen neuen Wochenplan mit mehr Sprechübungen, wenn du das möchtest.',
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanPlan | null} planEntry
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState | null} plan
 * @returns {{ label: string, tab: string, planIndex?: number }}
 */
export function getTrainingCta(planEntry, plan) {
  const allDone =
    plan && (countCompletedPlans(plan) >= TOTAL_PLANS || plan.status === 'completed');

  if (allDone) {
    return { label: 'Wochenbericht ansehen', tab: 'weeklyCompletion' };
  }

  if (!planEntry) {
    return { label: 'Training starten', tab: 'trainingPlanDashboard', planIndex: 1 };
  }

  const done = countCompletedExercises(planEntry);
  const exerciseTotal = getPlanExerciseCount(planEntry);
  const hasInProgress = Boolean(getInProgressExercise(planEntry));

  if (planEntry.status === 'ready_to_finish') {
    return {
      label: 'Heutiges Training abschließen',
      tab: 'trainingPlanDashboard',
      planIndex: planEntry.planIndex,
    };
  }

  if (planEntry.status === 'completed') {
    if (planEntry.planIndex >= TOTAL_PLANS) {
      return { label: 'Wochenbericht ansehen', tab: 'weeklyCompletion' };
    }
    return {
      label: 'Zum nächsten Trainingsplan',
      tab: 'trainingPlanDashboard',
      planIndex: planEntry.planIndex + 1,
    };
  }

  if (done === 0 && !hasInProgress) {
    return {
      label: 'Training starten',
      tab: 'trainingPlanDashboard',
      planIndex: planEntry.planIndex,
    };
  }

  return {
    label: 'Training fortsetzen',
    tab: 'trainingPlanDashboard',
    planIndex: planEntry.planIndex,
  };
}

/**
 * Pause an in-progress exercise while preserving progress for later.
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} slot
 */
export function pauseExercise(plan, planIndex, slot) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return { plan, changed: false };

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise || exercise.status !== 'in_progress') {
    return { plan, changed: false };
  }

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        return {
          ...e,
          status: 'not_started',
          savedProgress: true,
          pausedAt: new Date().toISOString(),
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * Switch from one in-progress exercise to another.
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} fromSlot
 * @param {number} toSlot
 */
export function switchExercise(plan, planIndex, fromSlot, toSlot) {
  let next = pauseExercise(plan, planIndex, fromSlot).plan;
  const started = startExercise(next, planIndex, toSlot);
  return started;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} slot
 * @returns {{ plan: import('../weeklyPlanLibrary.js').WeeklyPlanState, changed: boolean }}
 */
export function startExercise(plan, planIndex, slot) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry || planEntry.status === 'locked' || planEntry.status === 'completed') {
    return { plan, changed: false };
  }

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise || exercise.status === 'completed') {
    return { plan, changed: false };
  }

  if (exercise.status === 'in_progress') {
    return { plan, changed: false };
  }

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    const nextStatus = p.status === 'available' ? 'in_progress' : p.status;
    return {
      ...p,
      status: nextStatus,
      exercises: p.exercises.map((e) => {
        if (e.slot === slot) {
          return { ...e, status: 'in_progress' };
        }
        if (e.status === 'in_progress') {
          return {
            ...e,
            status: 'not_started',
            savedProgress: true,
            pausedAt: new Date().toISOString(),
          };
        }
        return e;
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({
      ...plan,
      plans,
      currentPlanIndex: planIndex,
    }),
    changed: true,
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} slot
 * @param {{ learnerResponse?: string, selectedAnswers?: Record<string, string>, speakingSubmitted?: boolean, audioPlayed?: boolean }} draft
 * @returns {{ plan: import('../weeklyPlanLibrary.js').WeeklyPlanState, changed: boolean }}
 */
export function saveExerciseDraft(plan, planIndex, slot, draft = {}) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry || planEntry.status === 'locked') {
    return { plan, changed: false };
  }

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise || exercise.status === 'completed') {
    return { plan, changed: false };
  }

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        return {
          ...e,
          learnerResponse: draft.learnerResponse ?? e.learnerResponse,
          selectedAnswers: draft.selectedAnswers ?? e.selectedAnswers,
          speakingSubmitted:
            draft.speakingSubmitted !== undefined
              ? draft.speakingSubmitted
              : e.speakingSubmitted,
          audioPlayed: draft.audioPlayed !== undefined ? draft.audioPlayed : e.audioPlayed,
          b1HoerenClipProgress:
            draft.b1HoerenClipProgress !== undefined
              ? draft.b1HoerenClipProgress
              : e.b1HoerenClipProgress,
          b1InteractiveState:
            draft.b1InteractiveState !== undefined ? draft.b1InteractiveState : e.b1InteractiveState,
          savedProgress: true,
          draftSavedAt: new Date().toISOString(),
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} slot
 * @param {{ learnerResponse?: string, selectedAnswers?: Record<string, string>, speakingSubmitted?: boolean, audioPlayed?: boolean }} payload
 * @returns {{ plan: import('../weeklyPlanLibrary.js').WeeklyPlanState, changed: boolean, error?: string, planJustCompleted: boolean, weekJustCompleted: boolean }}
 */
export function submitExerciseResponse(plan, planIndex, slot, payload = {}) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry || planEntry.status === 'locked') {
    return {
      plan,
      changed: false,
      error: 'Dieser Trainingsplan ist nicht verfügbar.',
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise) {
    return {
      plan,
      changed: false,
      error: 'Übung nicht gefunden.',
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  if (exercise.status === 'completed' && exerciseHasSubmission(exercise)) {
    return {
      plan,
      changed: false,
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  const task = resolveCoachExerciseTask(exercise, plan);
  const validation = validateExerciseSubmission(task, exercise.coachType, payload);
  if (!validation.ok) {
    return {
      plan,
      changed: false,
      error: validation.reason,
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  const { evaluationStatus, feedback } = evaluateWeeklyPlanExercise({
    task,
    coachType: exercise.coachType,
    selectedAnswers: payload.selectedAnswers,
    learnerResponse: payload.learnerResponse,
    speakingSubmitted: payload.speakingSubmitted,
    guidedCompleted: payload.guidedCompleted,
    correctCount: payload.correctCount,
    totalQuestions: payload.totalQuestions,
    canonicalModelId: payload.canonicalModelId,
    level: plan.level,
  });

  let nextPlan = plan;
  const draftResult = saveExerciseDraft(plan, planIndex, slot, payload);
  nextPlan = draftResult.plan;

  const plans = nextPlan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        return {
          ...e,
          learnerResponse: payload.learnerResponse ?? e.learnerResponse,
          selectedAnswers: payload.selectedAnswers ?? e.selectedAnswers,
          speakingSubmitted:
            payload.speakingSubmitted !== undefined
              ? payload.speakingSubmitted
              : e.speakingSubmitted,
          audioPlayed: payload.audioPlayed !== undefined ? payload.audioPlayed : e.audioPlayed,
          b1HoerenClipProgress:
            payload.b1HoerenClipProgress !== undefined
              ? payload.b1HoerenClipProgress
              : e.b1HoerenClipProgress,
          b1InteractiveState:
            payload.b1InteractiveState !== undefined
              ? payload.b1InteractiveState
              : e.b1InteractiveState,
          submittedAt: new Date().toISOString(),
          evaluationStatus,
          feedback,
          trainingMemory: buildExerciseTrainingMemory(
            {
              ...e,
              learnerResponse: payload.learnerResponse ?? e.learnerResponse,
              selectedAnswers: payload.selectedAnswers ?? e.selectedAnswers,
              speakingSubmitted:
                payload.speakingSubmitted !== undefined
                  ? payload.speakingSubmitted
                  : e.speakingSubmitted,
              audioPlayed: payload.audioPlayed !== undefined ? payload.audioPlayed : e.audioPlayed,
              b1HoerenClipProgress:
                payload.b1HoerenClipProgress !== undefined
                  ? payload.b1HoerenClipProgress
                  : e.b1HoerenClipProgress,
              b1InteractiveState:
                payload.b1InteractiveState !== undefined
                  ? payload.b1InteractiveState
                  : e.b1InteractiveState,
              submittedAt: new Date().toISOString(),
            },
            task
          ),
          attemptCount: (e.attemptCount || 0) + 1,
          status: e.status === 'not_started' ? 'in_progress' : e.status,
        };
      }),
    };
  });

  nextPlan = syncDerivedPlanFields({ ...nextPlan, plans });
  return completeExercise(nextPlan, planIndex, slot, { requireSubmission: true });
}

/**
 * Persist AI correction on a completed Schreiben exercise without changing completion or attempts.
 */
export function saveSchreibenAiCorrection(plan, planIndex, slot, aiCorrection) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return { plan, changed: false };

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise || exercise.status !== 'completed') {
    return { plan, changed: false };
  }

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        const mergedFeedback = e.feedback
          ? {
              ...e.feedback,
              aiCorrection,
              primaryCorrectedEmail: aiCorrection?.correctedEmail || e.feedback.primaryCorrectedEmail,
            }
          : e.feedback;
        return {
          ...e,
          aiCorrection,
          feedback: mergedFeedback,
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * Persist B1 interactive coach session binding on an exercise.
 */
export function saveB1InteractiveSessionBinding(plan, planIndex, slot, binding = {}) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return { plan, changed: false };

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        return {
          ...e,
          b1AiSessionId: binding.sessionId ?? e.b1AiSessionId,
          b1TaskSnapshot: binding.taskSnapshot ?? e.b1TaskSnapshot,
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * Persist B1 Schreiben Weekly Training AI session binding on an exercise.
 */
export function saveB1SchreibenSessionBinding(plan, planIndex, slot, binding = {}) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return { plan, changed: false };

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        return {
          ...e,
          b1AiSessionId: binding.sessionId ?? e.b1AiSessionId,
          selectedEmailIndex: binding.selectedEmailIndex ?? e.selectedEmailIndex,
          b1WritingSnapshot: binding.writingSnapshot ?? e.b1WritingSnapshot,
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * Mark Schreiben AI correction loading/failed without touching completion state.
 */
export function updateSchreibenAiCorrectionStatus(plan, planIndex, slot, patch = {}) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return { plan, changed: false };

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    return {
      ...p,
      exercises: p.exercises.map((e) => {
        if (e.slot !== slot) return e;
        const nextCorrection = {
          ...(e.aiCorrection || {}),
          ...patch,
          idempotencyKey:
            patch.idempotencyKey ||
            e.aiCorrection?.idempotencyKey ||
            buildSchreibenCorrectionIdempotencyKey(planIndex, slot, e.submittedAt),
        };
        return {
          ...e,
          aiCorrection: nextCorrection,
          feedback: e.feedback
            ? {
                ...e.feedback,
                aiCorrection: nextCorrection,
              }
            : e.feedback,
        };
      }),
    };
  });

  return {
    plan: syncDerivedPlanFields({ ...plan, plans }),
    changed: true,
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {number} slot
 * @param {{ requireSubmission?: boolean }} [options]
 * @returns {{ plan: import('../weeklyPlanLibrary.js').WeeklyPlanState, changed: boolean, planJustCompleted: boolean, weekJustCompleted: boolean }}
 */
export function completeExercise(plan, planIndex, slot, options = {}) {
  const { requireSubmission = false } = options;
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry || planEntry.status === 'locked') {
    return { plan, changed: false, planJustCompleted: false, weekJustCompleted: false };
  }

  const exercise = planEntry.exercises.find((e) => e.slot === slot);
  if (!exercise) {
    return { plan, changed: false, planJustCompleted: false, weekJustCompleted: false };
  }

  if (exercise.status === 'completed' && exercise.placeholderCompleted) {
    return { plan, changed: false, planJustCompleted: false, weekJustCompleted: false };
  }

  if (requireSubmission && !exerciseHasSubmission(exercise)) {
    return { plan, changed: false, planJustCompleted: false, weekJustCompleted: false };
  }

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;

    const exercises = p.exercises.map((e) => {
      if (e.slot !== slot) return e;
      return {
        ...e,
        status: 'completed',
        placeholderCompleted: true,
        completedAt: e.completedAt || new Date().toISOString(),
        evaluationStatus: e.evaluationStatus || 'submitted',
      };
    });

    const allDone = exercises.every((e) => e.status === 'completed');
    if (!allDone) {
      return {
        ...p,
        status: p.status === 'available' ? 'in_progress' : p.status,
        exercises,
      };
    }

    return {
      ...p,
      status: 'ready_to_finish',
      exercises,
    };
  });

  const nextPlan = syncDerivedPlanFields({
    ...plan,
    plans,
    currentPlanIndex: plan.currentPlanIndex,
  });

  return {
    plan: nextPlan,
    changed: true,
    planJustCompleted: false,
    weekJustCompleted: false,
  };
}

/**
 * Finish today's training and store the Final Daily Report.
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @param {object} dailyReport
 */
export function finishTrainingDay(plan, planIndex, dailyReport) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) {
    return {
      plan,
      changed: false,
      error: 'Dieser Trainingsplan ist nicht verfügbar.',
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  if (planEntry.status === 'completed') {
    return { plan, changed: false, planJustCompleted: false, weekJustCompleted: false };
  }

  const allDone = planEntry.exercises.every((e) => e.status === 'completed');
  if (!allDone) {
    return {
      plan,
      changed: false,
      error: 'Bitte schließe zuerst alle Übungen ab.',
      planJustCompleted: false,
      weekJustCompleted: false,
    };
  }

  let planJustCompleted = false;
  let weekJustCompleted = false;

  const plans = plan.plans.map((p) => {
    if (p.planIndex !== planIndex) return p;
    planJustCompleted = true;
    return {
      ...p,
      status: 'completed',
      dailyReport,
      planSummary: buildDailyReportPlanSummary(dailyReport),
      completedAt: p.completedAt || new Date().toISOString(),
    };
  });

  if (planJustCompleted) {
    const nextIndex = planIndex + 1;
    if (nextIndex <= TOTAL_PLANS) {
      const eligibleAt = getNextPlanEligibleAt();
      plans.forEach((p, i) => {
        if (p.planIndex === nextIndex && p.status === 'locked') {
          plans[i] = { ...p, status: 'locked', availableFrom: eligibleAt };
        }
      });
    } else {
      weekJustCompleted = true;
    }
  }

  const nextPlan = syncDerivedPlanFields({
    ...plan,
    plans,
    currentPlanIndex: plan.currentPlanIndex,
  });

  if (weekJustCompleted) {
    nextPlan.weeklyReport = nextPlan.weeklyReport || buildPlaceholderWeeklyReport(nextPlan);
    nextPlan.status = 'completed';
  }

  return {
    plan: nextPlan,
    changed: true,
    planJustCompleted,
    weekJustCompleted,
  };
}

function buildDailyReportPlanSummary(dailyReport) {
  const improved = [];
  const practice = [];

  if (dailyReport?.writing?.correctedText) {
    improved.push('Deine E-Mail wurde im Tagesbericht korrigiert.');
  }
  if (dailyReport?.overallPerformance) {
    improved.push(String(dailyReport.overallPerformance));
  } else if (dailyReport?.summary) {
    improved.push(String(dailyReport.summary));
  }
  if (dailyReport?.strongestSkill) {
    improved.push(`Stärkste Fähigkeit heute: ${dailyReport.strongestSkill}`);
  }
  if (Array.isArray(dailyReport?.tomorrowPriorities) && dailyReport.tomorrowPriorities.length) {
    practice.push(...dailyReport.tomorrowPriorities.slice(0, 3).map(String));
  } else if (dailyReport?.writing?.missingPoints?.length) {
    practice.push('Einige Inhaltspunkte in der E-Mail können noch ergänzt werden.');
  }

  return {
    improved: improved.length ? improved : ['Guter Trainingsfortschritt heute.'],
    practice: practice.length ? practice : ['Morgen geht es mit dem nächsten Trainingsplan weiter.'],
  };
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {number} planIndex
 * @returns {object[]}
 */
export function collectTrainingMemoriesForDay(plan, planIndex) {
  const planEntry = getPlanByIndex(plan, planIndex);
  if (!planEntry) return [];
  return planEntry.exercises
    .map((exercise) => {
      if (exercise.trainingMemory) return exercise.trainingMemory;
      const task = resolveCoachExerciseTask(exercise, plan, {
        planIndex,
        exerciseSlot: exercise.slot,
      });
      if (!exercise.submittedAt) return null;
      return buildExerciseTrainingMemory(exercise, task);
    })
    .filter(Boolean);
}

/**
 * @param {Storage|null|undefined} [storage]
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState | null}
 */
export function loadWeeklyPlan(storage = localStorage) {
  try {
    const raw = storage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isCoachV1Plan(parsed)) return parsed;
    return syncTrainingPlanDayUnlocks(syncDerivedPlanFields(parsed));
  } catch {
    return null;
  }
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @param {Storage|null|undefined} [storage]
 * @returns {boolean}
 */
export function saveWeeklyPlan(plan, storage = localStorage) {
  try {
    const normalized = isCoachV1Plan(plan) ? syncDerivedPlanFields(plan) : plan;
    storage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Storage|null|undefined} [storage]
 */
export function clearWeeklyPlan(storage = localStorage) {
  try {
    storage.removeItem(WEEKLY_PLAN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Time passing must not change plan state — explicit no-op for tests and future cron guards.
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState} plan
 * @returns {import('../weeklyPlanLibrary.js').WeeklyPlanState}
 */
export function applyTimePassage(plan) {
  return plan;
}

/**
 * @param {import('../weeklyPlanLibrary.js').WeeklyPlanState | null} plan
 * @returns {{ kind: 'none'|'legacy'|'active'|'next_ready'|'finished', planIndex?: number, doneExercises?: number, message: string, cta: string, tab: string }}
 */
export function getWeeklyPlanEntryCard(plan) {
  if (!plan) {
    return {
      kind: 'none',
      message: 'Du hast noch keinen Wochenplan.',
      cta: 'Wochenplan aktivieren',
      tab: 'weeklyPlanSetup',
    };
  }

  if (isLegacyWeeklyPlan(plan)) {
    return {
      kind: 'legacy',
      message: 'Dein gespeicherter Wochenplan verwendet ein älteres Format.',
      cta: 'Neuen Wochenplan aktivieren',
      tab: 'weeklyPlanSetup',
    };
  }

  if (!isCoachV1Plan(plan)) {
    return {
      kind: 'none',
      message: 'Du hast noch keinen Wochenplan.',
      cta: 'Wochenplan aktivieren',
      tab: 'weeklyPlanSetup',
    };
  }

  const completedPlans = countCompletedPlans(plan);

  if (completedPlans >= TOTAL_PLANS || plan.status === 'completed') {
    return {
      kind: 'finished',
      message: 'KI-Wochenplan abgeschlossen',
      cta: 'Wochenbericht ansehen',
      tab: 'weeklyCompletion',
    };
  }

  const current = getCurrentPlan(plan);
  const planIndex = current?.planIndex || plan.currentPlanIndex || 1;
  const doneExercises = current ? countCompletedExercises(current) : 0;
  const cta = getTrainingCta(current, plan);
  const resolvedPlanIndex = cta.planIndex || planIndex;

  if (
    current?.status === 'available' &&
    doneExercises === 0 &&
    planIndex > 1
  ) {
    const previous = getPlanByIndex(plan, planIndex - 1);
    if (previous?.status === 'completed') {
      return {
        kind: 'next_ready',
        planIndex: resolvedPlanIndex,
        message: `Trainingsplan ${planIndex} ist bereit`,
        cta: cta.label,
        tab: cta.tab,
      };
    }
  }

  if (current?.status === 'completed') {
    const next = getPlanByIndex(plan, planIndex + 1);
    if (next && next.status === 'available') {
      const nextCta = getTrainingCta(next, plan);
      return {
        kind: 'next_ready',
        planIndex: nextCta.planIndex || next.planIndex,
        message: `Trainingsplan ${next.planIndex} ist bereit`,
        cta: nextCta.label,
        tab: nextCta.tab,
      };
    }
  }

  if (doneExercises > 0 || getInProgressExercise(current)) {
    return {
      kind: 'active',
      planIndex: resolvedPlanIndex,
      doneExercises,
      message: `Trainingsplan ${planIndex} · ${doneExercises} von ${getPlanExerciseCount(current)} Übungen erledigt`,
      cta: cta.label,
      tab: cta.tab,
    };
  }

  return {
    kind: 'active',
    planIndex: resolvedPlanIndex,
    doneExercises: 0,
    message: `Trainingsplan ${planIndex} · 0 von ${getPlanExerciseCount(current)} Übungen erledigt`,
    cta: cta.label,
    tab: cta.tab,
  };
}
