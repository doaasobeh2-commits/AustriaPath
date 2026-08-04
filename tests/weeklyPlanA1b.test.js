/**
 * Phase A.1b — Weekly Plan library catalog expansion tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getActivityNamesForLevel,
  WEEKLY_PLAN_ACTIVITY_CATALOG,
} from '../src/data/weeklyPlanActivityCatalog.js';
import {
  planWeek,
  resolveCoachType,
  weeklyPlanLibrary,
} from '../src/data/weeklyPlanLibrary.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import {
  evaluateWeeklyPlanExercise,
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  buildCatalogCoverageMatrix,
  getUncoveredCatalogActivities,
  validateWeeklyPlanLibraryIntegrity,
} from '../src/data/utils/weeklyPlanLibraryValidation.js';
import {
  extractListeningQuestions,
  extractReadingQuestions,
} from '../src/exam-platform/evaluators/questionExtractors.js';
import { isA2HorenWeeklyTask } from '../src/data/utils/a2HorenRuntime.js';

function tasksForLevel(level) {
  return weeklyPlanLibrary.filter((task) => task.level === level);
}

describe('weeklyPlanLibrary catalog coverage (A.1b)', () => {
  it('has at least 15 tasks per CEFR level', () => {
    expect(tasksForLevel('A2').length).toBeGreaterThanOrEqual(15);
    expect(tasksForLevel('B1').length).toBeGreaterThanOrEqual(15);
    expect(tasksForLevel('B2').length).toBeGreaterThanOrEqual(15);
  });

  it('covers all 45 canonical level/activity combinations', () => {
    const missing = getUncoveredCatalogActivities();
    expect(missing.A2).toEqual([]);
    expect(missing.B1).toEqual([]);
    expect(missing.B2).toEqual([]);
  });

  it('passes library integrity validation', () => {
    const errors = validateWeeklyPlanLibraryIntegrity();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  it('uses unique task IDs', () => {
    const ids = weeklyPlanLibrary.map((task) => task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps every task in weeklyPlanTaskNavigation', () => {
    weeklyPlanLibrary.forEach((task) => {
      if (task.emailLibraryId) return;
      expect(weeklyPlanTaskNavigation[task.id], task.id).toBeTruthy();
    });
  });

  it('assigns a supported coach type to every task', () => {
    weeklyPlanLibrary.forEach((task) => {
      expect(resolveCoachType(task), task.id).toBeTruthy();
    });
  });
});

describe('evaluator compatibility (A.1b)', () => {
  it('catalog A2 hören tasks reference canonical listening models', () => {
    const catalogListening = weeklyPlanLibrary.filter(
      (task) => task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-H-')
    );
    expect(catalogListening).toHaveLength(10);
    catalogListening.forEach((task) => {
      expect(isA2HorenWeeklyTask(task), task.id).toBe(true);
    });
  });

  it('inline listening tasks have audio and evaluable questions', () => {
    const listeningTasks = weeklyPlanLibrary.filter(
      (task) =>
        resolveCoachType(task) === 'listening' &&
        !(task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-H-'))
    );
    expect(listeningTasks.length).toBeGreaterThanOrEqual(6);
    listeningTasks.forEach((task) => {
      expect(task.audioText?.trim(), task.id).toBeTruthy();
      expect(extractListeningQuestions(task).length, task.id).toBeGreaterThan(0);
      const evaluation = evaluateWeeklyPlanExercise({
        task,
        coachType: 'listening',
        selectedAnswers: { 0: task.questions[0].answer },
        level: task.level,
      });
      expect(evaluation.feedback.summary).toBeTruthy();
    });
  });

  it('reading tasks have text and evaluable questions', () => {
    const readingTasks = weeklyPlanLibrary.filter(
      (task) =>
        resolveCoachType(task) === 'reading' &&
        !(task.canonicalModelId && String(task.canonicalModelId).startsWith('A2-L-'))
    );
    readingTasks.forEach((task) => {
      expect(task.text?.trim(), task.id).toBeTruthy();
      expect(extractReadingQuestions(task).length, task.id).toBeGreaterThan(0);
    });
  });

  it('grammar tasks include deterministic solution data', () => {
    const grammarTasks = weeklyPlanLibrary.filter(
      (task) => resolveCoachType(task) === 'grammar'
    );
    grammarTasks.forEach((task) => {
      expect(task.solution?.trim() || task.example?.trim(), task.id).toBeTruthy();
    });
  });

  it('open writing tasks do not expose fake correctness scoring', () => {
    const writingTasks = weeklyPlanLibrary.filter(
      (task) => resolveCoachType(task) === 'email'
    );
    writingTasks.forEach((task) => {
      expect(task.solution).toBeUndefined();
      const validation = validateExerciseSubmission(task, 'email', {
        learnerResponse: 'Meine Antwort mit genügend Inhalt für die Aufgabe.',
      });
      expect(validation.ok).toBe(true);
    });
  });
});

describe('B2 domain coverage (A.1b)', () => {
  it('includes listening, speaking, and graphic activities', () => {
    const b2Listening = tasksForLevel('B2').filter(
      (task) => resolveCoachType(task) === 'listening'
    );
    const b2Speaking = tasksForLevel('B2').filter(
      (task) => resolveCoachType(task) === 'speaking'
    );
    expect(b2Listening.length).toBeGreaterThanOrEqual(3);
    expect(b2Speaking.length).toBeGreaterThanOrEqual(3);
    expect(
      tasksForLevel('B2').some((task) => task.activityName === 'Grafik beschreiben')
    ).toBe(true);
  });
});

describe('planWeek algorithm unchanged (A.1b)', () => {
  it('still uses the existing pool rotation implementation', () => {
    const source = readFileSync(resolve('src/data/weeklyPlanLibrary.js'), 'utf8');
    expect(source).toContain('pickTaskForSlot');
    expect(source).not.toContain('curriculumTemplate');
  });

  it('remains deterministic for the same inputs', () => {
    const params = { level: 'B1', weaknesses: ['hoeren', 'grammatik'], totalPlans: 7, exercisesPerPlan: 4 };
    const first = planWeek(params).map((plan) => plan.map((task) => task.id));
    const second = planWeek(params).map((plan) => plan.map((task) => task.id));
    expect(second).toEqual(first);
  });
});

describe('catalog coverage matrix (A.1b)', () => {
  it('maps every canonical activity to a task id', () => {
    const matrix = buildCatalogCoverageMatrix();
    for (const level of ['A2', 'B1', 'B2']) {
      for (const names of Object.values(WEEKLY_PLAN_ACTIVITY_CATALOG[level])) {
        names.forEach((activityName) => {
          const taskId = weeklyPlanLibrary.find(
            (task) => task.level === level && task.activityName === activityName
          )?.id;
          expect(taskId, `${level} ${activityName}`).toBeTruthy();
        });
      }
    }
    expect(matrix.A2.listening.every(Boolean)).toBe(true);
  });
});
