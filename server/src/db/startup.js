/**
 * Database startup — migrations then Examiner Mind rule-registry seed.
 * Safe on an empty PostgreSQL/Neon database (idempotent DDL + seed-if-empty).
 */
import { initDb, runMigrations } from "./client.js";
import { seedRuleRegistryIfEmpty } from "./seed.js";
import { runTrialAccessMigration } from "./trialAccessMigration.js";

export async function prepareDatabase() {
  await initDb();
  await runMigrations();
  await runTrialAccessMigration();
  await seedRuleRegistryIfEmpty();
}
