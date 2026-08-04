/**
 * Load server/.env into process.env before other server modules read configuration.
 * Weekly Training B1 credentials live here — not in the root Vite .env.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SERVER_ENV_PATH = resolve(SERVER_ROOT, ".env");
const ROOT_ENV_PATH = resolve(SERVER_ROOT, "../.env");

/**
 * @param {string} filePath
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

parseEnvFile(SERVER_ENV_PATH);
if ((process.env.NODE_ENV || "development") !== "production") {
  parseEnvFile(ROOT_ENV_PATH);
}

export const serverEnvPath = SERVER_ENV_PATH;
export const serverEnvLoaded = existsSync(SERVER_ENV_PATH);
