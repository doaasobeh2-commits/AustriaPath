/**
 * Admin-only Weekly Plan QA access — subscription gate bypass, no subscription mutation.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { isAdminAccount } from '../src/config/authConfig.js';
import {
  canAccessWeeklyPlanAdminQa,
  disableAdminQaMode,
  enableAdminQaMode,
  getWeeklyPlanAdminQaAccessibleLevels,
  resolveWeeklyPlanSubscriptionGate,
} from '../src/utils/adminQaMode.js';
import { resolveWeeklyPlanLevelChoices } from '../src/data/utils/weeklyPlanLevelSelection.js';
import { createEmptyB1SetupDraft } from '../src/data/utils/b1WeeklyPlanSetupState.js';
import { B1_WEEKLY_PLAN_SETUP_DRAFT_KEY } from '../src/constants/storageKeys.js';

const admin = { role: 'admin', status: 'approved', email: 'admin@example.com' };
const learner = { role: 'student', status: 'approved', level: 'A2' };
const weeklyPlanCard = { type: 'weekly_plan', id: 'weekly_plan' };

describe('canAccessWeeklyPlanAdminQa', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('uses isAdminAccount plus Learner QA preview flag', () => {
    expect(isAdminAccount(admin)).toBe(true);
    expect(canAccessWeeklyPlanAdminQa(admin)).toBe(false);
    enableAdminQaMode();
    expect(canAccessWeeklyPlanAdminQa(admin)).toBe(true);
    disableAdminQaMode();
    expect(canAccessWeeklyPlanAdminQa(admin)).toBe(false);
  });

  it('is false for normal learners even with preview flag', () => {
    enableAdminQaMode();
    expect(canAccessWeeklyPlanAdminQa(learner)).toBe(false);
  });
});

describe('resolveWeeklyPlanSubscriptionGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('lets admin QA bypass Weekly Plan Coming Soon', () => {
    enableAdminQaMode();
    expect(resolveWeeklyPlanSubscriptionGate(admin, weeklyPlanCard)).toBe(
      'open_weekly_plan_setup'
    );
  });

  it('keeps normal users on Coming Soon', () => {
    expect(resolveWeeklyPlanSubscriptionGate(learner, weeklyPlanCard)).toBe('coming_soon');
    enableAdminQaMode();
    expect(resolveWeeklyPlanSubscriptionGate(learner, weeklyPlanCard)).toBe('coming_soon');
  });

  it('ignores non-weekly-plan cards', () => {
    enableAdminQaMode();
    expect(resolveWeeklyPlanSubscriptionGate(admin, { type: 'ai_exam' })).toBeNull();
  });
});

describe('admin QA does not modify subscription state', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'austriaPathSubscription',
      JSON.stringify({ plan: 'none', active: false })
    );
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('leaves austriaPathSubscription unchanged when enabling QA access', () => {
    const before = localStorage.getItem('austriaPathSubscription');
    enableAdminQaMode();
    expect(canAccessWeeklyPlanAdminQa(admin)).toBe(true);
    expect(localStorage.getItem('austriaPathSubscription')).toBe(before);
    expect(JSON.parse(localStorage.getItem('austriaPathSubscription'))).toEqual({
      plan: 'none',
      active: false,
    });
  });
});

describe('admin Weekly Plan setup levels', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('unlocks A2 and B1 for admin QA', () => {
    enableAdminQaMode();
    expect(getWeeklyPlanAdminQaAccessibleLevels(admin)).toEqual(['A2', 'B1']);
  });

  it('keeps B2 Coming Soon and does not lock admin to placement recommendation', () => {
    enableAdminQaMode();
    const levels = getWeeklyPlanAdminQaAccessibleLevels(admin);
    const { choices } = resolveWeeklyPlanLevelChoices({
      placementProfile: { level: 'A2', recommendedFocus: ['hoeren'] },
      accessibleLevels: levels,
    });

    const a2 = choices.find((c) => c.level === 'A2');
    const b1 = choices.find((c) => c.level === 'B1');
    const b2 = choices.find((c) => c.level === 'B2');

    expect(a2.selectable).toBe(true);
    expect(b1.selectable).toBe(true);
    expect(b2.status).toBe('coming_soon');
    expect(b2.selectable).toBe(false);
  });

  it('supports B1 setup draft without touching active weekly plan storage', () => {
    enableAdminQaMode();
    const activePlan = { version: 'coach-v1', level: 'A2', plans: [] };
    localStorage.setItem('austriaPathWeeklyPlan', JSON.stringify(activePlan));

    const draft = createEmptyB1SetupDraft({ placementLevel: 'B1', placementFocus: ['hoeren'] });
    localStorage.setItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY, JSON.stringify(draft));

    expect(JSON.parse(localStorage.getItem('austriaPathWeeklyPlan'))).toEqual(activePlan);
    expect(JSON.parse(localStorage.getItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY)).trainingLevel).toBe('B1');
  });
});

describe('normal learner weekly plan level policy unchanged', () => {
  it('A2 learner cannot select B1 without admin QA', () => {
    const { choices } = resolveWeeklyPlanLevelChoices({
      placementProfile: null,
      accessibleLevels: ['A2'],
    });
    expect(choices.find((c) => c.level === 'A2').selectable).toBe(true);
    expect(choices.find((c) => c.level === 'B1').selectable).toBe(false);
  });
});
