import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";

export function dbRowToSession(row) {
  if (!row) return null;
  return {
    sessionId: row.id,
    productType: row.product_type,
    mode: row.mode,
    blueprint: row.blueprint,
    currentSectionIndex: row.current_section_index,
    answers: row.answers || [],
    evaluations: row.evaluations || [],
    status: row.status,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : undefined,
    deadlineAt: row.deadline_at ? new Date(row.deadline_at).getTime() : undefined,
  };
}

export async function insertExamSession({
  userId,
  subscriptionId,
  session,
  rulesVersion,
  idempotencyKey,
}) {
  const id = randomUUID();
  session.sessionId = id;

  const { rows } = await query(
    `INSERT INTO exam_sessions (
      id, user_id, subscription_id, product_type, mode, status, blueprint,
      current_section_index, answers, evaluations, rules_version,
      exam_index, exam_total, started_at, deadline_at, idempotency_key
    ) VALUES (
      $1, $2, $3, $4::product_type, $5::exam_mode, $6::exam_session_status, $7::jsonb,
      $8, $9::jsonb, $10::jsonb, $11,
      $12, $13,
      COALESCE(to_timestamp($14::double precision / 1000.0), NOW()),
      CASE WHEN $15::double precision IS NOT NULL THEN to_timestamp($15::double precision / 1000.0) ELSE NULL END,
      $16
    ) RETURNING *`,
    [
      id,
      userId,
      subscriptionId,
      session.productType,
      session.mode,
      session.status,
      JSON.stringify(session.blueprint),
      session.currentSectionIndex,
      JSON.stringify(session.answers),
      JSON.stringify(session.evaluations),
      rulesVersion,
      session.blueprint.examIndex ?? null,
      session.blueprint.examTotal ?? null,
      session.startedAt || Date.now(),
      session.deadlineAt || null,
      idempotencyKey || null,
    ]
  );
  return rows[0];
}

export async function updateExamSession(session) {
  await query(
    `UPDATE exam_sessions SET
      status = $2::exam_session_status,
      current_section_index = $3,
      answers = $4::jsonb,
      evaluations = $5::jsonb,
      updated_at = NOW(),
      completed_at = CASE WHEN $2::text = 'completed' THEN NOW() ELSE completed_at END
     WHERE id = $1`,
    [
      session.sessionId,
      session.status,
      session.currentSectionIndex,
      JSON.stringify(session.answers),
      JSON.stringify(session.evaluations),
    ]
  );
}

export async function findExamSession(sessionId, userId) {
  const { rows } = await query(
    `SELECT * FROM exam_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return rows[0] || null;
}

export async function findActiveSession(userId, productType) {
  const { rows } = await query(
    `SELECT * FROM exam_sessions
     WHERE user_id = $1 AND product_type = $2::product_type
       AND status IN ('active', 'awaiting_review')
     ORDER BY created_at DESC LIMIT 1`,
    [userId, productType]
  );
  return rows[0] || null;
}

export async function findByIdempotency(userId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const { rows } = await query(
    `SELECT * FROM exam_sessions WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
    [userId, idempotencyKey]
  );
  return rows[0] || null;
}
