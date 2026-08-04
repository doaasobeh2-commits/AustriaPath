import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApp } from '../server/src/app.js';
import { env } from '../server/src/config/env.js';
import {
  ADMIN_QA_FULL_DAY_TASK_IDS,
  createAdminQaFullDayPlan,
  isAdminQaFullDayPlan,
  clearAdminQaWeeklyPlanState,
} from '../src/data/utils/adminQaFullDayPlan.js';
import { planWeek } from '../src/data/weeklyPlanLibrary.js';
import { createCoachWeeklyPlan } from '../src/data/utils/weeklyPlanCoachState.js';
import { WEEKLY_PLAN_STORAGE_KEY } from '../src/constants/storageKeys.js';

describe('backend startup with canonical JSON catalogs', () => {
  it('imports createApp without JSON import attribute errors', async () => {
    await expect(import('../server/src/app.js')).resolves.toBeTruthy();
  });

  it('returns health 200 from /v1/health', async () => {
    const root = express();
    root.use('/v1', createApp());
    const res = await request(root).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.status).toBe('ok');
  });

  it('registers Schreiben correction route without 404', async () => {
    const root = express();
    root.use('/v1', createApp());
    const res = await request(root)
      .post('/v1/weekly-plan/correct-schreiben')
      .send({ input: { taskId: 'a2-schreiben-001', learnerEmail: 'Hallo.' } });
    expect(res.status).not.toBe(404);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });
});

describe('OpenAI configuration (no secret exposure)', () => {
  it('reports whether server OpenAI key is configured without printing it', () => {
    expect(typeof env.openaiApiKey).toBe('string');
    const configured = Boolean(env.openaiApiKey && env.openaiApiKey.trim().length > 0);
    expect(typeof configured).toBe('boolean');
  });
});

describe('Admin QA full day plan', () => {
  it('contains exactly the five requested canonical tasks on Day 1', () => {
    const plan = createAdminQaFullDayPlan();
    expect(isAdminQaFullDayPlan(plan)).toBe(true);
    const day1 = plan.plans[0];
    expect(day1.exercises).toHaveLength(5);
    expect(day1.exercises.map((exercise) => exercise.taskId)).toEqual([
      ...ADMIN_QA_FULL_DAY_TASK_IDS,
    ]);
    expect(day1.exercises[0].status).toBe('in_progress');
    expect(day1.exercises[0].slot).toBe(1);
  });

  it('does not change the normal learner four-exercise daily planner', () => {
    const day1 = planWeek({ level: 'A2', totalPlans: 7, exercisesPerPlan: 4 })[0];
    expect(day1).toHaveLength(4);
    expect(day1.map((task) => task.skill)).toEqual([
      'lesen',
      'hoeren',
      'bildbeschreibung',
      'aufgabe_loesen',
    ]);
  });

  it('clears only QA plans from storage without touching learner plans', () => {
    const storage = {
      data: {},
      getItem(key) {
        return this.data[key] ?? null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
    };

    const learnerPlan = createCoachWeeklyPlan({ level: 'A2' });
    storage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(learnerPlan));
    clearAdminQaWeeklyPlanState(storage);
    expect(storage.getItem(WEEKLY_PLAN_STORAGE_KEY)).toBeTruthy();

    const qaPlan = createAdminQaFullDayPlan();
    storage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(qaPlan));
    clearAdminQaWeeklyPlanState(storage);
    expect(storage.getItem(WEEKLY_PLAN_STORAGE_KEY)).toBeNull();
  });
});
