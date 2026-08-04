import { runMigrations, closeDb } from "./client.js";
import { runTrialAccessMigration } from "./trialAccessMigration.js";
import { runPlacementDiagnosticsMigration } from "./placementDiagnosticsMigration.js";
import { runWeeklyTrainingAiMigration } from "./weeklyTrainingAiMigration.js";
import { runUserActivityMigration } from "./userActivityMigration.js";
import { runCommunityQaMigration } from "./communityQaMigration.js";
import { runRegistrationCapacityMigration } from "./registrationCapacityMigration.js";

async function main() {
  try {
    await runMigrations();
    await runTrialAccessMigration();
    await runPlacementDiagnosticsMigration();
    await runWeeklyTrainingAiMigration();
    await runUserActivityMigration();
    await runCommunityQaMigration();
    await runRegistrationCapacityMigration();
    console.log("Migrations complete.");
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
