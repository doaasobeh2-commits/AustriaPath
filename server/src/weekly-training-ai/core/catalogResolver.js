/**
 * B1 catalog resolution for session start only.
 * After start, sessions must use frozen model_snapshot exclusively.
 * @module weekly-training-ai/core/catalogResolver
 */

import { resolveB1WeeklyPlanModel } from "../../../../src/data/weekly-plan/b1/planGeneration.js";
import { AppError } from "../../middleware/errorHandler.js";
import { freezeSchreibenCatalogModel } from "./schreibenSnapshot.js";
import {
  freezeBildbeschreibungCatalogModel,
} from "./bildbeschreibungSnapshot.js";

/**
 * Deep-freeze clone for model_snapshot persistence.
 * @param {unknown} value
 */
export function freezeCatalogSnapshot(value) {
  return structuredClone(value);
}

/**
 * Resolve and freeze a B1 catalog model at session start.
 * @param {string} category
 * @param {string} modelId
 * @param {{ planIndex?: number, exerciseSlot?: number, selectedEmailIndex?: number }} [context]
 */
export function resolveAndFreezeB1CatalogModel(category, modelId, context = {}) {
  const model = resolveB1WeeklyPlanModel(category, modelId);
  if (!model) {
    throw new AppError(
      "VALIDATION_ERROR",
      "category und modelId passen nicht zum B1-Katalog.",
      400
    );
  }

  const modelVersion = Number(model.modelVersion);
  if (!Number.isInteger(modelVersion) || modelVersion < 1) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Katalogmodell hat keine gültige modelVersion.",
      500
    );
  }

  if (String(model.id) !== String(modelId)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "category und modelId passen nicht zum B1-Katalog.",
      400
    );
  }

  if (category === "schreiben") {
    return freezeSchreibenCatalogModel(model, context);
  }

  if (category === "bildbeschreibung") {
    return freezeBildbeschreibungCatalogModel(model);
  }

  return {
    modelId: model.id,
    modelVersion,
    modelSnapshot: freezeCatalogSnapshot(model),
  };
}

/**
 * Guard against live catalog reload after session start.
 * @param {object} session
 */
export function assertSessionUsesFrozenSnapshot(session) {
  if (!session?.modelSnapshot || typeof session.modelSnapshot !== "object") {
    throw new AppError("SESSION_NOT_ACTIVE", "Modell-Snapshot fehlt.", 409);
  }
  return session.modelSnapshot;
}
