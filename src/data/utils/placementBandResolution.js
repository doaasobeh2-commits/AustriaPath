/**
 * Placement-only productive-band resolution.
 * Separates communicative success from linguistic accuracy with a modest accuracy floor.
 * Does not change closed follow-up / routing control plane.
 */

import { normalizePlacementBand } from "../placementLogic.js";

/** Closed diagnostic focus codes the AI may return for learner-safe report grounding. */
export const PLACEMENT_DIAGNOSTIC_FOCUS = Object.freeze({
  satzbau: "Satzbau",
  verbposition: "Verbposition",
  artikel_kasus: "Artikel und Kasus",
  wortstellung: "Wortstellung",
  zusammenhaengend_sprechen: "zusammenhängendes Sprechen",
  wortschatz: "genauer Wortschatz",
  vollstaendige_antworten: "vollständige Antworten",
  begruendung: "Begründungen (weil/deshalb)",
  fragmentierung: "weniger fragmentiert sprechen",
  hoerverstehen_detail: "Details aus Hörtexten erkennen",
  hoerverstehen_ort: "Ortsangaben gezielt verstehen",
  hoerverstehen_zeit: "Zeitangaben gezielt verstehen",
  hoerverstehen_person: "Personenangaben gezielt verstehen",
  planen_ort_zeit: "Ort und Zeit konkret vereinbaren",
  planen_loesung: "auf Probleme reagieren und Lösungen vorschlagen",
  planen_vorschlag: "klare Vorschläge machen",
  beschreiben_details: "Gegenstände und Situationen genauer beschreiben",
  beschreiben_erfahrung: "persönliche Erfahrungen zusammenhängend schildern",
});

export function normalizeDiagnosticFocusList(raw = []) {
  const allowed = new Set(Object.keys(PLACEMENT_DIAGNOSTIC_FOCUS));
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((item) => String(item || "").trim().toLowerCase())
        .filter((id) => allowed.has(id))
    ),
  ].slice(0, 6);
}

/**
 * Derive the scoring/routing band from communicative + accuracy dimensions.
 * - Accuracy weak never yields strong (no B1/B2-strong evidence from broken form).
 * - On B1/B2 models, strong requires accuracy strong (not only medium).
 * - A2 may still earn strong with communicative strong + accuracy medium
 *   (functional A2 with normal A2 errors).
 */
export function resolvePlacementProductiveBand({
  communicativeBand,
  accuracyBand,
  proposedBand,
  modelLevel = "A2",
} = {}) {
  const communicative = normalizePlacementBand(communicativeBand);
  const accuracy = normalizePlacementBand(accuracyBand);
  const proposed = normalizePlacementBand(proposedBand);
  const level = String(modelLevel || "A2").toUpperCase();
  const isBLevel = level.startsWith("B");

  if (communicative && accuracy) {
    if (communicative === "weak") return "weak";
    if (accuracy === "weak") {
      return communicative === "weak" ? "weak" : "medium";
    }
    if (communicative === "strong" && accuracy === "strong") return "strong";
    if (communicative === "strong" && accuracy === "medium") {
      return isBLevel ? "medium" : "strong";
    }
    if (communicative === "medium") return "medium";
    return "medium";
  }

  // Legacy / incomplete AI payload: keep proposed band but apply accuracy floor.
  if (proposed) {
    if (accuracy === "weak" && proposed === "strong") return "medium";
    if (isBLevel && accuracy === "medium" && proposed === "strong") return "medium";
    return proposed;
  }

  return null;
}

/**
 * Learner-safe note filter: short coaching phrases only; drop internals.
 */
export function sanitizePlacementLearnerNotes(notes = []) {
  if (!Array.isArray(notes)) return [];
  return notes
    .map((n) => String(n || "").trim().replace(/\s+/g, " "))
    .filter((n) => n.length >= 8 && n.length <= 140)
    .filter(
      (n) =>
        !/\b(system|prompt|schema|json|followup|benchmark|selectedlevel|openai|token|secret|internal|debug)\b/i.test(
          n
        )
    )
    .slice(0, 6);
}
