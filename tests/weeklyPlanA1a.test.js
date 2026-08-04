/**
 * Phase A.1a — Activity catalog, activityName tagging, and display title tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getActivityNamesForLevel,
  isValidActivityNameForLevel,
  WEEKLY_PLAN_ACTIVITY_CATALOG,
} from '../src/data/weeklyPlanActivityCatalog.js';
import { planWeek, weeklyPlanLibrary } from '../src/data/weeklyPlanLibrary.js';
import { createCoachWeeklyPlan } from '../src/data/utils/weeklyPlanCoachState.js';
import {
  getExerciseCardSubtitle,
  getExerciseCardTitle,
} from '../src/data/utils/weeklyPlanLabels.js';

const PLAN_WEEK_SNAPSHOT = {
  level: 'B1',
  weaknesses: ['hoeren', 'grammatik'],
  totalPlans: 7,
  exercisesPerPlan: 4,
};

function planWeekTaskIds(params = PLAN_WEEK_SNAPSHOT) {
  return planWeek(params).map((plan) => plan.map((task) => task.id));
}

describe('weeklyPlanActivityCatalog', () => {
  it('defines 15 activity names per level across five domains', () => {
    for (const level of ['A2', 'B1', 'B2']) {
      const names = getActivityNamesForLevel(level);
      expect(names).toHaveLength(15);
      expect(new Set(names).size).toBe(15);
      expect(WEEKLY_PLAN_ACTIVITY_CATALOG[level]).toBeTruthy();
    }
  });
});

describe('weeklyPlanLibrary activityName', () => {
  it('tags every library task with activityName', () => {
    expect(weeklyPlanLibrary.length).toBeGreaterThanOrEqual(45);
    weeklyPlanLibrary.forEach((task) => {
      expect(task.activityName, task.id).toBeTruthy();
      expect(String(task.activityName).trim().length).toBeGreaterThan(0);
    });
  });

  it('uses activity names from the correct level catalog', () => {
    weeklyPlanLibrary.forEach((task) => {
      expect(
        isValidActivityNameForLevel(task.level, task.activityName),
        `${task.id} → ${task.activityName}`
      ).toBe(true);
    });
  });
});

describe('createCoachWeeklyPlan activityName persistence', () => {
  it('persists activityName on each new exercise', () => {
    const plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren', 'grammatik'] });
    expect(plan.schemaVersion).toBe('coach-v1');

    plan.plans.forEach((planEntry) => {
      planEntry.exercises.forEach((exercise) => {
        expect(exercise.activityName).toBeTruthy();
        const task = weeklyPlanLibrary.find((item) => item.id === exercise.taskId);
        expect(exercise.activityName).toBe(task?.activityName || task?.title);
      });
    });
  });
});

describe('getExerciseCardTitle', () => {
  const task = weeklyPlanLibrary.find((item) => item.id === 'b1-hoeren-001');

  it('prefers persisted exercise.activityName for dashboard and headers', () => {
    expect(getExerciseCardTitle(task, { activityName: 'Interview anhören' })).toBe(
      'Interview anhören'
    );
  });

  it('falls back to task.activityName when exercise has no snapshot', () => {
    expect(getExerciseCardTitle(task)).toBe('Alltagsgespräch verstehen');
  });

  it('falls back to task.title for legacy tasks without activityName', () => {
    const legacyTask = { title: 'Termin beim Arzt', skill: 'hoeren', coachType: 'listening' };
    expect(getExerciseCardTitle(legacyTask)).toBe('Termin beim Arzt');
  });

  it('falls back to skill label when no activity or title exists', () => {
    expect(getExerciseCardTitle({ skill: 'grammatik', coachType: 'grammar' })).toBe('Grammatik');
  });
});

describe('getExerciseCardSubtitle', () => {
  it('uses library title as a short hint instead of the full prompt', () => {
    const task = weeklyPlanLibrary.find((item) => item.id === 'b1-grammatik-002');
    const subtitle = getExerciseCardSubtitle(task);
    expect(subtitle).toContain('Relativsatz');
    expect(subtitle.length).toBeLessThan(60);
  });
});

describe('planWeek stability (A.1a)', () => {
  it('keeps deterministic output for the same inputs', () => {
    const first = planWeekTaskIds();
    const second = planWeekTaskIds();
    expect(second).toEqual(first);
  });
});

describe('weekly plan pipeline isolation (A.1a)', () => {
  const weeklyFiles = [
    'src/data/weeklyPlanActivityCatalog.js',
    'src/data/utils/weeklyPlanLabels.js',
    'src/data/utils/weeklyPlanCoachState.js',
    'src/app/screens/TrainingPlanDashboardScreen.jsx',
    'src/app/screens/CoachExerciseScreen.jsx',
  ];

  it('A.1a files never call exam pipeline or placement evaluator', () => {
    weeklyFiles.forEach((relativePath) => {
      const source = readFileSync(resolve(relativePath), 'utf8');
      expect(source).not.toContain('finalizeAiSessionParts');
      expect(source).not.toContain('decidePracticeCouncil');
      expect(source).not.toContain('placementEvaluateService');
    });
  });
});
