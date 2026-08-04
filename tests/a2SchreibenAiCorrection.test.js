import { describe, expect, it, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApp } from '../server/src/app.js';
import {
  validateA2SchreibenAiCorrectionResponse,
  buildSchreibenCorrectionRequest,
  buildSchreibenCorrectionIdempotencyKey,
} from '../src/data/utils/a2SchreibenAiCorrectionSchema.js';
import { evaluateA2EmailWriting } from '../src/data/utils/a2EmailWritingEvaluation.js';
import { evaluateWeeklyPlanExercise } from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  buildSchreibenAiCorrectionPayload,
  fetchSchreibenAiCorrection,
  mergeSchreibenFeedbackWithAi,
  shouldRequestSchreibenAiCorrection,
} from '../src/data/utils/a2SchreibenAiCorrection.js';
import {
  createCoachWeeklyPlan,
  saveSchreibenAiCorrection,
  submitExerciseResponse,
  updateSchreibenAiCorrectionStatus,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { getWeeklyPlanTaskById } from '../src/data/weeklyPlanLibrary.js';
import {
  resetSchreibenCorrectionCache,
  validateSchreibenCorrectionInput,
} from '../server/src/services/a2SchreibenCorrectionService.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../src/api/a2SchreibenCorrectionClient.js', () => ({
  postA2SchreibenCorrection: vi.fn(),
}));

import { postA2SchreibenCorrection } from '../src/api/a2SchreibenCorrectionClient.js';

function readSrc(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const task = getWeeklyPlanTaskById('a2-schreiben-001');
const learnerEmail = 'Hallo.';

const validAiResponse = {
  correctedEmail: `Sehr geehrter Herr Müller,
leider kann ich morgen nicht zum Deutschkurs kommen, weil ich einen Arzttermin habe.
Nächste Woche bin ich wieder da.
Es tut mir leid.
Viele Grüße`,
  corrections: [
    {
      original: 'weil ich bin krank',
      corrected: 'weil ich krank bin',
      explanation: 'Nach „weil“ steht das Verb am Satzende.',
    },
  ],
  addedMissingPoints: [
    {
      point: 'Wann Sie wieder zum Kurs kommen',
      addedText: 'Nächste Woche bin ich wieder da.',
    },
  ],
  positiveFeedback: ['Die Anrede war passend.'],
  learningTip: 'Nach „weil“ kommt das Verb ans Ende des Satzes.',
};

describe('A2 Schreiben AI correction schema', () => {
  it('validates structured AI response', () => {
    const result = validateA2SchreibenAiCorrectionResponse(validAiResponse);
    expect(result.ok).toBe(true);
    expect(result.data.correctedEmail).toMatch(/Sehr geehrter/);
  });

  it('rejects invalid AI response', () => {
    const result = validateA2SchreibenAiCorrectionResponse({ correctedEmail: 'kurz' });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('builds server input with missed Stichpunkte', () => {
    const feedback = evaluateA2EmailWriting(task, learnerEmail);
    const payload = buildSchreibenCorrectionRequest({
      taskId: task.id,
      scenario: 'Test',
      recipient: 'Lehrer',
      requiredPoints: ['A', 'B'],
      deterministicCoveredPoints: feedback.evaluationMeta.coveredPoints,
      deterministicMissingPoints: feedback.evaluationMeta.missingPoints,
      learnerEmail,
      learnerLevel: 'A2',
      uiLanguage: 'de',
    });
    expect(payload.learnerEmail).toBe(learnerEmail);
    expect(payload.deterministicMissingPoints.length).toBeGreaterThan(0);
  });
});

describe('deterministic scoring remains authoritative', () => {
  it('keeps deterministic feedback unchanged when AI is merged', () => {
    const deterministic = evaluateWeeklyPlanExercise({
      task,
      coachType: 'email',
      learnerResponse: learnerEmail,
      level: 'A2',
    });

    const merged = mergeSchreibenFeedbackWithAi(deterministic.feedback, {
      status: 'ready',
      ...validAiResponse,
    });

    expect(merged.summary).toBe(deterministic.feedback.summary);
    expect(merged.evaluationMeta.deterministicScore).toEqual(
      deterministic.feedback.evaluationMeta.deterministicScore
    );
    expect(merged.primaryCorrectedEmail).toMatch(/Sehr geehrter/);
  });
});

describe('client AI orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSchreibenCorrectionCache();
  });

  it('sends learner email to AI service with missed points', async () => {
    postA2SchreibenCorrection.mockResolvedValue({
      ...validAiResponse,
      status: 'ready',
      provider: 'openai',
      model: 'gpt-4.1-mini',
    });

    const feedback = evaluateA2EmailWriting(task, learnerEmail);
    const exercise = {
      learnerResponse: learnerEmail,
      submittedAt: '2026-07-26T10:00:00.000Z',
      feedback: { evaluationMeta: feedback.evaluationMeta },
    };

    const payload = buildSchreibenAiCorrectionPayload(task, exercise);
    expect(payload.learnerEmail).toBe(learnerEmail);
    expect(payload.deterministicMissingPoints.length).toBeGreaterThan(0);

    const result = await fetchSchreibenAiCorrection(task, exercise, 1, 2);
    expect(postA2SchreibenCorrection).toHaveBeenCalledTimes(1);
    expect(postA2SchreibenCorrection.mock.calls[0][0].input.learnerEmail).toBe(learnerEmail);
    expect(result.correctedEmail).toMatch(/Sehr geehrter/);
  });

  it('only requests AI for weekly-plan A2 schreiben tasks', () => {
    expect(shouldRequestSchreibenAiCorrection(task)).toBe(true);
    expect(shouldRequestSchreibenAiCorrection(getWeeklyPlanTaskById('a2-lesen-001'))).toBe(false);
  });

  it('home practice does not wire AI correction in Lesen screen', () => {
    const lesen = readSrc('src/app/screens/LesenScreen.jsx');
    expect(lesen).not.toMatch(/fetchSchreibenAiCorrection|postA2SchreibenCorrection/);
  });
});

describe('weekly plan persistence and retry', () => {
  beforeEach(() => {
    resetSchreibenCorrectionCache();
  });

  it('persists AI correction and reuses it without another submit', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2' });
    const schreibenSlot = plan.plans[0].exercises.find((e) => e.coachType === 'email');
    if (!schreibenSlot) {
      plan.plans[0].exercises[0] = {
        ...plan.plans[0].exercises[0],
        taskId: task.id,
        coachType: 'email',
      };
    }
    const slot = schreibenSlot?.slot || 1;

    const submitted = submitExerciseResponse(plan, 1, slot, {
      learnerResponse: learnerEmail,
    });
    expect(submitted.changed).toBe(true);
    expect(submitted.plan.plans[0].exercises.find((e) => e.slot === slot).attemptCount).toBe(1);

    const aiCorrection = {
      status: 'ready',
      ...validAiResponse,
      idempotencyKey: buildSchreibenCorrectionIdempotencyKey(1, slot, '2026-07-26T10:00:00.000Z'),
      generatedAt: '2026-07-26T10:01:00.000Z',
    };
    const saved = saveSchreibenAiCorrection(submitted.plan, 1, slot, aiCorrection);
    const exercise = saved.plan.plans[0].exercises.find((e) => e.slot === slot);
    expect(exercise.aiCorrection.correctedEmail).toMatch(/Sehr geehrter/);
    expect(exercise.attemptCount).toBe(1);

    const retrySubmit = submitExerciseResponse(saved.plan, 1, slot, {
      learnerResponse: learnerEmail,
    });
    expect(retrySubmit.changed).toBe(false);
  });

  it('retry updates AI status without incrementing attempt count', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2' });
    plan.plans[0].exercises[0] = {
      ...plan.plans[0].exercises[0],
      taskId: task.id,
      coachType: 'email',
      status: 'completed',
      submittedAt: '2026-07-26T10:00:00.000Z',
      attemptCount: 1,
      learnerResponse: learnerEmail,
      feedback: evaluateA2EmailWriting(task, learnerEmail),
    };

    const failed = updateSchreibenAiCorrectionStatus(plan, 1, 1, {
      status: 'failed',
      errorMessage: 'timeout',
    });
    const exercise = failed.plan.plans[0].exercises[0];
    expect(exercise.attemptCount).toBe(1);
    expect(exercise.aiCorrection.status).toBe('failed');
  });
});

describe('server route mount', () => {
  it('registers POST /weekly-plan/correct-schreiben on the /v1 app', async () => {
    const root = express();
    root.use('/v1', createApp());

    const res = await request(root)
      .post('/v1/weekly-plan/correct-schreiben')
      .send({
        input: {
          taskId: 'a2-schreiben-001',
          scenario: 'Test',
          recipient: 'Lehrer',
          requiredPoints: ['A'],
          deterministicCoveredPoints: [],
          deterministicMissingPoints: ['A'],
          learnerEmail: 'Hallo, ich komme morgen nicht.',
          learnerLevel: 'A2',
          uiLanguage: 'de',
        },
      });

    expect(res.status).not.toBe(404);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });
});

describe('server input validation', () => {
  it('rejects invalid task ids', () => {
    expect(() =>
      validateSchreibenCorrectionInput({
        taskId: 'invalid',
        learnerEmail: 'Hallo Welt, das ist ein Test.',
        scenario: 'Test',
      })
    ).toThrow();
  });
});

describe('UI wiring', () => {
  it('displays learner-specific AI correction sections in coach screen', () => {
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/A2SchreibenCoachFeedbackPanel/);
    expect(coach).toMatch(/runSchreibenAiCorrection/);
    expect(coach).toMatch(/handleRetryAiCorrection/);

    const panel = readSrc('src/app/screens/weeklyPlan/CoachExercisePanels.jsx');
    expect(panel).toMatch(/Dein korrigierter E-Mail-Text/);
    expect(panel).toMatch(/Wichtige Korrekturen/);
    expect(panel).toMatch(/Ergänzte Punkte/);
  });
});
