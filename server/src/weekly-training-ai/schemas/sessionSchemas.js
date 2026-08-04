/**
 * Request validation schemas for B1 Weekly Training AI routes.
 * @module weekly-training-ai/schemas
 */

import { B1_WEEKLY_PLAN_CATEGORIES } from "../../../../src/data/weekly-plan/b1/metadata.js";
import { AppError } from "../../middleware/errorHandler.js";
import { B1_WEEKLY_TRAINING_LEVEL } from "../core/config.js";

const CATEGORY_SET = new Set(B1_WEEKLY_PLAN_CATEGORIES);

/**
 * @param {object} body
 */
export function validateSessionStartBody(body = {}) {
  const trainingLevel = String(body.trainingLevel || "").trim().toUpperCase();
  const category = String(body.category || "").trim().toLowerCase();
  const modelId = String(body.modelId || "").trim();
  const planHash = body.planHash ? String(body.planHash).trim() : null;
  const planIndex = Number(body.planIndex);
  const exerciseSlot = Number(body.exerciseSlot);
  const selectedEmailIndex =
    body.selectedEmailIndex !== undefined && body.selectedEmailIndex !== null
      ? Number(body.selectedEmailIndex)
      : null;

  if (trainingLevel !== B1_WEEKLY_TRAINING_LEVEL) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Nur B1-Trainingssitzungen werden unterstützt.",
      400
    );
  }
  if (!CATEGORY_SET.has(category)) {
    throw new AppError("VALIDATION_ERROR", "category ist ungültig.", 400);
  }
  if (!modelId.startsWith("b1wp-")) {
    throw new AppError("VALIDATION_ERROR", "modelId ist ungültig.", 400);
  }
  if (!Number.isInteger(planIndex) || planIndex < 1) {
    throw new AppError("VALIDATION_ERROR", "planIndex ist ungültig.", 400);
  }
  if (!Number.isInteger(exerciseSlot) || exerciseSlot < 1) {
    throw new AppError("VALIDATION_ERROR", "exerciseSlot ist ungültig.", 400);
  }
  if (
    category === "schreiben" &&
    selectedEmailIndex !== null &&
    (!Number.isInteger(selectedEmailIndex) || selectedEmailIndex < 1)
  ) {
    throw new AppError("VALIDATION_ERROR", "selectedEmailIndex ist ungültig.", 400);
  }

  return {
    trainingLevel,
    category,
    modelId,
    planHash,
    planIndex,
    exerciseSlot,
    selectedEmailIndex,
  };
}

/**
 * @param {object} body
 */
export function validateSessionTurnBody(body = {}) {
  const learnerMessage = body.learnerMessage !== undefined ? String(body.learnerMessage) : "";
  return { learnerMessage };
}

/**
 * @param {object} body
 */
export function validateSessionMemoryBody(body = {}) {
  const memory = body.memory && typeof body.memory === "object" ? body.memory : null;
  if (!memory) {
    throw new AppError("VALIDATION_ERROR", "memory ist erforderlich.", 400);
  }
  return { memory };
}

/**
 * @param {object} body
 */
export function validateSessionCompleteBody(_body = {}) {
  return {};
}

/**
 * @param {object} body
 */
export function validateDayCompleteBody(body = {}) {
  const planIndex = Number(body.planIndex);
  const planHash = body.planHash ? String(body.planHash).trim() : null;
  const trainingMemories = Array.isArray(body.trainingMemories) ? body.trainingMemories : [];

  if (!Number.isInteger(planIndex) || planIndex < 1) {
    throw new AppError("VALIDATION_ERROR", "planIndex ist ungültig.", 400);
  }
  if (!trainingMemories.length) {
    throw new AppError("VALIDATION_ERROR", "trainingMemories ist erforderlich.", 400);
  }

  return { planIndex, planHash, trainingMemories };
}
