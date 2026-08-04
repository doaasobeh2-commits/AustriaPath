import { initDb, runMigrations } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { runRegistrationCapacityMigration } from "../../server/src/db/registrationCapacityMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";

/**
 * Shared server test DB bootstrap — mirrors production schema including registration capacity.
 * @param {{ extra?: Array<() => Promise<void>>, seedRules?: boolean }} [options]
 */
export async function prepareServerTestDb(options = {}) {
  const { extra = [], seedRules = true } = options;
  await initDb();
  await runMigrations();
  await runTrialAccessMigration();
  await runRegistrationCapacityMigration();
  for (const step of extra) {
    await step();
  }
  if (seedRules) {
    await seedRuleRegistryIfEmpty();
  }
}
