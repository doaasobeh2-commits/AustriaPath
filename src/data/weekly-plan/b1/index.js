import {
  B1_WEEKLY_PLAN_CATEGORIES,
  B1_WEEKLY_PLAN_LIBRARY_VERSION,
  B1_CATEGORY_LABELS,
  B1_SELECTION_COUNT_PER_CATEGORY,
} from './metadata.js';
import { b1WeeklyPlanSelbstvorstellungCatalog } from './selbstvorstellung.js';
import { b1WeeklyPlanSchreibenCatalog } from './schreiben.js';
import {
  b1WeeklyPlanHoerenCatalog,
  b1WeeklyPlanHoerenApprovedCount,
  b1WeeklyPlanHoerenSelectionBlocked,
} from './hoeren.js';
import { b1WeeklyPlanBildbeschreibungCatalog } from './bildbeschreibung.js';
import {
  b1WeeklyPlanPlanungCatalog,
  b1WeeklyPlanPlanungApprovedCount,
} from './planung.js';

const CATEGORY_CATALOGS = Object.freeze({
  selbstvorstellung: b1WeeklyPlanSelbstvorstellungCatalog,
  schreiben: b1WeeklyPlanSchreibenCatalog,
  hoeren: b1WeeklyPlanHoerenCatalog,
  bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog,
  planung: b1WeeklyPlanPlanungCatalog,
});

const APPROVED_SELECTABLE_CATALOGS = Object.freeze({
  schreiben: b1WeeklyPlanSchreibenCatalog,
  hoeren: b1WeeklyPlanHoerenCatalog.filter((m) => m.status === 'approved'),
  bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog,
  planung: b1WeeklyPlanPlanungCatalog,
});

/**
 * Future-facing examiner access — only resolves IDs from this dedicated library.
 * @param {'selbstvorstellung'|'schreiben'|'hoeren'|'bildbeschreibung'|'planung'} category
 * @param {string} modelId
 * @returns {object|null}
 */
export function getB1WeeklyPlanExaminerModel(category, modelId) {
  if (!B1_WEEKLY_PLAN_CATEGORIES.includes(category)) return null;
  const id = String(modelId || '').trim();
  if (!id.startsWith('b1wp-')) return null;
  const catalog = CATEGORY_CATALOGS[category];
  if (!catalog) return null;
  return catalog.find((model) => model.id === id) || null;
}

export { resolveB1WeeklyPlanModel, generateB1WeeklyPlanSchedule, buildB1CoachWeeklyPlan } from './planGeneration.js';

export function getB1WeeklyPlanCatalog(category) {
  return CATEGORY_CATALOGS[category] || [];
}

export function getB1WeeklyPlanSelectableCatalog(category) {
  return APPROVED_SELECTABLE_CATALOGS[category] || [];
}

export function getB1WeeklyPlanLibrarySummary() {
  return {
    version: B1_WEEKLY_PLAN_LIBRARY_VERSION,
    counts: {
      selbstvorstellung: b1WeeklyPlanSelbstvorstellungCatalog.length,
      schreiben: b1WeeklyPlanSchreibenCatalog.length,
      hoeren: {
        approved: b1WeeklyPlanHoerenApprovedCount,
        placeholders: b1WeeklyPlanHoerenCatalog.length - b1WeeklyPlanHoerenApprovedCount,
        total: b1WeeklyPlanHoerenCatalog.length,
      },
      bildbeschreibung: b1WeeklyPlanBildbeschreibungCatalog.length,
      planung: b1WeeklyPlanPlanungApprovedCount,
    },
    blockers: {
      hoeren: b1WeeklyPlanHoerenSelectionBlocked
        ? `Only ${b1WeeklyPlanHoerenApprovedCount} approved Hören models; 7 required for learner selection.`
        : null,
      planung:
        b1WeeklyPlanPlanungApprovedCount < 7
          ? `Only ${b1WeeklyPlanPlanungApprovedCount} approved Planung models; 7 required.`
          : null,
    },
  };
}

export {
  B1_WEEKLY_PLAN_LIBRARY_VERSION,
  B1_CATEGORY_LABELS,
  B1_SELECTION_COUNT_PER_CATEGORY,
  b1WeeklyPlanSelbstvorstellungCatalog,
  b1WeeklyPlanSchreibenCatalog,
  b1WeeklyPlanHoerenCatalog,
  b1WeeklyPlanBildbeschreibungCatalog,
  b1WeeklyPlanPlanungCatalog,
  b1WeeklyPlanHoerenApprovedCount,
  b1WeeklyPlanHoerenSelectionBlocked,
  b1WeeklyPlanPlanungApprovedCount,
};
