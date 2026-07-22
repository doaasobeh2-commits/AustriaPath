/**
 * Historical Placement adaptive routing + weighted final scoring.
 * Restored from git (b16e10e → deleted 6d351d4) and kept faithful.
 *
 * PRODUCT DECISION (2026-07-21) — not historical — band → numeric:
 *   weak/schwach → 35, medium/mittel → 65, strong/stark → 100
 * Used only inside standalone Placement Test.
 */

import { getPlacementModel, getPlacementModelsBySkill } from "./aiPlacementLibrary.js";

export const placementStages = [
  "selbstvorstellung",
  "bildbeschreibung",
  "lesenHoeren",
  "planung",
];

export const placementWeights = {
  selbstvorstellung: 25,
  bildbeschreibung: 25,
  lesenHoeren: 20,
  planung: 30,
};

/** Documented product decision — Placement-only band → 0–100 */
export const PLACEMENT_BAND_TO_SCORE = Object.freeze({
  weak: 35,
  schwach: 35,
  medium: 65,
  mittel: 65,
  strong: 100,
  stark: 100,
});

/**
 * Explicit library resolve when historical routing asks for level+difficulty
 * that has no exact aiPlacementLibrary id. Do not invent models.
 *
 * Historical target → existing modelId (closest same level+skill):
 * - B1 bildbeschreibung leicht → b1_bild_mittel (no leicht variant)
 * Listening pool selection has its own same-level nearest-difficulty policy.
 * - A2 planung stark → a2_planung_mittel (no stark variant)
 * - B1 planung leicht → b1_planung_schwach (easier-than-mittel stands in for leicht)
 * Exact matches preferred when present (e.g. a2_bild_mittel, a2_bild_leicht).
 */
export const PLACEMENT_MODEL_FALLBACKS = Object.freeze({
  "bildbeschreibung|B1|leicht": "b1_bild_mittel",
  "planung|A2|stark": "a2_planung_mittel",
  "planung|B1|leicht": "b1_planung_schwach",
});

export function normalizePlacementBand(band) {
  const key = String(band || "")
    .toLowerCase()
    .trim();
  if (key === "schwach" || key === "weak") return "weak";
  if (key === "mittel" || key === "medium") return "medium";
  if (key === "stark" || key === "strong") return "strong";
  return null;
}

export function bandToPlacementScore(band) {
  const normalized = normalizePlacementBand(band);
  if (!normalized) return null;
  return PLACEMENT_BAND_TO_SCORE[normalized];
}

/**
 * Final skill band from all validated evaluations in the skill conversation.
 * Each turn contributes equally. Invalid/missing bands are ignored and an
 * entirely invalid evidence set fails closed with null.
 * @param {Array<{ band?: string, needsFollowUp?: boolean }>|undefined} evaluations
 */
export function getFinalBandFromTurnEvidence(evaluations = []) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) return null;
  const ranks = evaluations
    .map((item) => normalizePlacementBand(item?.band))
    .filter(Boolean)
    .map((band) => ({ weak: 0, medium: 1, strong: 2 })[band]);
  if (!ranks.length) return null;
  const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
  if (average < 0.5) return "weak";
  if (average < 1.5) return "medium";
  return "strong";
}

/** Objective listening result in the same band vocabulary as spoken skills. */
export function scorePlacementListeningAnswers(model, answers = {}) {
  const questions = Array.isArray(model?.listeningQuestions)
    ? model.listeningQuestions
    : [];
  if (!questions.length) return null;

  let correct = 0;
  const questionResults = questions.map((question) => {
    const selectedOption = answers[question.id] ?? null;
    const isCorrect = selectedOption === question.correctOption;
    if (isCorrect) correct += 1;
    return {
      questionId: question.id,
      question: question.question,
      selectedOption,
      isCorrect,
    };
  });
  const total = questions.length;
  const ratio = correct / total;
  const band = ratio >= 0.8 ? "strong" : ratio >= 0.5 ? "medium" : "weak";

  return { band, correct, total, ratio, questionResults };
}

export function getImageStepAfterSelfIntro(selfIntroResult, selectedStartLevel = "A2") {
  const band = normalizePlacementBand(selfIntroResult) || selfIntroResult;

  if (selectedStartLevel === "B2") {
    if (band === "weak") {
      return {
        skill: "bildbeschreibung",
        level: "B1",
        difficulty: "mittel",
        internalLevel: "B1",
        reason: "B2-Start schwach → eine Stufe tiefer zu B1 Bildbeschreibung",
      };
    }
    return {
      skill: "bildbeschreibung",
      level: "B2",
      difficulty: "mittel",
      internalLevel: band === "strong" ? "B2" : "B2-",
      reason: "B2-Start bestätigt → B2 Bildbeschreibung mittel",
    };
  }

  if (selectedStartLevel === "B1") {
    if (band === "weak") {
      return {
        skill: "bildbeschreibung",
        level: "A2",
        difficulty: "mittel",
        reason: "B1-Start schwach → A2 Bildbeschreibung mittel",
      };
    }
    return band === "strong" ? {
      skill: "bildbeschreibung",
      level: "B2",
      difficulty: "mittel",
      internalLevel: "B2-",
      reason: "B1-Start stark → B2 Bildbeschreibung mittel",
    } : {
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "mittel",
      reason: "B1-Start bestätigt → B1 Bildbeschreibung mittel",
    };
  }

  if (band === "weak" || selfIntroResult === "schwach") {
    return {
      skill: "bildbeschreibung",
      level: "A2",
      difficulty: "mittel",
      reason: "Selbstvorstellung schwach → A2 Bildbeschreibung mittel",
    };
  }

  if (band === "medium" || selfIntroResult === "mittel") {
    return {
      skill: "bildbeschreibung",
      level: "A2",
      difficulty: "mittel",
      reason: "Selbstvorstellung mittel → A2 Bildbeschreibung mittel",
    };
  }

  if (band === "strong" || selfIntroResult === "stark") {
    return {
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "leicht",
      internalLevel: "A2+/B1-",
      reason: "Selbstvorstellung stark → Übergang zu B1 Bildbeschreibung leicht",
    };
  }

  return {
    skill: "bildbeschreibung",
    level: "A2",
    difficulty: "leicht",
    reason: "Standardstart",
  };
}

export function getReadingListeningStep(
  selfIntroResult,
  imageResult,
  selectedStartLevel = "A2"
) {
  const selfBand = normalizePlacementBand(selfIntroResult) || selfIntroResult;
  const imageBand = normalizePlacementBand(imageResult) || imageResult;

  if (
    selectedStartLevel === "B2" &&
    selfBand !== "weak" &&
    imageBand !== "weak"
  ) {
    return {
      skill: "lesenHoeren",
      level: "B2",
      difficulty: "mittel",
      internalLevel: "B2-",
      reason: "Stabiler B2-Start → B2 Hören",
    };
  }

  if (
    selectedStartLevel === "B1" &&
    selfBand === "strong" &&
    imageBand === "strong"
  ) {
    return {
      skill: "lesenHoeren",
      level: "B2",
      difficulty: "mittel",
      internalLevel: "B2-",
      reason: "Sehr starke B1-Leistung → B2 Hören",
    };
  }

  if (
    selectedStartLevel === "B1" &&
    selfBand === "medium" &&
    imageBand === "medium"
  ) {
    return {
      skill: "lesenHoeren",
      level: "B1",
      difficulty: "mittel",
      internalLevel: "B1",
      reason: "Stabile mittlere B1-Evidenz → B1 Hören mittel",
    };
  }

  if (
    (selfBand === "weak" || selfIntroResult === "schwach") &&
    (imageBand === "medium" || imageResult === "mittel")
  ) {
    return {
      skill: "lesenHoeren",
      level: "A2",
      difficulty: "stark",
      internalLevel: "A2+",
      reason: "Selbstvorstellung schwach, Bild mittel → A2 Lesen/Hören stark",
    };
  }

  if (
    (selfBand === "medium" || selfIntroResult === "mittel") &&
    (imageBand === "medium" || imageResult === "mittel")
  ) {
    return {
      skill: "lesenHoeren",
      level: "A2",
      difficulty: "stark",
      internalLevel: "A2+",
      reason: "A2 stabil → Lesen/Hören stärker testen",
    };
  }

  if (
    (selfBand === "strong" || selfIntroResult === "stark") &&
    imageBand !== "weak" &&
    imageResult !== "schwach"
  ) {
    return {
      skill: "lesenHoeren",
      level: "B1",
      difficulty: "leicht",
      internalLevel: "B1-",
      reason: "Starke mündliche Leistung → B1 Lesen/Hören leicht",
    };
  }

  return {
    skill: "lesenHoeren",
    level: "A2",
    difficulty: "mittel",
    reason: "Standard A2 Lesen/Hören",
  };
}

export function getPlanningStep(results) {
  const { selfIntroResult, imageResult, lesenHoerenResult } = results;
  const selfBand = normalizePlacementBand(selfIntroResult) || selfIntroResult;
  const imageBand = normalizePlacementBand(imageResult) || imageResult;
  const listenBand =
    normalizePlacementBand(lesenHoerenResult) || lesenHoerenResult;

  const bands = [selfBand, imageBand, listenBand];
  const strongCount = bands.filter((band) => band === "strong").length;
  const mediumOrStrongCount = bands.filter(
    (band) => band === "medium" || band === "strong"
  ).length;
  const weakCount = bands.filter((band) => band === "weak").length;

  if (strongCount === 3) {
    return {
      skill: "planung",
      level: "B2",
      difficulty: "mittel",
      internalLevel: "B2-",
      reason: "Durchgehend starke Evidenz vor Planung → B2 Planung",
    };
  }

  if (weakCount === 0 && strongCount >= 2) {
    return {
      skill: "planung",
      level: "B1",
      difficulty: "mittel",
      internalLevel: "B1",
      reason: "Konsistente B1-oder-höhere Evidenz → B1 Planung mittel",
    };
  }

  if (weakCount <= 1 && mediumOrStrongCount >= 2) {
    return {
      skill: "planung",
      level: "B1",
      difficulty: "leicht",
      internalLevel: "B1-",
      reason: "Gemischte oder entstehende B1-Evidenz → B1 Planung schwach",
    };
  }

  return {
    skill: "planung",
    level: "A2",
    difficulty: "mittel",
    reason: "Standard A2 Planung mittel",
  };
}

export function calculatePlacementScore(scores) {
  const selfIntro = scores.selbstvorstellung || 0;
  const image = scores.bildbeschreibung || 0;
  const lesenHoeren = scores.lesenHoeren || 0;
  const planung = scores.planung || 0;

  return Math.round(
    selfIntro * 0.25 + image * 0.25 + lesenHoeren * 0.2 + planung * 0.3
  );
}

export function getFinalInternalLevel(score) {
  if (score < 40) return "A2";
  if (score < 60) return "A2+";
  if (score < 75) return "B1-";
  if (score < 88) return "B1";
  if (score < 95) return "B1+";
  return "B2-";
}

function librarySkillForRouting(skill) {
  if (skill === "lesenHoeren") return "hoeren";
  return skill;
}

/**
 * Resolve a routing step to an existing aiPlacementLibrary model.
 * Exact level+skill+difficulty match first; else documented fallback table.
 * @param {{ skill: string, level: string, difficulty: string }} step
 */
export function resolvePlacementModelFromStep(step) {
  const skill = step?.skill;
  const level = step?.level;
  const difficulty = step?.difficulty;
  if (!skill || !level || !difficulty) return null;

  const libSkill = librarySkillForRouting(skill);
  const candidates = getPlacementModelsBySkill(libSkill).filter(
    (m) => m.service === "placement" && m.level === level
  );

  const exact = candidates.find((m) => m.difficulty === difficulty);
  if (exact) return exact;

  const fallbackKey = `${skill}|${level}|${difficulty}`;
  const libFallbackKey = `${libSkill}|${level}|${difficulty}`;
  const fallbackId =
    PLACEMENT_MODEL_FALLBACKS[fallbackKey] ||
    PLACEMENT_MODEL_FALLBACKS[libFallbackKey];

  if (fallbackId) {
    const model = getPlacementModel(fallbackId);
    if (model) return model;
  }

  return null;
}

/** Fixed historical diagnostic start — always A2 Selbstvorstellung mittel */
export function getPlacementStartModel(selectedLevel = "A2") {
  const level = ["A2", "B1", "B2"].includes(selectedLevel)
    ? selectedLevel
    : "A2";
  return getPlacementModel(`${level.toLowerCase()}_self_mittel`);
}

/**
 * Score key for weighted formula (lesenHoeren vs library hoeren).
 */
export function scoreKeyForModelSkill(modelSkill) {
  if (modelSkill === "hoeren") return "lesenHoeren";
  return modelSkill;
}

export function placementTurnIdempotencyKey({
  stageIndex,
  followUpCount,
  skill,
  modelId,
  moveId,
}) {
  if (skill === "planung" && modelId && moveId) {
    return `turn:${stageIndex}:${modelId}:${moveId}`;
  }
  return `turn:${stageIndex}:${followUpCount}`;
}

export function isPlanningEvaluationComplete(evaluation) {
  return evaluation?.planningComplete === true;
}

/**
 * Build Placement-only result from four numeric skill scores.
 * Does not use placementEngine majority-CEFR.
 */
export function buildHistoricalPlacementResult({
  selectedLevel = "A2",
  numericScores = {},
  bands = {},
  modelsUsed = [],
}) {
  const score = calculatePlacementScore(numericScores);
  const level = getFinalInternalLevel(score);

  const strengths = [];
  const weaknesses = [];
  const focusAreas = [];

  Object.entries(bands).forEach(([skill, band]) => {
    const n = normalizePlacementBand(band);
    if (n === "strong") strengths.push(skill);
    if (n === "weak") {
      weaknesses.push(skill);
      focusAreas.push(skill);
    }
    if (n === "medium") focusAreas.push(skill);
  });

  return {
    level,
    selectedStartLevel: selectedLevel,
    date: new Date().toISOString(),
    skillScores: numericScores,
    skillBands: bands,
    placementScore: score,
    scoringMethod: "placement-historical-weighted-v1",
    bandScoreMapping: { weak: 35, medium: 65, strong: 100 },
    modelsUsed,
    strengths,
    weaknesses,
    focusAreas,
    recommendedFocus: focusAreas,
    studyPlan: [
      {
        day: "Tag 1",
        task: `${level} gezielt üben: Fokus auf ${focusAreas[0] || "bildbeschreibung"}.`,
        focus: focusAreas[0] || "bildbeschreibung",
      },
      {
        day: "Tag 3",
        task: `${level} Hören und Sprechen mit kurzen Dialogen üben.`,
        focus: focusAreas[1] || "hoeren",
      },
      {
        day: "Tag 5",
        task: `${level} Planung/Reaktion im Gespräch üben.`,
        focus: focusAreas[2] || "planung",
      },
      {
        day: "Tag 7",
        task: `${level} kurze Wiederholung und eine kleine Probe.`,
        focus: "prüfungsvorbereitung",
      },
    ],
  };
}
