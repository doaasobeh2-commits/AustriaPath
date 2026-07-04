/**
 * Rule-based "Extract from Content" — no external AI required.
 */

import { uniqueList } from "./contentModelSchema.js";
import { buildAkademieEntriesFromExtraction } from "./akademieFromExtraction.js";

const CONNECTOR_PATTERNS = [
  { key: "weil", rule: "weil + Nebensatz (Verb am Ende)", level: "A2" },
  { key: "deshalb", rule: "Folge / Konsequenz", level: "A2" },
  { key: "deswegen", rule: "Folge / Konsequenz", level: "B1" },
  { key: "trotzdem", rule: "Gegensatz (Hauptsatz)", level: "B1" },
  { key: "obwohl", rule: "Gegensatz (Nebensatz)", level: "B1" },
  { key: "damit", rule: "Zweck / damit + Nebensatz", level: "B1" },
  { key: "wenn", rule: "Bedingung / Zeit", level: "A2" },
  { key: "dass", rule: "dass-Satz (Verb am Ende)", level: "B1" },
  { key: "denn", rule: "Begründung im Hauptsatz", level: "A2" },
  { key: "außerdem", rule: "Ergänzung", level: "B1" },
  { key: "einerseits", rule: "einerseits … andererseits …", level: "B2" },
  { key: "andererseits", rule: "einerseits … andererseits …", level: "B2" },
];

const MODAL_VERBS = ["kann", "könnte", "können", "muss", "müssen", "müsste", "soll", "sollen", "sollte", "darf", "dürfen", "möchte", "möchten", "will", "wollen", "hätte", "würde", "wäre"];

const COMMON_VERBS = [
  "anmelden", "absagen", "verschieben", "reservieren", "beantragen", "ausfüllen",
  "helfen", "erklären", "fragen", "antworten", "organisieren", "planen", "vorschlagen",
  "mitbringen", "anrufen", "einkaufen", "bezahlen", "umtauschen", "beschweren",
  "vereinbaren", "unterschreiben", "einreichen", "sparen", "kündigen",
  "sich bewerben", "sich treffen", "sich entschuldigen", "berücksichtigen", "unterstützen",
];

const TOPIC_KEYWORDS = {
  "Arbeit & AMS": ["ams", "arbeit", "job", "bewerbung", "gehalt", "kollege", "chef"],
  "MA35 / Aufenthalt": ["ma35", "aufenthalt", "behörde", "amt", "meldezettel"],
  "Schule & Kindergarten": ["schule", "kindergarten", "kind", "lehrer", "klasse"],
  "Arzt & Apotheke": ["arzt", "praxis", "apotheke", "rezept", "krank", "untersuchung"],
  "Wohnen & Nachbarn": ["wohnung", "miete", "nachbar", "hausverwaltung", "lärm"],
  "Öffentlicher Verkehr": ["zug", "bus", "bahn", "öbb", "wiener linien", "gleis", "ticket"],
  "Bank & Versicherung": ["bank", "konto", "versicherung", "überweisen", "sparen"],
  "Behörde & Gemeinde": ["gemeinde", "magistrat", "formular", "antrag", "behörde"],
  "Familie & Kinderbetreuung": ["familie", "kind", "betreuung", "eltern"],
  "Termine & Digital Services": ["online", "portal", "digital", "app", "termin"],
};

const NOUN_ARTICLE_RE = /\b(der|die|das|ein|eine|einen|einem|einer)\s+([A-ZÄÖÜa-zäöüß][a-zäöüßA-ZÄÖÜ-]{2,})\b/g;

function combineText({ content = "", solution = "", title = "" }) {
  return [title, content, solution].filter(Boolean).join("\n\n");
}

function splitSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function extractConnectors(text, level) {
  const lower = text.toLowerCase();
  const found = [];
  CONNECTOR_PATTERNS.forEach((item) => {
    if (new RegExp(`\\b${item.key}\\b`, "i").test(lower)) {
      if (item.level === level || level !== "A2" || item.level === "A2") {
        found.push(`${item.key} — ${item.rule}`);
      }
    }
  });
  return uniqueList(found);
}

function extractGrammar(text, level) {
  const rules = [];
  const lower = text.toLowerCase();
  if (/\bweil\b/.test(lower)) rules.push("weil-Satz: Verb am Ende des Nebensatzes");
  if (/\bdass\b/.test(lower)) rules.push("dass-Satz: Verb am Ende");
  if (/\bwenn\b/.test(lower)) rules.push("wenn-Satz: Bedingung oder Zeit");
  if (/\bobwohl\b/.test(lower)) rules.push("obwohl-Satz: Gegensatz, Verb am Ende");
  if (/\bdamit\b/.test(lower)) rules.push("damit-Satz: Zweck, Verb am Ende");
  if (MODAL_VERBS.some((v) => new RegExp(`\\b${v}\\b`, "i").test(lower))) {
    rules.push("Modalverben: können, müssen, möchten, sollen, dürfen");
  }
  if (/sehr geehrte|mit freundlichen grüßen/i.test(text)) {
    rules.push("Formelle E-Mail: Anrede + Schlussformel");
  }
  if (/\bkönnten sie\b|\bhätten sie\b/i.test(text)) {
    rules.push("Höfliche Fragen: Könnten Sie …?");
  }
  if (level === "B2" && /einerseits|meiner meinung nach|ich bin der ansicht/i.test(lower)) {
    rules.push("Argumentation: Meinung begründen und abwägen");
  }
  return uniqueList(rules);
}

function extractVerbs(text) {
  const lower = text.toLowerCase();
  const found = COMMON_VERBS.filter((verb) => lower.includes(verb.toLowerCase()));
  const infinitiveRe = /\b([a-zäöüß]+en)\b/gi;
  let match;
  while ((match = infinitiveRe.exec(lower)) !== null) {
    const word = match[1];
    if (word.length >= 5 && !["sehr", "oder", "aber", "wenn", "weil"].includes(word)) found.push(word);
  }
  return uniqueList(found).slice(0, 20);
}

function extractVocabulary(text) {
  const found = [];
  let match;
  const copy = text.replace(/\n/g, " ");
  while ((match = NOUN_ARTICLE_RE.exec(copy)) !== null) {
    found.push(`${match[1]} ${match[2]}`);
  }
  return uniqueList(found).slice(0, 25);
}

function extractExpressions(text, level) {
  const expressions = [];
  [/wie wäre es mit[^.?!]+[.?!]?/gi, /ich schlage vor[^.?!]+[.?!]?/gi, /könnten sie bitte[^.?!]+[.?!]?/gi, /es tut mir leid[^.?!]+[.?!]?/gi, /meiner meinung nach[^.?!]+[.?!]?/gi].forEach((re) => {
    (text.match(re) || []).forEach((m) => expressions.push(m.trim()));
  });
  if (level === "B2") expressions.push("Einerseits …, andererseits …");
  return uniqueList(expressions).slice(0, 12);
}

function extractExamSentences(text) {
  return splitSentences(text)
    .filter((s) => s.length >= 15 && s.length <= 160 && !/^betreff:/i.test(s))
    .slice(0, 8)
    .map((s) => (s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : `${s}.`));
}

function suggestMistakes({ content, solution, level }) {
  const sample = `${content}\n${solution}`.toLowerCase();
  const mistakes = [];
  if (/\bweil ich bin\b/.test(sample)) mistakes.push("❌ … weil ich bin … → ✅ … weil ich … bin");
  if (/\bweil es gibt\b/.test(sample)) mistakes.push("❌ weil es gibt … → ✅ weil es … gibt");
  if (/\bhabe termin\b/.test(sample)) mistakes.push("❌ Ich habe Termin → ✅ Ich habe einen Termin");
  if (/\bin die arbeit\b/.test(sample)) mistakes.push("❌ in die Arbeit → ✅ bei der Arbeit");
  if (level !== "A2" && /\bmehr wie\b/.test(sample)) mistakes.push("❌ mehr wie → ✅ mehr als");
  return uniqueList(mistakes);
}

function suggestTopicTags(text) {
  const lower = text.toLowerCase();
  return uniqueList(
    Object.entries(TOPIC_KEYWORDS)
      .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
      .map(([tag]) => tag)
  );
}

export function extractFromContent({ content = "", solution = "", title = "", level = "A2", type = "schreiben" }) {
  const combined = combineText({ content, solution, title });
  if (!combined.trim()) return { error: "Bitte zuerst Aufgabe oder Musterlösung eingeben." };

  const pendingPlain = {
    grammar: extractGrammar(combined, level),
    konnektoren: extractConnectors(combined, level),
    verbs: extractVerbs(combined),
    words: extractVocabulary(combined),
    expressions: extractExpressions(combined, level),
    sentences: extractExamSentences(solution || content),
    satzbau: uniqueList([
      ...extractExamSentences(solution || content),
      ...extractExamSentences(content).slice(0, 3),
    ]),
    mistakes: suggestMistakes({ content, solution, level }),
    topicTags: suggestTopicTags(combined),
  };

  const akademieEntries = buildAkademieEntriesFromExtraction({
    pending: pendingPlain,
    level,
    type,
    title,
    content,
    solution,
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceLength: combined.length,
    pending: pendingPlain,
    akademieEntries,
    summary: Object.fromEntries(
      Object.entries(pendingPlain).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
    ),
  };
}

function toList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "").split("\n").map((s) => s.trim()).filter(Boolean);
}

export function approveExtractionFields(extraction, fieldsToApprove = []) {
  if (!extraction?.pending) return extraction;
  const approved = { ...(extraction.approved || {}) };
  fieldsToApprove.forEach((field) => {
    if (extraction.pending[field]) {
      approved[field] = uniqueList([...toList(approved[field]), ...toList(extraction.pending[field])]);
    }
  });
  const clearedPending = { ...extraction.pending };
  fieldsToApprove.forEach((f) => { clearedPending[f] = []; });
  return { ...extraction, approved, pending: clearedPending };
}

export function approveAkademieEntries(entries = [], ids = []) {
  const idSet = new Set(ids);
  return entries.map((entry) => (idSet.has(entry.id) ? { ...entry, approved: true } : entry));
}

export function approveAllExtraction(extraction) {
  if (!extraction?.pending) return extraction;
  return approveExtractionFields(extraction, Object.keys(extraction.pending));
}
