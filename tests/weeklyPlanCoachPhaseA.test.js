/**
 * Phase A — Weekly Plan exercise interaction, evaluation, and entry card tests.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  completeExercise,
  countCompletedPlans,
  createCoachWeeklyPlan,
  getPlanByIndex,
  getTrainingCta,
  getWeeklyPlanEntryCard,
  loadWeeklyPlan,
  saveExerciseDraft,
  saveWeeklyPlan,
  startExercise,
  submitExerciseResponse,
  switchExercise,
  TOTAL_PLANS,
} from '../src/data/utils/weeklyPlanCoachState.js';
import {
  evaluateWeeklyPlanExercise,
  shouldShowSolution,
  validateExerciseSubmission,
} from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import { getWeeklyPlanTaskById } from '../src/data/weeklyPlanLibrary.js';
import { WEEKLY_PLAN_STORAGE_KEY } from '../src/constants/storageKeys.js';

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

function payloadForExercise(plan, planIndex, slot) {
  const entry = getPlanByIndex(plan, planIndex);
  const exercise = entry.exercises.find((e) => e.slot === slot);
  const task = getWeeklyPlanTaskById(exercise.taskId);

  if (exercise.coachType === 'listening' || exercise.coachType === 'reading') {
    const answer = task.questions?.[0]?.answer || 'Antwort';
    return {
      selectedAnswers: { 0: answer },
      audioPlayed: exercise.coachType === 'listening',
    };
  }

  if (exercise.coachType === 'speaking') {
    return { speakingSubmitted: true, learnerResponse: 'Ich habe die Aufgabe gesprochen.' };
  }

  return { learnerResponse: task.solution || task.task || 'Meine Antwort.' };
}

function submitSlot(plan, planIndex, slot) {
  let next = startExercise(plan, planIndex, slot).plan;
  return submitExerciseResponse(next, planIndex, slot, payloadForExercise(next, planIndex, slot));
}

describe('getWeeklyPlanEntryCard', () => {
  it('returns active plan entry with Training starten at 0/4', () => {
    const plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    const card = getWeeklyPlanEntryCard(plan);
    expect(card.kind).toBe('active');
    expect(card.cta).toBe('Training starten');
    expect(card.message).toContain('0 von 4');
  });

  it('returns fortsetzen when current plan has progress', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = submitSlot(plan, 1, 1).plan;
    const card = getWeeklyPlanEntryCard(plan);
    expect(card.kind).toBe('active');
    expect(card.cta).toBe('Training fortsetzen');
    expect(card.doneExercises).toBe(1);
  });

  it('returns next plan CTA when a training plan is completed', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    for (let slot = 1; slot <= 4; slot += 1) {
      plan = submitSlot(plan, 1, slot).plan;
    }
    const completedPlan = getPlanByIndex(plan, 1);
    const cta = getTrainingCta(completedPlan, plan);
    expect(cta.label).toBe('Zum nächsten Trainingsplan');
    expect(cta.planIndex).toBe(2);
    const card = getWeeklyPlanEntryCard(plan);
    expect(card.planIndex).toBe(2);
    expect(card.cta).toBe('Training starten');
  });

  it('returns finished state when all 7 plans are completed', () => {
    let plan = createCoachWeeklyPlan({ level: 'B2', focusSkills: ['diskussion'] });
    for (let planIndex = 1; planIndex <= TOTAL_PLANS; planIndex += 1) {
      for (let slot = 1; slot <= 4; slot += 1) {
        plan = submitSlot(plan, planIndex, slot).plan;
      }
    }
    const card = getWeeklyPlanEntryCard(plan);
    expect(card.kind).toBe('finished');
    expect(card.cta).toBe('Wochenbericht ansehen');
    expect(card.tab).toBe('weeklyCompletion');
    expect(countCompletedPlans(plan)).toBe(7);
  });
});

describe('exercise response persistence', () => {
  it('saves draft responses and reloads them from storage', () => {
    const storage = createMemoryStorage();
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['grammatik'] });
    plan = startExercise(plan, 1, 1).plan;
    plan = saveExerciseDraft(plan, 1, 1, {
      learnerResponse: 'Ich lerne Deutsch, weil ich in Österreich lebe.',
    }).plan;
    saveWeeklyPlan(plan, storage);
    const reloaded = loadWeeklyPlan(storage);
    const exercise = getPlanByIndex(reloaded, 1).exercises[0];
    expect(exercise.learnerResponse).toContain('Österreich');
    expect(exercise.savedProgress).toBe(true);
  });

  it('preserves draft when switching exercises', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['grammatik'] });
    plan = startExercise(plan, 1, 1).plan;
    plan = saveExerciseDraft(plan, 1, 1, { learnerResponse: 'Entwurf 1' }).plan;
    plan = switchExercise(plan, 1, 1, 2).plan;
    const first = getPlanByIndex(plan, 1).exercises[0];
    const second = getPlanByIndex(plan, 1).exercises[1];
    expect(first.learnerResponse).toBe('Entwurf 1');
    expect(first.savedProgress).toBe(true);
    expect(second.status).toBe('in_progress');
  });
});

describe('listening and reading submission', () => {
  it('evaluates a listening exercise with coach-friendly feedback', () => {
    const task = getWeeklyPlanTaskById('a2-hoeren-001');
    const result = evaluateWeeklyPlanExercise({
      task,
      coachType: 'listening',
      selectedAnswers: { 0: 'Am Dienstag um 10 Uhr.' },
      level: 'A2',
    });
    expect(result.evaluationStatus).toBe('evaluated');
    expect(result.feedback.summary).toMatch(/richtig|ausgewertet/i);
    expect(result.feedback.lines[0].text).toMatch(/Richtig beantwortet/i);
    expect(JSON.stringify(result.feedback)).not.toMatch(/CEFR|normalizedScore|overallScore/i);
  });

  it('evaluates a reading exercise after submission', () => {
    const task = getWeeklyPlanTaskById('b1-lesen-001');
    const result = evaluateWeeklyPlanExercise({
      task,
      coachType: 'reading',
      selectedAnswers: { 0: task.questions[0].answer },
      level: 'B1',
    });
    expect(result.evaluationStatus).toBe('evaluated');
    expect(result.feedback.lines.some((line) => line.tone === 'success')).toBe(true);
  });
});

describe('writing and grammar guidance', () => {
  it('hides solution before submission', () => {
    const task = getWeeklyPlanTaskById('b1-grammatik-001');
    const exercise = { status: 'in_progress' };
    expect(shouldShowSolution(task, 'grammar', exercise)).toBe(false);
  });

  it('shows solution after submission when evaluation allows it', () => {
    const task = getWeeklyPlanTaskById('b1-grammatik-002');
    const exercise = {
      status: 'completed',
      submittedAt: new Date().toISOString(),
      evaluationStatus: 'evaluated',
      feedback: { showSolution: true },
    };
    expect(shouldShowSolution(task, 'grammar', exercise)).toBe(true);
  });

  it('requires a written response before grammar submission', () => {
    const task = getWeeklyPlanTaskById('b1-grammatik-001');
    expect(validateExerciseSubmission(task, 'grammar', { learnerResponse: '' }).ok).toBe(false);
    expect(validateExerciseSubmission(task, 'grammar', { learnerResponse: 'Meine Lösung' }).ok).toBe(
      true
    );
  });
});

describe('completion rules', () => {
  it('cannot complete without a learner submission', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    plan = startExercise(plan, 1, 1).plan;
    const blocked = completeExercise(plan, 1, 1, { requireSubmission: true });
    expect(blocked.changed).toBe(false);
  });

  it('completes after a valid submission', () => {
    let plan = createCoachWeeklyPlan({ level: 'B1', focusSkills: ['hoeren'] });
    const result = submitSlot(plan, 1, 1);
    expect(result.changed).toBe(true);
    const exercise = getPlanByIndex(result.plan, 1).exercises[0];
    expect(exercise.status).toBe('completed');
    expect(exercise.submittedAt).toBeTruthy();
    expect(exercise.feedback).toBeTruthy();
  });
});

describe('weekly plan exam pipeline separation', () => {
  const weeklyFiles = [
    'src/app/screens/CoachExerciseScreen.jsx',
    'src/app/screens/weeklyPlan/CoachExercisePanels.jsx',
    'src/data/utils/weeklyPlanCoachState.js',
    'src/data/utils/weeklyPlanExerciseEvaluation.js',
  ];

  it('Phase A weekly files never call exam pipeline or placement evaluator', () => {
    weeklyFiles.forEach((relativePath) => {
      const source = readFileSync(resolve(relativePath), 'utf8');
      expect(source).not.toContain('finalizeAiSessionParts');
      expect(source).not.toContain('decidePracticeCouncil');
      expect(source).not.toContain('buildFinalReport');
      expect(source).not.toContain('placementEvaluateService');
      expect(source).not.toContain('WeeklyPlanSessionScreen');
      expect(source).not.toContain('AISessionScreen');
    });
  });

  it('stored coach exercise feedback does not include exam score fields', () => {
    const storage = createMemoryStorage();
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren'] });
    plan = submitSlot(plan, 1, 1).plan;
    saveWeeklyPlan(plan, storage);
    const raw = storage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toMatch(/normalizedScore|cefrLevel|overallScore/i);
  });
});
