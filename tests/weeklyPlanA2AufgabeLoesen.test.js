/**
 * A2 Aufgabe lösen guided study — SpeakingScreen integration, catalog, navigation.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AUFGABE_LOESEN_EXERCISE_TYPE,
  a2AufgabeLoesenTasks,
  getA2AufgabeLoesenSpeakingModels,
  getA2AufgabeLoesenTask,
  listA2AufgabeLoesenCanonicalIds,
  resolveA2AufgabeLoesenAudioPath,
} from '../src/data/a2AufgabeLoesenCatalog.js';
import { isAufgabeLoesenWeeklyTask } from '../src/data/utils/a2AufgabeLoesenRuntime.js';
import { validateA2AufgabeLoesenCatalog } from '../src/data/utils/a2AufgabeLoesenValidation.js';
import { parseA2AufgabeLoesenCsv } from '../src/data/utils/parseA2AufgabeLoesenCsv.js';
import { weeklyPlanLibrary } from '../src/data/weeklyPlanLibrary.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import { placementPlanningPacks } from '../src/data/placementPlanningPacks.js';
import { b1PlanningModels } from '../src/data/modelsb1.js';

const ROOT = process.cwd();
const PUBLIC_ROOT = resolve(ROOT, 'public');

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('Home navigation', () => {
  it('does not display a separate Aufgabe lösen tile', () => {
    const home = readSrc('src/app/screens/HomeScreen.jsx');
    expect(home).not.toMatch(/Aufgabe lösen \(A2\)/);
    expect(home).not.toMatch(/setActiveTab\('aufgabeLoesen'\)/);
    expect(home).toMatch(/Sprechen üben/);
    expect(home).toMatch(/A2: Aufgabe lösen/);
  });
});

describe('SpeakingScreen A2 Aufgabe lösen', () => {
  it('exposes Aufgabe lösen as the A2 exercise type via speaking models', () => {
    const models = getA2AufgabeLoesenSpeakingModels();
    expect(models).toHaveLength(10);
    models.forEach((model) => {
      expect(model.type).toBe(AUFGABE_LOESEN_EXERCISE_TYPE);
      expect(model.level).toBe('A2');
      expect(model.isGuidedAufgabeLoesen).toBe(true);
      expect(model.canonicalId).toMatch(/^A2-AL-\d{3}$/);
    });
  });

  it('integrates guided panel inside SpeakingScreen without a separate route', () => {
    const speaking = readSrc('src/app/screens/SpeakingScreen.jsx');
    const app = readSrc('src/app/App.jsx');
    expect(speaking).toMatch(/AufgabeLoesenGuidedPanel/);
    expect(speaking).toMatch(/getA2AufgabeLoesenSpeakingModels/);
    expect(app).not.toMatch(/aufgabeLoesen/);
    expect(existsSync(resolve(ROOT, 'src/app/screens/A2AufgabeLoesenScreen.jsx'))).toBe(false);
  });

  it('selects all 10 canonical tasks by ID', () => {
    expect(listA2AufgabeLoesenCanonicalIds()).toHaveLength(10);
    for (let i = 1; i <= 10; i += 1) {
      const id = `A2-AL-${String(i).padStart(3, '0')}`;
      expect(getA2AufgabeLoesenTask(id)?.title).toBeTruthy();
    }
  });
});

describe('Canonical guided-study catalog', () => {
  it('passes validation for 10 tasks, 40 MP3 refs, and 40 learner responses', () => {
    expect(validateA2AufgabeLoesenCatalog({ checkFilesOnDisk: true })).toEqual([]);
  });

  it('gives every task exactly four partner audio clips on disk', () => {
    a2AufgabeLoesenTasks.forEach((task) => {
      expect(task.turns).toHaveLength(4);
      task.turns.forEach((turn) => {
        const path = resolveA2AufgabeLoesenAudioPath(turn.audioFile);
        expect(path).toMatch(/^\/audio\/a2\/aufgabe-loesen\//);
        expect(existsSync(resolve(PUBLIC_ROOT, path.replace(/^\//, '')))).toBe(true);
      });
    });
  });

  it('stores one curated learner response on every turn from CSV', () => {
    const csv = readFileSync(
      resolve(ROOT, 'src/data/a2-aufgabe-loesen-with-learner-responses.csv'),
      'utf8'
    );
    const rows = parseA2AufgabeLoesenCsv(csv).filter(
      (row) => String(row.audio_file || '').toLowerCase() !== 'welcome.mp3'
    );
    expect(rows).toHaveLength(40);

    let responseCount = 0;
    a2AufgabeLoesenTasks.forEach((task) => {
      task.turns.forEach((turn) => {
        expect(turn.learnerResponse?.trim()).toBeTruthy();
        responseCount += 1;
      });
    });
    expect(responseCount).toBe(40);
  });

  it('ignores welcome.mp3 test file', () => {
    const csv = readFileSync(
      resolve(ROOT, 'src/data/a2-aufgabe-loesen-with-learner-responses.csv'),
      'utf8'
    );
    const rows = parseA2AufgabeLoesenCsv(csv);
    expect(rows.some((row) => row.audio_file === 'welcome.mp3')).toBe(false);
  });
});

describe('Aufgabe lösen guided speaking UX', () => {
  it('shows the guided sentence and records learner speech', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    const speaking = readSrc('src/app/screens/SpeakingScreen.jsx');
    const forbidden = [
      'Das können Sie sagen:',
      'evaluateAufgabeLoesenTurn',
      'evaluateA2AufgabeLoesen',
      'placementEvaluate',
      '/ai/completions',
      'apiFetch',
      'Noch einmal üben',
    ];
    forbidden.forEach((token) => {
      expect(panel).not.toMatch(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      expect(speaking).not.toMatch(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
    expect(panel).toMatch(/getAufgabeLoesenPronunciationNote/);
    expect(panel).toMatch(/guidedSpeakingRecordInstruction/);
    expect(panel).toMatch(/getScreenLabels\(getUserLanguage\(\)\)/);
    expect(panel).toMatch(/Ihr Satz:/);
    expect(panel).toMatch(/Aufnahme starten/);
    expect(panel).toMatch(/Zurück zum Trainingsplan/);
    expect(panel).toMatch(/useWeeklyPlanSpeechRecognition/);
  });

  it('removed evaluation module', () => {
    expect(existsSync(resolve(ROOT, 'src/data/utils/a2AufgabeLoesenEvaluation.js'))).toBe(false);
  });
});

describe('Weekly plan navigation', () => {
  it('opens canonical tasks inside SpeakingScreen', () => {
    for (let i = 1; i <= 10; i += 1) {
      const weeklyId = `a2-al-${String(i).padStart(3, '0')}`;
      const canonicalId = `A2-AL-${String(i).padStart(3, '0')}`;
      expect(weeklyPlanTaskNavigation[weeklyId]).toEqual({
        tab: 'speaking',
        level: 'A2',
        canonicalTaskId: canonicalId,
      });
    }
  });

  it('coach redirect targets speaking with canonicalTaskId', () => {
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/setActiveTab\('speaking'\)/);
    expect(coach).toMatch(/canonicalTaskId: task\.canonicalTaskId/);
    expect(coach).not.toMatch(/aufgabeLoesen/);
  });

  it('keeps 10 weekly-plan aufgabe_loesen references', () => {
    const alTasks = weeklyPlanLibrary.filter((t) => t.skill === 'aufgabe_loesen');
    expect(alTasks).toHaveLength(10);
    alTasks.forEach((task) => {
      expect(isAufgabeLoesenWeeklyTask(task)).toBe(true);
      expect(task.canonicalTaskId).toMatch(/^A2-AL-\d{3}$/);
    });
  });
});

describe('B1/B2 speaking unchanged', () => {
  it('keeps B1 planning model count stable', () => {
    expect(b1PlanningModels.length).toBeGreaterThan(0);
  });

  it('does not inject aufgabe loesen models into B1/B2 speaking selectors', () => {
    const speaking = readSrc('src/app/screens/SpeakingScreen.jsx');
    expect(speaking).toMatch(/B1: b1PlanningModels/);
    expect(speaking).toMatch(/B2: b2SpeakingModels/);
  });
});

describe('Placement and Hören isolation', () => {
  it('does not modify placement planning packs', () => {
    const a2Packs = placementPlanningPacks.filter((p) => p.level === 'A2');
    expect(a2Packs.some((p) => p.scenarioId === 'a2_planung_mittel')).toBe(true);
  });

  it('does not add aufgabe loesen tasks to hören screen', () => {
    const horen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(horen).not.toMatch(/a2AufgabeLoesen/);
    expect(horen).not.toMatch(/aufgabeLoesen/);
  });
});
