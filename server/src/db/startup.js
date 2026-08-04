/**
 * Database startup — migrations then Examiner Mind rule-registry seed.
 * Safe on an empty PostgreSQL/Neon database (idempotent DDL + seed-if-empty).
 */
import { initDb, runMigrations } from "./client.js";
import { seedRuleRegistryIfEmpty } from "./seed.js";
import { runTrialAccessMigration } from "./trialAccessMigration.js";
import { runPlacementDiagnosticsMigration } from "./placementDiagnosticsMigration.js";
import { runWeeklyTrainingAiMigration } from "./weeklyTrainingAiMigration.js";
import { runUserActivityMigration } from "./userActivityMigration.js";
import { runCommunityQaMigration } from "./communityQaMigration.js";
import { runRegistrationCapacityMigration } from "./registrationCapacityMigration.js";
import { ensureLocalAdminPassword } from "./ensureLocalAdminPassword.js";
import { env } from "../config/env.js";

export async function prepareDatabase() {
  await initDb();
  await runMigrations();
  await runTrialAccessMigration();
  await runPlacementDiagnosticsMigration();
  await runWeeklyTrainingAiMigration();
  await runUserActivityMigration();
  await runCommunityQaMigration();
  await runRegistrationCapacityMigration();
  await seedRuleRegistryIfEmpty();
  const adminSync = await ensureLocalAdminPassword();
  if (adminSync.action === "created") {
    console.log(`[startup] local admin bootstrapped for ${env.adminEmail} (${adminSync.userId})`);
  } else if (adminSync.action === "password_updated") {
    console.log(`[startup] local admin password synced for user ${adminSync.userId}`);
  }
}
