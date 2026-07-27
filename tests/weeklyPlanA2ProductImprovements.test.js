import { describe, expect, it } from 'vitest';
import { getA2SchreibenEvaluation } from '../src/data/a2SchreibenEvaluationCatalog.js';
import { evaluateA2EmailWriting } from '../src/data/utils/a2EmailWritingEvaluation.js';
import { evaluateWeeklyPlanExercise, shouldShowSolution } from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import { getWeeklyPlanTaskById, planWeek } from '../src/data/weeklyPlanLibrary.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSrc(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('A2 Schreiben evaluation', () => {
  const task = getWeeklyPlanTaskById('a2-schreiben-001');

  it('exposes scenario, recipient, and Stichpunkte metadata', () => {
    const meta = getA2SchreibenEvaluation(task);
    expect(meta?.scenario).toMatch(/Deutschkurs/);
    expect(meta?.recipient).toMatch(/kursleiter/i);
    expect(meta?.taskPoints).toHaveLength(3);
    expect(meta?.modelAnswer).toMatch(/Sehr geehrter/);
  });

  it('evaluates submitted learner text against content points', () => {
    const learnerResponse = `Sehr geehrter Herr Müller,
leider kann ich morgen nicht zum Deutschkurs kommen, weil ich einen Arzttermin habe.
Nächste Woche komme ich wieder zum Kurs.
Es tut mir leid.
Viele Grüße
Anna`;

    const feedback = evaluateA2EmailWriting(task, learnerResponse);
    expect(feedback.summary).toMatch(/ausgewertet|gut|Inhaltspunkte/i);
    expect(feedback.lines.some((line) => line.text.includes('Inhaltspunkt erfüllt'))).toBe(true);
    expect(feedback.showSolution).toBe(true);
    expect(feedback.solution).toMatch(/Sehr geehrter Herr Müller/);
    expect(feedback.evaluationMeta.coveredPoints.length).toBeGreaterThan(0);
  });

  it('reports missing required content points', () => {
    const feedback = evaluateA2EmailWriting(task, 'Hallo, ich komme morgen.');
    expect(feedback.evaluationMeta.missingPoints.length).toBeGreaterThan(0);
    expect(feedback.lines.some((line) => line.text.includes('fehlt'))).toBe(true);
  });

  it('wires submitted email into weekly plan exercise evaluation', () => {
    const result = evaluateWeeklyPlanExercise({
      task,
      coachType: 'email',
      learnerResponse: `Sehr geehrter Herr Müller,
leider kann ich morgen nicht kommen, weil ich einen Arzttermin habe.
Nächste Woche bin ich wieder da.
Es tut mir leid.
Viele Grüße`,
      level: 'A2',
    });

    expect(result.evaluationStatus).toBe('evaluated');
    expect(result.feedback.solution).toMatch(/Sehr geehrter/);
    expect(result.feedback.lines.some((line) => /Grammatik|Wortschatz|Kommunikation/.test(line.text))).toBe(
      true
    );
  });

  it('shows model answer after submission without task.solution field', () => {
    const exercise = {
      submittedAt: '2026-01-01T00:00:00.000Z',
      feedback: {
        showSolution: true,
        solution: getA2SchreibenEvaluation(task).modelAnswer,
      },
    };
    expect(shouldShowSolution(task, 'email', exercise)).toBe(true);
  });
});

describe('A2 Lesen home vs weekly plan', () => {
  it('uses practice mode from home and coach mode from weekly plan handoff', () => {
    const panel = readSrc('src/app/screens/lesen/A2LesenGuidedPanel.jsx');
    expect(panel).toMatch(/mode = 'practice'/);
    expect(panel).toMatch(/mode === 'coach'/);
    expect(panel).toMatch(/Antworten abschicken/);
    expect(panel).toMatch(/Häufige Fehler/);

    const screen = readSrc('src/app/screens/LesenScreen.jsx');
    expect(screen).toMatch(/isActiveWeeklyPlanExerciseHandoff/);
    expect(screen).toMatch(/mode=\{isWeeklyPlanCoachMode \? 'coach' : 'practice'\}/);
    expect(screen).toMatch(/hidePracticeSubmit/);
  });

  it('does not expose score or solutions in practice mode UI branch', () => {
    const panel = readSrc('src/app/screens/lesen/A2LesenGuidedPanel.jsx');
    const practiceBlock = panel.split("step === 'submitted'")[0];
    expect(practiceBlock).not.toMatch(/Richtige Antwort/);
    expect(practiceBlock).not.toMatch(/Häufige Fehler/);
  });
});

describe('fair A2 model rotation', () => {
  it('rotates each skill independently before repeating', () => {
    const plans = planWeek({ level: 'A2', weaknesses: [], totalPlans: 20, exercisesPerPlan: 4 });
    const lesenIds = plans.map((day) => day.find((task) => task.skill === 'lesen')?.id);
    const hoerenIds = plans.map((day) => day.find((task) => task.skill === 'hoeren')?.id);
    const lesenPoolSize = new Set(lesenIds).size;

    expect(new Set(lesenIds.slice(0, lesenPoolSize)).size).toBe(lesenPoolSize);
    expect(lesenIds[lesenPoolSize]).toBe(lesenIds[0]);
    expect(new Set(hoerenIds.slice(0, lesenPoolSize)).size).toBe(lesenPoolSize);
    expect(hoerenIds[lesenPoolSize]).toBe(hoerenIds[0]);
  });

  it('keeps stable rotation even when weaknesses are provided', () => {
    const baseline = planWeek({ level: 'A2', weaknesses: [], totalPlans: 7, exercisesPerPlan: 4 });
    const withWeakness = planWeek({
      level: 'A2',
      weaknesses: ['lesen', 'hoeren'],
      totalPlans: 7,
      exercisesPerPlan: 4,
    });

    expect(withWeakness.map((day) => day.map((task) => task.id))).toEqual(
      baseline.map((day) => day.map((task) => task.id))
    );
  });
});
