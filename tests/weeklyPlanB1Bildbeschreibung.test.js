/**
 * B1 Bildbeschreibung — task resolution, training memory, UI contract.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildB1CoachWeeklyPlan } from '../src/data/weekly-plan/b1/planGeneration.js';
import { b1WeeklyPlanSchreibenCatalog, b1WeeklyPlanHoerenCatalog } from '../src/data/weekly-plan/b1/index.js';
import {
  B1_BILD_TASK_PROMPT,
  isB1WeeklyPlanBildbeschreibungTask,
  resolveB1CoachExerciseTask,
  resolveCoachExerciseTask,
} from '../src/data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import {
  buildBildbeschreibungTrainingMemory,
  buildExerciseTrainingMemory,
} from '../src/data/utils/weeklyPlanTrainingMemory.js';
import {
  isWeeklyPlanBildbeschreibungTask,
  resolveWeeklyPlanTaskImage,
} from '../src/data/utils/weeklyPlanImageAsset.js';
import {
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  getPlanByIndex,
  submitExerciseResponse,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { freezeBildbeschreibungCatalogModel } from '../server/src/weekly-training-ai/core/bildbeschreibungSnapshot.js';
import { b1WeeklyPlanBildbeschreibungCatalog } from '../src/data/weekly-plan/b1/bildbeschreibung.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function fullB1Selections() {
  return {
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((model) => model.id),
    hoeren: b1WeeklyPlanHoerenCatalog.slice(0, 7).map((model) => model.id),
    bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog.slice(0, 7).map((model) => model.id),
    planung: Array.from({ length: 7 }, (_, index) => `b1wp-planung-${String(index + 1).padStart(2, '0')}`),
  };
}

function findBildExercise(plan, planIndex = 1) {
  const entry = getPlanByIndex(plan, planIndex);
  return entry.exercises.find((exercise) => exercise.b1Category === 'bildbeschreibung');
}

describe('B1 bildbeschreibung task adapter', () => {
  it('resolves b1wp bild tasks with image asset and learner prompt', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findBildExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);

    expect(task).toBeTruthy();
    expect(isB1WeeklyPlanBildbeschreibungTask(task)).toBe(true);
    expect(isWeeklyPlanBildbeschreibungTask(task)).toBe(true);
    expect(task.task).toBe(B1_BILD_TASK_PROMPT);
    expect(task.imageAsset).toMatch(/^\/images\/b1\//);
    expect(resolveWeeklyPlanTaskImage(task)?.image).toBe(task.imageAsset);
  });

  it('freezes coverage points in server snapshot without exposing them to learner task', () => {
    const model = b1WeeklyPlanBildbeschreibungCatalog[0];
    const frozen = freezeBildbeschreibungCatalogModel(model);

    expect(frozen.modelSnapshot.coveragePoints.length).toBeGreaterThan(0);
    expect(frozen.modelSnapshot.learnerTaskPrompt).toBe(B1_BILD_TASK_PROMPT);
    expect(frozen.modelSnapshot.imageId).toBeTruthy();
  });
});

describe('B1 bildbeschreibung training memory', () => {
  it('stores imageId, transcript, dialogue, and coverage without correction fields', () => {
    const memory = buildBildbeschreibungTrainingMemory(
      {
        taskId: 'b1wp-bild-001',
        b1AiSessionId: 'sess-1',
        learnerResponse: 'Ich sehe einen Mechaniker.',
        b1InteractiveState: {
          dialogue: [
            { role: 'learner', text: 'Ich sehe einen Mechaniker.' },
            { role: 'assistant', text: 'Was macht die Person?' },
          ],
          coveredPoints: [{ id: 'point-1', text: 'Was sehen Sie?' }],
          missingPoints: [{ id: 'point-2', text: 'Was macht die Person?' }],
        },
        submittedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b1wp-bild-001',
        imageId: '1',
        isB1WeeklyPlanBildbeschreibungTask: true,
      }
    );

    expect(memory).toMatchObject({
      category: 'bildbeschreibung',
      imageId: '1',
      transcript: 'Ich sehe einen Mechaniker.',
      sessionId: 'sess-1',
    });
    expect(memory.aiDialogue).toHaveLength(2);
    expect(memory.coveredPoints).toHaveLength(1);
    expect(memory.missingPoints).toHaveLength(1);
    expect(memory).not.toHaveProperty('correctedEmail');
    expect(memory).not.toHaveProperty('score');
  });

  it('requires learner dialogue before submission', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findBildExercise(plan);
    const task = resolveB1CoachExerciseTask(exercise, plan);

    expect(
      validateExerciseSubmission(task, 'speaking', {
        learnerResponse: '',
        b1InteractiveState: { dialogue: [] },
      }).ok
    ).toBe(false);

    expect(
      validateExerciseSubmission(task, 'speaking', {
        learnerResponse: 'Ich sehe eine Werkstatt.',
        b1InteractiveState: {
          dialogue: [{ role: 'learner', text: 'Ich sehe eine Werkstatt.' }],
          conversationComplete: false,
        },
      }).ok
    ).toBe(false);

    expect(
      validateExerciseSubmission(task, 'speaking', {
        learnerResponse: 'Ich sehe eine Werkstatt.',
        b1InteractiveState: {
          dialogue: [
            { role: 'learner', text: 'Ich sehe eine Werkstatt.' },
            { role: 'assistant', text: 'Danke, das reicht.' },
          ],
          conversationComplete: true,
        },
      }).ok
    ).toBe(true);
  });

  it('persists training memory on submit', () => {
    const plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const exercise = findBildExercise(plan);
    const task = resolveCoachExerciseTask(exercise, plan);

    const result = submitExerciseResponse(plan, 1, exercise.slot, {
      learnerResponse: 'Auf dem Bild sehe ich einen Mechaniker.',
      speakingSubmitted: true,
      b1InteractiveState: {
        dialogue: [
          { role: 'learner', text: 'Auf dem Bild sehe ich einen Mechaniker.' },
          { role: 'assistant', text: 'Wie wirkt die Situation auf Sie?' },
        ],
        coveredPoints: [{ id: 'point-1', text: 'Was sehen Sie?' }],
        missingPoints: [],
        conversationComplete: true,
      },
    });

    expect(result.changed).toBe(true);
    const saved = getPlanByIndex(result.plan, 1).exercises.find((e) => e.slot === exercise.slot);
    const memory = buildExerciseTrainingMemory(saved, task);
    expect(memory.category).toBe('bildbeschreibung');
    expect(memory.transcript).toMatch(/Mechaniker/);
    expect(memory.aiDialogue).toHaveLength(2);
  });
});

describe('B1 bildbeschreibung UI contract', () => {
  it('shows sticky image, learner task prompt, and interactive coach panel', () => {
    const panels = readSrc('src/app/screens/weeklyPlan/CoachExercisePanels.jsx');
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');

    expect(panels).toMatch(/B1InteractiveSpeakingExercisePanel/);
    expect(panels).toMatch(/position:\s*'sticky'/);
    expect(panels).toMatch(/B1_BILD_TASK_PROMPT/);
    expect(panels).toMatch(/Antwort senden/);
    expect(coach).toMatch(/isB1InteractiveSpeakingTask/);
    expect(coach).toMatch(/B1InteractiveSpeakingExercisePanel/);
  });
});
