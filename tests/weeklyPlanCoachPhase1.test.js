/**
 * Phase 1 — Weekly Plan coach-v1 state and separation tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyTimePassage,
  completeExercise,
  countCompletedPlans,
  createCoachWeeklyPlan,
  finishTrainingDay,
  getInProgressExercise,
  getPlanByIndex,
  getTrainingCta,
  isCoachV1Plan,
  loadWeeklyPlan,
  saveWeeklyPlan,
  startExercise,
  submitExerciseResponse,
  switchExercise,
  TOTAL_PLANS,
  EXERCISES_PER_PLAN,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { buildA2DailyReport } from '../src/data/utils/a2CoachDailyReport.js';
import {
  planWeek,
  resolveCoachType,
  getWeeklyPlanTaskById,
} from '../src/data/weeklyPlanLibrary.js';
import { WEEKLY_PLAN_STORAGE_KEY } from '../src/constants/storageKeys.js';
import { buildGuidedCatalogCompletionPayload } from '../src/data/utils/a2GuidedCatalogCompletion.js';
import { isA2HorenWeeklyTask } from '../src/data/utils/a2HorenRuntime.js';
import { isA2LesenWeeklyTask } from '../src/data/utils/a2LesenRuntime.js';

function createMemoryStorage() {
  /** @type {Record<string, string>} */
  const store = {};
  return {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

function submitPayloadForSlot(plan, planIndex, slot) {
  const entry = getPlanByIndex(plan, planIndex);
  const exercise = entry.exercises.find((e) => e.slot === slot);
  const task = getWeeklyPlanTaskById(exercise.taskId);
  if (isA2LesenWeeklyTask(task)) {
    return buildGuidedCatalogCompletionPayload(4, 4, task.canonicalModelId);
  }
  if (isA2HorenWeeklyTask(task)) {
    return {
      ...buildGuidedCatalogCompletionPayload(4, 4, task.canonicalModelId),
      audioPlayed: true,
    };
  }
  if (exercise.coachType === 'speaking') {
    return { speakingSubmitted: true, learnerResponse: 'Übungsantwort für die Coach-Übung.' };
  }
  if (exercise.coachType === 'listening' || exercise.coachType === 'reading') {
    return {
      selectedAnswers: { 0: task.questions?.[0]?.answer || 'Antwort' },
      audioPlayed: exercise.coachType === 'listening',
    };
  }
  return { learnerResponse: task.solution || task.task || 'Übungsantwort' };
}

function finishDay(plan, planIndex) {
  const dailyReport = buildA2DailyReport(plan, planIndex);
  return finishTrainingDay(plan, planIndex, dailyReport);
}

function unlockPlan(plan, planIndex) {
  return {
    ...plan,
    plans: plan.plans.map((entry) => {
      if (entry.planIndex !== planIndex) return entry;
      const { availableFrom: _removed, ...rest } = entry;
      return { ...rest, status: 'available' };
    }),
  };
}

function submitSlot(plan, planIndex, slot) {
  let next = startExercise(plan, planIndex, slot).plan;
  return submitExerciseResponse(next, planIndex, slot, submitPayloadForSlot(next, planIndex, slot));
}

describe('resolveCoachType', () => {
  it('maps library tasks to coach types', () => {
    expect(resolveCoachType({ type: 'speaking', skill: 'planung' })).toBe('speaking');
    expect(resolveCoachType({ type: 'listening', skill: 'hoeren' })).toBe('listening');
    expect(resolveCoachType({ type: 'reading', skill: 'lesen' })).toBe('reading');
    expect(resolveCoachType({ type: 'writing', skill: 'schreiben' })).toBe('email');
    expect(resolveCoachType({ type: 'writing', skill: 'grammatik' })).toBe('grammar');
    expect(resolveCoachType({ type: 'writing', skill: 'satzbau' })).toBe('grammar');
  });
});

describe('planWeek', () => {
  it('creates exactly 7 plans with 4 exercises each', () => {
    const plans = planWeek({ level: 'B1', weaknesses: ['hoeren', 'grammatik'], totalPlans: 7, exercisesPerPlan: 4 });
    expect(plans).toHaveLength(7);
    plans.forEach((plan) => {
      expect(plan).toHaveLength(4);
      plan.forEach((task) => {
        expect(task.id).toBeTruthy();
        expect(task.coachType).toBeTruthy();
      });
    });
  });
});

describe('createCoachWeeklyPlan', () => {
  it('activates plan 1 and locks plans 2–7', () => {
    const plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    expect(plan.schemaVersion).toBe('coach-v1');
    expect(plan.plans).toHaveLength(7);
    expect(plan.plans[0].status).toBe('available');
    expect(plan.plans[0].exercises).toHaveLength(4);
    for (let i = 1; i < 7; i += 1) {
      expect(plan.plans[i].status).toBe('locked');
      expect(plan.plans[i].exercises).toHaveLength(4);
    }
  });
});

describe('getTrainingCta', () => {
  it('shows Training starten at 0/4 even when plan is in_progress', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = startExercise(plan, 1, 1).plan;
    const entry = getPlanByIndex(plan, 1);
    const paused = {
      ...plan,
      plans: plan.plans.map((p) =>
        p.planIndex === 1
          ? {
              ...p,
              exercises: p.exercises.map((e) =>
                e.slot === 1 ? { ...e, status: 'not_started', savedProgress: true } : e
              ),
            }
          : p
      ),
    };
    const cta = getTrainingCta(getPlanByIndex(paused, 1), paused);
    expect(cta.label).toBe('Training starten');
  });

  it('shows Training fortsetzen when at least one exercise is done', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = submitSlot(plan, 1, 1).plan;
    const cta = getTrainingCta(getPlanByIndex(plan, 1), plan);
    expect(cta.label).toBe('Training fortsetzen');
  });

  it('shows Training fortsetzen when an exercise is in progress', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = startExercise(plan, 1, 2).plan;
    const cta = getTrainingCta(getPlanByIndex(plan, 1), plan);
    expect(cta.label).toBe('Training fortsetzen');
  });
});

describe('switchExercise', () => {
  it('pauses the previous exercise and starts the new one', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = startExercise(plan, 1, 1).plan;
    const result = switchExercise(plan, 1, 1, 2);
    plan = result.plan;
    const entry = getPlanByIndex(plan, 1);
    expect(getInProgressExercise(entry)?.slot).toBe(2);
    const paused = entry.exercises.find((e) => e.slot === 1);
    expect(paused.status).toBe('not_started');
    expect(paused.savedProgress).toBe(true);
  });
});

describe('weekly plan progression', () => {
  it('starts an exercise as in_progress', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren'] });
    const result = startExercise(plan, 1, 1);
    expect(result.changed).toBe(true);
    plan = result.plan;
    expect(plan.plans[0].status).toBe('in_progress');
    expect(plan.plans[0].exercises[0].status).toBe('in_progress');
  });

  it('persists progress across storage reload', () => {
    const storage = createMemoryStorage();
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['lesen'] });
    plan = submitSlot(plan, 1, 1).plan;
    saveWeeklyPlan(plan, storage);
    const reloaded = loadWeeklyPlan(storage);
    expect(reloaded?.plans[0].exercises[0].status).toBe('completed');
    expect(reloaded?.plans[0].exercises[0].submittedAt).toBeTruthy();
  });

  it('marks a plan ready_to_finish after the fourth exercise, then completes via finishTrainingDay', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren'] });
    for (let slot = 1; slot <= 4; slot += 1) {
      const result = submitSlot(plan, 1, slot);
      plan = result.plan;
      if (slot < 4) {
        expect(result.planJustCompleted).toBe(false);
      }
    }
    expect(plan.plans[0].status).toBe('ready_to_finish');
    expect(countCompletedPlans(plan)).toBe(0);

    const finished = finishDay(plan, 1);
    plan = finished.plan;
    expect(finished.planJustCompleted).toBe(true);
    expect(plan.plans[0].status).toBe('completed');
    expect(plan.plans[0].planSummary).toBeTruthy();
    expect(plan.plans[1].status).toBe('locked');
    expect(plan.plans[1].availableFrom).toBeTruthy();
    expect(countCompletedPlans(plan)).toBe(1);
    expect(plan.currentPlanIndex).toBe(1);
  });

  it('completing plan 7 marks the weekly plan finished', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['lesen'] });
    for (let planIndex = 1; planIndex <= TOTAL_PLANS; planIndex += 1) {
      plan = unlockPlan(plan, planIndex);
      for (let slot = 1; slot <= EXERCISES_PER_PLAN; slot += 1) {
        plan = submitSlot(plan, planIndex, slot).plan;
      }
      const finished = finishDay(plan, planIndex);
      plan = finished.plan;
      if (planIndex === TOTAL_PLANS) {
        expect(finished.weekJustCompleted).toBe(true);
      } else {
        expect(finished.planJustCompleted).toBe(true);
      }
    }
    expect(plan.status).toBe('completed');
    expect(plan.weeklyReport).toBeTruthy();
    expect(countCompletedPlans(plan)).toBe(7);
  });

  it('is idempotent when completing the same exercise twice', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['grammatik'] });
    plan = submitSlot(plan, 1, 1).plan;
    const second = submitExerciseResponse(plan, 1, 1, submitPayloadForSlot(plan, 1, 1));
    expect(second.changed).toBe(false);
    expect(second.plan.plans[0].exercises[0].status).toBe('completed');
  });

  it('does not change state when time passes', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = startExercise(plan, 1, 2).plan;
    const afterTime = applyTimePassage(plan);
    expect(afterTime).toEqual(plan);
    expect(afterTime.plans[0].exercises[1].status).toBe('in_progress');
  });
});

describe('coach-v1 storage shape', () => {
  it('never stores score or CEFR fields', () => {
    const storage = createMemoryStorage();
    const plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    saveWeeklyPlan(plan, storage);
    const raw = storage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toMatch(/normalizedScore|cefrLevel|overallScore|strongCount|weakCount/i);
    expect(isCoachV1Plan(JSON.parse(raw))).toBe(true);
  });
});

describe('weekly plan exam pipeline separation', () => {
  const weeklyFiles = [
    'src/app/screens/WeeklyPlanSetupScreen.jsx',
    'src/app/screens/WeeklyPlanHomeScreen.jsx',
    'src/app/screens/TrainingPlanDashboardScreen.jsx',
    'src/app/screens/CoachExerciseScreen.jsx',
    'src/app/screens/WeeklyCompletionScreen.jsx',
    'src/data/utils/weeklyPlanCoachState.js',
    'src/data/utils/weeklyPlanExerciseEvaluation.js',
  ];

  it('weekly plan Phase 1 files never call finalizeAiSessionParts or decidePracticeCouncil', () => {
    weeklyFiles.forEach((relativePath) => {
      const source = readFileSync(resolve(relativePath), 'utf8');
      expect(source).not.toContain('finalizeAiSessionParts');
      expect(source).not.toContain('decidePracticeCouncil');
      expect(source).not.toContain('placementEvaluateService');
    });
  });
});
