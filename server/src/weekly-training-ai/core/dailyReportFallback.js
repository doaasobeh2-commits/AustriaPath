/**
 * Deterministic Final Daily Report when AI generation fails.
 * @module weekly-training-ai/core/dailyReportFallback
 */

import { buildDefaultRepeatedGrammarPatterns } from "./repeatedGrammarPatterns.js";

const B1_DAILY_REPORT_VERSION = "b1-daily-report-v3";

const CATEGORY_LABELS = {
  schreiben: "Schreiben / E-Mail",
  hoeren: "Hören",
  bildbeschreibung: "Bildbeschreibung",
  planung: "Gemeinsam planen",
  selbstvorstellung: "Selbstvorstellung",
};

const CATEGORY_SKILL = {
  schreiben: "Schreiben",
  hoeren: "Hören",
  bildbeschreibung: "Sprechen",
  planung: "Sprechen",
  selbstvorstellung: "Sprechen",
};

/**
 * @param {object} memory
 */
function resolveOriginalText(memory) {
  if (!memory || typeof memory !== "object") return "";
  if (memory.category === "schreiben") {
    return String(memory.originalEmail || memory.learnerEmail || "").trim();
  }
  return String(memory.transcript || memory.learnerResponse || memory.originalText || "").trim();
}

/**
 * @param {object} memory
 */
function buildExerciseEntry(memory) {
  const category = String(memory.category || "unknown");
  const originalText = resolveOriginalText(memory);

  return {
    category,
    title: CATEGORY_LABELS[category] || category,
    originalText,
    correctedText: originalText,
    coveredPoints: Array.isArray(memory.coveredPoints) ? memory.coveredPoints : [],
    missingPoints: Array.isArray(memory.missingPoints) ? memory.missingPoints : [],
    feedback:
      "Ihre Antwort wurde gespeichert. Der detaillierte KI-Kommentar steht morgen in den Trainingsprioritäten.",
    cefrPerformance: "B1",
  };
}

/**
 * @param {object} input
 */
export function buildDeterministicDailyReport({
  planIndex,
  planHash,
  trainingMemories,
  idempotencyKey = null,
}) {
  const memories = Array.isArray(trainingMemories) ? trainingMemories : [];
  const exercises = memories.map(buildExerciseEntry);
  const schreibenMemory = memories.find((memory) => memory.category === "schreiben");
  const hoerenMemory = memories.find((memory) => memory.category === "hoeren");
  const speakingMemories = memories.filter((memory) =>
    ["bildbeschreibung", "planung", "selbstvorstellung"].includes(memory.category)
  );

  const skillCounts = new Map();
  for (const memory of memories) {
    const skill = CATEGORY_SKILL[memory.category] || "Training";
    skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
  }

  const rankedSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]);
  const strongestSkill = rankedSkills[0]?.[0] || "Schreiben";
  const weakestSkill = rankedSkills[rankedSkills.length - 1]?.[0] || "Sprechen";

  const missingTotal = exercises.reduce(
    (sum, entry) => sum + (entry.missingPoints?.length || 0),
    0
  );

  const tomorrowPriorities = [
    missingTotal > 0
      ? "Fehlende Inhaltspunkte aus heute in kurzen Antworten nachholen."
      : "Heutige Antworten laut vorlesen und auf klare Satzmelodie achten.",
    speakingMemories.length
      ? "Eine Sprechübung mit mindestens einer Nachfrage wiederholen."
      : "Eine kurze Hörübung mit Notizen wiederholen.",
    schreibenMemory
      ? "Die E-Mail von heute noch einmal mit vollständigen Inhaltspunkten schreiben."
      : "Neue Wörter aus den heutigen Übungen in kurzen Sätzen üben.",
  ];

  const summary = `Trainingstag ${planIndex} abgeschlossen. Alle ${exercises.length} Übungen wurden gespeichert.`;
  const overallPerformance =
    missingTotal > 0
      ? "Sie haben den Tag vollständig absolviert; einzelne Inhaltspunkte können noch vertieft werden."
      : "Sie haben den Tag vollständig absolviert und die Aufgaben sicher bearbeitet.";

  return {
    version: B1_DAILY_REPORT_VERSION,
    planIndex,
    planHash: planHash || null,
    generatedAt: new Date().toISOString(),
    idempotencyKey,
    source: "deterministic_fallback",
    summary,
    overallPerformance,
    strongestSkill,
    weakestSkill,
    tomorrowPriorities,
    repeatedGrammarPatterns: buildDefaultRepeatedGrammarPatterns(),
    exercises,
    writing: schreibenMemory
      ? {
          originalText: resolveOriginalText(schreibenMemory),
          correctedText: resolveOriginalText(schreibenMemory),
          coveredPoints: schreibenMemory.coveredPoints || [],
          missingPoints: schreibenMemory.missingPoints || [],
        }
      : undefined,
    listening: hoerenMemory
      ? { notes: "Hörverständnis-Antworten wurden für den Tagesbericht gespeichert." }
      : undefined,
    speaking: speakingMemories.length
      ? { notes: "Sprechdialoge und Transkripte wurden für den Tagesbericht gespeichert." }
      : undefined,
  };
}
