/**
 * 48-hour trial + admin-approved access tests.
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
  const email = `trial_${Date.now()}${suffix}@test.local`;
  await request(app).post("/auth/register").send({
    name: "Trial Student",
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

describe("48-hour trial access", () => {
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

  it("computeAccessStatus marks grandfathered users as APPROVED", () => {
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
      hasApplicationAccess(
        {
          email: "legacy@test.local",
          role: "student",
          status: "approved",
          is_access_approved: true,
          trial_started_at: null,
          trial_expires_at: null,
        },
        env.adminEmail
      )
    ).toBe(true);
  });

  it("new user receives a trial on first login", async () => {
    const email = await registerStudent(app, "_firstlogin");
    const { res } = await loginStudent(app, email);

    expect(res.status).toBe(200);
    expect(res.body.data.user.accessStatus).toBe("TRIAL_ACTIVE");
    expect(res.body.data.user.trialStartedAt).toBeTruthy();
    expect(res.body.data.user.trialExpiresAt).toBeTruthy();
    expect(res.body.data.user.isAccessApproved).toBe(false);

    const { rows } = await query(
      `SELECT trial_started_at, trial_expires_at, is_access_approved FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    expect(rows[0].trial_started_at).toBeTruthy();
    expect(rows[0].trial_expires_at).toBeTruthy();
    expect(rows[0].is_access_approved).toBe(false);
  });

  it("trial cannot be reset by logging in again", async () => {
    const email = await registerStudent(app, "_noreset");
    await loginStudent(app, email);
    const { rows: afterFirst } = await query(
      `SELECT trial_started_at, trial_expires_at FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    await loginStudent(app, email);
    const { rows: afterSecond } = await query(
      `SELECT trial_started_at, trial_expires_at FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    expect(afterSecond[0].trial_started_at).toEqual(afterFirst[0].trial_started_at);
    expect(afterSecond[0].trial_expires_at).toEqual(afterFirst[0].trial_expires_at);
  });

  it("expired trial blocks protected routes but allows /auth/me", async () => {
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
    expect(me.body.data.user.accessStatus).toBe("TRIAL_EXPIRED");

    const profile = await request(app).get("/student-profile").set("Cookie", cookie);
    expect(profile.status).toBe(403);
    expect(profile.body.error.code).toBe("TRIAL_EXPIRED");
  });

  it("approved users continue working after trial expiry", async () => {
    const email = await registerStudent(app, "_approved");
    const { cookie } = await loginStudent(app, email);

    const { rows } = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
    await query(
      `UPDATE users SET trial_expires_at = NOW() - INTERVAL '1 hour',
       is_access_approved = TRUE WHERE id = $1`,
      [rows[0].id]
    );

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

  it("migration does not infer existing users as expired", async () => {
    const email = `legacy_${Date.now()}@test.local`;
    await query(
      `INSERT INTO users (email, password_hash, role, status, level, allowed_levels, ai_credits, is_access_approved)
       VALUES ($1, 'hash', 'student', 'approved', 'B1', '{A2,B1}', 5, FALSE)`,
      [email]
    );

    const { rows } = await query(
      `SELECT is_access_approved, trial_started_at, trial_expires_at FROM users WHERE email = $1`,
      [email]
    );

    const status = computeAccessStatus(
      {
        email,
        role: "student",
        status: "approved",
        is_access_approved: rows[0].is_access_approved,
        trial_started_at: rows[0].trial_started_at,
        trial_expires_at: rows[0].trial_expires_at,
      },
      env.adminEmail
    );

    expect(status).toBe(ACCESS_STATUS.TRIAL_ACTIVE);
  });
});
