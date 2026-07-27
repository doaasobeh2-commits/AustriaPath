/**
 * A2 Hören guided listening — catalog, navigation, single Hören screen integration.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  a2HorenModels,
  flattenA2HorenQuestions,
  getA2HorenModel,
  listA2HorenModelIds,
  resolveA2HorenAudioPath,
  weeklyPlanIdToCanonicalModelId,
  canonicalModelIdToWeeklyPlanId,
} from '../src/data/a2HorenCatalog.js';
import { weeklyPlanA2HorenTasks } from '../src/data/weeklyPlanA2HorenTasks.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import { weeklyPlanLibrary } from '../src/data/weeklyPlanLibrary.js';
import { isA2HorenWeeklyTask } from '../src/data/utils/a2HorenRuntime.js';
import { validateWeeklyPlanLibraryIntegrity } from '../src/data/utils/weeklyPlanLibraryValidation.js';
import catalogJson from '../src/data/a2-hoeren-catalog.json' with { type: 'json' };

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('A2 Hören catalog', () => {
  it('loads 10 listening models with 2 clips and 4 questions each', () => {
    expect(a2HorenModels).toHaveLength(10);
    a2HorenModels.forEach((model) => {
      expect(model.clips).toHaveLength(2);
      const questions = flattenA2HorenQuestions(model);
      expect(questions).toHaveLength(4);
      model.clips.forEach((clip) => {
        expect(clip.audio_file).toMatch(/^a2-h-\d{3}-clip-\d{2}\.mp3$/);
        expect(clip.questions).toHaveLength(2);
        clip.questions.forEach((question) => {
          expect(['single_choice', 'true_false']).toContain(question.type);
          expect(question.options.length).toBeGreaterThanOrEqual(2);
        });
      });
    });
  });

  it('resolves MP3 paths from catalog audioBasePath', () => {
    expect(resolveA2HorenAudioPath('a2-h-001-clip-01.mp3')).toBe(
      '/audio/a2/hoeren/a2-h-001-clip-01.mp3'
    );
    expect(catalogJson.audioBasePath).toBe('/audio/a2/hoeren/');
  });

  it('maps weekly plan ids to canonical model ids', () => {
    expect(weeklyPlanIdToCanonicalModelId('a2-hoeren-001')).toBe('A2-H-001');
    expect(canonicalModelIdToWeeklyPlanId('A2-H-010')).toBe('a2-hoeren-010');
    expect(getA2HorenModel('A2-H-001')?.title).toBe('Unterwegs und Wetter');
  });
});

describe('Weekly Plan integration', () => {
  it('defines 10 catalog-backed hören tasks', () => {
    expect(weeklyPlanA2HorenTasks).toHaveLength(10);
    weeklyPlanA2HorenTasks.forEach((task) => {
      expect(isA2HorenWeeklyTask(task)).toBe(true);
      expect(task.canonicalModelId).toMatch(/^A2-H-\d{3}$/);
      expect(weeklyPlanLibrary.find((entry) => entry.id === task.id)).toBeTruthy();
    });
  });

  it('routes all a2-hoeren tasks to the horen tab with deep links', () => {
    listA2HorenModelIds().forEach((modelId) => {
      const weeklyId = canonicalModelIdToWeeklyPlanId(modelId);
      expect(weeklyPlanTaskNavigation[weeklyId]).toEqual({
        tab: 'horen',
        level: 'A2',
        canonicalModelId: modelId,
      });
    });
  });

  it('passes weekly plan library validation', () => {
    expect(validateWeeklyPlanLibraryIntegrity()).toEqual([]);
  });
});

describe('Single Hören screen integration', () => {
  it('uses A2HorenGuidedPanel inside HorenScreen without a separate screen', () => {
    const horenScreen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(horenScreen).toMatch(/A2HorenGuidedPanel/);
    expect(horenScreen).toMatch(/canonicalModelId/);
    expect(horenScreen).not.toMatch(/staticA2HorenModels = \[\s*\{\s*title: 'Termin beim Arzt'/);
  });

  it('redirects weekly plan hören tasks from CoachExerciseScreen to horen', () => {
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/isA2HorenWeeklyTask/);
    expect(coach).toMatch(/setActiveTab\('horen'\)/);
    expect(coach).toMatch(/canonicalModelId/);
  });

  it('does not add a duplicate Hören route in App.jsx', () => {
    const app = readSrc('src/app/App.jsx');
    expect(app.match(/guardedTab === "horen"/g)).toHaveLength(1);
  });
});
