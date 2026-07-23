/**
 * Placement-only learner-facing practice-focus mapping.
 * Maps raw pack topics / listening questions → skill diagnoses for the report.
 */

import { PLACEMENT_DIAGNOSTIC_FOCUS } from "./placementBandResolution.js";

const BILD_FOCUS_BY_ID = Object.freeze({
  place: "Ort und Umgebung klar benennen",
  woman: "Personen im Bild klar benennen",
  woman_action: "Handlungen genauer beschreiben",
  shop_details: "Gegenstände und Situationen genauer beschreiben",
  seller_help: "Hilfsaktionen im Bild klar beschreiben",
  travel_preference: "persönliche Erfahrungen zusammenhängend schildern",
  atmosphere: "Stimmung und Wirkung beschreiben",
  reading_preference: "persönliche Vorlieben zusammenhängend schildern",
  reading_detail: "Vorlieben mit mehr Detail schildern",
  people_action: "Handlungen genauer beschreiben",
  appearance: "Aussehen und Merkmale genauer beschreiben",
  room_details: "Gegenstände und Situationen genauer beschreiben",
  housing_opinion: "eine einfache Meinung begründen",
  conversation: "Gespräche im Bild beschreiben",
  documents: "Details aus dem Bild nennen",
  possible_action: "mögliche Handlungen begründen",
  bank_experience: "persönliche Erfahrungen zusammenhängend schildern",
  salad_action: "Handlungen genauer beschreiben",
  vegetables: "Gegenstände genauer beschreiben",
  healthy: "einfache Einschätzungen formulieren",
  cooking_preference: "persönliche Vorlieben zusammenhängend schildern",
  cooking_detail: "Vorlieben mit mehr Detail schildern",
  delivery_scene: "die Bildsituation zusammenhängend schildern",
  online_opinion: "eine Meinung klar formulieren",
  justification: "Begründungen (weil/deshalb) üben",
  delivery_experience: "persönliche Erfahrungen zusammenhängend schildern",
  delivery_problem: "Probleme und Folgen beschreiben",
});

const PLANNING_FOCUS_BY_ID = Object.freeze({
  date_time: "Termin und Uhrzeit konkret vereinbaren",
  place: "Ort und Zeit konkret vereinbaren",
  meeting_place: "Ort und Zeit konkret vereinbaren",
  guests: "Teilnehmende klar benennen",
  food_drinks: "Verpflegung konkret vorschlagen",
  simple_reason: "Begründungen (weil/deshalb) üben",
  reaction: "auf Vorschläge klar reagieren",
  alternative: "Alternativen vorschlagen",
  final_agreement: "eine gemeinsame Entscheidung formulieren",
  items: "benötigte Dinge konkret nennen",
  weather_alternative: "auf Probleme reagieren und Lösungen vorschlagen",
  weather_solution: "auf Probleme reagieren und Lösungen vorschlagen",
  attendance_problem: "auf Probleme reagieren und Lösungen vorschlagen",
  delay_solution: "auf Probleme reagieren und Lösungen vorschlagen",
  tasks: "Aufgaben klar verteilen",
  responsibilities: "Aufgaben klar verteilen",
  transport: "Verkehrsmittel konkret vereinbaren",
  transport_items: "Transport und Hilfsmittel planen",
  costs: "Kosten und Budget ansprechen",
  budget: "Kosten und Budget ansprechen",
  proposal_reason: "Vorschläge mit Begründung machen",
  reaction_alternative: "reagieren und Alternativen anbieten",
  program: "ein Programm konkret vorschlagen",
  arrival: "Ankunft und Abholung planen",
  accommodation: "Unterkunft konkret vereinbaren",
  food_scope: "Verpflegung konkret planen",
  activities: "gemeinsame Aktivitäten vorschlagen",
  reason_preference: "Wünsche mit Begründung nennen",
  reason_alternative: "Begründung und Alternative verbinden",
});

const SELF_FOCUS_BY_ID = Object.freeze({
  name: "persönliche Angaben vollständig nennen",
  origin: "Herkunft klar nennen",
  residence: "Wohnort klar nennen",
  residence_duration: "Aufenthaltsdauer klar nennen",
  work: "Arbeit oder Ausbildung klar nennen",
  work_details: "berufliche Tätigkeit genauer beschreiben",
  family: "Familie kurz vorstellen",
  leisure: "Freizeit zusammenhängend schildern",
  german_learning: "Deutschlernen ansprechen",
  german_reason: "Begründungen (weil/deshalb) üben",
  german_difficulty: "Schwierigkeiten klar benennen",
  learning_strategy: "Lernstrategien beschreiben",
  daily_routine: "Tagesablauf zusammenhängend schildern",
  past_experience: "Erfahrungen zusammenhängend schildern",
  future_plan: "Zukunftspläne klar formulieren",
  professional_goal: "berufliche Ziele klar formulieren",
  reason: "Begründungen (weil/deshalb) üben",
  example: "Beispiele geben",
  comparison: "einfache Vergleiche formulieren",
  opinion: "eine Meinung klar formulieren",
  integration_opinion: "eine Meinung klar formulieren",
});

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapListeningQuestionToFocus(question = "") {
  const text = normalizeText(question);
  if (!text) return "Details aus Hörtexten erkennen";
  // Intent-first: reason/time/place before superficial person words like "Frau".
  if (/\bwarum\b|\bweshalb\b|grund|weil|empfiehlt/.test(text)) {
    return "Gründe im Hörtext erkennen";
  }
  if (/\bwann\b|uhr|zeit|tag|datum|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag/.test(text)) {
    return "Zeitangaben gezielt verstehen";
  }
  if (/\bwo\b|ort|gefunden|gelegen|befind/.test(text)) {
    return "Ortsangaben gezielt verstehen";
  }
  if (/\bwer\b|wen\b|wessen\b|\bperson\b|\bname\b/.test(text)) {
    return "Personenangaben gezielt verstehen";
  }
  if (/\bwas\b|welche|wie viel|wieviele|wie lange|worum/.test(text)) {
    return "Details aus Hörtexten erkennen";
  }
  return "Details aus Hörtexten erkennen";
}

/**
 * Map a missing topic / question / id to a learner-facing practice focus.
 */
export function mapPlacementPracticeFocus(skill, topicOrLabel, topicId = null) {
  const id = String(topicId || "").trim();
  const label = String(topicOrLabel || "").trim();

  if (skill === "lesenHoeren" || skill === "hoeren") {
    return mapListeningQuestionToFocus(label || id);
  }
  if (skill === "bildbeschreibung") {
    if (id && BILD_FOCUS_BY_ID[id]) return BILD_FOCUS_BY_ID[id];
    const key = Object.keys(BILD_FOCUS_BY_ID).find(
      (k) => normalizeText(BILD_FOCUS_BY_ID[k]) === normalizeText(label)
    );
    if (key) return BILD_FOCUS_BY_ID[key];
    // Known raw labels from packs
    if (/koffer und taschen/i.test(label)) return BILD_FOCUS_BY_ID.shop_details;
    if (/personliche reiseerfahrung|persönliche reiseerfahrung/i.test(label)) {
      return BILD_FOCUS_BY_ID.travel_preference;
    }
    if (/^ort$/i.test(label)) return BILD_FOCUS_BY_ID.place;
    return "Gegenstände und Situationen genauer beschreiben";
  }
  if (skill === "planung") {
    if (id && PLANNING_FOCUS_BY_ID[id]) return PLANNING_FOCUS_BY_ID[id];
    if (/^ort$/i.test(label)) return PLANNING_FOCUS_BY_ID.place;
    if (/geringer teilnahme|teilnahme/i.test(label)) {
      return PLANNING_FOCUS_BY_ID.attendance_problem;
    }
    return "Ort und Zeit konkret vereinbaren";
  }
  if (skill === "selbstvorstellung") {
    if (id && SELF_FOCUS_BY_ID[id]) return SELF_FOCUS_BY_ID[id];
    return "persönliche Angaben vollständig und zusammenhängend nennen";
  }
  return label || "gezielt weiter üben";
}

export function mapPracticeFocusList(skill, missingTopics = [], missingTopicIds = []) {
  const focuses = [];
  const seen = new Set();
  const ids = Array.isArray(missingTopicIds) ? missingTopicIds : [];
  const topics = Array.isArray(missingTopics) ? missingTopics : [];
  const n = Math.max(ids.length, topics.length);
  for (let i = 0; i < n; i += 1) {
    const focus = mapPlacementPracticeFocus(skill, topics[i], ids[i] || null);
    const key = normalizeText(focus);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    focuses.push(focus);
  }
  return focuses.slice(0, 6);
}

export function diagnosticFocusLabels(codes = []) {
  return (Array.isArray(codes) ? codes : [])
    .map((code) => PLACEMENT_DIAGNOSTIC_FOCUS[code] || null)
    .filter(Boolean);
}

/**
 * Relative strengths grounded in evidence — not only absolute "strong" bands.
 */
export function buildRelativeStrengthItems(skillBands = {}, evidenceSummary = {}) {
  const items = [];
  const seen = new Set();
  const add = (skill, text) => {
    const key = `${skill}|${normalizeText(text)}`;
    if (!text || seen.has(key)) return;
    seen.add(key);
    items.push({ skill, text });
  };

  const self = evidenceSummary.selbstvorstellung || {};
  const selfCovered = new Set(self.coveredTopicIds || []);
  if (selfCovered.has("name") || selfCovered.has("origin") || selfCovered.has("family") || selfCovered.has("work")) {
    add(
      "selbstvorstellung",
      "Sie können grundlegende persönliche Informationen verständlich mitteilen."
    );
  }
  if (selfCovered.has("reason") || selfCovered.has("german_reason") || /\bweil\b/i.test(
    (self.transcripts || []).map((t) => t.transcript || "").join(" ")
  )) {
    add(
      "selbstvorstellung",
      "Sie können einfache Gründe mit „weil“ ausdrücken."
    );
  }
  if (normalizeBand(skillBands.selbstvorstellung) === "strong") {
    add("selbstvorstellung", "Selbstvorstellung war in diesem Test eine besondere Stärke.");
  }

  const bild = evidenceSummary.bildbeschreibung || {};
  if ((bild.coveredTopicIds || []).length >= 2) {
    add(
      "bildbeschreibung",
      "Sie erfassen die Hauptsituation im Bild und können zentrale Details nennen."
    );
  }

  const listen = evidenceSummary.lesenHoeren || {};
  const results = listen.listeningQuestionResults || [];
  const correct = results.filter((r) => r.isCorrect).length;
  if (results.length && correct / results.length >= 0.5) {
    add(
      "lesenHoeren",
      "Sie verstehen die Hauptinformationen in Hörtexten weitgehend."
    );
  }
  if (results.length && correct / results.length >= 0.8) {
    add(
      "lesenHoeren",
      "Hören war in diesem Test eine besondere Stärke."
    );
  }

  const plan = evidenceSummary.planung || {};
  if ((plan.coveredTopicIds || []).length >= 2 || (plan.coveredTopics || []).length >= 2) {
    add(
      "planung",
      "Sie können in einem Planungsgespräch grundlegende Vorschläge machen."
    );
  }
  if (normalizeBand(skillBands.planung) === "strong") {
    add("planung", "Planung war in diesem Test eine besondere Stärke.");
  }

  // Fallback: any medium+ skill with transcripts/coverage still gets a gentle relative strength
  for (const skill of ["selbstvorstellung", "bildbeschreibung", "lesenHoeren", "planung"]) {
    if (items.some((i) => i.skill === skill)) continue;
    const band = normalizeBand(skillBands[skill]);
    const ev = evidenceSummary[skill] || {};
    if (band === "medium" || band === "strong") {
      if (
        (ev.coveredTopics || []).length ||
        (ev.coveredTopicIds || []).length ||
        (ev.listeningQuestionResults || []).some((r) => r.isCorrect) ||
        (ev.transcripts || []).length
      ) {
        const labels = {
          selbstvorstellung: "Sie verstehen direkte Fragen und antworten verständlich.",
          bildbeschreibung: "Sie können eine Bildsituation im Kern verständlich beschreiben.",
          lesenHoeren: "Sie erfassen den Kern einfacher Hörtexte.",
          planung: "Sie können sich an einem einfachen Planungsgespräch beteiligen.",
        };
        add(skill, labels[skill]);
      }
    }
  }

  return items.slice(0, 6).map((item) => ({
    skill: item.skill,
    label: AREA_LABELS[item.skill] || item.skill,
    text: item.text,
  }));
}

const AREA_LABELS = {
  selbstvorstellung: "Selbstvorstellung",
  bildbeschreibung: "Bildbeschreibung",
  lesenHoeren: "Hören",
  planung: "Planung",
};

function normalizeBand(band) {
  const key = String(band || "").toLowerCase().trim();
  if (key === "weak" || key === "schwach") return "weak";
  if (key === "medium" || key === "mittel") return "medium";
  if (key === "strong" || key === "stark") return "strong";
  return null;
}

/**
 * Concrete improvement text from practice focuses + diagnostic codes.
 */
export function buildImprovementText(skill, {
  isWeak = false,
  practiceFocuses = [],
  diagnosticFocus = [],
} = {}) {
  const label = AREA_LABELS[skill] || skill;
  const focuses = [
    ...diagnosticFocusLabels(diagnosticFocus),
    ...(Array.isArray(practiceFocuses) ? practiceFocuses : []),
  ].filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const f of focuses) {
    const key = normalizeText(f);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }
  const tip = unique.slice(0, 3).join(", ");

  if (skill === "lesenHoeren") {
    if (tip) {
      return isWeak
        ? `Hören: Priorität — ${tip}.`
        : `Hören: Weiter gezielt trainieren — ${tip}.`;
    }
    return isWeak
      ? "Hören: Hauptinformationen und Detailfragen gezielt trainieren."
      : "Hören: Detailverständnis weiter festigen.";
  }

  if (tip) {
    return isWeak
      ? `${label}: Priorität — ${tip}.`
      : `${label}: Besonders üben — ${tip}.`;
  }

  return isWeak
    ? `${label} sollte priorisiert geübt werden.`
    : `${label}: Satzbau, vollständige Antworten und zusammenhängendes Sprechen gezielt festigen.`;
}
