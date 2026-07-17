import express from "express";
import { createApp } from "./app.js";
import { attachProductionFrontend } from "./spa.js";
import { closeDb } from "./db/client.js";
import { prepareDatabase } from "./db/startup.js";
import { env } from "./config/env.js";
import { assertProductionDatabaseConfig } from "./config/validateEnv.js";
import { attachRequestLogger } from "./middleware/requestLogger.js";
import { attachProcessHandlers } from "./runtime/processHandlers.js";
import healthzRoutes from "./routes/healthz.routes.js";

const root = express();
root.set("trust proxy", 1);
attachRequestLogger(root);

/** Liveness probe — registered before SPA so Railway can reach it without dist/ or index.html. */
root.use("/healthz", healthzRoutes);

root.use("/v1", createApp());

assertProductionDatabaseConfig();
await prepareDatabase();

const spaEnabled = attachProductionFrontend(root);

const host = "0.0.0.0";
const port = Number(process.env.PORT || env.port);

const server = root.listen(port, host, () => {
  if (spaEnabled) {
    console.log(`AustriaPath listening on ${host}:${port} (SPA / + API /v1)`);
  } else {
    console.log(`AustriaPath API listening on ${host}:${port}/v1 (no dist/ — API only)`);
  }
  console.log(`[startup] healthz=http://${host}:${port}/healthz api=http://${host}:${port}/v1/health`);
});

server.on("error", (error) => {
  console.error("[server] listen error", error);
});

async function shutdown(signal) {
  console.log(`[process] shutting down (${signal})`);
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await closeDb();
  console.log("[process] shutdown complete");
  process.exit(0);
}

attachProcessHandlers({ onShutdown: shutdown });

export { root as app };
