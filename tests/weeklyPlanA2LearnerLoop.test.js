/**
 * A2 Weekly Plan 4-stage learner loop — completion, return, retry, bild, balancing.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildGuidedCatalogCompletionPayload,
  validateGuidedCatalogCompletion,
} from '../src/data/utils/a2GuidedCatalogCompletion.js';
import {
  createCoachWeeklyPlan,
  getPlanByIndex,
  saveWeeklyPlan,
  startExercise,
  submitExerciseResponse,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { getWeeklyPlanTaskById, planWeek } from '../src/data/weeklyPlanLibrary.js';
import {
  isActiveWeeklyPlanExerciseHandoff,
  returnToWeeklyPlanDashboard,
  setWeeklyPlanHandoff,
} from '../src/data/utils/weeklyPlanHandoff.js';
import {
  submitGuidedCatalogWeeklyPlanExercise,
  submitSpeakingWeeklyPlanExercise,
} from '../src/data/utils/weeklyPlanGuidedCompletion.js';
import { validateExerciseSubmission } from '../src/data/utils/weeklyPlanExerciseEvaluation.js';
import {
  isWeeklyPlanBildbeschreibungTask,
  resolveWeeklyPlanTaskImage,
} from '../src/data/utils/weeklyPlanImageAsset.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

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

function guidedLesenPayload(modelId = 'A2-L-001', correctCount = 4) {
  return buildGuidedCatalogCompletionPayload(correctCount, 4, modelId);
}

describe('canonical A2 Lesen/Hören completion validation', () => {
  const lesenTask = getWeeklyPlanTaskById('a2-lesen-001');
  const horenTask = getWeeklyPlanTaskById('a2-hoeren-001');

  it('accepts valid guided catalog completion for Lesen', () => {
    const payload = guidedLesenPayload('A2-L-001', 3);
    expect(validateExerciseSubmission(lesenTask, 'reading', payload).ok).toBe(true);
    expect(validateGuidedCatalogCompletion(lesenTask, 'reading', payload).ok).toBe(true);
  });

  it('accepts valid guided catalog completion for Hören', () => {
    const payload = { ...guidedLesenPayload('A2-H-001', 4), audioPlayed: true };
    expect(validateExerciseSubmission(horenTask, 'listening', payload).ok).toBe(true);
  });

  it('rejects mismatched canonicalModelId', () => {
    const payload = guidedLesenPayload('A2-L-002', 4);
    const result = validateExerciseSubmission(lesenTask, 'reading', payload);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/stimmt nicht/);
  });

  it('persists only the active slot as completed', () => {
    let plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['lesen', 'hoeren'] });
    const lesenTaskId = getPlanByIndex(plan, 1).exercises.find((e) => e.slot === 1).taskId;
    const lesenTask = getWeeklyPlanTaskById(lesenTaskId);
    plan = startExercise(plan, 1, 1).plan;
    const result = submitExerciseResponse(
      plan,
      1,
      1,
      guidedLesenPayload(lesenTask.canonicalModelId, 4)
    );
    expect(result.changed).toBe(true);
    const entry = getPlanByIndex(result.plan, 1);
    expect(entry.exercises.find((e) => e.slot === 1)?.status).toBe('completed');
    expect(entry.exercises.find((e) => e.slot === 2)?.status).not.toBe('completed');
    expect(entry.exercises.find((e) => e.slot === 3)?.status).not.toBe('completed');
    expect(entry.exercises.find((e) => e.slot === 4)?.status).not.toBe('completed');
  });
});

describe('weekly plan return navigation', () => {
  it('returns Lesen completion to the same planIndex dashboard', () => {
    const storage = createMemoryStorage();
    vi.stubGlobal('localStorage', storage);
    let plan = createCoachWeeklyPlan({ level: 'A2' });
    plan = startExercise(plan, 1, 1).plan;
    saveWeeklyPlan(plan, storage);
    setWeeklyPlanHandoff({ planIndex: 1, slot: 1, canonicalModelId: 'A2-L-001' }, storage);
    const setActiveTab = vi.fn();
    const result = submitGuidedCatalogWeeklyPlanExercise({
      setActiveTab,
      modelId: 'A2-L-001',
      correctCount: 4,
      totalQuestions: 4,
    });
    expect(result.submitted).toBe(true);
    expect(result.planIndex).toBe(1);
    expect(setActiveTab).toHaveBeenCalledWith('trainingPlanDashboard');
    const handoff = JSON.parse(storage.getItem('austriaPathWeeklyPlanHandoff'));
    expect(handoff.planIndex).toBe(1);
    expect(handoff.view).toBe('dashboard');
    expect(handoff.slot).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it('returns Hören completion to the same planIndex dashboard', () => {
    const storage = createMemoryStorage();
    vi.stubGlobal('localStorage', storage);
    let plan = createCoachWeeklyPlan({ level: 'A2' });
    plan = startExercise(plan, 1, 2).plan;
    saveWeeklyPlan(plan, storage);
    setWeeklyPlanHandoff({ planIndex: 1, slot: 2, canonicalModelId: 'A2-H-001' }, storage);
    const setActiveTab = vi.fn();
    const result = submitGuidedCatalogWeeklyPlanExercise({
      setActiveTab,
      modelId: 'A2-H-001',
      correctCount: 2,
      totalQuestions: 4,
      audioPlayed: true,
    });
    expect(result.submitted).toBe(true);
    expect(setActiveTab).toHaveBeenCalledWith('trainingPlanDashboard');
    const handoff = JSON.parse(storage.getItem('austriaPathWeeklyPlanHandoff'));
    expect(handoff.planIndex).toBe(1);
    vi.unstubAllGlobals();
  });

  it('returns Aufgabe lösen completion to the Weekly Plan', () => {
    const storage = createMemoryStorage();
    vi.stubGlobal('localStorage', storage);
    let plan = createCoachWeeklyPlan({ level: 'A2' });
    plan = startExercise(plan, 1, 4).plan;
    saveWeeklyPlan(plan, storage);
    setWeeklyPlanHandoff({ planIndex: 1, slot: 4, canonicalTaskId: 'A2-AL-001' }, storage);
    const setActiveTab = vi.fn();
    const result = submitSpeakingWeeklyPlanExercise({ setActiveTab });
    expect(result.submitted).toBe(true);
    expect(setActiveTab).toHaveBeenCalledWith('trainingPlanDashboard');
    vi.unstubAllGlobals();
  });

  it('does not return to dashboard when not in an active weekly-plan exercise', () => {
    const setActiveTab = vi.fn();
    const result = submitGuidedCatalogWeeklyPlanExercise({
      setActiveTab,
      modelId: 'A2-L-001',
      correctCount: 4,
    });
    expect(result.fromWeeklyPlan).toBe(false);
    expect(setActiveTab).not.toHaveBeenCalled();
  });
});

describe('weekly plan retry behavior', () => {
  it('keeps assigned Lesen model on retry from Weekly Plan handoff', () => {
    const lesenScreen = readSrc('src/app/screens/LesenScreen.jsx');
    expect(lesenScreen).toMatch(/weeklyPlanModelId/);
    expect(lesenScreen).toMatch(/handleA2Restart/);
    expect(lesenScreen).toMatch(/getA2LesenModel\(weeklyPlanModelId\)/);
    expect(lesenScreen).not.toMatch(/onRestart=\{\(\) => setActiveA2Model\(pickRandomA2LesenModel/);
  });

  it('keeps assigned Hören model on retry from Weekly Plan handoff', () => {
    const horenScreen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(horenScreen).toMatch(/weeklyPlanModelId/);
    expect(horenScreen).toMatch(/handleA2Restart/);
    expect(horenScreen).toMatch(/getA2HorenModel\(handoff\.canonicalModelId\)/);
    expect(horenScreen).toMatch(/clearA2ModelSession/);
  });

  it('keeps assigned Aufgabe lösen task on guided restart', () => {
    const speakingScreen = readSrc('src/app/screens/SpeakingScreen.jsx');
    expect(speakingScreen).toMatch(/handleGuidedRestart/);
    expect(speakingScreen).toMatch(/handoff\.canonicalTaskId/);
    expect(speakingScreen).toMatch(/onRestart=\{handleGuidedRestart\}/);
  });

  it('uses model selector defaults on free Home Trainer pages', () => {
    const lesenScreen = readSrc('src/app/screens/LesenScreen.jsx');
    expect(lesenScreen).toMatch(/Lesemodell auswählen/);
    expect(lesenScreen).toMatch(/a2LesenModels\[0\]/);
    expect(lesenScreen).not.toMatch(/pickRandomA2LesenModel\(\)/);
    const horenScreen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(horenScreen).toMatch(/Hörmodell auswählen/);
    expect(horenScreen).toMatch(/a2HorenModels\[0\]/);
    expect(horenScreen).not.toMatch(/pickRandomA2HorenModel\(\)/);
  });
});

describe('A2 Bildbeschreibung weekly task UI', () => {
  const bildTask = getWeeklyPlanTaskById('a2-bild-001');

  it('renders the assigned image from imageAssetRef', () => {
    expect(isWeeklyPlanBildbeschreibungTask(bildTask)).toBe(true);
    const image = resolveWeeklyPlanTaskImage(bildTask);
    expect(image?.canonicalId).toBe('A2-IMG-10');
    expect(image?.image).toBe('/images/a2/kueche-salat.jpeg');
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/BildbeschreibungExercisePanel/);
    expect(coach).toMatch(/resolveWeeklyPlanTaskImage/);
  });

  it('uses voice-first recording for Bildbeschreibung', () => {
    const panels = readSrc('src/app/screens/weeklyPlan/CoachExercisePanels.jsx');
    expect(panels).toMatch(/BildbeschreibungExercisePanel/);
    expect(panels).toMatch(/Aufnahme starten/);
    expect(panels).toMatch(/useWeeklyPlanSpeechRecognition/);
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/onSpeakingSubmitted/);
    expect(coach).toMatch(/speakingSubmitted: draft\.speakingSubmitted/);
  });
});

describe('balanced A2 four-stage daily plans', () => {
  it('generates one Lesen, Hören, Bildbeschreibung, and fourth skill per day', () => {
    const plans = planWeek({ level: 'A2', weaknesses: [], totalPlans: 7, exercisesPerPlan: 4 });
    expect(plans).toHaveLength(7);
    plans.forEach((day, index) => {
      expect(day, `plan ${index + 1}`).toHaveLength(4);
      const skills = day.map((task) => task.skill);
      const planIndex = index + 1;
      const fourthSkill = planIndex % 2 === 0 ? 'schreiben' : 'aufgabe_loesen';
      expect(skills).toEqual(['lesen', 'hoeren', 'bildbeschreibung', fourthSkill]);
      expect(new Set(skills).size).toBe(4);
    });
  });

  it('rotates canonical tasks across plans without duplicating skills in one day', () => {
    const plans = planWeek({ level: 'A2', weaknesses: [], totalPlans: 7, exercisesPerPlan: 4 });
    expect(plans[0][0].id).toBe('a2-lesen-001');
    expect(plans[0][1].id).toBe('a2-hoeren-001');
    expect(plans[0][2].id).toBe('a2-bild-001');
    expect(plans[0][3].id).toBe('a2-al-001');
    expect(plans[1][0].id).toBe('a2-lesen-002');
    expect(plans[1][1].id).toBe('a2-hoeren-002');
    expect(plans[1][3].id).toBe('A2-EM-002');
  });
});

describe('handoff helpers', () => {
  it('detects active weekly-plan exercise handoffs', () => {
    expect(isActiveWeeklyPlanExerciseHandoff({ planIndex: 1, slot: 2 })).toBe(true);
    expect(isActiveWeeklyPlanExerciseHandoff({ planIndex: 1, slot: 2, review: true })).toBe(false);
    expect(isActiveWeeklyPlanExerciseHandoff({ planIndex: 1, view: 'dashboard' })).toBe(false);
  });

  it('returnToWeeklyPlanDashboard preserves planIndex', () => {
    const storage = createMemoryStorage();
    setWeeklyPlanHandoff({ planIndex: 4, slot: 2, canonicalModelId: 'A2-L-004' }, storage);
    const setActiveTab = vi.fn();
    returnToWeeklyPlanDashboard(setActiveTab, storage);
    expect(setActiveTab).toHaveBeenCalledWith('trainingPlanDashboard');
    const handoff = JSON.parse(storage.getItem('austriaPathWeeklyPlanHandoff'));
    expect(handoff).toEqual({ planIndex: 4, view: 'dashboard' });
  });
});

describe('unchanged architectures', () => {
  it('does not modify Placement evaluator wiring', () => {
    const placement = readSrc('src/app/screens/PlacementTestScreen.jsx');
    expect(placement).toMatch(/evaluatePlacementTurn|postPlacementEvaluateTurn/);
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).not.toMatch(/placementEvaluate/);
  });

  it('uses learner voice capture without Placement AI in Aufgabe lösen', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    expect(panel).toMatch(/useWeeklyPlanSpeechRecognition/);
    expect(panel).toMatch(/Aufnahme starten/);
    expect(panel).not.toMatch(/placementEvaluate|apiFetch|\/ai\/completions/);
  });
});
