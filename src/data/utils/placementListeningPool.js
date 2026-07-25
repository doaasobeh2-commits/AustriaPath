/**
 * Placement-only listening rotation.
 * Selects exactly one existing listening model for the routed CEFR level.
 * The caller stores the returned model as the session's currentModel, making
 * the selection sticky for the complete Hören stage.
 */

import { getPlacementModel } from "../aiPlacementLibrary.js";

/** All registered IDs — models remain in the library even when not live-routable. */
export const PLACEMENT_LISTENING_POOLS = Object.freeze({
  A2: Object.freeze([
    "placement_listening_02",
    "placement_listening_04",
    "placement_listening_10",
    "placement_listening_a2_support",
  ]),
  B1: Object.freeze([
    "placement_listening_b1_bridge",
    "placement_listening_06",
    "placement_listening_11",
    "placement_listening_12",
    "placement_listening_14",
  ]),
  B2: Object.freeze([
    "b2_hoeren_buerotermin",
    "b2_hoeren_bewerbung",
    "b2_hoeren_digitalisierung",
  ]),
});

const DIFFICULTY_ORDER = ["leicht", "bridge", "mittel", "stark"];

export function isPlacementListeningLiveModel(model) {
  if (!model || model.service !== "placement" || model.skill !== "hoeren") {
    return false;
  }
  if (model.liveAvailable === false) return false;
  if (!model.audioText) return false;
  const hasAudio = Boolean(model.audioUrl);
  const allowsTtsBridge =
    model.placementTier === "bridge" ||
    model.placementTier === "support" ||
    model.difficulty === "bridge";
  if (!hasAudio && !allowsTtsBridge) return false;
  const questions = model.listeningQuestions || [];
  return questions.length >= 2 && questions.length <= 4;
}

export function listPlacementListeningModels(level, options = {}) {
  const includeOffline = Boolean(options.includeOffline);
  return (PLACEMENT_LISTENING_POOLS[level] || [])
    .map((id) => getPlacementModel(id))
    .filter((model) => {
      if (!model) return false;
      if (includeOffline) {
        return (
          model.service === "placement" &&
          model.skill === "hoeren" &&
          model.level === level &&
          model.audioText &&
          Array.isArray(model.listeningQuestions) &&
          model.listeningQuestions.length >= 2 &&
          model.listeningQuestions.length <= 4
        );
      }
      if (!isPlacementListeningLiveModel(model) || model.level !== level) return false;
      // Stark A2 medical clip stays in the library but is only live-routable on explicit stark routing.
      if (
        level === "A2" &&
        model.id === "placement_listening_02" &&
        !options.includeStarkA2
      ) {
        return false;
      }
      return true;
    });
}

function filterByRequestedDifficulty(models, requestedDifficulty, step = {}) {
  if (!models.length) return models;
  const requestedRank = DIFFICULTY_ORDER.indexOf(requestedDifficulty);
  if (requestedRank < 0) return models;

  if (requestedDifficulty === "bridge") {
    const bridge = models.filter(
      (model) => model.difficulty === "bridge" || model.placementTier === "bridge"
    );
    if (bridge.length) return bridge;
  }

  if (requestedDifficulty === "leicht") {
    const light = models.filter(
      (model) =>
        model.difficulty === "leicht" || model.placementTier === "support"
    );
    if (light.length) return light;
  }

  if (requestedDifficulty === "mittel") {
    const medium = models.filter((model) => model.difficulty === "mittel");
    if (medium.length) return medium;
  }

  const available = [...new Set(models.map((model) => model.difficulty))];
  available.sort((a, b) => {
    const distance =
      Math.abs(DIFFICULTY_ORDER.indexOf(a) - requestedRank) -
      Math.abs(DIFFICULTY_ORDER.indexOf(b) - requestedRank);
    return distance || DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b);
  });
  const chosenDifficulty = available[0];
  return models.filter((model) => model.difficulty === chosenDifficulty);
}

export function selectPlacementListeningModel(step, options = {}) {
  const level = step?.level;
  const requestedDifficulty = step?.difficulty;
  let models = listPlacementListeningModels(level, {
    includeStarkA2: requestedDifficulty === "stark",
  });
  if (!models.length) return null;

  models = filterByRequestedDifficulty(models, requestedDifficulty, step);

  if (level === "A2" && requestedDifficulty !== "stark") {
    models = models.filter((model) => model.id !== "placement_listening_02");
  }

  if (level === "B1" && (step?.b1Entry || requestedDifficulty === "bridge")) {
    const bridge = models.filter((model) => model.id === "placement_listening_b1_bridge");
    if (bridge.length) models = bridge;
  } else if (level === "B1" && requestedDifficulty === "mittel" && !options?.b1Stable) {
    models = models.filter((model) => model.id !== "placement_listening_b1_bridge");
  }

  const recentIds = Array.isArray(options.recentIds) ? options.recentIds : [];
  const unseen = models.filter((model) => !recentIds.includes(model.id));
  if (unseen.length) {
    models = unseen;
  } else if (recentIds.length) {
    const recency = models.map((model) => ({
      model,
      mostRecentIndex: recentIds.indexOf(model.id),
    }));
    const oldestIndex = Math.max(...recency.map((item) => item.mostRecentIndex));
    models = recency
      .filter((item) => item.mostRecentIndex === oldestIndex)
      .map((item) => item.model);
  }

  const random =
    typeof options.random === "function" ? options.random() : Math.random();
  const index = Math.min(
    models.length - 1,
    Math.max(0, Math.floor(random * models.length))
  );
  return models[index];
}
