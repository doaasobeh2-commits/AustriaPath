import { runMigrations, closeDb } from "./client.js";

async function main() {
  try {
    await runMigrations();
    console.log("Migrations complete.");
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
