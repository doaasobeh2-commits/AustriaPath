import {
  B1_SELECTION_COUNT_PER_CATEGORY,
  B1_WEEKLY_PLAN_LIBRARY_VERSION,
} from '../weekly-plan/b1/metadata.js';
import {
  b1WeeklyPlanHoerenSelectionBlocked,
  getB1WeeklyPlanSelectableCatalog,
} from '../weekly-plan/b1/index.js';
import { B1_WEEKLY_PLAN_SETUP_DRAFT_KEY } from '../../constants/storageKeys.js';

export const B1_SETUP_SCHEMA_VERSION = 'b1-setup-draft-v1';

const SELECTABLE_CATEGORIES = ['schreiben', 'hoeren', 'bildbeschreibung', 'planung'];

/**
 * @returns {import('../weekly-plan/b1/planGeneration.js').B1WeeklyPlanSelections & {
 *   schemaVersion: string;
 *   step: string;
 *   trainingLevel: string;
 *   placementLevel: string|null;
 *   placementFocus: string[];
 *   updatedAt: string;
 * }}
 */
export function createEmptyB1SetupDraft({
  placementLevel = null,
  placementFocus = [],
} = {}) {
  return {
    schemaVersion: B1_SETUP_SCHEMA_VERSION,
    libraryVersion: B1_WEEKLY_PLAN_LIBRARY_VERSION,
    step: 'selection',
    trainingLevel: 'B1',
    placementLevel,
    placementFocus,
    schreiben: [],
    hoeren: [],
    bildbeschreibung: [],
    planung: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadB1SetupDraft(storage = localStorage) {
  try {
    const raw = storage.getItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== B1_SETUP_SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveB1SetupDraft(draft, storage = localStorage) {
  try {
    const payload = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearB1SetupDraft(storage = localStorage) {
  try {
    storage.removeItem(B1_WEEKLY_PLAN_SETUP_DRAFT_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {string} category
 * @param {string[]} selectedIds
 * @param {string} modelId
 */
export function toggleB1ModelSelection(category, selectedIds, modelId) {
  const list = [...selectedIds];
  const index = list.indexOf(modelId);
  if (index >= 0) {
    list.splice(index, 1);
    return list;
  }
  if (list.length >= B1_SELECTION_COUNT_PER_CATEGORY) return list;
  list.push(modelId);
  return list;
}

export function getB1CategorySelectionCount(draft, category) {
  return draft?.[category]?.length || 0;
}

export function getB1CategoryBlocker(category) {
  if (category === 'hoeren' && b1WeeklyPlanHoerenSelectionBlocked) {
    const approved = getB1WeeklyPlanSelectableCatalog('hoeren').length;
    return `Nur ${approved} genehmigte Hören-Modelle verfügbar — 7 erforderlich. Audio- und Inhaltsfreigabe ausstehend.`;
  }
  return null;
}

export function isB1SetupSelectionComplete(draft) {
  if (!draft) return false;
  for (const category of SELECTABLE_CATEGORIES) {
    const blocker = getB1CategoryBlocker(category);
    if (blocker) return false;
    if ((draft[category]?.length || 0) !== B1_SELECTION_COUNT_PER_CATEGORY) return false;
  }
  return true;
}

export function getB1SetupSelectionSummary(draft) {
  return SELECTABLE_CATEGORIES.reduce((acc, category) => {
    acc[category] = {
      selected: getB1CategorySelectionCount(draft, category),
      required: B1_SELECTION_COUNT_PER_CATEGORY,
      blocker: getB1CategoryBlocker(category),
    };
    return acc;
  }, {});
}
