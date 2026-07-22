const PREFIX = "austriaPathPlacementInProgress:";
const HISTORY_KEY = "austriaPathPlacementRecentContent";
export const PLACEMENT_HISTORY_LIMIT = 5;

function keyFor(attemptId) {
  return PREFIX + String(attemptId || "").trim();
}

export function loadPlacementSession(attemptId) {
  if (!attemptId) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(attemptId)) || "null");
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function savePlacementSession(attemptId, snapshot) {
  if (!attemptId || !snapshot) return;
  localStorage.setItem(
    keyFor(attemptId),
    JSON.stringify({ version: 1, ...snapshot, savedAt: new Date().toISOString() })
  );
}

export function clearPlacementSession(attemptId) {
  if (!attemptId) return;
  localStorage.removeItem(keyFor(attemptId));
}

export function loadPlacementRecentContent() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, PLACEMENT_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function recordCompletedPlacementContent(entry) {
  if (!entry?.attemptId) return;
  const bounded = [entry, ...loadPlacementRecentContent().filter(
    (item) => item?.attemptId !== entry.attemptId
  )].slice(0, PLACEMENT_HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(bounded));
}

export function recentPlacementContentIds(kind) {
  return loadPlacementRecentContent()
    .map((entry) => entry?.[kind])
    .filter(Boolean);
}
