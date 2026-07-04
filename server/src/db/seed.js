import { query, runMigrations } from "./client.js";
import { seedRuleRegistryFromKnowledge } from "../../../src/exam-platform/services/ruleRegistryService.js";

const REGISTRY_CHECK_SQL = `SELECT id FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`;

async function loadCurrentRegistryRow() {
  try {
    return await query(REGISTRY_CHECK_SQL);
  } catch (err) {
    if (err?.code !== "42P01") throw err;
    // Schema missing (e.g. migrate step skipped) — apply DDL then retry once.
    await runMigrations();
    return query(REGISTRY_CHECK_SQL);
  }
}

export async function seedRuleRegistryIfEmpty() {
  const { rows } = await loadCurrentRegistryRow();
  if (rows.length) return;

  const seeded = seedRuleRegistryFromKnowledge();

  await query(
    `INSERT INTO rule_registry_snapshots (registry_version, registry_json, is_current)
     VALUES ($1, $2::jsonb, TRUE)`,
    [seeded.meta.registryVersion, JSON.stringify(seeded)]
  );
}
