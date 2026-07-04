/**
 * Extraction review state: per-item approve / reject / edit and safe regeneration merge.
 */

import { uniqueList } from "./contentModelSchema.js";

const EXTRACTION_FIELDS = [
  "grammar",
  "satzbau",
  "konnektoren",
  "words",
  "verbs",
  "expressions",
  "mistakes",
  "sentences",
  "topicTags",
];

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .slice(0, 40);
}

export function createSuggestion(text, field) {
  const value = String(text || "").trim();
  return {
    id: `s-${field}-${slug(value)}-${value.length}`,
    text: value,
    status: "pending",
  };
}

/** Normalize legacy string[] or structured suggestions. */
export function normalizeSuggestions(items, field) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return createSuggestion(item, field);
      if (item && typeof item === "object") {
        return {
          id: item.id || createSuggestion(item.text, field).id,
          text: String(item.text || "").trim(),
          status: item.status || "pending",
        };
      }
      return null;
    })
    .filter((item) => item && item.text);
}

export function pendingToPlainArrays(pending = {}) {
  const plain = {};
  EXTRACTION_FIELDS.forEach((field) => {
    plain[field] = normalizeSuggestions(pending[field], field)
      .filter((s) => s.status === "pending")
      .map((s) => s.text);
  });
  return plain;
}

function collectTexts(set, extraction, source) {
  EXTRACTION_FIELDS.forEach((field) => {
    const list = extraction?.[source]?.[field];
    if (!list) return;
    normalizeSuggestions(list, field).forEach((s) => set.add(s.text.toLowerCase()));
    if (Array.isArray(list) && list.every((x) => typeof x === "string")) {
      list.forEach((t) => set.add(String(t).toLowerCase()));
    }
  });
}

function buildKnownTextSet(extraction, formLists = {}) {
  const known = new Set();
  if (!extraction) return known;

  collectTexts(known, extraction, "approved");
  collectTexts(known, extraction, "rejected");

  EXTRACTION_FIELDS.forEach((field) => {
    (formLists[field] || []).forEach((t) => known.add(String(t).toLowerCase()));
  });

  return known;
}

/**
 * Merge new extraction into existing state.
 * merge (default): keep approved/rejected; only add new pending suggestions.
 * replace: clear pending; optionally clear rejected; never removes form fields or approved akademie.
 */
export function mergeExtraction(previous, incoming, { mode = "merge", formLists = {} } = {}) {
  if (!incoming || incoming.error) return incoming;

  const structuredIncoming = Object.fromEntries(
    EXTRACTION_FIELDS.map((field) => [
      field,
      normalizeSuggestions(incoming.pending?.[field], field),
    ])
  );

  if (!previous) {
    return {
      ...incoming,
      pending: structuredIncoming,
      approved: {},
      rejected: {},
    };
  }

  if (mode === "replace") {
    return {
      ...incoming,
      approved: previous.approved || {},
      rejected: {},
      pending: structuredIncoming,
    };
  }

  const known = buildKnownTextSet(previous, formLists);
  const pending = {};

  EXTRACTION_FIELDS.forEach((field) => {
    const incomingItems = normalizeSuggestions(incoming.pending?.[field], field);
    pending[field] = incomingItems.filter((item) => !known.has(item.text.toLowerCase()));
  });

  return {
    ...incoming,
    approved: previous.approved || {},
    rejected: previous.rejected || {},
    pending,
  };
}

export function approveSuggestion(extraction, field, suggestionId) {
  if (!extraction?.pending) return { extraction, approvedText: null };

  const pending = normalizeSuggestions(extraction.pending[field], field);
  const target = pending.find((s) => s.id === suggestionId);
  if (!target) return { extraction, approvedText: null };

  const remaining = pending.filter((s) => s.id !== suggestionId);
  const approved = { ...(extraction.approved || {}) };
  approved[field] = uniqueList([...(approved[field] || []), target.text]);

  const next = {
    ...extraction,
    approved,
    pending: { ...extraction.pending, [field]: remaining },
  };

  return { extraction: next, approvedText: target.text };
}

export function rejectSuggestion(extraction, field, suggestionId) {
  if (!extraction?.pending) return extraction;

  const pending = normalizeSuggestions(extraction.pending[field], field);
  const target = pending.find((s) => s.id === suggestionId);
  if (!target) return extraction;

  const rejected = { ...(extraction.rejected || {}) };
  rejected[field] = uniqueList([...(rejected[field] || []), target.text]);

  return {
    ...extraction,
    rejected,
    pending: {
      ...extraction.pending,
      [field]: pending.filter((s) => s.id !== suggestionId),
    },
  };
}

export function editSuggestion(extraction, field, suggestionId, newText) {
  if (!extraction?.pending) return extraction;
  const text = String(newText || "").trim();
  if (!text) return extraction;

  const pending = normalizeSuggestions(extraction.pending[field], field).map((s) =>
    s.id === suggestionId ? { ...s, text, id: createSuggestion(text, field).id } : s
  );

  return {
    ...extraction,
    pending: { ...extraction.pending, [field]: pending },
  };
}

export function approveAllPending(extraction) {
  if (!extraction?.pending) return extraction;

  let next = extraction;
  EXTRACTION_FIELDS.forEach((field) => {
    const items = normalizeSuggestions(next.pending[field], field);
    items.forEach((item) => {
      const result = approveSuggestion(next, field, item.id);
      next = result.extraction;
    });
  });
  return next;
}

export function rejectAkademieEntry(entries, id) {
  return entries.map((e) => (e.id === id ? { ...e, approved: false, rejected: true } : e));
}

export function countPending(extraction) {
  if (!extraction?.pending) return 0;
  return EXTRACTION_FIELDS.reduce(
    (sum, field) => sum + normalizeSuggestions(extraction.pending[field], field).length,
    0
  );
}

export { EXTRACTION_FIELDS };
