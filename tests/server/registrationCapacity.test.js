/**
 * Registration capacity gate + waitlist tests.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.VITE_ADMIN_INITIAL_PASSWORD = "test-admin-pass-12345";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { initDb, runMigrations, closeDb, query } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { runUserActivityMigration } from "../../server/src/db/userActivityMigration.js";
import { runCommunityQaMigration } from "../../server/src/db/communityQaMigration.js";
import { runRegistrationCapacityMigration } from "../../server/src/db/registrationCapacityMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";
import { ensureLocalAdminPassword } from "../../server/src/db/ensureLocalAdminPassword.js";
import { env } from "../../server/src/config/env.js";
import { countCapacityUsers } from "../../server/src/services/registrationCapacityService.js";

/** @param {import('express').Express} app */
async function registerLearner(app, email, suffix = "") {
  const res = await request(app)
    .post("/auth/register")
    .send({
      name: `Learner ${suffix}`,
      email,
      password: "password123",
      level: "B1",
    });
  return res;
}

/** @param {import('express').Express} app */
async function loginAdmin(app) {
  const login = await request(app)
    .post("/auth/login")
    .send({ email: env.adminEmail, password: "test-admin-pass-12345" });
  const cookie = (login.headers["set-cookie"] || [])
    .find((c) => c.startsWith("austria_path_session="))
    ?.split(";")[0];
  return { cookie, userId: login.body.data.user.id };
}

/** @param {import('express').Express} app */
async function setCapacity(app, adminCookie, capacity, manualState = "open") {
  await request(app)
    .patch("/admin/registration/settings")
    .set("Cookie", adminCookie || "")
    .send({ capacity, manualState });
}

describe("registration capacity + waitlist", () => {
  /** @type {import('express').Express} */
  let app;
  /** @type {string | undefined} */
  let adminCookie;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await runTrialAccessMigration();
    await runUserActivityMigration();
    await runCommunityQaMigration();
    await runRegistrationCapacityMigration();
    await seedRuleRegistryIfEmpty();
    await ensureLocalAdminPassword();
    app = createApp();
    adminCookie = (await loginAdmin(app)).cookie;
    await setCapacity(app, adminCookie, 70, "open");
  });

  afterAll(async () => {
    await closeDb();
  });

  it("allows registrations 1–70 and blocks registration 71 without creating a user row", async () => {
    const counted = await countCapacityUsers();
    await setCapacity(app, adminCookie, counted + 70, "open");

    const base = `cap70_${Date.now()}`;
    for (let i = 1; i <= 70; i += 1) {
      const res = await registerLearner(app, `${base}_${i}@example.com`, String(i));
      expect(res.status).toBe(201);
    }

    const blocked = await registerLearner(app, `${base}_71@example.com`, "71");
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("REGISTRATION_FULL");

    const { rows } = await query(
      `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)`,
      [`${base}_71@example.com`]
    );
    expect(rows).toHaveLength(0);
  }, 120000);

  it("does not allow more registrations than remaining capacity slots", async () => {
    const stamp = Date.now();
    const counted = await countCapacityUsers();
    const targetCapacity = counted + 3;
    await setCapacity(app, adminCookie, targetCapacity, "open");

    for (let i = 0; i < 3; i += 1) {
      const res = await registerLearner(app, `serial_${stamp}_${i}@example.com`, `serial-${i}`);
      expect(res.status).toBe(201);
    }

    const blocked = await registerLearner(app, `serial_${stamp}_extra@example.com`, "serial-extra");
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("REGISTRATION_FULL");

    const finalCount = await countCapacityUsers();
    expect(finalCount).toBe(targetCapacity);

    const { rows } = await query(
      `SELECT 1 FROM users WHERE email = $1`,
      [`serial_${stamp}_extra@example.com`]
    );
    expect(rows).toHaveLength(0);
  });

  it("lets existing users log in after capacity is full", async () => {
    const { rows } = await query(
      `SELECT email FROM users WHERE email ILIKE 'cap70_%@example.com' ORDER BY created_at ASC LIMIT 1`
    );
    expect(rows.length).toBeGreaterThan(0);

    const login = await request(app).post("/auth/login").send({
      email: rows[0].email,
      password: "password123",
    });
    expect(login.status).toBe(200);
  });

  it("rejects duplicate active waitlist emails and invalid email", async () => {
    const email = `waitlist_${Date.now()}@example.com`;
    const first = await request(app).post("/registration/waitlist").send({ email });
    expect(first.status).toBe(201);

    const duplicate = await request(app).post("/registration/waitlist").send({ email });
    expect(duplicate.status).toBe(409);

    const invalid = await request(app).post("/registration/waitlist").send({ email: "not-an-email" });
    expect(invalid.status).toBe(400);
  });

  it("does not expose waitlist data to public users", async () => {
    const { rows } = await query(
      `SELECT email FROM users WHERE email ILIKE 'cap70_%@example.com' LIMIT 1`
    );
    const learner = await request(app).post("/auth/login").send({
      email: rows[0].email,
      password: "password123",
    });
    const cookie = (learner.headers["set-cookie"] || [])
      .find((c) => c.startsWith("austria_path_session="))
      ?.split(";")[0];

    const res = await request(app)
      .get("/admin/registration/overview")
      .set("Cookie", cookie || "");
    expect(res.status).toBe(403);
  });

  it("applies counting rules for admin, test, blocked, deleted, and exempt accounts", async () => {
    const before = await countCapacityUsers();
    await setCapacity(app, adminCookie, before + 100, "open");
    const stamp = Date.now();

    await query(
      `INSERT INTO users (email, password_hash, level, allowed_levels, role, status, registration_capacity_exempt)
       VALUES ($1, 'hash', 'B1', ARRAY['A2','B1']::cefr_label[], 'student', 'blocked', FALSE)`,
      [`blocked_count_${stamp}@example.com`]
    );
    await query(
      `INSERT INTO users (email, password_hash, level, allowed_levels, role, status, registration_capacity_exempt)
       VALUES ($1, 'hash', 'B1', ARRAY['A2','B1']::cefr_label[], 'student', 'approved', TRUE)`,
      [`internal_count_${stamp}@example.com`]
    );
    await query(
      `INSERT INTO users (email, password_hash, level, allowed_levels, role, status, deleted_at)
       VALUES ($1, 'hash', 'B1', ARRAY['A2','B1']::cefr_label[], 'student', 'approved', NOW())`,
      [`deleted_count_${stamp}@example.com`]
    );

    const testLocal = await registerLearner(app, `testonly_${Date.now()}@test.local`, "test");
    expect(testLocal.status).toBe(201);

    const after = await countCapacityUsers();
    expect(after).toBe(before);
  });

  it("blocks registration when manually closed even below capacity", async () => {
    const counted = await countCapacityUsers();
    await setCapacity(app, adminCookie, counted + 100, "closed");
    const res = await registerLearner(app, `closed_${Date.now()}@example.com`, "closed");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("REGISTRATION_CLOSED");
    await setCapacity(app, adminCookie, counted + 100, "open");
  });
});
