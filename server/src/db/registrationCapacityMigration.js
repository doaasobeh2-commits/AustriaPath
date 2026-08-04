/**
 * Registration capacity settings and waitlist (v1 — no invite flow).
 */

import { query } from "./client.js";

const MIGRATION_ID = "004_registration_capacity_waitlist_v1";

export async function runRegistrationCapacityMigration() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_capacity_exempt BOOLEAN NOT NULL DEFAULT FALSE`
  );

  await query(`
    CREATE TABLE IF NOT EXISTS registration_settings (
      id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      capacity      INTEGER NOT NULL DEFAULT 70 CHECK (capacity > 0),
      capacity_slots_used INTEGER NOT NULL DEFAULT 0 CHECK (capacity_slots_used >= 0),
      manual_state  VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (manual_state IN ('open', 'closed')),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(
    `ALTER TABLE registration_settings ADD COLUMN IF NOT EXISTS capacity_slots_used INTEGER NOT NULL DEFAULT 0`
  );

  await query(`
    CREATE TABLE IF NOT EXISTS registration_waitlist (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email               VARCHAR(255) NOT NULL,
      email_normalized    VARCHAR(255) NOT NULL,
      display_name        VARCHAR(120),
      preferred_language  VARCHAR(32),
      status              VARCHAR(16) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'invited', 'registered', 'removed')),
      admin_notes         TEXT,
      invited_at          TIMESTAMPTZ,
      registered_at       TIMESTAMPTZ,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    DROP INDEX IF EXISTS idx_registration_waitlist_active_email
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_waitlist_active_email
      ON registration_waitlist (email_normalized)
      WHERE status = 'waiting'
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_registration_waitlist_status_created
      ON registration_waitlist (status, created_at DESC)
  `);

  const defaultCapacity = Math.max(
    1,
    Number(process.env.REGISTRATION_CAPACITY_DEFAULT || 70) || 70
  );
  const manualState =
    String(process.env.REGISTRATION_MANUAL_STATE || "open").toLowerCase() === "closed"
      ? "closed"
      : "open";

  await query(
    `INSERT INTO registration_settings (id, capacity, manual_state)
     VALUES (1, $1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [defaultCapacity, manualState]
  );

  const { rows: applied } = await query(
    `SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1`,
    [MIGRATION_ID]
  );
  if (applied.length) return;

  await query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [MIGRATION_ID]);
}
