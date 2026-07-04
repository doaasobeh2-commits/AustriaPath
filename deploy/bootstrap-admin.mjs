/**
 * One-time admin bootstrap against production Railway API.
 *
 * Reads deploy/closed-beta-env.local (gitignored) or process env:
 *   RAILWAY_PUBLIC_URL, ADMIN_BOOTSTRAP_SECRET, ADMIN_PASSWORD, ADMIN_NAME (optional)
 *   ADMIN_EMAIL (optional; must match Railway ADMIN_EMAIL)
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
const adminEmail = (process.env.ADMIN_EMAIL || "fadisobehau@gmail.com")
  .trim()
  .toLowerCase();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function explain502() {
  return (
    "Railway returned HTTP 502 — the Express API process is not listening.\n" +
    "This is not a bootstrap bug; the container crashed or is still deploying.\n" +
    "Check Railway → API service → Deployments → logs for:\n" +
    "  • DATABASE_URL is required in production\n" +
    "  • Migration errors\n" +
    "Fix: set Neon pooled DATABASE_URL on the Railway API Web Service, redeploy, then verify:\n" +
    `  curl.exe -s "${baseUrl}/v1/health/db"\n` +
    "Expected: dbKind \"pg\", databaseUrlConfigured true.\n" +
    "See deploy/RAILWAY-API.md"
  );
}

function explain403Bootstrap() {
  return (
    "HTTP 403 FORBIDDEN on POST /v1/internal/bootstrap-admin.\n" +
    "ADMIN_BOOTSTRAP_SECRET in deploy/closed-beta-env.local does not match Railway.\n" +
    "Set the same value in Railway → API service → Variables → ADMIN_BOOTSTRAP_SECRET, redeploy, retry."
  );
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
  return {
    status: response.status,
    body,
    rawText,
    contentType,
    headers: response.headers,
  };
}

console.log(`API base: ${baseUrl}`);

const health = await request("/v1/health");
if (health.status === 502) {
  fail(explain502());
}
if (
  health.status !== 200 ||
  !health.body?.success ||
  health.body?.data?.status !== "ok"
) {
  if (
    health.rawText?.includes("<!DOCTYPE html") ||
    health.rawText?.includes("<html")
  ) {
    fail(
      "RAILWAY_PUBLIC_URL points to the frontend (HTML), not the Express API.\n" +
        "In Railway, open the API service (npm run server:start) → Networking → Public domain.\n" +
        "Update RAILWAY_PUBLIC_URL, then verify: curl.exe -s https://YOUR-API-HOST/v1/health returns JSON with status ok."
    );
  }
  console.error(
    "Health check failed:",
    health.status,
    health.body || health.rawText?.slice(0, 200)
  );
  if (health.status === 502 || health.body?.message === "Application failed to respond") {
    fail(explain502());
  }
  fail("GET /v1/health did not return a healthy API response. Fix RAILWAY_PUBLIC_URL first.");
}

console.log("Health check OK (Express API confirmed)");

const dbHealth = await request("/v1/health/db");
if (dbHealth.status === 502) {
  fail(explain502());
}
if (dbHealth.status !== 200 || !dbHealth.body?.success) {
  console.error(
    "DB health check failed:",
    dbHealth.status,
    dbHealth.body || dbHealth.rawText?.slice(0, 200)
  );
  fail("GET /v1/health/db failed. Fix DATABASE_URL on Railway before bootstrapping admin.");
}

const db = dbHealth.body.data;
console.log(
  `Database: ${db.dbKind} host=${db.host ?? "n/a"} db=${db.database ?? "n/a"} tables=${db.publicTableCount}`
);

if (db.dbKind !== "pg") {
  fail(
    `API is not using Neon PostgreSQL (dbKind="${db.dbKind}").\n` +
      "Bootstrap would write to the wrong database. Set DATABASE_URL on Railway API service and redeploy.\n" +
      "See deploy/RAILWAY-API.md"
  );
}
if (!db.databaseUrlConfigured) {
  fail(
    "databaseUrlConfigured is false — DATABASE_URL is missing on the Railway API service."
  );
}
if (!db.usersTableExists) {
  fail(
    "users table missing — migrations did not run. Check Railway deploy logs for server:migrate errors."
  );
}

console.log(`Bootstrap target: ${baseUrl}/v1/internal/bootstrap-admin`);
console.log(`Admin email: ${adminEmail}`);

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

if (bootstrap.status === 403) {
  fail(explain403Bootstrap());
}
if (bootstrap.status === 409) {
  fail(
    "HTTP 409 CONFLICT — admin already exists in PostgreSQL.\n" +
      "Remove ADMIN_BOOTSTRAP_SECRET from Railway after bootstrap.\n" +
      "To reset password, use POST /v1/auth/forgot-password (not bootstrap)."
  );
}
if (bootstrap.status === 502) {
  fail(explain502());
}
if (![200, 201].includes(bootstrap.status)) {
  process.exit(1);
}

const login = await request("/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: adminEmail, password }),
});

console.log("Login status:", login.status);
console.log(JSON.stringify(login.body, null, 2));

if (login.status !== 200 || login.body?.data?.user?.role !== "admin") {
  fail("Login verification failed — admin role not returned.");
}

console.log(`OK — admin bootstrap and login verified for ${adminEmail}`);
