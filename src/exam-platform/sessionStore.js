/**
 * Exam session persistence — in-memory with optional Storage adapter.
 *
 * @module exam-platform/sessionStore
 */

export const EXAM_SESSION_STORAGE_KEY = "austriaPathExamSession";

/** @type {Map<string, import('./contracts.js').ExamSessionState>} */
const memorySessions = new Map();

function uid(prefix = "sess") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {import('./contracts.js').ExamSessionState} session
 * @param {Storage|null|undefined} storage
 */
export function saveSession(session, storage) {
  memorySessions.set(session.sessionId, session);
  if (storage) {
    try {
      storage.setItem(
        EXAM_SESSION_STORAGE_KEY,
        JSON.stringify({
          activeSessionId: session.sessionId,
          sessions: Object.fromEntries(memorySessions),
        })
      );
    } catch {
      /* quota — memory only */
    }
  }
  return session;
}

/**
 * @param {string} sessionId
 * @param {Storage|null|undefined} storage
 * @returns {import('./contracts.js').ExamSessionState|undefined}
 */
export function loadSession(sessionId, storage) {
  if (memorySessions.has(sessionId)) {
    return memorySessions.get(sessionId);
  }
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(EXAM_SESSION_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const session = parsed?.sessions?.[sessionId];
    if (session) memorySessions.set(sessionId, session);
    return session;
  } catch {
    return undefined;
  }
}

/**
 * @param {import('./contracts.js').ExamBlueprint} blueprint
 * @param {import('./contracts.js').ProductType} productType
 * @param {import('./contracts.js').ExamMode} mode
 * @returns {import('./contracts.js').ExamSessionState}
 */
export function createSessionState(blueprint, productType, mode) {
  const now = Date.now();
  return {
    sessionId: uid(),
    productType,
    mode,
    blueprint,
    currentSectionIndex: 0,
    answers: [],
    evaluations: [],
    status: "active",
    startedAt: now,
  };
}

export function clearAllSessions() {
  memorySessions.clear();
}

export const sessionStore = {
  saveSession,
  loadSession,
  createSessionState,
  clearAllSessions,
  EXAM_SESSION_STORAGE_KEY,
};
