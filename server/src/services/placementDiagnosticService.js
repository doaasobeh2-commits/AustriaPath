/**
 * Hidden placement diagnostic persistence — PostgreSQL/Neon (admin-only).
 */

import { query, withTransaction } from "../db/client.js";

const DEFAULT_CONFIG = Object.freeze({
  autoCaptureEnabled: true,
  captureLimit: 20,
  completedCaptureCount: 0,
});

/** Technical runtime events that may be stored after the first 20 complete sessions. */
export const POST_LIMIT_TECHNICAL_ISSUE_TYPES = Object.freeze([
  "evaluator_timeout",
  "network_provider_error",
  "evaluator_failure",
  "invalid_structured_output",
  "retry_performed",
  "idempotency_recovery",
  "stt_failure",
  "unexpected_runtime_exception",
  "planning_audio_playback_error",
  "unrecoverable_session_interruption",
]);

const POST_LIMIT_TECHNICAL_SET = new Set(POST_LIMIT_TECHNICAL_ISSUE_TYPES);

const POST_LIMIT_EXCLUDED_ISSUE_TYPES = new Set([
  "simplified_rephrase_used",
  "off_topic_after_rephrase",
  "low_routing_confidence",
  "no_listening_evidence",
  "answer_too_short_validation",
  "duplicate_request_prevented",
  "premature_question_prevented",
  "premature_audio_prevented",
  "stt_low_confidence",
  "repeated_covered_question_prevented",
  "fallback_path",
  "stage_mismatch",
  "invalid_question_selection",
]);

export function issueQualifiesForPostLimitCapture(issue) {
  const type = String(issue?.type || "").trim();
  if (!type || POST_LIMIT_EXCLUDED_ISSUE_TYPES.has(type)) return false;
  if (!POST_LIMIT_TECHNICAL_SET.has(type)) return false;
  if (
    (type === "retry_performed" || type === "idempotency_recovery") &&
    !issue.recoveryAttempted
  ) {
    return false;
  }
  return true;
}

export function sessionQualifiesForPostLimitCapture(session) {
  const issues = Array.isArray(session?.issues) ? session.issues : [];
  return issues.some((issue) => issueQualifiesForPostLimitCapture(issue));
}

export async function isFullCaptureSlotAvailable({ qaMode = false } = {}) {
  return canAutoCapturePlacementDiagnostic({ qaMode });
}

function normalizeAttemptId(attemptId) {
  return String(attemptId || "").trim();
}

function mapConfig(row) {
  if (!row) return { ...DEFAULT_CONFIG };
  return {
    autoCaptureEnabled: Boolean(row.auto_capture_enabled),
    captureLimit: Number(row.capture_limit),
    completedCaptureCount: Number(row.completed_capture_count),
  };
}

function mapIndexEntry(row) {
  return {
    attemptId: row.attempt_id,
    sessionId: row.session_id,
    userId: row.user_id,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    qaMode: Boolean(row.qa_mode),
    captured: Boolean(row.captured),
    captureMode: row.capture_mode,
    errorOnlyCapture: Boolean(row.error_only_capture),
    issueSummary: row.issue_summary || { count: 0, hasIssues: false },
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function rowToSession(row) {
  if (!row) return null;
  const payload =
    row.payload && typeof row.payload === "object" ? row.payload : {};
  return {
    ...payload,
    attemptId: row.attempt_id,
    userId: row.user_id,
    captured: Boolean(row.captured),
    captureMode: row.capture_mode,
    errorOnlyCapture: Boolean(row.error_only_capture),
    completedCounted: row.completed_counted ? true : undefined,
    startedAt: row.started_at
      ? new Date(row.started_at).toISOString()
      : payload.startedAt,
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : payload.completedAt,
    issueSummary: row.issue_summary || payload.issueSummary,
    labReplay: row.lab_replay || payload.labReplay || null,
  };
}

async function ensureConfigRow(q = query) {
  await q(
    `INSERT INTO placement_diagnostic_config (id)
     VALUES (1)
     ON CONFLICT (id) DO NOTHING`
  );
}

async function loadConfig(q = query, { forUpdate = false } = {}) {
  await ensureConfigRow(q);
  const { rows } = await q(
    `SELECT auto_capture_enabled, capture_limit, completed_capture_count
     FROM placement_diagnostic_config
     WHERE id = 1
     ${forUpdate ? "FOR UPDATE" : ""}`
  );
  return mapConfig(rows[0]);
}

async function loadSessionRow(q, attemptId, { forUpdate = false } = {}) {
  const id = normalizeAttemptId(attemptId);
  if (!id) return null;
  const { rows } = await q(
    `SELECT *
     FROM placement_diagnostic_sessions
     WHERE attempt_id = $1
     ${forUpdate ? "FOR UPDATE" : ""}`,
    [id]
  );
  return rows[0] || null;
}

function buildPayload(session, userId, attemptId, extras = {}) {
  return {
    ...(session && typeof session === "object" ? session : {}),
    userId,
    attemptId,
    ...extras,
  };
}

async function upsertSessionRow(
  q,
  {
    attemptId,
    userId,
    session,
    captureMode,
    errorOnlyCapture,
    captured,
    qaMode,
    completedCounted,
    labReplay,
  }
) {
  const id = normalizeAttemptId(attemptId);
  const payload = buildPayload(session, userId, id, {
    captureMode,
    errorOnlyCapture,
    captured,
    syncedAt: new Date().toISOString(),
  });
  const issueSummary = session?.issueSummary || { count: 0, hasIssues: false };
  await q(
    `INSERT INTO placement_diagnostic_sessions (
       attempt_id, user_id, session_id, capture_mode, error_only_capture,
       captured, qa_mode, completed_counted, started_at, completed_at,
       issue_summary, payload, lab_replay
     ) VALUES (
       $1, $2, $3, $4, $5,
       $6, $7, $8, $9, $10,
       $11::jsonb, $12::jsonb, $13::jsonb
     )
     ON CONFLICT (attempt_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       session_id = EXCLUDED.session_id,
       capture_mode = EXCLUDED.capture_mode,
       error_only_capture = EXCLUDED.error_only_capture,
       captured = EXCLUDED.captured,
       qa_mode = EXCLUDED.qa_mode,
       completed_counted = CASE
         WHEN placement_diagnostic_sessions.completed_counted THEN TRUE
         ELSE EXCLUDED.completed_counted
       END,
       started_at = COALESCE(EXCLUDED.started_at, placement_diagnostic_sessions.started_at),
       completed_at = COALESCE(EXCLUDED.completed_at, placement_diagnostic_sessions.completed_at),
       issue_summary = EXCLUDED.issue_summary,
       payload = EXCLUDED.payload,
       lab_replay = COALESCE(EXCLUDED.lab_replay, placement_diagnostic_sessions.lab_replay),
       updated_at = NOW()`,
    [
      id,
      userId || null,
      id,
      captureMode,
      errorOnlyCapture,
      captured,
      qaMode,
      Boolean(completedCounted),
      session?.startedAt || null,
      session?.completedAt || null,
      JSON.stringify(issueSummary),
      JSON.stringify(payload),
      labReplay ? JSON.stringify(labReplay) : null,
    ]
  );
}

export async function getPlacementDiagnosticConfig() {
  return loadConfig();
}

export async function updatePlacementDiagnosticConfig(patch = {}) {
  return withTransaction(async (q) => {
    const current = await loadConfig(q, { forUpdate: true });
    const next = {
      ...current,
      ...(patch.autoCaptureEnabled != null
        ? { autoCaptureEnabled: Boolean(patch.autoCaptureEnabled) }
        : {}),
      ...(Number.isFinite(Number(patch.captureLimit))
        ? { captureLimit: Math.max(1, Number(patch.captureLimit)) }
        : {}),
    };
    await q(
      `UPDATE placement_diagnostic_config
       SET auto_capture_enabled = $2,
           capture_limit = $3,
           updated_at = NOW()
       WHERE id = 1`,
      [1, next.autoCaptureEnabled, next.captureLimit]
    );
    return next;
  });
}

export async function canAutoCapturePlacementDiagnostic({ qaMode = false } = {}) {
  if (qaMode) return false;
  const config = await getPlacementDiagnosticConfig();
  return (
    config.autoCaptureEnabled &&
    Number(config.completedCaptureCount) < Number(config.captureLimit)
  );
}

export async function syncPlacementDiagnosticSession({
  userId,
  attemptId,
  qaMode = false,
  session,
}) {
  const id = normalizeAttemptId(attemptId);
  if (!id || qaMode) {
    return { stored: false, reason: "qa_or_missing_attempt" };
  }

  return withTransaction(async (q) => {
    const config = await loadConfig(q, { forUpdate: true });
    const existing = await loadSessionRow(q, id, { forUpdate: true });
    const fullSlotAvailable =
      config.autoCaptureEnabled &&
      Number(config.completedCaptureCount) < Number(config.captureLimit);
    const postLimitTechnical =
      !fullSlotAvailable && sessionQualifiesForPostLimitCapture(session);

    if (!fullSlotAvailable) {
      if (existing) {
        await upsertSessionRow(q, {
          attemptId: id,
          userId,
          session: { ...rowToSession(existing), ...session },
          captureMode: existing.capture_mode,
          errorOnlyCapture: existing.error_only_capture,
          captured: existing.captured,
          qaMode,
          completedCounted: existing.completed_counted,
          labReplay: existing.lab_replay,
        });
        return { stored: true, reason: "updated_existing_after_limit" };
      }
      if (!postLimitTechnical) {
        return { stored: false, reason: "capture_limit_reached" };
      }
      await upsertSessionRow(q, {
        attemptId: id,
        userId,
        session,
        captureMode: "error_only",
        errorOnlyCapture: true,
        captured: true,
        qaMode,
        completedCounted: false,
      });
      return { stored: true, reason: "error_only_capture" };
    }

    await upsertSessionRow(q, {
      attemptId: id,
      userId,
      session,
      captureMode: "full",
      errorOnlyCapture: false,
      captured: true,
      qaMode,
      completedCounted: false,
    });
    return { stored: true, reason: "synced" };
  });
}

export async function finalizePlacementDiagnosticSession({
  userId,
  attemptId,
  qaMode = false,
  session,
  labReplay,
}) {
  const id = normalizeAttemptId(attemptId);
  if (!id || qaMode) {
    return { stored: false, reason: "qa_or_missing_attempt" };
  }

  return withTransaction(async (q) => {
    const config = await loadConfig(q, { forUpdate: true });
    const existing = await loadSessionRow(q, id, { forUpdate: true });
    const alreadyCounted = Boolean(existing?.completed_counted);
    const fullSlotAvailable =
      config.autoCaptureEnabled &&
      Number(config.completedCaptureCount) < Number(config.captureLimit);
    const postLimitTechnical =
      !fullSlotAvailable &&
      (sessionQualifiesForPostLimitCapture(session) ||
        Boolean(existing?.error_only_capture));

    if (!fullSlotAvailable && !existing?.captured && !postLimitTechnical) {
      return { stored: false, reason: "capture_limit_reached" };
    }

    const isErrorOnlyCapture =
      !fullSlotAvailable &&
      (Boolean(existing?.error_only_capture) || postLimitTechnical);

    const completedAt = session?.completedAt || new Date().toISOString();
    const mergedSession = {
      ...(existing ? rowToSession(existing) : {}),
      ...(session && typeof session === "object" ? session : {}),
      completedAt,
      finalizedAt: new Date().toISOString(),
      labReplay: labReplay || existing?.lab_replay || null,
    };

    const shouldCount =
      !isErrorOnlyCapture && !alreadyCounted && !qaMode && fullSlotAvailable;

    await upsertSessionRow(q, {
      attemptId: id,
      userId,
      session: mergedSession,
      captureMode: isErrorOnlyCapture ? "error_only" : "full",
      errorOnlyCapture: isErrorOnlyCapture,
      captured: true,
      qaMode,
      completedCounted: alreadyCounted,
      labReplay: mergedSession.labReplay,
    });

    if (shouldCount) {
      const { rowCount } = await q(
        `UPDATE placement_diagnostic_config
         SET completed_capture_count = completed_capture_count + 1,
             updated_at = NOW()
         WHERE id = 1
           AND completed_capture_count < capture_limit`
      );
      if (rowCount > 0) {
        await q(
          `UPDATE placement_diagnostic_sessions
           SET completed_counted = TRUE, updated_at = NOW()
           WHERE attempt_id = $1 AND completed_counted = FALSE`,
          [id]
        );
      }
    }

    return {
      stored: true,
      reason: isErrorOnlyCapture ? "error_only_finalized" : "finalized",
    };
  });
}

export async function listPlacementDiagnosticSessions(filter = "all") {
  let sql = `SELECT * FROM placement_diagnostic_sessions WHERE captured = TRUE`;
  if (filter === "issues") {
    sql += ` AND COALESCE(issue_summary->>'hasIssues', 'false') = 'true'`;
  } else if (filter === "errors") {
    sql += ` AND issue_summary->>'highestSeverity' IN ('error', 'critical')`;
  }
  sql += ` ORDER BY updated_at DESC`;
  const { rows } = await query(sql);
  return rows.map(mapIndexEntry);
}

export async function getPlacementDiagnosticSession(attemptId) {
  const row = await loadSessionRow(query, attemptId);
  return rowToSession(row);
}

export async function exportPlacementDiagnosticSession(attemptId) {
  const session = await getPlacementDiagnosticSession(attemptId);
  if (!session) return null;
  return {
    exportedAt: new Date().toISOString(),
    session,
    labReplay: session.labReplay || null,
  };
}

/** Test helper — reset diagnostic tables. */
export async function resetPlacementDiagnosticStoreForTests() {
  await query(`DELETE FROM placement_diagnostic_sessions`);
  await query(
    `UPDATE placement_diagnostic_config
     SET completed_capture_count = 0,
         auto_capture_enabled = TRUE,
         capture_limit = 20,
         updated_at = NOW()
     WHERE id = 1`
  );
  await ensureConfigRow();
}
