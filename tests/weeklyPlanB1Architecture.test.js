import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  getB1WeeklyPlanExaminerModel,
  getB1WeeklyPlanLibrarySummary,
  getB1WeeklyPlanSelectableCatalog,
  b1WeeklyPlanHoerenApprovedCount,
  b1WeeklyPlanHoerenCatalog,
  b1WeeklyPlanHoerenSelectionBlocked,
  b1WeeklyPlanSchreibenCatalog,
  b1WeeklyPlanPlanungCatalog,
} from '../src/data/weekly-plan/b1/index.js';
import {
  createEmptyB1SetupDraft,
  isB1SetupSelectionComplete,
  loadB1SetupDraft,
  saveB1SetupDraft,
  toggleB1ModelSelection,
} from '../src/data/utils/b1WeeklyPlanSetupState.js';
import { B1_WEEKLY_PLAN_SETUP_DRAFT_KEY } from '../src/constants/storageKeys.js';
import {
  buildB1CoachWeeklyPlan,
  generateB1WeeklyPlanSchedule,
} from '../src/data/weekly-plan/b1/planGeneration.js';
import {
  resolveWeeklyPlanLevelChoices,
  didAcceptPlacementRecommendation,
} from '../src/data/utils/weeklyPlanLevelSelection.js';
import {
  getWeeklyPlanAnalyticsEvents,
  recordWeeklyPlanAnalyticsEvent,
  WeeklyPlanAnalyticsEvents,
} from '../src/data/utils/weeklyPlanAnalytics.js';
import { loadWeeklyPlan, saveWeeklyPlan } from '../src/data/utils/weeklyPlanCoachState.js';
import { WEEKLY_PLAN_STORAGE_KEY, WEEKLY_PLAN_ANALYTICS_KEY } from '../src/constants/storageKeys.js';

const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};

describe('B1 Weekly Plan level selection policy', () => {
  it('recommends placement level without hard-locking choices', () => {
    const result = resolveWeeklyPlanLevelChoices({
      placementProfile: { level: 'A2+' },
      accessibleLevels: ['A2', 'B1'],
      storedLevel: 'B1',
    });
    expect(result.recommended).toBe('A2');
    expect(result.choices.find((c) => c.level === 'A2')?.recommended).toBe(true);
    expect(result.choices.find((c) => c.level === 'B1')?.selectable).toBe(true);
    expect(result.choices.find((c) => c.level === 'B2')?.status).toBe('coming_soon');
  });

  it('defaults to A2 without placement when no explicit non-B1 preference', () => {
    const result = resolveWeeklyPlanLevelChoices({
      placementProfile: null,
      accessibleLevels: ['A2', 'B1'],
      storedLevel: 'B1',
    });
    expect(result.defaultLevel).toBe('A2');
  });

  it('tracks recommended vs different level selection', () => {
    expect(didAcceptPlacementRecommendation('B1', 'B1')).toBe(true);
    expect(didAcceptPlacementRecommendation('A2', 'B1')).toBe(false);
  });
});

describe('B1 dedicated library', () => {
  it('exposes approved model counts and hören blocker', () => {
    const summary = getB1WeeklyPlanLibrarySummary();
    expect(summary.counts.schreiben).toBe(13);
    expect(summary.counts.bildbeschreibung).toBe(20);
    expect(summary.counts.planung).toBe(8);
    expect(summary.counts.hoeren.approved).toBe(10);
    expect(summary.counts.hoeren.total).toBe(10);
    expect(summary.counts.hoeren.placeholders).toBe(0);
    expect(b1WeeklyPlanHoerenSelectionBlocked).toBe(false);
    expect(summary.blockers.hoeren).toBeNull();
  });

  it('examiner resolves only b1wp IDs', () => {
    const model = getB1WeeklyPlanExaminerModel(
      'schreiben',
      b1WeeklyPlanSchreibenCatalog[0].id
    );
    expect(model?.id).toMatch(/^b1wp-/);
    expect(getB1WeeklyPlanExaminerModel('schreiben', 'a2-schreiben-001')).toBeNull();
    expect(getB1WeeklyPlanExaminerModel('schreiben', 'b1-selbst-001')).toBeNull();
    expect(getB1WeeklyPlanExaminerModel('hoeren', 'placement-pack-1')).toBeNull();
  });

  it('selbstvorstellung is mandatory in schema', () => {
    const selbst = getB1WeeklyPlanExaminerModel(
      'selbstvorstellung',
      'b1wp-selbst-001'
    );
    expect(selbst?.required).toBe(true);
    expect(selbst?.maxFollowUpQuestions).toBe(2);
  });

  it('assigns modelVersion 1 to every B1 weekly catalog model', () => {
    const allModels = [
      ...b1WeeklyPlanSchreibenCatalog,
      ...b1WeeklyPlanHoerenCatalog,
      ...b1WeeklyPlanPlanungCatalog,
    ];
    allModels.forEach((model) => {
      expect(model.modelVersion).toBe(1);
    });
  });

  it('loads 10 approved hören models from b1-hoeren-catalog.json with public audio paths', () => {
    expect(b1WeeklyPlanHoerenApprovedCount).toBe(10);
    expect(b1WeeklyPlanHoerenCatalog).toHaveLength(10);
    expect(b1WeeklyPlanHoerenCatalog.every((model) => model.status === 'approved')).toBe(true);
    expect(getB1WeeklyPlanSelectableCatalog('hoeren')).toHaveLength(10);
    const first = b1WeeklyPlanHoerenCatalog[0];
    expect(first.id).toBe('b1wp-hoeren-001');
    expect(first.parts).toHaveLength(2);
    expect(first.parts[0].audioPath).toBe('/audio/weekly-plan/b1/hoeren/b1-wp-h-001-clip-01.mp3');
    expect(first.parts[0].questions).toHaveLength(2);
    expect(first.source.file).toContain('b1-hoeren-catalog.json');
  });
});

describe('B1 setup draft persistence', () => {
  let storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it('persists draft selections across reload', () => {
    const draft = createEmptyB1SetupDraft({ placementLevel: 'B1' });
    draft.schreiben = b1WeeklyPlanSchreibenCatalog.slice(0, 3).map((m) => m.id);
    saveB1SetupDraft(draft, storage);
    const loaded = loadB1SetupDraft(storage);
    expect(loaded.schreiben).toHaveLength(3);
    expect(loaded.schemaVersion).toBe('b1-setup-draft-v1');
  });

  it('requires exactly seven per selectable category when hören allows', () => {
    const draft = createEmptyB1SetupDraft();
    expect(isB1SetupSelectionComplete(draft)).toBe(false);
  });

  it('does not overwrite active plan when saving draft only', () => {
    storage = memoryStorage();
    storage.setItem(
      WEEKLY_PLAN_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 'coach-v1', level: 'A2', plans: [] })
    );
    saveB1SetupDraft(createEmptyB1SetupDraft(), storage);
    const plan = loadWeeklyPlan(storage);
    expect(plan.level).toBe('A2');
    expect(storage.getItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY)).toBeTruthy();
  });
});

describe('B1 plan generation', () => {
  const fullSelections = () => ({
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((m) => m.id),
    hoeren: b1WeeklyPlanHoerenCatalog.slice(0, 7).map((m) => m.id),
    bildbeschreibung: Array.from({ length: 7 }, (_, i) => `b1wp-bild-${String(i + 1).padStart(3, '0')}`),
    planung: Array.from({ length: 7 }, (_, i) => `b1wp-planung-${String(i + 1).padStart(2, '0')}`),
  });

  it('builds deterministic 7-day schedule with selbstvorstellung on days 1, 4 and 7', () => {
    const schedule = generateB1WeeklyPlanSchedule(fullSelections());
    expect(schedule.days).toHaveLength(7);
    expect(schedule.selbstvorstellungSessions).toBe(3);

    const exerciseCountByDay = Object.fromEntries(
      schedule.days.map((day) => [day.dayIndex, day.activities.length])
    );
    expect(exerciseCountByDay).toEqual({
      1: 5,
      2: 4,
      3: 4,
      4: 5,
      5: 4,
      6: 4,
      7: 5,
    });

    schedule.days.forEach((day) => {
      const categories = day.activities.map((a) => a.category);
      expect(categories).toContain('hoeren');
      expect(categories).toContain('schreiben');
      expect(categories).toContain('bildbeschreibung');
      expect(categories).toContain('planung');
      if ([1, 4, 7].includes(day.dayIndex)) {
        expect(categories).toContain('selbstvorstellung');
      } else {
        expect(categories).not.toContain('selbstvorstellung');
      }
    });

    const selbstCount = schedule.days
      .flatMap((d) => d.activities)
      .filter((a) => a.category === 'selbstvorstellung').length;
    expect(selbstCount).toBe(3);
  });

  it('confirmed plan uses only b1wp library IDs', () => {
    const plan = buildB1CoachWeeklyPlan(fullSelections());
    expect(plan.planKind).toBe('b1-weekly-plan-v1');
    expect(plan.level).toBe('B1');
    const taskIds = plan.plans.flatMap((p) => p.exercises.map((e) => e.taskId));
    taskIds.forEach((id) => expect(id).toMatch(/^b1wp-/));
  });
});

describe('Weekly Plan analytics', () => {
  let storage;

  beforeEach(() => {
    storage = memoryStorage();
    globalThis.localStorage = storage;
  });

  afterEach(() => {
    storage.removeItem(WEEKLY_PLAN_ANALYTICS_KEY);
  });

  it('records events without transcript content', () => {
    recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_SELECTED, {
      selectedTrainingLevel: 'B1',
      transcript: 'should be stripped',
      placementLevel: 'B1',
    });
    const events = getWeeklyPlanAnalyticsEvents(storage);
    expect(events[0].eventName).toBe('b1_selected');
    expect(events[0].transcript).toBeUndefined();
    expect(events[0].placementLevel).toBe('B1');
  });
});

describe('A2 setup screen wiring', () => {
  it('still routes A2 through createCoachWeeklyPlan without B1 planKind', () => {
    const setup = require('fs').readFileSync('src/app/screens/WeeklyPlanSetupScreen.jsx', 'utf8');
    expect(setup).toMatch(/createCoachWeeklyPlan\(\{ level: 'A2'/);
    expect(setup).toMatch(/b1WeeklyPlanSetup/);
    expect(setup).not.toMatch(/createCoachWeeklyPlan\(\{ level: 'B1'/);
  });
});
