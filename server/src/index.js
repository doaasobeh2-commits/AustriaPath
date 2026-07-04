import express from "express";
import { createApp } from "./app.js";
import { initDb, closeDb } from "./db/client.js";
import { env } from "./config/env.js";
import { seedRuleRegistryIfEmpty } from "./db/seed.js";

const root = express();
root.use("/v1", createApp());

await initDb();
await seedRuleRegistryIfEmpty();

const server = root.listen(env.port, () => {
  console.log(`AustriaPath API listening on :${env.port}/v1`);
});

async function shutdown() {
  server.close();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { root as app };
