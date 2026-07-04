/**
 * Admin content persistence and unified feed helpers.
 */

import {
  normalizeContentModel,
  syncLegacyFields,
  toExamFeedItem,
  flattenAkademieFromModel,
  toList,
  uniqueList,
} from "../content/contentModelSchema.js";

export const ADMIN_STORAGE_KEY = "austriaPathAdminData";

export function getAdminItems() {
  try {
    const data = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.map(normalizeContentModel) : [];
  } catch {
    return [];
  }
}

export function saveAdminItems(items) {
  const normalized = items.map((item) => syncLegacyFields(normalizeContentModel(item)));
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(normalized));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("austriaPathContentUpdated"));
  }
  return normalized;
}

export function getPublishedAdminItems({ type, level } = {}) {
  return getAdminItems().filter((item) => {
    const isPublished = item.status === "published";
    const matchType = type ? String(item.type).toLowerCase() === String(type).toLowerCase() : true;
    const matchLevel = level ? item.level === level : true;
    return isPublished && matchType && matchLevel;
  });
}

export function getAdminItemsByType(type, level) {
  return getPublishedAdminItems({ type, level });
}

/** Unified exam feed for student screens. */
export function getExamFeed({ type, level, includeDraft = false } = {}) {
  return getAdminItems()
    .filter((item) => (includeDraft ? true : item.status === "published"))
    .filter((item) => (type ? item.type === type : true))
    .filter((item) => (level ? item.level === level : true))
    .map(toExamFeedItem);
}

/** Akademie data aggregated from published admin models for a level. */
export function getAdminAkademieFeed(level) {
  const items = getPublishedAdminItems({ level });
  const merged = {
    grammar: [],
    satzbau: [],
    konnektoren: [],
    words: [],
    verbs: [],
    mistakes: [],
    akademieEntries: [],
  };

  items.forEach((item) => {
    const flat = flattenAkademieFromModel(item);
    merged.grammar.push(...flat.grammar);
    merged.satzbau.push(...flat.satzbau);
    merged.konnektoren.push(...flat.konnektoren);
    merged.words.push(...flat.words);
    merged.verbs.push(...flat.verbs);
    merged.mistakes.push(...flat.mistakes);
    merged.akademieEntries.push(...(flat.akademieEntries || []));
  });

  return {
    grammar: uniqueList(merged.grammar),
    satzbau: uniqueList(merged.satzbau),
    konnektoren: uniqueList(merged.konnektoren),
    words: uniqueList(merged.words),
    verbs: uniqueList(merged.verbs),
    mistakes: uniqueList(merged.mistakes),
    akademieEntries: merged.akademieEntries,
  };
}

export function buildContentPayload(form, { parentModel } = {}) {
  const payload = {
    type: form.type,
    level: form.level,
    title: form.title.trim(),
    content: form.content.trim(),
    solution: form.solution.trim(),
    status: form.status,
    difficulty: form.difficulty || "medium",
    topicTags: toList(form.topicTags),
    examId: form.examId.trim(),
    examType: form.examType,
    examCenter: form.examCenter.trim(),
    examDate: form.examDate,
    city: form.city.trim(),
    state: form.state.trim(),
    imageUrl: form.imageUrl,
    audioUrl: form.audioUrl,
    grammar: toList(form.grammar),
    satzbau: toList(form.satzbau),
    konnektoren: toList(form.konnektoren),
    words: toList(form.words),
    verbs: toList(form.verbs),
    expressions: toList(form.expressions),
    mistakes: toList(form.mistakes),
    sentences: toList(form.sentences),
    confirmations: Number(form.confirmations || 1),
    modelMode: form.modelMode,
    parentModelId: form.parentModelId,
    parentModelTitle: parentModel?.title || "",
    parentModelLevel: parentModel?.level || form.level,
    isChildContent: form.modelMode === "existing",
    extraction: form.extraction,
    akademieEntries: form.akademieEntries || [],
  };

  return syncLegacyFields(normalizeContentModel(payload));
}

export function getContentStats(items = getAdminItems()) {
  return {
    total: items.length,
    draft: items.filter((i) => i.status === "draft").length,
    review: items.filter((i) => i.status === "review").length,
    published: items.filter((i) => i.status === "published").length,
    archived: items.filter((i) => i.status === "archived").length,
  };
}

export function getCalculatedStatus(item) {
  if (item.status === "archived") return "archived";
  if (item.status === "published") return "published";
  if (item.status === "review") return "review";
  if (!item.lastConfirmed) return "draft";

  const diffDays = Math.floor((Date.now() - new Date(item.lastConfirmed)) / (86400000));
  if (diffDays > 365) return "old";
  if ((item.confirmations || 0) >= 5 && diffDays <= 180) return "hot";
  return item.status || "draft";
}

export function getImportanceScore(item) {
  const confirmationsScore = Number(item.confirmations || 0) * 10;
  if (!item.lastConfirmed) return confirmationsScore;
  const diffDays = Math.floor((Date.now() - new Date(item.lastConfirmed)) / (86400000));
  return confirmationsScore - Math.floor(diffDays / 30);
}
