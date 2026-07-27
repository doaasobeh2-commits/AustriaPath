import { b1Images } from '../../b1Images.js';
import { B1_WEEKLY_PLAN_ID_PREFIX, B1_WEEKLY_PLAN_MODEL_VERSION } from './metadata.js';

/**
 * Approved B1 image models for dedicated Weekly Plan library.
 * Source: src/data/b1Images.js (20 images)
 */
function buildBildbeschreibungCatalog() {
  return b1Images.map((image) => ({
    id: `${B1_WEEKLY_PLAN_ID_PREFIX}-bild-${String(image.id).padStart(3, '0')}`,
    modelVersion: B1_WEEKLY_PLAN_MODEL_VERSION,
    level: 'B1',
    title: image.title,
    description: image.description,
    shortDescription: image.task?.[0] || image.title,
    category: 'bildbeschreibung',
    imageAsset: image.image,
    taskPrompts: image.task || [],
    descriptionPoints: [image.description].filter(Boolean),
    semanticCoveragePoints: [
      ...(image.task || []),
      image.personalOpinion,
      image.ownExperience,
      image.homeland,
    ].filter(Boolean),
    followUpQuestionPool: {
      opinion: [image.personalOpinion].filter(Boolean),
      personalExperience: [image.ownExperience].filter(Boolean),
      homelandComparison: [image.homeland].filter(Boolean),
      general: image.task || [],
    },
    maxFollowUpQuestions: 2,
    words: image.words || [],
    verbs: image.verbs || [],
    grammar: image.grammar || [],
    tip: image.tip || '',
    source: {
      file: 'src/data/b1Images.js',
      sourceId: String(image.id),
    },
  }));
}

export const b1WeeklyPlanBildbeschreibungCatalog = Object.freeze(buildBildbeschreibungCatalog());
