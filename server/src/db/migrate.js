import { runMigrations, closeDb } from "./client.js";
import { runTrialAccessMigration } from "./trialAccessMigration.js";

async function main() {
  try {
    await runMigrations();
    await runTrialAccessMigration();
    console.log("Migrations complete.");
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
