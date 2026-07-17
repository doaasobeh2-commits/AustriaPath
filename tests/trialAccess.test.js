/**
 * Public access — no allowlist or trial window restrictions.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../server/src/app.js";
import { initDb, runMigrations, closeDb, query } from "../server/src/db/client.js";
import { runTrialAccessMigration } from "../server/src/db/trialAccessMigration.js";
import { seedRuleRegistryIfEmpty } from "../server/src/db/seed.js";
import {
  computeAccessStatus,
  hasApplicationAccess,
  ACCESS_STATUS,
} from "../server/src/services/accessService.js";
import { env } from "../server/src/config/env.js";

process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.ADMIN_BOOTSTRAP_SECRET = "test-bootstrap-secret";

async function registerStudent(app, suffix = "") {
  const email = `access_${Date.now()}${suffix}@test.local`;
  await request(app).post("/auth/register").send({
    name: "Access Student",
    email,
    password: "password123",
    level: "B1",
  });
  return email;
}

async function loginStudent(app, email) {
  const res = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  return { res, cookie: res.headers["set-cookie"] };
}

describe("public application access", () => {
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await runTrialAccessMigration();
    await seedRuleRegistryIfEmpty();
    app = createApp();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("computeAccessStatus marks active users as APPROVED", () => {
    const status = computeAccessStatus(
      {
        email: "legacy@test.local",
        role: "student",
        status: "approved",
        is_access_approved: true,
        trial_started_at: null,
        trial_expires_at: null,
      },
      env.adminEmail
    );
    expect(status).toBe(ACCESS_STATUS.APPROVED);
    expect(
      hasApplicationAccess({
        email: "legacy@test.local",
        role: "student",
        status: "approved",
      })
    ).toBe(true);
  });

  it("new user is approved on first login", async () => {
    const email = await registerStudent(app, "_firstlogin");
    const { res } = await loginStudent(app, email);

    expect(res.status).toBe(200);
    expect(res.body.data.user.accessStatus).toBe("APPROVED");
    expect(res.body.data.user.isAccessApproved).toBe(true);
    expect(res.body.data.user.hasApplicationAccess).toBe(true);

    const { rows } = await query(
      `SELECT is_access_approved FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    expect(rows[0].is_access_approved).toBe(true);
  });

  it("expired trial timestamps do not block protected routes", async () => {
    const email = await registerStudent(app, "_expired");
    const { cookie } = await loginStudent(app, email);

    const { rows } = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
    await query(
      `UPDATE users SET trial_started_at = NOW() - INTERVAL '72 hours',
       trial_expires_at = NOW() - INTERVAL '24 hours',
       is_access_approved = FALSE WHERE id = $1`,
      [rows[0].id]
    );

    const me = await request(app).get("/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.user.accessStatus).toBe("APPROVED");

    const profile = await request(app).get("/student-profile").set("Cookie", cookie);
    expect(profile.status).toBe(200);
  });

  it("blocked users cannot log in", async () => {
    const email = await registerStudent(app, "_blocked");
    const { rows } = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
    await query(`UPDATE users SET status = 'blocked' WHERE id = $1`, [rows[0].id]);

    const login = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe("AUTH_BLOCKED");
  });
});
