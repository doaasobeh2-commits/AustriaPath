/**
 * Rich Akademie entries from extracted content metadata.
 */

import { uniqueList } from "./contentModelSchema.js";

let entryCounter = 0;

function nextId(prefix) {
  entryCounter += 1;
  return `${prefix}-${Date.now()}-${entryCounter}`;
}

function baseEntry(partial) {
  return {
    id: partial.id || nextId("ak"),
    category: partial.category || "grammar",
    title: partial.title || "",
    level: partial.level || "A2",
    rule: partial.rule || "",
    explanation: partial.explanation || "",
    examples: partial.examples || [],
    combinations: partial.combinations || [],
    mistakes: partial.mistakes || [],
    examSentences: partial.examSentences || [],
    tip: partial.tip || "",
    approved: false,
    source: "extracted",
    ...partial,
  };
}

export function buildAkademieEntriesFromExtraction({
  pending = {},
  level = "A2",
  type = "schreiben",
  title = "",
  content = "",
  solution = "",
}) {
  const entries = [];
  const tip = typeTip(type);
  const sourceText = solution || content;

  (pending.grammar || []).forEach((rule) => {
    entries.push(baseEntry({
      category: "grammar",
      title: rule.split(":")[0] || rule,
      level,
      rule,
      explanation: `In „${title || "diesem Modell"}“: ${rule}`,
      examples: pickSentences(sourceText, 2),
      examSentences: (pending.sentences || []).slice(0, 2),
      mistakes: (pending.mistakes || []).slice(0, 2),
      tip: `${tip} Achten Sie auf Satzstellung bei Nebensätzen.`,
    }));
  });

  (pending.konnektoren || []).forEach((line) => {
    const [key, rule = "Konnektor"] = String(line).split(" — ");
    entries.push(baseEntry({
      category: "connector",
      title: key.trim(),
      level,
      rule: rule.trim(),
      explanation: `„${key.trim()}“ strukturiert Ihre Antwort klar.`,
      examples: findWith(sourceText, key).slice(0, 2),
      combinations: [`${key.trim()} + Hauptsatz`, `${key.trim()} + Nebensatz`],
      examSentences: findWith(sourceText, key).slice(0, 1),
      tip: "Zeigen Sie den Konnektor in einem vollständigen Prüfungssatz.",
    }));
  });

  (pending.words || []).slice(0, 10).forEach((word) => {
    const noun = word.split(" ").pop();
    entries.push(baseEntry({
      category: "vocabulary",
      title: word,
      level,
      rule: "Wortschatz mit Artikel",
      explanation: `Themenwort aus „${title || "dem Modell"}“.`,
      examples: findWith(sourceText, noun).slice(0, 1),
      combinations: [`${word} + passendes Verb`],
      tip: "Nomen immer mit Artikel lernen.",
    }));
  });

  (pending.verbs || []).slice(0, 10).forEach((verb) => {
    entries.push(baseEntry({
      category: "verb",
      title: verb,
      level,
      rule: "Verb im Prüfungskontext",
      explanation: `Wichtiges Verb für ${typeLabel(type)} (${level}).`,
      examples: findWith(sourceText, verb).slice(0, 2),
      examSentences: findWith(sourceText, verb).slice(0, 1),
      tip: "Bilden Sie 3 eigene Sätze mit diesem Verb.",
    }));
  });

  (pending.expressions || []).slice(0, 6).forEach((expr) => {
    entries.push(baseEntry({
      category: "expression",
      title: expr.length > 60 ? `${expr.slice(0, 57)}…` : expr,
      level,
      rule: "Redemittel",
      explanation: "Nützlicher Ausdruck aus der Musterlösung.",
      examples: [expr],
      examSentences: [expr],
      tip: "Laut üben, bis der Ausdruck automatisch kommt.",
    }));
  });

  (pending.mistakes || []).forEach((mistake) => {
    entries.push(baseEntry({
      category: "mistake",
      title: mistake.split("→")[0]?.replace("❌", "").trim() || "Häufiger Fehler",
      level,
      rule: "Typischer Fehler",
      explanation: mistake,
      mistakes: [mistake],
      tip: "Die richtige Version mehrmals laut lesen.",
    }));
  });

  (pending.sentences || []).slice(0, 4).forEach((sentence) => {
    entries.push(baseEntry({
      category: "sentence",
      title: sentence.length > 50 ? `${sentence.slice(0, 47)}…` : sentence,
      level,
      rule: "Prüfungssatz",
      explanation: "Struktur und Wortschatz aus der Musterlösung übernehmen.",
      examples: [sentence],
      examSentences: [sentence],
      tip: "Struktur verstehen — nicht blind kopieren.",
    }));
  });

  return dedupe(entries);
}

function dedupe(entries) {
  const map = new Map();
  entries.forEach((e) => map.set(`${e.category}:${e.title.toLowerCase()}`, e));
  return [...map.values()];
}

function pickSentences(text, n) {
  return String(text || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 10).slice(0, n);
}

function findWith(text, needle) {
  if (!needle) return [];
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return String(text || "").split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => re.test(s) && s.length > 8);
}

function typeLabel(type) {
  return ({ schreiben: "Schreiben", bildbeschreibung: "Bildbeschreibung", planung: "Planung", lesen: "Lesen", hoeren: "Hören", sprechen: "Sprechen" })[type] || "Prüfung";
}

function typeTip(type) {
  return ({
    schreiben: "Kurz, höflich, alle Aufgabenpunkte beantworten.",
    bildbeschreibung: "Mit „Auf dem Bild sehe ich …“ beginnen.",
    planung: "Zeit, Ort und Aufgaben klären.",
    hoeren: "Uhrzeiten und Meinungen genau notieren.",
    lesen: "Ähnliche Antwortoptionen vergleichen.",
    sprechen: "Meinung begründen + Beispiel nennen.",
  })[type] || "Mit Musterlösung laut üben.";
}

export function mergeAkademieEntries(existing = [], incoming = [], mode = "append") {
  if (mode === "replace") return incoming;
  const map = new Map();
  [...(existing || []), ...(incoming || [])].forEach((entry) => {
    map.set(`${entry.category}:${entry.title}`, entry);
  });
  return [...map.values()];
}

/** On regenerate: keep approved/rejected; add only new suggestions. */
export function mergeAkademieOnRegenerate(existing = [], incoming = []) {
  const kept = (existing || []).filter(
    (e) => e.approved === true || e.approved === false || e.rejected
  );
  const known = new Set(kept.map((e) => `${e.category}:${e.title}`.toLowerCase()));
  const added = (incoming || []).filter(
    (e) => !known.has(`${e.category}:${e.title}`.toLowerCase())
  );
  return [...kept, ...added];
}
