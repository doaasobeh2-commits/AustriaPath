/**
 * B1 interactive speaking — task adapters, submission gates, conversation lifecycle.
 */
import { describe, expect, it } from 'vitest';
import { buildB1CoachWeeklyPlan } from '../src/data/weekly-plan/b1/planGeneration.js';
import {
  b1WeeklyPlanSchreibenCatalog,
  b1WeeklyPlanHoerenCatalog,
  b1WeeklyPlanBildbeschreibungCatalog,
} from '../src/data/weekly-plan/b1/index.js';
import {
  isB1WeeklyPlanInteractiveSpeakingTask,
  isB1WeeklyPlanPlanungTask,
  isB1WeeklyPlanSelbstvorstellungTask,
  resolveCoachExerciseTask,
} from '../src/data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import { shouldRequestB1InteractiveSession } from '../src/data/utils/b1InteractiveCoach.js';
import { validateExerciseSubmission } from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import { getPlanByIndex } from '../src/data/utils/weeklyPlanCoachState.js';

function fullB1Selections() {
  return {
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((model) => model.id),
    hoeren: b1WeeklyPlanHoerenCatalog.slice(0, 7).map((model) => model.id),
    bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog.slice(0, 7).map((model) => model.id),
    planung: Array.from({ length: 7 }, (_, index) => `b1wp-planung-${String(index + 1).padStart(2, '0')}`),
  };
}

function findExercise(plan, category, planIndex = 1) {
  const entry = getPlanByIndex(plan, planIndex);
  return entry.exercises.find((exercise) => exercise.b1Category === category);
}

describe('B1 interactive speaking adapters', () => {
  it('resolves planung with scenario, bullet points, and conversation goal', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findExercise(plan, 'planung');
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(task).toBeTruthy();
    expect(isB1WeeklyPlanPlanungTask(task)).toBe(true);
    expect(isB1WeeklyPlanInteractiveSpeakingTask(task)).toBe(true);
    expect(shouldRequestB1InteractiveSession(task)).toBe(true);
    expect(task.scenario).toBeTruthy();
    expect(task.requiredDiscussionPoints?.length).toBeGreaterThan(0);
    expect(task.conversationGoal).toBeTruthy();
  });

  it('resolves selbstvorstellung as interactive speaking task', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findExercise(plan, 'selbstvorstellung');
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(task).toBeTruthy();
    expect(isB1WeeklyPlanSelbstvorstellungTask(task)).toBe(true);
    expect(shouldRequestB1InteractiveSession(task)).toBe(true);
    expect(task.task).toBeTruthy();
  });
});

describe('B1 interactive speaking submission gates', () => {
  it('blocks submit until conversationComplete is true', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findExercise(plan, 'planung');
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(
      validateExerciseSubmission(task, 'speaking', {
        learnerResponse: 'Ich schlage vor, dass wir am Samstag fahren.',
        b1InteractiveState: {
          dialogue: [
            { role: 'learner', text: 'Ich schlage vor, dass wir am Samstag fahren.' },
            { role: 'assistant', text: 'Wohin möchten Sie fahren?' },
          ],
          conversationComplete: false,
        },
      }).ok
    ).toBe(false);

    expect(
      validateExerciseSubmission(task, 'speaking', {
        learnerResponse: 'Ich schlage vor, dass wir am Samstag fahren.',
        b1InteractiveState: {
          dialogue: [
            { role: 'learner', text: 'Ich schlage vor, dass wir am Samstag fahren.' },
            { role: 'assistant', text: 'Danke, das reicht für heute.' },
          ],
          conversationComplete: true,
        },
      }).ok
    ).toBe(true);
  });
});
