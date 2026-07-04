/**
 * One-time admin bootstrap against production Railway API.
 *
 * Reads deploy/closed-beta-env.local (gitignored) or process env:
 *   RAILWAY_PUBLIC_URL, ADMIN_BOOTSTRAP_SECRET, ADMIN_PASSWORD, ADMIN_NAME (optional)
 *
 * Usage:
 *   node deploy/bootstrap-admin.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = join(__dirname, "closed-beta-env.local");

function loadLocalEnv() {
  if (!existsSync(envFile)) return;
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const baseUrl = (process.env.RAILWAY_PUBLIC_URL || "").replace(/\/$/, "");
const secret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "Fadi";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!baseUrl) {
  fail(
    "Missing RAILWAY_PUBLIC_URL in deploy/closed-beta-env.local or environment."
  );
}
if (!secret) {
  fail(
    "Missing ADMIN_BOOTSTRAP_SECRET in deploy/closed-beta-env.local or environment."
  );
}
if (!password || password.length < 8) {
  fail(
    "Missing ADMIN_PASSWORD (min 8 chars) in deploy/closed-beta-env.local or environment."
  );
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  let body = null;
  let rawText = null;
  try {
    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      rawText = await response.text();
      try {
        body = JSON.parse(rawText);
      } catch {
        body = null;
      }
    }
  } catch {
    body = null;
  }
  return { status: response.status, body, rawText, contentType, headers: response.headers };
}

console.log(`API base: ${baseUrl}`);

const health = await request("/v1/health");
if (
  health.status !== 200 ||
  !health.body?.success ||
  health.body?.data?.status !== "ok"
) {
  if (health.rawText?.includes("<!DOCTYPE html") || health.rawText?.includes("<html")) {
    fail(
      "RAILWAY_PUBLIC_URL points to the frontend (HTML), not the Express API.\n" +
        "In Railway, open the API service (npm run server:start) → Networking → Public domain.\n" +
        "Update RAILWAY_PUBLIC_URL, then verify: curl.exe -s https://YOUR-API-HOST/v1/health returns JSON with status ok."
    );
  }
  console.error("Health check failed:", health.status, health.body || health.rawText?.slice(0, 200));
  fail("GET /v1/health did not return a healthy API response. Fix RAILWAY_PUBLIC_URL first.");
}

console.log("Health check OK (Express API confirmed)");
console.log(`Bootstrap target: ${baseUrl}/v1/internal/bootstrap-admin`);

const bootstrap = await request("/v1/internal/bootstrap-admin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Bootstrap-Secret": secret,
  },
  body: JSON.stringify({ name, password }),
});

console.log("Bootstrap status:", bootstrap.status);
console.log(JSON.stringify(bootstrap.body, null, 2));

if (![200, 201].includes(bootstrap.status)) {
  process.exit(1);
}

const login = await request("/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "fadisobehau@gmail.com", password }),
});

console.log("Login status:", login.status);
console.log(JSON.stringify(login.body, null, 2));

if (login.status !== 200 || login.body?.data?.user?.role !== "admin") {
  fail("Login verification failed — admin role not returned.");
}

console.log("OK — admin bootstrap and login verified for fadisobehau@gmail.com");
