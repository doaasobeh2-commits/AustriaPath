/**
 * Placement-only listening rotation.
 * Selects exactly one existing listening model for the routed CEFR level.
 * The caller stores the returned model as the session's currentModel, making
 * the selection sticky for the complete Hören stage.
 */

import { getPlacementModel } from "../aiPlacementLibrary.js";

export const PLACEMENT_LISTENING_POOLS = Object.freeze({
  A2: Object.freeze([
    "a2_hoeren_mittel",
    "a2_hoeren_arzt_apotheke",
  ]),
  B1: Object.freeze([
    "b1_hoeren_supermarkt",
    "b1_hoeren_bahnhof",
    "b1_hoeren_arzttermin",
  ]),
  B2: Object.freeze([
    "b2_hoeren_buerotermin",
    "b2_hoeren_bewerbung",
    "b2_hoeren_digitalisierung",
  ]),
});

export function listPlacementListeningModels(level) {
  return (PLACEMENT_LISTENING_POOLS[level] || [])
    .map((id) => getPlacementModel(id))
    .filter(
      (model) =>
        model?.service === "placement" &&
        model.skill === "hoeren" &&
        model.level === level &&
        model.audioText &&
        Array.isArray(model.listeningQuestions) &&
        model.listeningQuestions.length >= 2 &&
        model.listeningQuestions.length <= 3
    );
}

export function selectPlacementListeningModel(step, options = {}) {
  const level = step?.level;
  const models = listPlacementListeningModels(level);
  if (!models.length) return null;

  const random =
    typeof options.random === "function" ? options.random() : Math.random();
  const index = Math.min(
    models.length - 1,
    Math.max(0, Math.floor(random * models.length))
  );
  return models[index];
}
