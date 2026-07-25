import { query } from "./client.js";

/** Idempotent seed for placement diagnostic singleton config row. */
export async function runPlacementDiagnosticsMigration() {
  await query(
    `INSERT INTO placement_diagnostic_config (id)
     VALUES (1)
     ON CONFLICT (id) DO NOTHING`
  );
}
