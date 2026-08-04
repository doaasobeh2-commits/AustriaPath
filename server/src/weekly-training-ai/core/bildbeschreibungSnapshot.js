/**
 * Bildbeschreibung model_snapshot freeze — coverage points internal only.
 * @module weekly-training-ai/core/bildbeschreibungSnapshot
 */

import { buildCoveragePoints } from "../../../../src/data/utils/b1CoveragePoints.js";

function freezeValue(value) {
  return structuredClone(value);
}

export const B1_BILD_LEARNER_TASK_PROMPT = "Bitte beschreiben Sie das Bild.";

/**
 * @param {object} model
 */
export function freezeBildbeschreibungCatalogModel(model) {
  const coveragePoints = buildCoveragePoints(model.semanticCoveragePoints || model.taskPrompts || []);

  const modelSnapshot = {
    id: model.id,
    modelVersion: model.modelVersion,
    trainingLevel: "B1",
    category: "bildbeschreibung",
    title: model.title,
    imageId: model.source?.sourceId || model.id,
    imageAsset: model.imageAsset,
    learnerTaskPrompt: B1_BILD_LEARNER_TASK_PROMPT,
    coveragePoints,
    followUpQuestionPool: freezeValue(model.followUpQuestionPool || {}),
    maxFollowUpQuestions: Number(model.maxFollowUpQuestions) || 2,
  };

  return {
    modelId: model.id,
    modelVersion: Number(model.modelVersion),
    modelSnapshot,
  };
}

/**
 * @param {object} snapshot
 */
export function extractBildbeschreibungLearnerTask(snapshot) {
  if (!snapshot || snapshot.category !== "bildbeschreibung") return null;
  return {
    imageId: snapshot.imageId,
    imageAsset: snapshot.imageAsset,
    title: snapshot.title,
    taskPrompt: snapshot.learnerTaskPrompt || B1_BILD_LEARNER_TASK_PROMPT,
  };
}
