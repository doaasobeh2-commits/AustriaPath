const PREFIX = "austriaPathPlacementInProgress:";

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
