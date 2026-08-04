/**
 * B1 Weekly Training AI category capability registry.
 * Turn = interactive coach during exercise. Complete = disabled (no per-exercise reports).
 * Final Daily Report uses /days/complete only.
 * @module weekly-training-ai/core/categoryCapabilities
 */

import { AppError } from "../../middleware/errorHandler.js";

/** @type {Record<'selbstvorstellung'|'schreiben'|'hoeren'|'bildbeschreibung'|'planung', boolean>} */
export const B1_CATEGORY_TURN_CAPABILITIES = Object.freeze({
  selbstvorstellung: true,
  schreiben: false,
  hoeren: false,
  bildbeschreibung: true,
  planung: true,
});

/** Per-exercise session complete is disabled — correction happens in Final Daily Report only. */
export const B1_CATEGORY_COMPLETE_CAPABILITIES = Object.freeze({
  selbstvorstellung: false,
  schreiben: false,
  hoeren: false,
  bildbeschreibung: false,
  planung: false,
});

/** @deprecated Use B1_CATEGORY_TURN_CAPABILITIES / B1_CATEGORY_COMPLETE_CAPABILITIES */
export const B1_CATEGORY_AI_CAPABILITIES = B1_CATEGORY_TURN_CAPABILITIES;

/**
 * @param {string} category
 */
export function isCategoryTurnImplemented(category) {
  return Boolean(B1_CATEGORY_TURN_CAPABILITIES[category]);
}

/**
 * @param {string} category
 */
export function isCategoryCompleteImplemented(category) {
  return Boolean(B1_CATEGORY_COMPLETE_CAPABILITIES[category]);
}

/**
 * @param {string} category
 */
export function isInteractiveCoachCategory(category) {
  return ["selbstvorstellung", "bildbeschreibung", "planung"].includes(category);
}

/**
 * @param {string} category
 */
export function assertCategoryTurnImplemented(category) {
  if (!isCategoryTurnImplemented(category)) {
    throw new AppError(
      "NOT_IMPLEMENTED",
      `B1 Weekly Training AI für Kategorie "${category}" ist noch nicht implementiert.`,
      501
    );
  }
}

/**
 * @param {string} category
 */
export function assertCategoryCompleteImplemented(category) {
  if (!isCategoryCompleteImplemented(category)) {
    throw new AppError(
      "NOT_IMPLEMENTED",
      `B1 Weekly Training AI Abschluss für Kategorie "${category}" ist noch nicht implementiert.`,
      501
    );
  }
}
