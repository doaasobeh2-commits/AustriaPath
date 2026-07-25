/**
 * Explicit sourceRef for every Daily Learning card (270/270).
 * No runtime heuristics — each card ID maps to one deterministic source.
 */

function seq(prefix, nums, refs) {
  const out = {};
  nums.forEach((num, i) => {
    out[`${prefix}-${String(num).padStart(3, "0")}`] = { ...refs[i] };
  });
  return out;
}

function fill(prefix, from, to, ref) {
  const out = {};
  for (let n = from; n <= to; n++) {
    out[`${prefix}-${String(n).padStart(3, "0")}`] = { ...ref };
  }
  return out;
}

function akademie(level, section, itemIndex) {
  const sectionMap = {
    grammar: "grammatik",
    satzbau: "satzbau",
    konnektoren: "konnektoren",
    words: "wortschatz",
    verbs: "verben",
    mistakes: "fehler",
  };
  return {
    file: "akademieContent",
    level,
    section: sectionMap[section] || section,
    itemIndex,
  };
}

export const DAILY_LEARNING_SOURCE_REGISTRY = {
  ...fill("A2", 1, 3, { file: "modelsA2", modelId: 1 }),
  ...fill("A2", 4, 6, { file: "modelsA2", modelId: 2 }),
  ...fill("A2", 7, 9, { file: "modelsA2", modelId: 3 }),
  ...fill("A2", 10, 12, { file: "modelsA2", modelId: 4 }),
  ...fill("A2", 13, 15, { file: "modelsA2", modelId: 5 }),
  "A2-016": { file: "modelsA2", modelId: 30 },
  ...fill("A2", 17, 20, { file: "modelsA2", modelId: 35 }),
  "A2-021": { file: "modelsA2", modelId: 4 },
  "A2-022": { file: "modelsA2", modelId: 3 },
  ...fill("A2", 23, 24, { file: "modelsA2", modelId: 2 }),
  "A2-025": { file: "modelsA2", modelId: 1 },

  ...seq(
    "A2",
    [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4].map((i) => akademie("A2", "konnektoren", i))
  ),

  "A2-041": akademie("A2", "verbs", 2),
  "A2-042": { file: "weeklyPlanLibrary", taskId: "a2-planung-001" },
  "A2-043": { file: "weeklyPlanLibrary", taskId: "a2-planung-001" },
  "A2-044": { file: "modelsA2", modelId: 4 },
  "A2-045": akademie("A2", "grammar", 5),
  "A2-046": akademie("A2", "mistakes", 8),
  "A2-047": akademie("A2", "satzbau", 3),
  "A2-048": akademie("A2", "grammar", 4),
  "A2-049": akademie("A2", "grammar", 11),
  "A2-050": akademie("A2", "grammar", 3),
  "A2-051": akademie("A2", "grammar", 1),
  "A2-052": akademie("A2", "verbs", 2),

  ...seq(
    "A2",
    [53, 54, 55, 56, 57, 58, 59, 60, 61, 62],
    [
      akademie("A2", "words", 0),
      akademie("A2", "words", 4),
      akademie("A2", "words", 1),
      akademie("A2", "words", 1),
      { file: "weeklyPlanLibrary", taskId: "a2-grammatik-002" },
      akademie("A2", "words", 2),
      { file: "weeklyPlanLibrary", taskId: "a2-lesen-001" },
      { file: "weeklyPlanLibrary", taskId: "a2-lesen-001" },
      { file: "modelsA2", modelId: 4 },
      { file: "modelsA2", modelId: 35 },
    ]
  ),

  ...seq(
    "A2",
    [63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
    [1, 1, 2, 3, 4, 5, 8, 10, 11, 7].map((id) => ({ file: "a2Images", imageId: id }))
  ),

  ...seq(
    "A2",
    [73, 74, 75, 76, 77, 78, 79, 80],
    [1, 1, 1, 5, 6, 7, 8, 11].map((id) => ({ file: "a2Images", imageId: id }))
  ),

  "A2-081": { file: "modelsA2", modelId: 6 },
  "A2-082": { file: "modelsA2", modelId: 11 },
  "A2-083": { file: "modelsA2", modelId: 11 },
  "A2-084": { file: "modelsA2", modelId: 11 },
  "A2-085": { file: "modelsA2", modelId: 20 },
  "A2-086": { file: "weeklyPlanLibrary", taskId: "a2-grammatik-001" },
  "A2-087": { file: "weeklyPlanLibrary", taskId: "a2-hoeren-001" },
  "A2-088": { file: "modelsA2", modelId: 4 },
  "A2-089": { file: "weeklyPlanLibrary", taskId: "a2-grammatik-001" },
  "A2-090": { file: "weeklyPlanLibrary", taskId: "a2-planung-001" },

  ...fill("B1", 1, 2, { file: "modelsb1", modelId: 1 }),
  ...fill("B1", 3, 4, { file: "modelsb1", modelId: 2 }),
  ...fill("B1", 5, 6, { file: "modelsb1", modelId: 3 }),
  ...fill("B1", 7, 8, { file: "modelsb1", modelId: 4 }),
  ...fill("B1", 9, 10, { file: "modelsb1", modelId: 5 }),
  ...fill("B1", 11, 12, { file: "modelsb1", modelId: 6 }),
  ...fill("B1", 13, 14, { file: "modelsb1", modelId: 7 }),
  ...fill("B1", 15, 16, { file: "modelsb1", modelId: 8 }),
  ...fill("B1", 17, 18, { file: "modelsb1", modelId: 9 }),
  ...fill("B1", 19, 20, { file: "modelsb1", modelId: 10 }),

  ...seq(
    "B1",
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 41, 43],
    [
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-01",
      "b1-plan-03",
      "b1-plan-03",
      "b1-plan-03",
      "b1-plan-04",
      "b1-plan-04",
      "b1-plan-05",
      "b1-plan-05",
      "b1-plan-06",
      "b1-plan-06",
      "b1-plan-07",
      "b1-plan-07",
      "b1-plan-01",
      "b1-plan-01",
    ].map((planId) => ({ file: "modelsb1", planId }))
  ),

  ...seq(
    "B1",
    [39, 40, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53],
    [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => ({
      file: "b1Images",
      imageId: id,
    }))
  ),

  ...seq(
    "B1",
    [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => ({ file: "b1Images", imageId: id }))
  ),

  ...seq(
    "B1",
    [66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1].map((i) => akademie("B1", "konnektoren", i))
  ),

  "B1-078": akademie("B1", "grammar", 5),
  "B1-079": { file: "modelsb1", modelId: 11 },
  "B1-080": { file: "modelsb1", modelId: 12 },
  "B1-081": { file: "modelsb1", modelId: 13 },
  "B1-082": akademie("B1", "grammar", 4),
  "B1-083": akademie("B1", "grammar", 0),
  "B1-084": akademie("B1", "grammar", 6),
  "B1-085": akademie("B1", "grammar", 1),
  "B1-086": { file: "modelsb1", modelId: 1 },
  "B1-087": { file: "modelsb1", modelId: 2 },
  "B1-088": { file: "modelsb1", modelId: 10 },
  "B1-089": akademie("B1", "verbs", 5),
  "B1-090": { file: "modelsb1", modelId: 4 },

  "B2-001": { file: "b2PlanningModels", diskId: "b2-disk-04" },
  "B2-002": { file: "b2PlanningModels", diskId: "b2-disk-05" },
  "B2-003": { file: "b2Speaking", speakingTitle: "Künstliche Intelligenz" },
  "B2-004": { file: "b2Images", imageId: 4 },
  "B2-005": { file: "b2PlanningModels", diskId: "b2-disk-06" },
  "B2-006": { file: "b2Images", imageId: 5 },
  "B2-007": { file: "b2Images", imageId: 6 },
  "B2-008": { file: "b2Images", imageId: 8 },
  "B2-009": { file: "b2PlanningModels", diskId: "b2-disk-05" },
  "B2-010": { file: "b2PlanningModels", planId: "b2-plan-02" },
  "B2-011": { file: "b2Grafiken", grafikId: 5 },
  "B2-012": { file: "b2Grafiken", grafikId: 4 },

  ...seq(
    "B2",
    [13, 14, 15, 16, 17, 18, 19, 20],
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => akademie("B2", "satzbau", i))
  ),

  ...seq(
    "B2",
    [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7].map((id) => ({ file: "b2Grafiken", grafikId: id }))
  ),

  ...seq(
    "B2",
    [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4].map((id) => ({ file: "b2Images", imageId: id }))
  ),

  ...seq(
    "B2",
    [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    [
      "b2-plan-01",
      "b2-plan-01",
      "b2-plan-02",
      "b2-plan-02",
      "b2-plan-03",
      "b2-plan-03",
      "b2-plan-01",
      "b2-plan-02",
      "b2-plan-03",
      "b2-plan-02",
      "b2-plan-01",
      "b2-plan-01",
    ].map((planId) => ({ file: "b2PlanningModels", planId }))
  ),

  ...seq(
    "B2",
    [60, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 72, 73, 74],
    [
      "b2-lesen-modell-1",
      "b2-lesen-modell-1",
      "b2-lesen-modell-1",
      "b2-lesen-modell-1",
      "b2-lesen-modell-1",
      "b2-lesen-modell-2",
      "b2-lesen-modell-2",
      "b2-lesen-modell-2",
      "b2-lesen-modell-2",
      "b2-lesen-modell-3",
      "b2-lesen-modell-3",
      "b2-lesen-modell-3",
      "b2-lesen-modell-3",
      "b2-lesen-modell-3",
    ].map((modelId) => ({ file: "b2LesenModels", modelId }))
  ),

  "B2-068": akademie("B2", "satzbau", 9),

  ...fill("B2", 75, 79, { file: "modelsB2", modelId: 1 }),
  ...fill("B2", 80, 84, { file: "modelsB2", modelId: 2 }),

  "B2-085": akademie("B2", "verbs", 1),
  "B2-086": akademie("B2", "verbs", 0),
  "B2-087": akademie("B2", "words", 3),
  "B2-088": akademie("B2", "words", 4),
  "B2-089": { file: "b2PlanningModels", planId: "b2-plan-02" },
  "B2-090": akademie("B2", "satzbau", 7),
};

export function getSourceRefForCard(cardId) {
  return DAILY_LEARNING_SOURCE_REGISTRY[cardId] || null;
}
