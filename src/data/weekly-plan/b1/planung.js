import { b1PlanningModels } from '../../modelsb1.js';
import { B1_WEEKLY_PLAN_ID_PREFIX, B1_WEEKLY_PLAN_MODEL_VERSION } from './metadata.js';

/**
 * Approved B1 planning models for dedicated Weekly Plan library.
 * Source: src/data/modelsb1.js → b1PlanningModels (8 models)
 */
function buildPlanungCatalog() {
  return b1PlanningModels.map((model) => ({
    id: `${B1_WEEKLY_PLAN_ID_PREFIX}-planung-${model.id.replace('b1-plan-', '')}`,
    modelVersion: B1_WEEKLY_PLAN_MODEL_VERSION,
    level: 'B1',
    title: model.title,
    description: model.situation,
    shortDescription: model.situation,
    category: 'planung',
    scenario: model.situation,
    requiredDiscussionPoints: model.points || [],
    examinerPrompts: model.dialog || [],
    semanticCoverageDefinitions: Object.fromEntries(
      (model.points || []).map((point, index) => [`point_${index + 1}`, [point.toLowerCase()]])
    ),
    followUpBranches: model.dialog || [],
    maxConversationTurns: 12,
    words: model.words || [],
    verbs: model.verbs || [],
    sentences: model.sentences || [],
    grammar: model.grammar || [],
    tip: model.tip || '',
    source: {
      file: 'src/data/modelsb1.js',
      sourceId: model.id,
    },
  }));
}

export const b1WeeklyPlanPlanungCatalog = Object.freeze(buildPlanungCatalog());

export const b1WeeklyPlanPlanungApprovedCount = b1WeeklyPlanPlanungCatalog.length;
