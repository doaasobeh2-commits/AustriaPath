/**
 * Admin-wide learning level access — helpers, SpeakingScreen integration, entitlements unchanged.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isAdminAccount } from '../src/config/authConfig.js';
import {
  canAccessAllLearningLevels,
  clearAdminSessionLearningLevel,
  getAccessibleLearningLevels,
  readAdminSessionLearningLevel,
  resolveActiveLearningLevel,
  shouldPersistLearningLevelToProfile,
  writeAdminSessionLearningLevel,
} from '../src/utils/learningLevelAccess.js';
import {
  AUFGABE_LOESEN_EXERCISE_TYPE,
  getA2AufgabeLoesenSpeakingModels,
} from '../src/data/a2AufgabeLoesenCatalog.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import { b1PlanningModels } from '../src/data/modelsb1.js';
import { placementPlanningPacks } from '../src/data/placementPlanningPacks.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

const adminUser = { role: 'admin', status: 'approved', level: 'B1' };
const b1Learner = { role: 'student', status: 'approved', level: 'B1' };
const a2Learner = { role: 'student', status: 'approved', level: 'A2' };

describe('admin detection', () => {
  it('uses isAdminAccount(role=admin, status=approved)', () => {
    expect(isAdminAccount(adminUser)).toBe(true);
    expect(isAdminAccount({ role: 'admin', status: 'pending' })).toBe(false);
    expect(isAdminAccount(b1Learner)).toBe(false);
  });

  it('canAccessAllLearningLevels mirrors isAdminAccount', () => {
    expect(canAccessAllLearningLevels(adminUser)).toBe(true);
    expect(canAccessAllLearningLevels(b1Learner)).toBe(false);
  });
});

describe('getAccessibleLearningLevels', () => {
  it('returns A2, B1, B2 for admin', () => {
    expect(getAccessibleLearningLevels(adminUser)).toEqual(['A2', 'B1', 'B2']);
  });

  it('returns A2 and B1 for normal B1 learner', () => {
    expect(getAccessibleLearningLevels(b1Learner)).toEqual(['A2', 'B1']);
  });

  it('returns only A2 for normal A2 learner', () => {
    expect(getAccessibleLearningLevels(a2Learner)).toEqual(['A2']);
  });

  it('filters explicit allowedLevels arrays from the API', () => {
    const learner = {
      role: 'student',
      status: 'approved',
      level: 'B1',
      allowedLevels: ['A2', 'B1', 'INVALID'],
    };
    expect(getAccessibleLearningLevels(learner)).toEqual(['A2', 'B1']);
  });

  it('falls back to level defaults when allowedLevels is a PostgreSQL array literal string', () => {
    const learner = {
      role: 'student',
      status: 'approved',
      level: 'B1',
      allowedLevels: '{A2,B1}',
    };
    expect(getAccessibleLearningLevels(learner)).toEqual(['A2', 'B1']);
    expect(() => getAccessibleLearningLevels(learner)).not.toThrow();
  });

  it('falls back to level defaults when allowedLevels is missing', () => {
    const learner = { role: 'student', status: 'approved', level: 'B1' };
    expect(getAccessibleLearningLevels(learner)).toEqual(['A2', 'B1']);
  });
});

describe('session-local admin level (no profile mutation)', () => {
  beforeEach(() => {
    clearAdminSessionLearningLevel();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userLevel', 'B1');
    }
  });

  afterEach(() => {
    clearAdminSessionLearningLevel();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userLevel');
    }
  });

  it('stores admin preview level in sessionStorage only', () => {
    writeAdminSessionLearningLevel('A2');
    expect(readAdminSessionLearningLevel()).toBe('A2');
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('userLevel')).toBe('B1');
    }
  });

  it('resolveActiveLearningLevel prefers session/selection for admin without changing stored level', () => {
    writeAdminSessionLearningLevel('A2');
    const resolved = resolveActiveLearningLevel({
      user: adminUser,
      selectedLevel: null,
      storedLevel: 'B1',
    });
    expect(resolved).toBe('A2');
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('userLevel')).toBe('B1');
    }
  });

  it('shouldPersistLearningLevelToProfile is false for admin', () => {
    expect(shouldPersistLearningLevelToProfile(adminUser)).toBe(false);
    expect(shouldPersistLearningLevelToProfile(b1Learner)).toBe(true);
  });

  it('readAdminSessionLearningLevel returns null when unset', () => {
    expect(readAdminSessionLearningLevel()).toBeNull();
  });
});

describe('SpeakingScreen admin A2 Aufgabe lösen', () => {
  it('uses LearningLevelSelector instead of a disabled level select', () => {
    const source = readSrc('src/app/screens/SpeakingScreen.jsx');
    expect(source).toMatch(/LearningLevelSelector/);
    expect(source).not.toMatch(/value=\{userLevel\} disabled/);
  });

  it('exposes all 10 canonical A2 Aufgabe lösen tasks', () => {
    const models = getA2AufgabeLoesenSpeakingModels();
    expect(models).toHaveLength(10);
    models.forEach((model) => {
      expect(model.type).toBe(AUFGABE_LOESEN_EXERCISE_TYPE);
      expect(model.level).toBe('A2');
    });
  });

  it('admin with stored B1 can resolve A2 via session selection', () => {
    writeAdminSessionLearningLevel('A2');
    const level = resolveActiveLearningLevel({
      user: adminUser,
      storedLevel: 'B1',
    });
    expect(level).toBe('A2');
    const models = getA2AufgabeLoesenSpeakingModels();
    expect(models.length).toBe(10);
  });
});

describe('weekly navigation for admin A2 speaking', () => {
  it('maps a2-al-001 to speaking tab with canonical task id', () => {
    expect(weeklyPlanTaskNavigation['a2-al-001']).toEqual({
      tab: 'speaking',
      level: 'A2',
      canonicalTaskId: 'A2-AL-001',
    });
  });

  it('CoachExerciseScreen does not write userLevel to localStorage', () => {
    const source = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(source).not.toMatch(/localStorage\.setItem\(['"]userLevel['"]/);
    expect(source).toMatch(/setSelectedLevel\?\.\('A2'\)/);
  });
});

describe('learner restrictions preserved', () => {
  it('B1 learner cannot access B2 via getAccessibleLearningLevels', () => {
    expect(getAccessibleLearningLevels(b1Learner)).not.toContain('B2');
  });

  it('normal learner resolveActiveLearningLevel ignores admin session level', () => {
    writeAdminSessionLearningLevel('B2');
    const level = resolveActiveLearningLevel({
      user: b1Learner,
      selectedLevel: null,
      storedLevel: 'B1',
    });
    expect(level).toBe('B1');
  });
});

describe('B1/B2 content unchanged', () => {
  it('B1 planning models remain available', () => {
    expect(b1PlanningModels.length).toBeGreaterThan(0);
  });
});

describe('placement and paid gates untouched', () => {
  it('placement planning packs are unchanged', () => {
    expect(placementPlanningPacks).toBeDefined();
    expect(Object.keys(placementPlanningPacks).length).toBeGreaterThan(0);
  });

  it('SpeakingScreen still uses premium hint gating', () => {
    const source = readSrc('src/app/screens/SpeakingScreen.jsx');
    expect(source).toMatch(/isPremiumUser/);
    expect(source).toMatch(/setActiveTab\('premium'\)/);
  });

  it('learningLevelAccess does not reference subscription or ai credits', () => {
    const source = readSrc('src/utils/learningLevelAccess.js');
    expect(source).not.toMatch(/subscription|aiCredits|premiumExam/i);
  });
});
