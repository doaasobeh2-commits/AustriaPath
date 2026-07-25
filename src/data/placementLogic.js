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
  "bildbeschreibung|A2|leicht": "a2_bild_leicht",
  "planung|A2|stark": "a2_planung_mittel",
  "planung|B1|leicht": "b1_planung_schwach",
});

export const PLACEMENT_WORKING_LEVELS = Object.freeze(["A2", "B1", "B2"]);
const WORKING_LEVEL_INDEX = { A2: 0, B1: 1, B2: 2 };

export const PLACEMENT_B2_CONFIRMATION_MODEL_ID = "b2_diskussion_mittel";

export function normalizePlacementBand(band) {
  const key = String(band || "")
    .toLowerCase()
    .trim();
  if (key === "schwach" || key === "weak") return "weak";
  if (key === "mittel" || key === "medium") return "medium";
  if (key === "stark" || key === "strong") return "strong";
  return null;
}

/** Map self-intro band to next-task level — never above B1 (Rule 2). */
export function workingLevelAfterSelf(band) {
  const normalized = normalizePlacementBand(band);
  if (normalized === "strong") return "B1";
  return "A2";
}

/**
 * @deprecated Use workingLevelAfterSelf for post-self routing.
 * Kept for callers that need band→level without self cap.
 */
export function bandToWorkingLevel(band) {
  return workingLevelAfterSelf(band);
}

/** Move at most one working level based on stage band evidence. */
export function stepWorkingLevelByBand(currentLevel = "A2", band) {
  const idx = WORKING_LEVEL_INDEX[currentLevel] ?? 0;
  const normalized = normalizePlacementBand(band);
  if (normalized === "weak") {
    return PLACEMENT_WORKING_LEVELS[Math.max(0, idx - 1)];
  }
  if (normalized === "strong") {
    return PLACEMENT_WORKING_LEVELS[Math.min(2, idx + 1)];
  }
  return PLACEMENT_WORKING_LEVELS[idx];
}

/** @deprecated Use stepWorkingLevelByBand */
export function updateWorkingLevel(currentLevel = "A2", band) {
  return stepWorkingLevelByBand(currentLevel, band);
}

/** Speaking working level after Bild — one step from post-self level only. */
export function computeSpeakingWorkingLevelAfterBild(selfIntroResult, imageResult) {
  const afterSelf = workingLevelAfterSelf(selfIntroResult);
  return stepWorkingLevelByBand(afterSelf, imageResult);
}

/** @deprecated */
export function computeWorkingLevelAfterBild(selfIntroResult, imageResult) {
  return computeSpeakingWorkingLevelAfterBild(selfIntroResult, imageResult);
}

/**
 * Listening is supplementary evidence only (Rules 3–4).
 * Never lowers speaking working level; may block B2 promotion when weak.
 */
export function evaluateListeningRouting(speakingWorkingLevel = "A2", listenBand) {
  const listen = normalizePlacementBand(listenBand);
  return {
    speakingWorkingLevel,
    b2PromotionAllowed: listen !== "weak",
    listenConfirmsHigher: listen === "strong",
  };
}

/** @deprecated Listening must not change speaking working level. */
export function applyListeningToWorkingLevel(
  speakingWorkingLevel = "A2",
  listenBand,
  _priorBands = []
) {
  return evaluateListeningRouting(speakingWorkingLevel, listenBand)
    .speakingWorkingLevel;
}

/**
 * Strong repeated B1 oral evidence + listening not weak → one B2 confirmation task.
 * Both-only-medium = stable B1, no B2 attempt (Rules 5–6).
 */
export function qualifiesForB2Confirmation(
  selfIntroResult,
  imageResult,
  lesenHoerenResult
) {
  if (
    computeSpeakingWorkingLevelForPlanung(selfIntroResult, imageResult) !== "B1"
  ) {
    return false;
  }
  const selfBand = normalizePlacementBand(selfIntroResult);
  const imageBand = normalizePlacementBand(imageResult);
  const listenBand = normalizePlacementBand(lesenHoerenResult);
  if (!selfBand || !imageBand || selfBand === "weak" || imageBand === "weak") {
    return false;
  }
  if (selfBand === "medium" && imageBand === "medium") return false;
  const hasStrongEvidence =
    selfBand === "strong" || imageBand === "strong";
  if (!hasStrongEvidence) return false;
  if (listenBand === "weak") return false;
  return true;
}

/** Speaking-only planung level (listening never downgrades). */
export function computeSpeakingWorkingLevelForPlanung(
  selfIntroResult,
  imageResult
) {
  const speaking = computeSpeakingWorkingLevelAfterBild(
    selfIntroResult,
    imageResult
  );
  return speaking === "B2" ? "B1" : speaking;
}

/** @deprecated */
export function computeWorkingLevelForPlanung(
  selfIntroResult,
  imageResult,
  lesenHoerenResult
) {
  void lesenHoerenResult;
  return computeSpeakingWorkingLevelForPlanung(selfIntroResult, imageResult);
}

export function bandToPlacementScore(band) {
  const normalized = normalizePlacementBand(band);
  if (!normalized) return null;
  return PLACEMENT_BAND_TO_SCORE[normalized];
}

/**
 * Final skill band from all validated evaluations in the skill conversation.
 * Each turn contributes equally (including Planung — closing turn does not dominate).
 * Invalid/missing bands are ignored and an entirely invalid evidence set fails closed with null.
 * @param {Array<{ band?: string, needsFollowUp?: boolean }>|undefined} evaluations
 */
export function getFinalBandFromTurnEvidence(evaluations = [], options = {}) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) return null;
  const skill = String(options?.skill || "").toLowerCase();
  const ranks = evaluations
    .map((item, index) => {
      const band = normalizePlacementBand(item?.band);
      if (!band) return null;
      const rank = { weak: 0, medium: 1, strong: 2 }[band];
      const isClosing = Boolean(item?.planningComplete || item?.isClosingMove);
      const weight =
        skill === "planung" && isClosing ? 0.5 : 1;
      return { rank, weight };
    })
    .filter(Boolean);
  if (!ranks.length) return null;
  const totalWeight = ranks.reduce((sum, item) => sum + item.weight, 0);
  const average =
    ranks.reduce((sum, item) => sum + item.rank * item.weight, 0) / totalWeight;
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

/**
 * Bild step from Selbstvorstellung evidence only — ignores any predicted level.
 */
export function getImageStepAfterSelfIntro(selfIntroResult) {
  const band = normalizePlacementBand(selfIntroResult) || "weak";
  const level = workingLevelAfterSelf(band);
  const difficulty =
    level === "A2" ? (band === "weak" ? "leicht" : "mittel") : "mittel";

  return {
    skill: "bildbeschreibung",
    level,
    difficulty,
    internalLevel: level,
    reason: `Selbstvorstellung ${band} → ${level} Bildbeschreibung ${difficulty} (max B1 nach Selbstvorstellung)`,
  };
}

/**
 * Listening step from oral evidence only. Uses working level after Bildbeschreibung.
 */
export function getReadingListeningStep(
  selfIntroResult,
  imageResult,
  options = {}
) {
  const imageBand = normalizePlacementBand(imageResult) || "weak";
  const speakingLevel =
    options.speakingWorkingLevel ||
    options.workingLevel ||
    computeSpeakingWorkingLevelAfterBild(selfIntroResult, imageResult);
  const workingLevel = speakingLevel === "B2" ? "B1" : speakingLevel;

  let difficulty = "mittel";
  if (workingLevel === "A2" && imageBand === "weak") difficulty = "leicht";
  else if (workingLevel === "B1" && imageBand !== "strong") difficulty = "bridge";

  return {
    skill: "lesenHoeren",
    level: workingLevel,
    difficulty,
    internalLevel: workingLevel,
    speakingWorkingLevel: speakingLevel,
    reason: `Sprech-Arbeitsniveau ${speakingLevel} → ${workingLevel} Hören (Hören ändert das Niveau nicht)`,
    ...(workingLevel === "B1" && difficulty === "bridge" ? { b1Entry: true } : {}),
  };
}

export function getPlanningStep(results) {
  const { selfIntroResult, imageResult, lesenHoerenResult } = results;
  const speakingWorkingLevel = computeSpeakingWorkingLevelAfterBild(
    selfIntroResult,
    imageResult
  );

  if (
    qualifiesForB2Confirmation(
      selfIntroResult,
      imageResult,
      lesenHoerenResult
    )
  ) {
    return {
      skill: "diskussion",
      level: "B2",
      difficulty: "mittel",
      mode: "b2_confirmation",
      modelId: PLACEMENT_B2_CONFIRMATION_MODEL_ID,
      speakingWorkingLevel,
      internalLevel: "B2-",
      reason:
        "Starke wiederholte B1-Sprechleistung → kurze B2-Bestätigung (Diskussion)",
    };
  }

  const level = computeSpeakingWorkingLevelForPlanung(
    selfIntroResult,
    imageResult
  );
  const imageBand = normalizePlacementBand(imageResult);
  const difficulty =
    level === "B1" && imageBand === "weak" ? "leicht" : "mittel";

  return {
    skill: "planung",
    level,
    difficulty,
    speakingWorkingLevel,
    internalLevel: level,
    reason: `Sprech-Arbeitsniveau ${speakingWorkingLevel} → ${level} Planung (Hören beeinflusst nur die Auswertung)`,
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

function capPlacementLevelAtB1(level) {
  if (level === "B2-" || level === "B2" || level === "B2+") return "B1+";
  if (level === "B1-" || level === "B1" || level === "B1+") return level;
  return "B1-";
}

function capPlacementLevelAtA2(level) {
  if (level === "A2" || level === "A2+") return level;
  return "A2";
}

/**
 * Apply routing confirmation outcomes after weighted score (Rules 6–7).
 * Does not change band weights or band→score mapping.
 */
export function resolvePlacementFinalLevel({
  score,
  bands = {},
  modelsUsed = [],
}) {
  const scoreLevel = getFinalInternalLevel(score);
  const hadB2Confirmation = modelsUsed.some(
    (item) =>
      item?.requested?.mode === "b2_confirmation" ||
      item?.stage === "diskussion"
  );
  if (hadB2Confirmation) {
    const confirmationBand = normalizePlacementBand(bands.planung);
    if (confirmationBand === "weak") {
      return capPlacementLevelAtB1(scoreLevel);
    }
    if (confirmationBand === "medium" || confirmationBand === "strong") {
      return "B2-";
    }
    return capPlacementLevelAtB1(scoreLevel);
  }

  const selfBand = normalizePlacementBand(bands.selbstvorstellung);
  const imageBand = normalizePlacementBand(bands.bildbeschreibung);
  const listenBand = normalizePlacementBand(bands.lesenHoeren);
  if (imageBand === "weak" && listenBand === "weak") {
    return capPlacementLevelAtA2(scoreLevel);
  }
  const speakingAfterBild = computeSpeakingWorkingLevelAfterBild(
    bands.selbstvorstellung,
    bands.bildbeschreibung
  );
  const stableB1Speaking =
    speakingAfterBild === "B1" &&
    selfBand !== "weak" &&
    imageBand !== "weak";
  if (
    stableB1Speaking &&
    (scoreLevel === "A2" || scoreLevel === "A2+")
  ) {
    return "B1-";
  }

  return scoreLevel;
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

/** Every attempt starts at A2 Selbstvorstellung — ignores predicted/stored level. */
export function getPlacementStartModel(_ignoredPredictedLevel) {
  return getPlacementModel("a2_self_mittel");
}

/**
 * Score key for weighted formula (lesenHoeren vs library hoeren).
 */
export function scoreKeyForModelSkill(modelSkill) {
  if (modelSkill === "hoeren") return "lesenHoeren";
  if (modelSkill === "diskussion") return "planung";
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

/** Learner-facing copy when evaluate-turn rejects an answer as too short. */
export const PLACEMENT_ANSWER_TOO_SHORT_MESSAGE =
  "Ihre Antwort ist zu kurz. Bitte antworten Sie etwas ausführlicher.";

/** True for the pre-evaluation 400 VALIDATION_ERROR the client must recover locally. */
export function isPlacementAnswerTooShortValidationError(err) {
  if (!err || err.code !== "VALIDATION_ERROR") return false;
  return /antwort ist zu kurz|antwort fehlt für die auswertung/i.test(
    String(err.message || "")
  );
}

export function isPlanningEvaluationComplete(evaluation) {
  return evaluation?.planningComplete === true;
}

export function claimPlacementReportFinalization(inFlightRef, attemptId) {
  const id = String(attemptId || "").trim();
  if (!id || inFlightRef?.current === id) return false;
  inFlightRef.current = id;
  return true;
}

export function releasePlacementReportFinalization(inFlightRef, attemptId) {
  if (inFlightRef?.current === String(attemptId || "").trim()) {
    inFlightRef.current = null;
  }
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
  const level = resolvePlacementFinalLevel({ score, bands, modelsUsed });

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
