/**
 * Session persistence for B1 Weekly Training AI.
 * @module weekly-training-ai/core/sessionStore
 */

import { query } from "../../db/client.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * @param {object} row
 */
function mapSessionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    trainingLevel: row.training_level,
    productScope: row.product_scope,
    modelId: row.model_id,
    modelVersion: row.model_version,
    modelSnapshot: row.model_snapshot,
    planHash: row.plan_hash,
    planIndex: row.plan_index,
    exerciseSlot: row.exercise_slot,
    category: row.category,
    status: row.status,
    coveredPoints: row.covered_points || [],
    transcript: row.transcript || [],
    planungStep: row.planung_step,
    finalReport: row.final_report,
    idempotencyScope: row.idempotency_scope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

/**
 * @param {string} userId
 * @param {string} idempotencyScope
 */
export async function findSessionByIdempotencyScope(userId, idempotencyScope) {
  const { rows } = await query(
    `SELECT * FROM weekly_training_task_sessions
     WHERE user_id = $1 AND idempotency_scope = $2
     LIMIT 1`,
    [userId, idempotencyScope]
  );
  return mapSessionRow(rows[0]);
}

/**
 * @param {object} input
 */
export async function insertSession(input) {
  const { rows } = await query(
    `INSERT INTO weekly_training_task_sessions (
      user_id, training_level, product_scope, model_id, model_version, model_snapshot,
      plan_hash, plan_index, exercise_slot, category, status, idempotency_scope
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, 'in_progress', $11)
    RETURNING *`,
    [
      input.userId,
      input.trainingLevel,
      input.productScope,
      input.modelId,
      input.modelVersion,
      JSON.stringify(input.modelSnapshot),
      input.planHash || null,
      input.planIndex,
      input.exerciseSlot,
      input.category,
      input.idempotencyScope,
    ]
  );
  return mapSessionRow(rows[0]);
}

/**
 * @param {string} sessionId
 */
export async function getSessionById(sessionId) {
  const { rows } = await query(
    `SELECT * FROM weekly_training_task_sessions WHERE id = $1 LIMIT 1`,
    [sessionId]
  );
  return mapSessionRow(rows[0]);
}

/**
 * @param {string} sessionId
 * @param {object} patch
 */
export async function updateSession(sessionId, patch) {
  const assignments = [];
  const values = [];
  let index = 1;

  if (patch.status !== undefined) {
    assignments.push(`status = $${index++}`);
    values.push(patch.status);
  }
  if (patch.coveredPoints !== undefined) {
    assignments.push(`covered_points = $${index++}::jsonb`);
    values.push(JSON.stringify(patch.coveredPoints));
  }
  if (patch.transcript !== undefined) {
    assignments.push(`transcript = $${index++}::jsonb`);
    values.push(JSON.stringify(patch.transcript));
  }
  if (patch.planungStep !== undefined) {
    assignments.push(`planung_step = $${index++}`);
    values.push(patch.planungStep);
  }
  if (patch.finalReport !== undefined) {
    assignments.push(`final_report = $${index++}::jsonb`);
    values.push(JSON.stringify(patch.finalReport));
  }
  if (patch.completedAt !== undefined) {
    assignments.push(`completed_at = $${index++}`);
    values.push(patch.completedAt);
  }

  if (!assignments.length) {
    return getSessionById(sessionId);
  }

  assignments.push("updated_at = NOW()");
  values.push(sessionId);

  const { rows } = await query(
    `UPDATE weekly_training_task_sessions
     SET ${assignments.join(", ")}
     WHERE id = $${index}
     RETURNING *`,
    values
  );
  return mapSessionRow(rows[0]);
}

/**
 * @param {string} sessionId
 * @param {string} userId
 */
export async function getSessionForUser(sessionId, userId) {
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new AppError("SESSION_NOT_FOUND", "Trainingssitzung nicht gefunden.", 404);
  }
  if (session.userId !== userId) {
    throw new AppError("FORBIDDEN", "Kein Zugriff auf diese Trainingssitzung.", 403);
  }
  return session;
}

export function toPublicSession(session) {
  return {
    sessionId: session.id,
    trainingLevel: session.trainingLevel,
    productScope: session.productScope,
    modelId: session.modelId,
    modelVersion: session.modelVersion,
    category: session.category,
    planHash: session.planHash,
    planIndex: session.planIndex,
    exerciseSlot: session.exerciseSlot,
    status: session.status,
    coveredPoints: session.coveredPoints,
    transcript: session.transcript,
    planungStep: session.planungStep,
    finalReport: session.finalReport,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt,
    selectedEmailIndex: session.modelSnapshot?.selectedEmailIndex ?? null,
  };
}
