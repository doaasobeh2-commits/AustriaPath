/**
 * Phase 2A — B1 Schreiben coach UI (no AI).
 */
import { describe, expect, it } from 'vitest';
import { buildB1CoachWeeklyPlan } from '../src/data/weekly-plan/b1/planGeneration.js';
import { b1WeeklyPlanHoerenCatalog, b1WeeklyPlanSchreibenCatalog } from '../src/data/weekly-plan/b1/index.js';
import {
  isB1WeeklyPlanSchreibenTask,
  resolveCoachExerciseTask,
} from '../src/data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import {
  parseB1SchreibenTaskLines,
  isB1SchreibenResponseReady,
} from '../src/data/utils/b1SchreibenTaskParser.js';
import {
  evaluateWeeklyPlanExercise,
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  getPlanByIndex,
  startExercise,
  submitExerciseResponse,
} from '../src/data/utils/weeklyPlanCoachState.js';

function fullB1Selections() {
  return {
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((model) => model.id),
    hoeren: b1WeeklyPlanHoerenCatalog.slice(0, 7).map((model) => model.id),
    bildbeschreibung: Array.from({ length: 7 }, (_, index) => `b1wp-bild-${String(index + 1).padStart(3, '0')}`),
    planung: Array.from({ length: 7 }, (_, index) => `b1wp-planung-${String(index + 1).padStart(2, '0')}`),
  };
}

function findSchreibenExercise(plan, planIndex = 1) {
  return getPlanByIndex(plan, planIndex).exercises.find((exercise) => exercise.b1Category === 'schreiben');
}

describe('B1 Schreiben task parser', () => {
  it('extracts scenario, recipient and bullet points from catalog email task', () => {
    const email = b1WeeklyPlanSchreibenCatalog[0].emails[0];
    const parsed = parseB1SchreibenTaskLines(email.task);

    expect(parsed.scenario).toContain('Ausbildung');
    expect(parsed.recipient).toBe('Frau Korma');
    expect(parsed.taskPoints.length).toBeGreaterThanOrEqual(3);
    expect(parsed.taskPoints).toContain('Warum schreiben Sie?');
  });
});

describe('B1 Schreiben coach adapter', () => {
  it('resolves schreiben model with writing metadata for coach UI', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findSchreibenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan, {
      planIndex: 1,
      exerciseSlot: exercise.slot,
    });

    expect(isB1WeeklyPlanSchreibenTask(task)).toBe(true);
    expect(task.emailTitle).toBeTruthy();
    expect(task.scenario).toBeTruthy();
    expect(task.recipient).toBeTruthy();
    expect(task.taskPoints.length).toBeGreaterThan(0);
    expect(task.minimumLength).toBe(80);
    expect(task.selectedEmailIndex).toBeGreaterThanOrEqual(1);
  });
});

describe('B1 Schreiben submission without AI', () => {
  it('requires minimum length before submit', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findSchreibenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan, {
      planIndex: 1,
      exerciseSlot: exercise.slot,
    });

    expect(
      validateExerciseSubmission(task, 'email', {
        learnerResponse: 'Zu kurz',
      }).ok
    ).toBe(false);

    const emailText = 'Sehr geehrte Frau Korma,\n\n'.repeat(6);
    expect(
      validateExerciseSubmission(task, 'email', {
        learnerResponse: emailText,
      }).ok
    ).toBe(true);
    expect(isB1SchreibenResponseReady(emailText, task.minimumLength)).toBe(true);
  });

  it('persists learner email exactly without correction or scoring', () => {
    let plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findSchreibenExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan, {
      planIndex: 1,
      exerciseSlot: exercise.slot,
    });

    const learnerEmail = `Sehr geehrte Frau Korma,

ich schreibe mit vielen Fehler und falsch Grammatik weil ich teste nur speichern.

Mit freundlichen Grüßen
Test`;

    plan = startExercise(plan, 1, exercise.slot).plan;
    const result = submitExerciseResponse(plan, 1, exercise.slot, {
      learnerResponse: learnerEmail,
    });

    expect(result.changed).toBe(true);
    const updated = getPlanByIndex(result.plan, 1).exercises.find((item) => item.slot === exercise.slot);
    expect(updated.learnerResponse).toBe(learnerEmail);
    expect(updated.status).toBe('completed');
    expect(updated.evaluationStatus).toBe('saved');
    expect(updated.feedback.summary).toContain('gespeichert');
    expect(updated.feedback.lines.some((line) => line.text.includes('ohne Korrektur'))).toBe(true);
    expect(updated.feedback.solution).toBeUndefined();

    const evaluation = evaluateWeeklyPlanExercise({
      task,
      coachType: 'email',
      learnerResponse: learnerEmail,
      level: 'B1',
    });
    expect(evaluation.feedback.lines.every((line) => line.tone !== 'success')).toBe(true);
  });
});
