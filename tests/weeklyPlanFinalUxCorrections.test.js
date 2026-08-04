import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  completeExercise,
  createCoachWeeklyPlan,
  getNextTrainingPlanAccess,
  getPlanExerciseCount,
  syncTrainingPlanDayUnlocks,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { createAdminQaFullDayPlan } from '../src/data/utils/adminQaFullDayPlan.js';
import { getAufgabeLoesenPronunciationNote } from '../src/data/utils/a2AufgabeLoesenTurnEvaluation.js';
import { getScreenLabels } from '../src/i18n/screenLabels.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('completion screens without retry buttons', () => {
  it('keeps only Zurück zum Trainingsplan on Hören result', () => {
    const panel = readSrc('src/app/screens/horen/A2HorenGuidedPanel.jsx');
    expect(panel).toMatch(/Zurück zum Trainingsplan/);
    expect(panel).not.toMatch(/Noch einmal üben/);
  });

  it('keeps only Zurück zum Trainingsplan on Aufgabe lösen debrief', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    expect(panel).toMatch(/Zurück zum Trainingsplan/);
    expect(panel).not.toMatch(/Noch einmal üben/);
  });

  it('uses Zurück zum Trainingsplan on Lesen coach result', () => {
    const panel = readSrc('src/app/screens/lesen/A2LesenGuidedPanel.jsx');
    expect(panel).toMatch(/Zurück zum Trainingsplan/);
    expect(panel).not.toMatch(/isCoachMode && step === 'result'[\s\S]*Noch einmal üben/);
  });
});

describe('Aufgabe lösen guided speaking', () => {
  it('shows the required sentence and guided instruction before recording', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    expect(panel).toMatch(/Ihr Satz:/);
    expect(panel).toMatch(/guidedSpeakingRecordInstruction/);
    expect(panel).toMatch(/getScreenLabels\(getUserLanguage\(\)\)/);
    expect(panel).toMatch(/Aufnahme starten/);
    expect(panel).not.toMatch(/Das können Sie sagen:/);
    expect(panel).not.toMatch(/Musterantwort:/);
  });

  it('localizes the guided speaking instruction', () => {
    expect(getScreenLabels('Deutsch').guidedSpeakingRecordInstruction).toBe(
      'Lesen Sie den Satz im Feld laut vor und nehmen Sie Ihre Stimme auf.'
    );
    expect(getScreenLabels('English').guidedSpeakingRecordInstruction).toBe(
      'Read the sentence inside the box aloud and record your voice.'
    );
    expect(getScreenLabels('العربية').guidedSpeakingRecordInstruction).toBe(
      'اقرأ النص الموجود داخل المربع بصوتٍ عالٍ ثم سجّل صوتك.'
    );
    expect(getScreenLabels('Türkçe').guidedSpeakingRecordInstruction).toBe(
      'Kutunun içindeki cümleyi yüksek sesle okuyun ve sesinizi kaydedin.'
    );
  });

  it('debrief shows required sentence and transcript with pronunciation note', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    expect(panel).toMatch(/Satz zum Vorlesen/);
    expect(panel).toMatch(/Erkanntes Transkript/);
    const note = getAufgabeLoesenPronunciationNote(
      'Guten Tag, ich möchte einen Termin.',
      'Guten Tag, ich hätte gern einen Termin.'
    );
    expect(note.message).toMatch(/erkannt/i);
  });
});

describe('next training plan day lock', () => {
  function completeFirstPlan(plan) {
    const prepared = {
      ...plan,
      plans: plan.plans.map((entry) =>
        entry.planIndex === 1
          ? {
              ...entry,
              status: 'in_progress',
              exercises: entry.exercises.map((exercise, index) =>
                index < entry.exercises.length - 1
                  ? {
                      ...exercise,
                      status: 'completed',
                      submittedAt: new Date().toISOString(),
                      evaluationStatus: 'evaluated',
                    }
                  : {
                      ...exercise,
                      status: 'in_progress',
                      submittedAt: new Date().toISOString(),
                      evaluationStatus: 'evaluated',
                    }
              ),
            }
          : entry
      ),
    };
    const lastSlot = prepared.plans[0].exercises.length;
    return completeExercise(prepared, 1, lastSlot, { requireSubmission: true }).plan;
  }

  it('schedules the next plan for tomorrow instead of unlocking immediately', () => {
    const plan = completeFirstPlan(createCoachWeeklyPlan({ level: 'A2' }));
    const next = plan.plans.find((entry) => entry.planIndex === 2);
    expect(next?.status).toBe('locked');
    expect(next?.availableFrom).toBeTruthy();
    expect(new Date(next.availableFrom).getTime()).toBeGreaterThan(Date.now());
  });

  it('reports tomorrow message when next plan is still locked', () => {
    const plan = completeFirstPlan(createCoachWeeklyPlan({ level: 'A2' }));
    const access = getNextTrainingPlanAccess(plan, 1);
    expect(access.canOpen).toBe(false);
    expect(access.message).toMatch(/morgen verfügbar/);
  });

  it('unlocks the next plan after the eligible timestamp', () => {
    const plan = completeFirstPlan(createCoachWeeklyPlan({ level: 'A2' }));
    const plans = plan.plans.map((entry) =>
      entry.planIndex === 2
        ? { ...entry, availableFrom: new Date(Date.now() - 1000).toISOString() }
        : entry
    );
    const unlocked = syncTrainingPlanDayUnlocks({ ...plan, plans });
    const next = unlocked.plans.find((entry) => entry.planIndex === 2);
    expect(next?.status).toBe('available');
  });
});

describe('dynamic exercise counts', () => {
  it('uses five exercises for the Admin QA full day plan', () => {
    const plan = createAdminQaFullDayPlan();
    expect(getPlanExerciseCount(plan.plans[0])).toBe(5);
    expect(plan.plans[0].exercises).toHaveLength(5);
  });

  it('keeps four exercises for normal learner plans', () => {
    const plan = createCoachWeeklyPlan({ level: 'A2' });
    expect(getPlanExerciseCount(plan.plans[0])).toBe(4);
  });

  it('dashboard uses dynamic exercise totals in UI copy', () => {
    const dashboard = readSrc('src/app/screens/TrainingPlanDashboardScreen.jsx');
    const coachState = readSrc('src/data/utils/weeklyPlanCoachState.js');
    expect(dashboard).toMatch(/getPlanExerciseCount/);
    expect(dashboard).not.toMatch(/von 4 Übungen erledigt/);
    expect(dashboard).toMatch(/getNextTrainingPlanAccess/);
    expect(dashboard).toMatch(/Admin QA: Nächsten Plan sofort öffnen/);
    expect(coachState).toMatch(/morgen verfügbar/);
  });
});
