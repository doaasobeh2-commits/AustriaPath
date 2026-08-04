/**
 * A2 coach daily report builder tests.
 */
import { describe, expect, it } from 'vitest';
import { createCoachWeeklyPlan, finishTrainingDay, getPlanByIndex, startExercise, submitExerciseResponse } from '../src/data/utils/weeklyPlanCoachState.js';
import { getWeeklyPlanTaskById } from '../src/data/weeklyPlanLibrary.js';
import { buildGuidedCatalogCompletionPayload } from '../src/data/utils/a2GuidedCatalogCompletion.js';
import { isA2HorenWeeklyTask } from '../src/data/utils/a2HorenRuntime.js';
import { isA2LesenWeeklyTask } from '../src/data/utils/a2LesenRuntime.js';
import { buildA2DailyReport } from '../src/data/utils/a2CoachDailyReport.js';

function submitPayload(plan, planIndex, slot) {
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
  return { learnerResponse: task.solution || task.task || 'Übungsantwort' };
}

describe('buildA2DailyReport', () => {
  it('builds a deterministic daily report from completed exercises', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren'] });
    for (let slot = 1; slot <= 4; slot += 1) {
      plan = startExercise(plan, 1, slot).plan;
      plan = submitExerciseResponse(plan, 1, slot, submitPayload(plan, 1, slot)).plan;
    }

    const report = buildA2DailyReport(plan, 1);
    expect(report.summary).toContain('Trainingsplan 1');
    expect(report.exercises).toHaveLength(4);

    const finished = finishTrainingDay(plan, 1, report);
    expect(finished.changed).toBe(true);
    expect(finished.plan.plans[0].status).toBe('completed');
    expect(finished.plan.plans[0].dailyReport?.summary).toBe(report.summary);
  });
});
