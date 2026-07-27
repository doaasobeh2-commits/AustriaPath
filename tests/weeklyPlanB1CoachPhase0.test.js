/**
 * Phase 0 — B1 Weekly Plan Hören coach runtime (client-only).
 */
import { describe, expect, it } from 'vitest';
import { buildB1CoachWeeklyPlan } from '../src/data/weekly-plan/b1/planGeneration.js';
import { b1WeeklyPlanHoerenCatalog, b1WeeklyPlanSchreibenCatalog } from '../src/data/weekly-plan/b1/index.js';
import {
  B1_HOEREN_QUESTIONS_PER_MODEL,
  flattenB1HoerenQuestions,
  isB1WeeklyPlanHoerenTask,
  resolveB1CoachExerciseTask,
  resolveCoachExerciseTask,
} from '../src/data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import {
  evaluateWeeklyPlanExercise,
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  getPlanByIndex,
  startExercise,
  submitExerciseResponse,
  createCoachWeeklyPlan,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { getWeeklyPlanTaskById } from '../src/data/weeklyPlanLibrary.js';

function fullB1Selections() {
  return {
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((model) => model.id),
    hoeren: b1WeeklyPlanHoerenCatalog.slice(0, 7).map((model) => model.id),
    bildbeschreibung: Array.from({ length: 7 }, (_, index) => `b1wp-bild-${String(index + 1).padStart(3, '0')}`),
    planung: Array.from({ length: 7 }, (_, index) => `b1wp-planung-${String(index + 1).padStart(2, '0')}`),
  };
}

function findHoerenExercise(plan, planIndex = 1) {
  const entry = getPlanByIndex(plan, planIndex);
  return entry.exercises.find((exercise) => exercise.b1Category === 'hoeren');
}

function buildCorrectAnswers(task) {
  return Object.fromEntries(
    flattenB1HoerenQuestions(task).map((question) => [question.id, question.expected])
  );
}

describe('B1 coach task adapter', () => {
  it('does not change legacy getWeeklyPlanTaskById behavior', () => {
    const legacy = getWeeklyPlanTaskById('b1-hoeren-001');
    expect(legacy?.id).toBe('b1-hoeren-001');
    expect(getWeeklyPlanTaskById('b1wp-hoeren-001')).toBeUndefined();
  });

  it('resolves b1wp hören tasks only through plan branch with b1Category', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findHoerenExercise(plan);
    expect(exercise?.taskId).toBe('b1wp-hoeren-001');

    expect(resolveCoachExerciseTask(exercise, plan)).toBeTruthy();
    expect(resolveCoachExerciseTask(exercise, null)).toBeUndefined();
    expect(resolveB1CoachExerciseTask(exercise, plan)?.id).toBe('b1wp-hoeren-001');
  });

  it('normalizes hören model with two clips, four questions, and public audio paths', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findHoerenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(isB1WeeklyPlanHoerenTask(task)).toBe(true);
    expect(task.parts).toHaveLength(2);
    expect(flattenB1HoerenQuestions(task)).toHaveLength(B1_HOEREN_QUESTIONS_PER_MODEL);

    task.parts.forEach((part) => {
      expect(part.audioPath).toMatch(/^\/audio\/weekly-plan\/b1\/hoeren\/.+\.mp3$/);
      expect(part.questions).toHaveLength(2);
      part.questions.forEach((question) => {
        expect(question.q).toBeTruthy();
        expect(question.answer).toMatch(/^[A-D]$/);
        expect(Object.keys(question.options || {})).toHaveLength(4);
      });
    });
  });
});

describe('B1 hören validation and grading', () => {
  it('requires both clips played and all four answers before submission', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findHoerenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);
    const answers = buildCorrectAnswers(task);

    expect(
      validateExerciseSubmission(task, 'listening', {
        selectedAnswers: answers,
        b1HoerenClipProgress: { clip1Played: true, clip2Played: false },
      }).ok
    ).toBe(false);

    expect(
      validateExerciseSubmission(task, 'listening', {
        selectedAnswers: { 'p0-q0': 'A' },
        b1HoerenClipProgress: { clip1Played: true, clip2Played: true },
      }).ok
    ).toBe(false);

    expect(
      validateExerciseSubmission(task, 'listening', {
        selectedAnswers: answers,
        b1HoerenClipProgress: { clip1Played: true, clip2Played: true },
      }).ok
    ).toBe(true);
  });

  it('grades deterministically from correctAnswer letters', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findHoerenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);
    const answers = buildCorrectAnswers(task);

    const perfect = evaluateWeeklyPlanExercise({
      task,
      coachType: 'listening',
      selectedAnswers: answers,
      level: 'B1',
    });
    expect(perfect.feedback.summary).toContain('Sehr gut');

    const wrong = evaluateWeeklyPlanExercise({
      task,
      coachType: 'listening',
      selectedAnswers: Object.fromEntries(Object.keys(answers).map((id) => [id, 'A'])),
      level: 'B1',
    });
    expect(wrong.feedback.lines.some((line) => line.tone === 'retry')).toBe(true);
  });
});

describe('B1 hören coach state persistence', () => {
  it('completes hören exercise through existing submitExerciseResponse flow', () => {
    let plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findHoerenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);
    const answers = buildCorrectAnswers(task);

    plan = startExercise(plan, 1, exercise.slot).plan;
    const result = submitExerciseResponse(plan, 1, exercise.slot, {
      selectedAnswers: answers,
      audioPlayed: true,
      b1HoerenClipProgress: { clip1Played: true, clip2Played: true },
    });

    expect(result.changed).toBe(true);
    expect(result.error).toBeUndefined();

    const updated = getPlanByIndex(result.plan, 1).exercises.find((item) => item.slot === exercise.slot);
    expect(updated.status).toBe('completed');
    expect(updated.selectedAnswers).toEqual(answers);
    expect(updated.b1HoerenClipProgress).toEqual({ clip1Played: true, clip2Played: true });
    expect(updated.evaluationStatus).toBe('evaluated');
    expect(updated.feedback?.summary).toContain('Sehr gut');
  });
});

describe('legacy weekly-plan flows remain unchanged', () => {
  it('still resolves A2 coach tasks through legacy library lookup', () => {
    const plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren'] });
    const exercise = getPlanByIndex(plan, 1).exercises[0];
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(plan.planKind).not.toBe('b1-weekly-plan-v1');
    expect(task?.id).toBe(exercise.taskId);
    expect(isB1WeeklyPlanHoerenTask(task)).toBe(false);
  });
});
