/**
 * Unified AustriaPath content model — single source of truth for admin → student feeds.
 * Backward-compatible with legacy flat fields in austriaPathAdminData.
 */

export const CONTENT_TYPES = [
  "schreiben",
  "bildbeschreibung",
  "planung",
  "lesen",
  "hoeren",
  "sprechen",
  "erfahrung",
];

export const CONTENT_STATUSES = ["draft", "review", "published", "archived"];

export const DIFFICULTY_LEVELS = ["medium", "strong"];

export const TOPIC_SUGGESTIONS = [
  "Arbeit & AMS",
  "MA35 / Aufenthalt",
  "Schule & Kindergarten",
  "Arzt & Apotheke",
  "Wohnen & Nachbarn",
  "Öffentlicher Verkehr",
  "Bank & Versicherung",
  "Behörde & Gemeinde",
  "Familie & Kinderbetreuung",
  "Termine & Digital Services",
];

export function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueList(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const value = String(item || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (!map.has(key)) map.set(key, value);
  });
  return [...map.values()];
}

/** Sync legacy flat arrays from approved extraction + manual fields. */
export function syncLegacyFields(model = {}) {
  const approved = model.extraction?.approved || {};
  const manual = {
    grammar: toList(model.grammar),
    satzbau: toList(model.satzbau),
    konnektoren: toList(model.konnektoren),
    words: toList(model.words),
    verbs: toList(model.verbs),
    expressions: toList(model.expressions),
    mistakes: toList(model.mistakes),
    sentences: toList(model.sentences),
  };

  const merged = {
    grammar: uniqueList([...manual.grammar, ...toList(approved.grammar)]),
    satzbau: uniqueList([...manual.satzbau, ...toList(approved.satzbau)]),
    konnektoren: uniqueList([...manual.konnektoren, ...toList(approved.konnektoren)]),
    words: uniqueList([...manual.words, ...toList(approved.words)]),
    verbs: uniqueList([...manual.verbs, ...toList(approved.verbs)]),
    expressions: uniqueList([...manual.expressions, ...toList(approved.expressions)]),
    mistakes: uniqueList([...manual.mistakes, ...toList(approved.mistakes)]),
    sentences: uniqueList([...manual.sentences, ...toList(approved.sentences)]),
  };

  const akademieEntries = Array.isArray(model.akademieEntries) ? model.akademieEntries : [];

  return {
    ...model,
    ...merged,
    grammar: merged.grammar,
    satzbau: uniqueList([...merged.satzbau, ...merged.expressions]),
    konnektoren: merged.konnektoren,
    words: merged.words,
    verbs: merged.verbs,
    expressions: merged.expressions,
    mistakes: merged.mistakes,
    sentences: merged.sentences,
    akademieEntries,
    published: model.status === "published",
  };
}

export function normalizeContentModel(raw = {}) {
  const base = {
    id: raw.id ?? Date.now(),
    type: raw.type || "schreiben",
    level: raw.level || "A2",
    title: String(raw.title || "").trim(),
    content: String(raw.content || "").trim(),
    solution: String(raw.solution || "").trim(),
    status: raw.status || "draft",
    difficulty: raw.difficulty || "medium",
    topicTags: toList(raw.topicTags),
    examId: String(raw.examId || "").trim(),
    examType: raw.examType || "Alltagsorientiert",
    examCenter: String(raw.examCenter || "").trim(),
    examDate: raw.examDate || "",
    city: String(raw.city || "").trim(),
    state: String(raw.state || "").trim(),
    imageUrl: raw.imageUrl || "",
    audioUrl: raw.audioUrl || "",
    grammar: toList(raw.grammar),
    satzbau: toList(raw.satzbau),
    konnektoren: toList(raw.konnektoren),
    words: toList(raw.words),
    verbs: toList(raw.verbs),
    expressions: toList(raw.expressions),
    mistakes: toList(raw.mistakes),
    sentences: toList(raw.sentences),
    confirmations: Number(raw.confirmations || 1),
    modelMode: raw.modelMode || "new",
    parentModelId: raw.parentModelId || "",
    parentModelTitle: raw.parentModelTitle || "",
    parentModelLevel: raw.parentModelLevel || raw.level || "A2",
    isChildContent: Boolean(raw.isChildContent),
    extraction: raw.extraction || null,
    akademieEntries: Array.isArray(raw.akademieEntries) ? raw.akademieEntries : [],
    cities: toList(raw.cities),
    states: toList(raw.states),
    examDates: toList(raw.examDates),
    examCenters: toList(raw.examCenters),
    lastConfirmed: raw.lastConfirmed || "",
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || "",
    history: Array.isArray(raw.history) ? raw.history : [],
  };

  return syncLegacyFields(base);
}

/** Map unified model to exam-screen shapes (Writing, Database, etc.). */
export function toExamFeedItem(model) {
  const item = normalizeContentModel(model);
  return {
    id: `admin-${item.id}`,
    title: item.title,
    level: item.level,
    type: item.type,
    content: item.content,
    solution: item.solution,
    task: toList(item.content),
    schreiben: item.solution,
    grammar: item.grammar,
    satzbau: item.satzbau,
    konnektoren: item.konnektoren,
    words: item.words,
    verbs: item.verbs,
    expressions: item.expressions,
    mistakes: item.mistakes,
    sentences: item.sentences,
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    topicTags: item.topicTags,
    difficulty: item.difficulty,
    source: "admin",
    status: item.status,
    akademieEntries: item.akademieEntries,
  };
}

/** Flatten rich Akademie entries into list fields for AkademieScreen tabs. */
export function flattenAkademieFromModel(model) {
  const item = normalizeContentModel(model);
  const fromEntries = { grammar: [], satzbau: [], konnektoren: [], words: [], verbs: [], mistakes: [] };

  item.akademieEntries.forEach((entry) => {
    if (entry.approved !== true) return;
    const line =
      entry.category === "grammar" || entry.category === "connector"
        ? `${entry.title}${entry.rule ? ` — ${entry.rule}` : ""}`
        : entry.title;

    const bucket =
      entry.category === "grammar"
        ? "grammar"
        : entry.category === "connector"
          ? "konnektoren"
          : entry.category === "vocabulary"
            ? "words"
            : entry.category === "verb"
              ? "verbs"
              : entry.category === "mistake"
                ? "mistakes"
                : entry.category === "expression"
              ? "satzbau"
              : entry.category === "sentence"
                  ? "satzbau"
                  : "grammar";

    fromEntries[bucket].push(line);
    (entry.examSentences || []).forEach((s) => fromEntries.satzbau.push(s));
    (entry.mistakes || []).forEach((m) => fromEntries.mistakes.push(m));
  });

  return {
    grammar: uniqueList([...item.grammar, ...fromEntries.grammar]),
    satzbau: uniqueList([...item.satzbau, ...item.sentences, ...item.expressions, ...fromEntries.satzbau]),
    konnektoren: uniqueList([...item.konnektoren, ...fromEntries.konnektoren]),
    words: uniqueList([...item.words, ...fromEntries.words]),
    verbs: uniqueList([...item.verbs, ...fromEntries.verbs]),
    mistakes: uniqueList([...item.mistakes, ...fromEntries.mistakes]),
    akademieEntries: item.akademieEntries.filter((e) => e.approved === true),
  };
}

export function createEmptyFormState() {
  return {
    editingId: null,
    modelMode: "new",
    parentModelId: "",
    type: "schreiben",
    level: "A2",
    title: "",
    content: "",
    solution: "",
    status: "draft",
    difficulty: "medium",
    topicTags: "",
    examId: "",
    examType: "Alltagsorientiert",
    examCenter: "",
    examDate: "",
    city: "",
    state: "",
    imageUrl: "",
    audioUrl: "",
    grammar: "",
    satzbau: "",
    konnektoren: "",
    words: "",
    verbs: "",
    expressions: "",
    mistakes: "",
    sentences: "",
    confirmations: 1,
    extraction: null,
    akademieEntries: [],
  };
}

export function modelToFormState(item) {
  return {
    editingId: item.id,
    modelMode: item.modelMode || "new",
    parentModelId: item.parentModelId || "",
    type: item.type || "schreiben",
    level: item.level || "A2",
    title: item.title || "",
    content: item.content || "",
    solution: item.solution || "",
    status: item.status || "draft",
    difficulty: item.difficulty || "medium",
    topicTags: toList(item.topicTags).join("\n"),
    examId: item.examId || "",
    examType: item.examType || "Alltagsorientiert",
    examCenter: item.examCenter || "",
    examDate: item.examDate || "",
    city: item.city || "",
    state: item.state || "",
    imageUrl: item.imageUrl || "",
    audioUrl: item.audioUrl || "",
    grammar: toList(item.grammar).join("\n"),
    satzbau: toList(item.satzbau).join("\n"),
    konnektoren: toList(item.konnektoren).join("\n"),
    words: toList(item.words).join("\n"),
    verbs: toList(item.verbs).join("\n"),
    expressions: toList(item.expressions).join("\n"),
    mistakes: toList(item.mistakes).join("\n"),
    sentences: toList(item.sentences).join("\n"),
    confirmations: item.confirmations || 1,
    extraction: item.extraction || null,
    akademieEntries: item.akademieEntries || [],
  };
}
