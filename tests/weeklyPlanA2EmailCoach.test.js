/**
 * A2 Weekly Plan email library integration tests.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createCoachWeeklyPlan,
  getPlanByIndex,
  loadWeeklyPlan,
  saveExerciseDraft,
  saveWeeklyPlan,
  startExercise,
  submitExerciseResponse,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { getWeeklyPlanTaskById, planWeek } from '../src/data/weeklyPlanLibrary.js';
import { weeklyPlanA2EmailLibrary } from '../src/data/weeklyPlanA2EmailLibrary.js';
import {
  getA2WeeklyPlanEmailCoachContent,
  getA2WeeklyPlanEmailRecord,
  isA2WeeklyPlanEmailTask,
} from '../src/data/utils/a2WeeklyPlanEmailRuntime.js';
import { getA2SchreibenEvaluation } from '../src/data/a2SchreibenEvaluationCatalog.js';
import * as a2EmailWritingEvaluation from '../src/data/utils/a2EmailWritingEvaluation.js';
import {
  evaluateWeeklyPlanExercise,
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import { shouldRequestSchreibenAiCorrection } from '../src/data/utils/a2SchreibenAiCorrection.js';

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

function findEmailExercise(plan, planIndex = 2) {
  const entry = getPlanByIndex(plan, planIndex);
  return entry.exercises.find((exercise) =>
    isA2WeeklyPlanEmailTask(getWeeklyPlanTaskById(exercise.taskId))
  );
}

describe('A2 weekly plan email selection', () => {
  it('includes an email exercise on even plan days', () => {
    const plans = planWeek({ level: 'A2', totalPlans: 7, exercisesPerPlan: 4 });
    const dayTwo = plans[1];
    const emailTask = dayTwo.find((task) => task.skill === 'schreiben');
    expect(emailTask).toBeTruthy();
    expect(String(emailTask.id)).toMatch(/^A2-EM-/);

    const dayOne = plans[0];
    expect(dayOne.some((task) => task.skill === 'schreiben')).toBe(false);
    expect(dayOne.some((task) => task.skill === 'aufgabe_loesen')).toBe(true);
  });

  it('keeps the selected email ID stable in coach plan state', () => {
    const plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['schreiben'] });
    const exercise = findEmailExercise(plan, 2);
    expect(exercise?.taskId).toMatch(/^A2-EM-/);

    const storage = createMemoryStorage();
    saveWeeklyPlan(plan, storage);
    const reloaded = loadWeeklyPlan(storage);
    const reloadedExercise = findEmailExercise(reloaded, 2);
    expect(reloadedExercise?.taskId).toBe(exercise?.taskId);
  });
});

describe('A2 email coach content', () => {
  const task = getWeeklyPlanTaskById('A2-EM-001');

  it('resolves scenario and Aufgabe from the same library record', () => {
    const record = getA2WeeklyPlanEmailRecord(task);
    const content = getA2WeeklyPlanEmailCoachContent(task);
    expect(record?.id).toBe('A2-EM-001');
    expect(content?.scenario).toBe(record?.scenario);
    expect(content?.taskPoints).toEqual(record?.taskPoints);
    expect(content?.aufgabe).toEqual(record?.taskPoints);
  });

  it('exposes evaluation metadata from the same record', () => {
    const meta = getA2SchreibenEvaluation(task);
    const record = getA2WeeklyPlanEmailRecord(task);
    expect(meta?.scenario).toBe(record?.scenario);
    expect(meta?.taskPoints).toEqual(record?.taskPoints);
  });
});

describe('A2 email coach exercise flow', () => {
  it('rejects empty submission', () => {
    const task = getWeeklyPlanTaskById('A2-EM-002');
    const result = validateExerciseSubmission(task, 'email', { learnerResponse: '   ' });
    expect(result.ok).toBe(false);
  });

  it('persists draft text across save and reload', () => {
    const storage = createMemoryStorage();
    let plan = unlockPlan(createCoachWeeklyPlan({ level: 'A2' }), 2);
    const exercise = findEmailExercise(plan, 2);
    expect(exercise).toBeTruthy();

    plan = startExercise(plan, 2, exercise.slot).plan;
    const draftText = 'Sehr geehrte Damen und Herren, ich habe eine Frage zur Ausbildung.';
    const draftResult = saveExerciseDraft(plan, 2, exercise.slot, { learnerResponse: draftText });
    saveWeeklyPlan(draftResult.plan, storage);

    const reloaded = loadWeeklyPlan(storage);
    const reloadedExercise = getPlanByIndex(reloaded, 2).exercises.find(
      (e) => e.slot === exercise.slot
    );
    expect(reloadedExercise?.learnerResponse).toBe(draftText);
  });

  it('calls evaluateA2EmailWriting with the selected task and learner response', () => {
    const evaluateSpy = vi.spyOn(a2EmailWritingEvaluation, 'evaluateA2EmailWriting');

    let plan = unlockPlan(createCoachWeeklyPlan({ level: 'A2' }), 2);
    const exercise = findEmailExercise(plan, 2);
    const task = getWeeklyPlanTaskById(exercise.taskId);
    plan = startExercise(plan, 2, exercise.slot).plan;

    const learnerResponse = `Sehr geehrte Damen und Herren,
ich interessiere mich für die Pflege-Ausbildung.
Können wir einen Termin für ein Vorstellungsgespräch vereinbaren?
Viele Grüße`;

    submitExerciseResponse(plan, 2, exercise.slot, { learnerResponse });

    expect(evaluateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: task.id, emailLibraryId: task.id }),
      learnerResponse
    );

    evaluateSpy.mockRestore();
  });

  it('marks the exercise completed after successful submission', () => {
    let plan = unlockPlan(createCoachWeeklyPlan({ level: 'A2' }), 2);
    const exercise = findEmailExercise(plan, 2);
    plan = startExercise(plan, 2, exercise.slot).plan;

    const learnerResponse = `Sehr geehrte Damen und Herren,
ich interessiere mich für die Pflege-Ausbildung.
Können wir einen Termin für ein Vorstellungsgespräch vereinbaren?
Viele Grüße`;

    const result = submitExerciseResponse(plan, 2, exercise.slot, { learnerResponse });
    expect(result.changed).toBe(true);
    expect(result.error).toBeUndefined();

    const completed = getPlanByIndex(result.plan, 2).exercises.find((e) => e.slot === exercise.slot);
    expect(completed?.status).toBe('completed');
    expect(completed?.feedback?.summary).toBeTruthy();
    expect(completed?.evaluationStatus).toBe('evaluated');
  });

  it('does not trigger AI correction for library email tasks', () => {
    const task = getWeeklyPlanTaskById('A2-EM-003');
    expect(shouldRequestSchreibenAiCorrection(task)).toBe(false);
    expect(
      evaluateWeeklyPlanExercise({
        task,
        coachType: 'email',
        learnerResponse: 'Hallo, dies ist meine Antwort mit genügend Text für die Übung.',
        level: 'A2',
      }).evaluationStatus
    ).toBe('evaluated');
  });

  it('preserves draft when submission validation fails', () => {
    let plan = unlockPlan(createCoachWeeklyPlan({ level: 'A2' }), 4);
    const exercise = findEmailExercise(plan, 4);
    plan = startExercise(plan, 4, exercise.slot).plan;
    plan = saveExerciseDraft(plan, 4, exercise.slot, {
      learnerResponse: 'Entwurf bleibt erhalten',
    }).plan;

    const failed = submitExerciseResponse(plan, 4, exercise.slot, { learnerResponse: '' });
    expect(failed.changed).toBe(false);
    const stillDraft = getPlanByIndex(plan, 4).exercises.find((e) => e.slot === exercise.slot);
    expect(stillDraft?.learnerResponse).toBe('Entwurf bleibt erhalten');
    expect(stillDraft?.status).not.toBe('completed');
  });
});

describe('library integrity', () => {
  it('maps every email library record to a weekly plan task', () => {
    weeklyPlanA2EmailLibrary.forEach((email) => {
      const task = getWeeklyPlanTaskById(email.id);
      expect(task?.emailLibraryId).toBe(email.id);
      expect(task?.skill).toBe('schreiben');
    });
  });

  it('does not change placement or B1 email runtime flags', () => {
    const b1Task = getWeeklyPlanTaskById('b1-schreiben-001');
    expect(isA2WeeklyPlanEmailTask(b1Task)).toBe(false);
    expect(a2EmailWritingEvaluation.evaluateA2EmailWriting(b1Task, 'test')).toMatchObject({
      summary: expect.any(String),
    });
  });
});
