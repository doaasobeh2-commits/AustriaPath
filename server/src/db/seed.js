import { query } from "./client.js";
import { seedRuleRegistryFromKnowledge } from "../../../src/exam-platform/services/ruleRegistryService.js";

export async function seedRuleRegistryIfEmpty() {
  const { rows } = await query(
    `SELECT id FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
  );
  if (rows.length) return;

  const seeded = seedRuleRegistryFromKnowledge();

  await query(
    `INSERT INTO rule_registry_snapshots (registry_version, registry_json, is_current)
     VALUES ($1, $2::jsonb, TRUE)`,
    [seeded.meta.registryVersion, JSON.stringify(seeded)]
  );
}
