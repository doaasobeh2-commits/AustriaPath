/**
 * Production smoke test — read-only-ish API checks. No destructive prod mutations except optional test user.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_API_BASE || "https://austriapath-production.up.railway.app/v1";
const VERCEL = process.env.SMOKE_VERCEL_BASE || "https://austriapath-exam-ai.vercel.app";

function loadLocalEnv() {
  const file = path.join(__dirname, "closed-beta-env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const local = loadLocalEnv();
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "fadisobehau@gmail.com";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || local.ADMIN_PASSWORD || "";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, { method = "GET", json, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, cookie: res.headers.get("set-cookie") };
}

function extractSessionCookie(setCookie) {
  if (!setCookie) return "";
  const m = setCookie.match(/austria_path_session=([^;]+)/);
  return m ? `austria_path_session=${m[1]}` : "";
}

async function main() {
  record("config", Boolean(ADMIN_PASSWORD), ADMIN_PASSWORD ? "admin credentials loaded" : "no admin password");

  const health = await api("/health");
  record("GET /v1/health", health.status === 200 && health.body?.data?.status === "ok", `HTTP ${health.status}`);

  const db = await api("/health/db");
  record(
    "GET /v1/health/db",
    db.status === 200 && db.body?.data?.dbKind === "pg" && db.body?.data?.usersTableExists,
    `tables=${db.body?.data?.publicTableCount}`
  );

  const reg = await api("/registration/status");
  record(
    "Registration overview (public)",
    reg.status === 200 && typeof reg.body?.data?.counted === "number",
    reg.body?.data ? `${reg.body.data.counted} / ${reg.body.data.capacity}` : `HTTP ${reg.status}`
  );

  const vercelReg = await fetch(`${VERCEL}/v1/registration/status`, { headers: { Accept: "application/json" } });
  const vercelRegBody = await vercelReg.json();
  record(
    "Vercel /v1 proxy",
    vercelReg.status === 200 && vercelRegBody?.success,
    `HTTP ${vercelReg.status}`
  );

  if (!ADMIN_PASSWORD) {
    console.log("\nSkipping authenticated checks (no admin password).");
    summarize();
    process.exit(1);
  }

  const login = await api("/auth/login", {
    method: "POST",
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const adminCookie = extractSessionCookie(login.cookie);
  record("Admin login", login.status === 200 && Boolean(adminCookie), `HTTP ${login.status}`);

  const me = await api("/auth/me", { cookie: adminCookie });
  record(
    "GET /auth/me",
    me.status === 200 && me.body?.data?.user?.role === "admin",
    me.body?.data?.user?.role || `HTTP ${me.status}`
  );

  const adminReg = await api("/admin/registration/overview", { cookie: adminCookie });
  record(
    "Admin registration overview",
    adminReg.status === 200 && adminReg.body?.data?.overview,
    adminReg.body?.data?.overview
      ? `${adminReg.body.data.overview.counted}/${adminReg.body.data.overview.capacity}`
      : `HTTP ${adminReg.status}`
  );

  const commList = await api("/admin/community/questions", { cookie: adminCookie });
  record(
    "Admin community moderation",
    commList.status === 200 && Array.isArray(commList.body?.data?.items),
    `items=${commList.body?.data?.items?.length ?? "?"}`
  );

  const placementEnt = await api("/placement/entitlement", { cookie: adminCookie });
  record(
    "Placement entitlement endpoint",
    placementEnt.status === 200 && placementEnt.body?.data !== undefined,
    JSON.stringify(placementEnt.body?.data || {}).slice(0, 80)
  );

  const weeklyEnt = await api("/weekly-plan/entitlement", { cookie: adminCookie });
  record(
    "Weekly plan entitlement endpoint",
    weeklyEnt.status === 200 && weeklyEnt.body?.data !== undefined,
    JSON.stringify(weeklyEnt.body?.data || {}).slice(0, 80)
  );

  const commFeed = await api("/community/questions?limit=1", { cookie: adminCookie });
  record(
    "Community Q&A feed (auth)",
    commFeed.status === 200 && Array.isArray(commFeed.body?.data?.items),
    `HTTP ${commFeed.status}`
  );

  summarize();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

function summarize() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
