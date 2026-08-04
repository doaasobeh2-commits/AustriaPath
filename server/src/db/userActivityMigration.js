/**
 * Lightweight per-user activity summary columns.
 */

import { query } from "./client.js";

const MIGRATION_ID = "002_user_activity_summary_v1";

export async function runUserActivityMigration() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0`
  );
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ`);
  await query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_feature_opened VARCHAR(64)`
  );

  const { rows: applied } = await query(
    `SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1`,
    [MIGRATION_ID]
  );
  if (applied.length) return;

  await query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [MIGRATION_ID]);
}
