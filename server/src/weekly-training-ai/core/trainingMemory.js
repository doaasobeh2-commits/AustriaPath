/**
 * Training memory validation — per-exercise storage, no correction at save time.
 * @module weekly-training-ai/core/trainingMemory
 */

import { AppError } from "../../middleware/errorHandler.js";

/**
 * @param {object} memory
 * @param {string} category
 */
export function validateTrainingMemory(memory = {}, category) {
  if (!memory || typeof memory !== "object") {
    throw new AppError("VALIDATION_ERROR", "trainingMemory ist erforderlich.", 400);
  }

  if (category === "schreiben") {
    const email = String(memory.originalEmail || memory.learnerEmail || "").trim();
    if (!email) {
      throw new AppError("VALIDATION_ERROR", "originalEmail ist erforderlich.", 400);
    }
    return { ...memory, category: "schreiben", originalEmail: email };
  }

  if (category === "hoeren") {
    return { ...memory, category: "hoeren" };
  }

  if (["bildbeschreibung", "planung", "selbstvorstellung"].includes(category)) {
    return { ...memory, category };
  }

  return { ...memory, category };
}

/**
 * @param {object} session
 */
export function appendTrainingMemory(session, memory) {
  const existing = Array.isArray(session.trainingMemory)
    ? session.trainingMemory
    : session.trainingMemory
      ? [session.trainingMemory]
      : [];

  return [...existing, { ...memory, savedAt: new Date().toISOString() }];
}
