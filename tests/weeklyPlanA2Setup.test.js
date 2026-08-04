/**
 * A2 Weekly Plan setup screen — simplified informational flow (Phase A2-3).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createCoachWeeklyPlan,
  EXERCISES_PER_PLAN,
  isCoachV1Plan,
  loadWeeklyPlan,
  saveWeeklyPlan,
  TOTAL_PLANS,
} from '../src/data/utils/weeklyPlanCoachState.js';
import { planWeek } from '../src/data/weeklyPlanLibrary.js';

const SETUP_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/app/screens/WeeklyPlanSetupScreen.jsx'),
  'utf8'
);

const REMOVED_A2_OPTIONS = [
  'Selbstvorstellung',
  'Grafikbeschreibung',
  'Diskussion',
  'Planung',
  'Grammatik',
  'Satzbau',
  'Konnektoren',
];

const A2_TRAINING_DOMAINS = [
  'Hören',
  'Lesen',
  'Bildbeschreibung',
  'Schreiben / E-Mail',
  'Aufgabe lösen',
];

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

describe('A2 setup screen source', () => {
  it('shows no selectable skill chips', () => {
    expect(SETUP_SOURCE).not.toMatch(/toggleExtraSkill/);
    expect(SETUP_SOURCE).not.toMatch(/selfSelectedSkills/);
    expect(SETUP_SOURCE).not.toMatch(/extraSkills/);
    expect(SETUP_SOURCE).not.toMatch(/WEAKNESS_OPTIONS/);
    expect(SETUP_SOURCE).not.toMatch(/Woran möchtest du arbeiten/);
    expect(SETUP_SOURCE).not.toMatch(/Bitte wähle mindestens einen Bereich/);
  });

  it('shows the five real A2 training domains', () => {
    A2_TRAINING_DOMAINS.forEach((label) => {
      expect(SETUP_SOURCE).toContain(label);
    });
    expect(SETUP_SOURCE).toMatch(/So ist dein A2-Wochenplan aufgebaut/);
    expect(SETUP_SOURCE).toMatch(
      /Die vierte Übung wechselt zwischen E-Mail schreiben und Aufgabe[\s\S]*lösen/
    );
  });

  it('does not show removed A2 setup options', () => {
    REMOVED_A2_OPTIONS.forEach((label) => {
      expect(SETUP_SOURCE).not.toContain(label);
    });
  });

  it('does not display placement focus chips for A2', () => {
    expect(SETUP_SOURCE).not.toMatch(/Aus deinem Einstufungstest/);
    expect(SETUP_SOURCE).not.toMatch(/Zusätzlich auswählen/);
    expect(SETUP_SOURCE).toMatch(/importedFocus=\{isB1Flow \? importedFocus : \[\]\}/);
  });

  it('still routes A2 through createCoachWeeklyPlan and B1 to b1WeeklyPlanSetup', () => {
    expect(SETUP_SOURCE).toMatch(/createCoachWeeklyPlan\(\{ level: 'A2', focusSkills: \[\] \}\)/);
    expect(SETUP_SOURCE).toMatch(/b1WeeklyPlanSetup/);
    expect(SETUP_SOURCE).not.toMatch(/createCoachWeeklyPlan\(\{ level: 'B1'/);
  });
});

describe('A2 activation without focus selection', () => {
  it('creates a valid 7 × 4 coach plan with empty focusSkills', () => {
    const plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: [] });
    expect(isCoachV1Plan(plan)).toBe(true);
    expect(plan.level).toBe('A2');
    expect(plan.focusSkills).toEqual([]);
    expect(plan.plans).toHaveLength(TOTAL_PLANS);
    plan.plans.forEach((entry) => {
      expect(entry.exercises).toHaveLength(EXERCISES_PER_PLAN);
    });
  });

  it('keeps odd/even fourth-skill distribution unchanged', () => {
    const plans = planWeek({ level: 'A2', totalPlans: 7, exercisesPerPlan: 4 });
    plans.forEach((day, index) => {
      const skills = day.map((task) => task.skill);
      const planIndex = index + 1;
      const fourthSkill = planIndex % 2 === 0 ? 'schreiben' : 'aufgabe_loesen';
      expect(skills).toEqual(['lesen', 'hoeren', 'bildbeschreibung', fourthSkill]);
    });
  });

  it('loads existing stored plans without migration', () => {
    const legacyPlan = createCoachWeeklyPlan({ level: 'A2', focusSkills: ['hoeren', 'grammatik'] });
    const storage = createMemoryStorage();
    saveWeeklyPlan(legacyPlan, storage);
    const reloaded = loadWeeklyPlan(storage);
    expect(reloaded?.focusSkills).toEqual(['hoeren', 'grammatik']);
    expect(isCoachV1Plan(reloaded)).toBe(true);
    expect(reloaded?.plans).toHaveLength(7);
  });
});

describe('B1 setup wiring unchanged', () => {
  it('still references B1 model selection flow', () => {
    expect(SETUP_SOURCE).toMatch(/Weiter zur B1-Modellauswahl/);
    expect(SETUP_SOURCE).toMatch(/createEmptyB1SetupDraft/);
    expect(SETUP_SOURCE).toMatch(/placementFocus: b1PlacementFocus/);
  });
});
