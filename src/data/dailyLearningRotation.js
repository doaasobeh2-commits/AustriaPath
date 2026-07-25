import { DAILY_LEARNING_STORAGE_KEY } from "../constants/dailyLearningKeys.js";
import { dailyLearningCardsByLevel } from "./dailyLearningBank.js";
import { DAILY_SLOT_ORDER, getDailySlotGroup } from "./dailyLearningCategories.js";
import { readJsonStorage, writeJsonStorage } from "../security/secureStorage.js";

const CARDS_PER_DAY = 3;

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function defaultState(level) {
  const pool = (dailyLearningCardsByLevel[level] || []).map((c) => c.id);
  return {
    level,
    lastDate: null,
    cycleQueue: shuffle(pool),
    cyclePosition: 0,
    todayCardIds: [],
    sessionComplete: false,
  };
}

function loadState(level) {
  const saved = readJsonStorage(DAILY_LEARNING_STORAGE_KEY, null);
  if (!saved || saved.level !== level) {
    return defaultState(level);
  }
  return saved;
}

function saveState(state) {
  writeJsonStorage(DAILY_LEARNING_STORAGE_KEY, state);
}

function pickThreeCards(state, level) {
  const pool = dailyLearningCardsByLevel[level] || [];
  const idToCard = new Map(pool.map((c) => [c.id, c]));
  let queue = [...state.cycleQueue];
  let position = state.cyclePosition;

  if (position >= queue.length || queue.length === 0) {
    queue = shuffle(pool.map((c) => c.id));
    position = 0;
  }

  const picked = [];
  const usedCategories = new Set();
  let searchFrom = position;

  for (const slot of DAILY_SLOT_ORDER) {
    let found = null;
    for (let i = searchFrom; i < queue.length; i += 1) {
      const id = queue[i];
      const card = idToCard.get(id);
      if (!card || usedCategories.has(card.category)) continue;
      const group = getDailySlotGroup(card.category);
      const matches =
        slot === group ||
        (slot === "scene" && (group === "scene" || group === "dialogue")) ||
        (slot === "mixed" && group === "mixed") ||
        (slot === "communication" && group === "communication");
      if (matches) {
        found = { id, index: i };
        break;
      }
    }

    if (!found) {
      for (let i = searchFrom; i < queue.length; i += 1) {
        const id = queue[i];
        const card = idToCard.get(id);
        if (!card || usedCategories.has(card.category)) continue;
        found = { id, index: i };
        break;
      }
    }

    if (!found) break;

    const card = idToCard.get(found.id);
    picked.push(found.id);
    usedCategories.add(card.category);
    queue.splice(found.index, 1);
    if (found.index < searchFrom) searchFrom -= 1;
  }

  while (picked.length < CARDS_PER_DAY && searchFrom < queue.length) {
    const id = queue[searchFrom];
    const card = idToCard.get(id);
    if (card && !usedCategories.has(card.category)) {
      picked.push(id);
      usedCategories.add(card.category);
      queue.splice(searchFrom, 1);
    } else {
      searchFrom += 1;
    }
  }

  while (picked.length < CARDS_PER_DAY && queue.length > 0) {
    picked.push(queue.shift());
  }

  return {
    todayCardIds: picked.slice(0, CARDS_PER_DAY),
    cycleQueue: queue,
    cyclePosition: position + picked.length,
  };
}

export function getDailyLearningSession(level) {
  let state = loadState(level);
  const today = todayKey();

  if (state.lastDate !== today) {
    const next = pickThreeCards(state, level);
    state = {
      ...state,
      level,
      lastDate: today,
      todayCardIds: next.todayCardIds,
      cycleQueue: next.cycleQueue,
      cyclePosition: next.cyclePosition,
      sessionComplete: false,
    };
    saveState(state);
  }

  const pool = dailyLearningCardsByLevel[level] || [];
  const cards = state.todayCardIds
    .map((id) => pool.find((c) => c.id === id))
    .filter(Boolean);

  return {
    cards,
    sessionComplete: Boolean(state.sessionComplete),
    level,
  };
}

export function markDailyLearningSessionComplete(level) {
  const state = loadState(level);
  if (state.lastDate !== todayKey()) return;
  saveState({ ...state, sessionComplete: true });
}

export function resetDailyLearningStateForTests() {
  localStorage.removeItem(DAILY_LEARNING_STORAGE_KEY);
}
