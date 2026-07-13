/**
 * Safe additive migration for 48-hour trial + admin-approved access.
 * Existing production users are grandfathered as approved (one-time backfill).
 */

import { query } from "./client.js";

const MIGRATION_ID = "001_trial_access_v1";

export async function runTrialAccessMigration() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ`);
  await query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_access_approved BOOLEAN NOT NULL DEFAULT FALSE`
  );

  const { rows: applied } = await query(
    `SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1`,
    [MIGRATION_ID]
  );
  if (applied.length) return;

  // Grandfather existing users: preserve access, do not infer trial expiry.
  await query(`
    UPDATE users SET
      is_access_approved = TRUE,
      updated_at = NOW()
    WHERE trial_started_at IS NULL
      AND trial_expires_at IS NULL
      AND role IN ('student', 'admin', 'examiner')
  `);

  await query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [MIGRATION_ID]);
}
