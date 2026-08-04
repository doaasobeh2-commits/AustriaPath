/**
 * Usage logging for B1 Weekly Training AI — no pooled credit debits.
 * @module weekly-training-ai/core/usageLogger
 */

import { query } from "../../db/client.js";
import { B1_WEEKLY_TRAINING_PRODUCT_SCOPE } from "./config.js";

/**
 * @param {object} input
 */
export async function logWeeklyTrainingAiEvent({
  sessionId = null,
  userId,
  eventType,
  modelName = null,
  payload = null,
}) {
  try {
    await query(
      `INSERT INTO weekly_training_ai_logs (session_id, user_id, event_type, product_scope, model_name, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        sessionId,
        userId,
        eventType,
        B1_WEEKLY_TRAINING_PRODUCT_SCOPE,
        modelName,
        payload ? JSON.stringify(payload) : null,
      ]
    );
  } catch {
    // Logging must not block session lifecycle.
  }
}
