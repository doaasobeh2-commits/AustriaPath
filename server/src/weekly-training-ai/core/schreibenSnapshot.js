/**
 * Schreiben model_snapshot freeze — single selected email authority.
 * @module weekly-training-ai/core/schreibenSnapshot
 */

import {
  B1_SCHREIBEN_DEFAULT_MIN_LENGTH,
  buildSchreibenRequiredPoints,
  parseB1SchreibenTaskLines,
  resolveDeterministicSchreibenEmailIndex,
} from "../../../../src/data/utils/b1SchreibenTaskParser.js";
import { AppError } from "../../middleware/errorHandler.js";

function freezeValue(value) {
  return structuredClone(value);
}

/**
 * @param {object} model
 * @param {{ planIndex?: number, exerciseSlot?: number, selectedEmailIndex?: number }} context
 */
export function freezeSchreibenCatalogModel(model, context = {}) {
  const planIndex = Number(context.planIndex) || 1;
  const exerciseSlot = Number(context.exerciseSlot) || 1;
  const emails = model.emails || [];
  const deterministicIndex = resolveDeterministicSchreibenEmailIndex(emails, planIndex, exerciseSlot);

  if (!deterministicIndex) {
    throw new AppError("VALIDATION_ERROR", "Schreiben-Modell enthält keine E-Mail-Aufgabe.", 400);
  }

  const requestedIndex =
    Number(context.selectedEmailIndex) > 0
      ? Number(context.selectedEmailIndex)
      : deterministicIndex;

  if (requestedIndex !== deterministicIndex) {
    throw new AppError(
      "VALIDATION_ERROR",
      "selectedEmailIndex stimmt nicht mit der deterministischen Aufgabenauswahl überein.",
      400
    );
  }

  const selectedEmail = emails.find((email) => Number(email.emailIndex) === requestedIndex);
  if (!selectedEmail) {
    throw new AppError("VALIDATION_ERROR", "selectedEmailIndex ist ungültig.", 400);
  }

  const parsed = parseB1SchreibenTaskLines(selectedEmail.task || []);
  const requiredPoints = buildSchreibenRequiredPoints(parsed.taskPoints);
  const minimumLength = B1_SCHREIBEN_DEFAULT_MIN_LENGTH;

  const modelSnapshot = {
    id: model.id,
    modelVersion: model.modelVersion,
    trainingLevel: "B1",
    category: "schreiben",
    title: model.title,
    selectedEmailIndex: requestedIndex,
    minimumLength,
    selectedEmail: freezeValue(selectedEmail),
    writingTask: {
      emailTitle: String(selectedEmail.title || "").trim(),
      scenario: parsed.scenario,
      recipient: parsed.recipient,
      requiredPoints,
      minimumLength,
      originalTaskLines: freezeValue(selectedEmail.task || []),
    },
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
export function extractSchreibenWritingTask(snapshot) {
  if (!snapshot?.writingTask) return null;
  return {
    selectedEmailIndex: snapshot.selectedEmailIndex,
    emailTitle: snapshot.writingTask.emailTitle,
    scenario: snapshot.writingTask.scenario,
    recipient: snapshot.writingTask.recipient,
    taskPoints: (snapshot.writingTask.requiredPoints || []).map((point) => point.text),
    requiredPoints: snapshot.writingTask.requiredPoints || [],
    minimumLength: snapshot.writingTask.minimumLength || B1_SCHREIBEN_DEFAULT_MIN_LENGTH,
  };
}
