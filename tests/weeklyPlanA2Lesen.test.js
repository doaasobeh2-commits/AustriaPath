/**
 * A2 Lesen guided reading — catalog, navigation, single Lesen screen integration.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  a2LesenModels,
  getA2LesenModel,
  getA2LesenQuestions,
  listA2LesenModelIds,
  weeklyPlanIdToCanonicalLesenModelId,
  canonicalLesenModelIdToWeeklyPlanId,
} from '../src/data/a2LesenCatalog.js';
import { weeklyPlanA2LesenTasks } from '../src/data/weeklyPlanA2LesenTasks.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import { weeklyPlanLibrary } from '../src/data/weeklyPlanLibrary.js';
import { isA2LesenWeeklyTask } from '../src/data/utils/a2LesenRuntime.js';
import { validateWeeklyPlanLibraryIntegrity } from '../src/data/utils/weeklyPlanLibraryValidation.js';
import catalogJson from '../src/data/a2-lesen-catalog.json' with { type: 'json' };

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

describe('A2 Lesen catalog', () => {
  it('loads 10 reading models with 4 questions each', () => {
    expect(a2LesenModels).toHaveLength(10);
    expect(catalogJson.models_count).toBe(10);
    expect(catalogJson.questions_per_model).toBe(4);

    a2LesenModels.forEach((model) => {
      const questions = getA2LesenQuestions(model);
      expect(questions).toHaveLength(4);

      const comprehension = questions.filter((q) => q.category === 'comprehension');
      const language = questions.filter((q) => q.category === 'language');
      expect(comprehension).toHaveLength(2);
      expect(language).toHaveLength(2);

      questions.forEach((question) => {
        expect(['single_choice', 'true_false']).toContain(question.type);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.correct_answer).toBeTruthy();
      });

      const words = wordCount(model.text);
      expect(words).toBeGreaterThanOrEqual(80);
      expect(words).toBeLessThanOrEqual(170);
    });
  });

  it('maps weekly plan ids to canonical model ids', () => {
    expect(weeklyPlanIdToCanonicalLesenModelId('a2-lesen-001')).toBe('A2-L-001');
    expect(canonicalLesenModelIdToWeeklyPlanId('A2-L-010')).toBe('a2-lesen-010');
    expect(getA2LesenModel('A2-L-001')?.title).toBe('Maria arbeitet im Supermarkt');
  });
});

describe('Weekly Plan integration', () => {
  it('defines 10 catalog-backed lesen tasks without inline text', () => {
    expect(weeklyPlanA2LesenTasks).toHaveLength(10);
    weeklyPlanA2LesenTasks.forEach((task) => {
      expect(isA2LesenWeeklyTask(task)).toBe(true);
      expect(task.canonicalModelId).toMatch(/^A2-L-\d{3}$/);
      expect(task.text).toBeUndefined();
      expect(task.questions).toBeUndefined();
      expect(weeklyPlanLibrary.find((entry) => entry.id === task.id)).toBeTruthy();
    });
  });

  it('routes all a2-lesen tasks to the lesen tab with deep links', () => {
    listA2LesenModelIds().forEach((modelId) => {
      const weeklyId = canonicalLesenModelIdToWeeklyPlanId(modelId);
      expect(weeklyPlanTaskNavigation[weeklyId]).toEqual({
        tab: 'lesen',
        level: 'A2',
        canonicalModelId: modelId,
      });
    });
  });

  it('does not route any a2-lesen task to Writing', () => {
    Object.entries(weeklyPlanTaskNavigation).forEach(([taskId, target]) => {
      if (!taskId.startsWith('a2-lesen-')) return;
      expect(target.tab).toBe('lesen');
      expect(target.writingModelId).toBeUndefined();
      expect(target.canonicalModelId).toMatch(/^A2-L-\d{3}$/);
    });
  });

  it('passes weekly plan library validation', () => {
    expect(validateWeeklyPlanLibraryIntegrity()).toEqual([]);
  });

  it('removed old inline A2 lesen duplicates from library sources', () => {
    const librarySource = readSrc('src/data/weeklyPlanLibrary.js');
    const catalogTasksSource = readSrc('src/data/weeklyPlanLibraryCatalogTasks.js');
    expect(librarySource).not.toMatch(/Der Bus hat Verspätung/);
    expect(catalogTasksSource).not.toMatch(/Kleines Zimmer in Wien/);
    expect(catalogTasksSource).not.toMatch(/am Samstag feiere ich meinen Geburtstag/);
    expect(librarySource).toMatch(/weeklyPlanA2LesenTasks/);
  });
});

describe('Single Lesen screen integration', () => {
  it('uses A2LesenGuidedPanel inside LesenScreen without hardcoded A2 demo', () => {
    const lesenScreen = readSrc('src/app/screens/LesenScreen.jsx');
    expect(lesenScreen).toMatch(/A2LesenGuidedPanel/);
    expect(lesenScreen).toMatch(/pickRandomA2LesenModel/);
    expect(lesenScreen).toMatch(/canonicalModelId/);
    expect(lesenScreen).toMatch(/a2LesenCatalog/);
    expect(lesenScreen).not.toMatch(/lesenModels\s*=\s*\{/);
    expect(lesenScreen).not.toMatch(/Maria arbeitet im Supermarkt/);
  });

  it('redirects weekly plan lesen tasks from CoachExerciseScreen to lesen', () => {
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/isA2LesenWeeklyTask/);
    expect(coach).toMatch(/setActiveTab\('lesen'\)/);
    expect(coach).toMatch(/canonicalModelId/);
  });

  it('resolves daily learning lesen deep links via canonicalModelId', () => {
    const nav = readSrc('src/data/dailyLearningNavigation.js');
    expect(nav).toMatch(/target\.canonicalModelId/);
    expect(nav).toMatch(/tab: "lesen"/);
  });
});
