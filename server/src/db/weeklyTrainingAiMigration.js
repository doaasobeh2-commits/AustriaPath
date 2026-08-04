/**
 * Additive migration for B1 Weekly Training AI session tables.
 */

import { query } from "./client.js";

const MIGRATION_ID = "002_weekly_training_ai_v1";

export async function runWeeklyTrainingAiMigration() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: applied } = await query(
    `SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1`,
    [MIGRATION_ID]
  );
  if (applied.length) return;

  await query(`
    CREATE TABLE IF NOT EXISTS weekly_training_task_sessions (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID NOT NULL REFERENCES users(id),
      training_level    VARCHAR(10) NOT NULL,
      product_scope     VARCHAR(64) NOT NULL,
      model_id          VARCHAR(128) NOT NULL,
      model_version     INTEGER NOT NULL,
      model_snapshot    JSONB NOT NULL,
      plan_hash         VARCHAR(128),
      plan_index        INTEGER NOT NULL,
      exercise_slot     INTEGER NOT NULL,
      category          VARCHAR(64) NOT NULL,
      status            VARCHAR(32) NOT NULL DEFAULT 'active',
      covered_points    JSONB NOT NULL DEFAULT '[]'::jsonb,
      transcript        JSONB NOT NULL DEFAULT '[]'::jsonb,
      planung_step      INTEGER,
      final_report      JSONB,
      idempotency_scope VARCHAR(256),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at      TIMESTAMPTZ
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS weekly_training_task_sessions_idempotency_scope_uidx
      ON weekly_training_task_sessions (user_id, idempotency_scope)
      WHERE idempotency_scope IS NOT NULL
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS weekly_training_task_sessions_user_status_idx
      ON weekly_training_task_sessions (user_id, status)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS weekly_training_ai_logs (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id     UUID REFERENCES weekly_training_task_sessions(id) ON DELETE SET NULL,
      user_id        UUID NOT NULL REFERENCES users(id),
      event_type     VARCHAR(64) NOT NULL,
      product_scope  VARCHAR(64) NOT NULL,
      model_name     VARCHAR(128),
      payload        JSONB,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS weekly_training_ai_logs_session_idx
      ON weekly_training_ai_logs (session_id)
  `);

  await query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [MIGRATION_ID]);
}
