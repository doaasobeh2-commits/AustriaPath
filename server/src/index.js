import express from "express";
import { createApp } from "./app.js";
import { closeDb } from "./db/client.js";
import { prepareDatabase } from "./db/startup.js";
import { env } from "./config/env.js";
import { assertProductionDatabaseConfig } from "./config/validateEnv.js";
import { getBetaAllowlistStatus } from "./config/betaAllowlist.js";

const root = express();
root.use("/v1", createApp());

assertProductionDatabaseConfig();
await prepareDatabase();

const betaAllowlist = getBetaAllowlistStatus();
console.log(
  `Beta allowlist: configured=${betaAllowlist.configured} enforced=${betaAllowlist.enforced} count=${betaAllowlist.count} production=${betaAllowlist.production}`
);

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
