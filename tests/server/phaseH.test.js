/**
 * Phase H backend API tests — Sprints 1–7.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../../server/src/app.js";
import { initDb, runMigrations, closeDb } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";

process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.ADMIN_BOOTSTRAP_SECRET = "test-bootstrap-secret";

/** @param {import('express').Express} app */
async function registerAndLogin(app, suffix = "") {
  const email = `student_${Date.now()}${suffix}@test.local`;
  await request(app).post("/auth/register").send({
    name: "Test Student",
    email,
    password: "password123",
    level: "B1",
  });
  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  return { email, cookie: login.headers["set-cookie"] };
}

describe("Phase H API", () => {
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

  describe("Sprint 1 — Auth & health", () => {
    it("GET /health returns ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.betaAllowlist).toBeDefined();
    });

    it("GET /health/db returns read-only DB fingerprint without secrets", async () => {
      const res = await request(app).get("/health/db");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(["pg", "pglite", "not_initialized"]).toContain(data.dbKind);
      expect(data).toHaveProperty("host");
      expect(data).toHaveProperty("database");
      expect(data).toHaveProperty("role");
      expect(data).toHaveProperty("usersTableExists");
      expect(data).toHaveProperty("publicTableCount");
      expect(data.usersTableExists).toBe(true);
      expect(data.publicTableCount).toBeGreaterThan(0);
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    it("registers and logs in a student", async () => {
      const email = `student_${Date.now()}@test.local`;
      const reg = await request(app).post("/auth/register").send({
        name: "Test Student",
        email,
        password: "password123",
        level: "B1",
      });
      expect(reg.status).toBe(201);
      expect(reg.body.data.user.email).toBe(email);
      expect(reg.body.data.user.aiCredits).toBe(5);

      const login = await request(app).post("/auth/login").send({
        email,
        password: "password123",
      });
      expect(login.status).toBe(200);
      expect(login.body.data.user.email).toBe(email);
      expect(login.headers["set-cookie"]).toBeDefined();

      const cookie = login.headers["set-cookie"];
      const me = await request(app).get("/auth/me").set("Cookie", cookie);
      expect(me.status).toBe(200);
      expect(me.body.data.user.email).toBe(email);
    });
  });

  describe("Sprint 2 — Exam sessions", () => {
    it("starts and retrieves a weekly_plan session", async () => {
      const { cookie } = await registerAndLogin(app, "_s2");
      const idempotencyKey = randomUUID();

      const start = await request(app)
        .post("/exam-sessions")
        .set("Cookie", cookie)
        .set("Idempotency-Key", idempotencyKey)
        .send({ productType: "weekly_plan", idempotencyKey });

      expect(start.status).toBe(201);
      expect(start.body.data.sessionId).toBeTruthy();
      expect(start.body.data.session.productType).toBe("weekly_plan");

      const sessionId = start.body.data.sessionId;
      const get = await request(app)
        .get(`/exam-sessions/${sessionId}`)
        .set("Cookie", cookie);
      expect(get.status).toBe(200);
      expect(get.body.data.session.sessionId).toBe(sessionId);

      const dup = await request(app)
        .post("/exam-sessions")
        .set("Cookie", cookie)
        .set("Idempotency-Key", idempotencyKey)
        .send({ productType: "weekly_plan", idempotencyKey });
      expect(dup.status).toBe(201);
      expect(dup.body.data.sessionId).toBe(sessionId);
    });
  });

  describe("Sprint 3 — Reports & profile", () => {
    it("GET /student-profile after login", async () => {
      const { cookie } = await registerAndLogin(app, "_s3");
      const res = await request(app).get("/student-profile").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.profile.profileVersion).toBe("2.0.0");
    });

    it("GET /reports returns empty list for new user", async () => {
      const { cookie } = await registerAndLogin(app, "_s3b");
      const res = await request(app).get("/reports").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe("Sprint 4 — AI gateway", () => {
    it("GET /ai/usage returns credit balance", async () => {
      const { cookie } = await registerAndLogin(app, "_s4");
      const res = await request(app).get("/ai/usage").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.aiCredits).toBe(5);
    });

    it("POST /ai/completions charges credits (dev mode without OpenAI)", async () => {
      const { cookie } = await registerAndLogin(app, "_s4b");
      const res = await request(app)
        .post("/ai/completions")
        .set("Cookie", cookie)
        .send({ mode: "llm_proposal", context: { serviceType: "llm_proposal" } });
      expect(res.status).toBe(200);
      expect(res.body.data.creditsRemaining).toBe(4);
    });
  });

  describe("Sprint 5 — Subscription", () => {
    it("GET /subscription returns free plan", async () => {
      const { cookie } = await registerAndLogin(app, "_s5");
      const res = await request(app).get("/subscription").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.subscription.type).toBe("free");
    });

    it("POST /subscription/checkout returns dev mode without Stripe keys", async () => {
      const { cookie } = await registerAndLogin(app, "_s5b");
      const res = await request(app)
        .post("/subscription/checkout")
        .set("Cookie", cookie)
        .send({ planType: "ai_exam" });
      expect(res.status).toBe(200);
      expect(res.body.data.devMode).toBe(true);
    });
  });

  describe("Sprint 6 — Rule registry", () => {
    it("GET /rule-registry returns version", async () => {
      const res = await request(app).get("/rule-registry");
      expect(res.status).toBe(200);
      expect(res.body.data.registryVersion).toBeTruthy();
    });
  });

  describe("Sprint 7 — Migration import", () => {
    it("POST /migration/import merges profile payload", async () => {
      const { cookie } = await registerAndLogin(app, "_s7");
      const res = await request(app)
        .post("/migration/import")
        .set("Cookie", cookie)
        .send({
          exportVersion: "1.0",
          exportedAt: new Date().toISOString(),
          payload: {
            austriaPathStudentProfileV2: {
              profileVersion: "2.0.0",
              officialExamLevel: "B1",
              officialSkillLevels: { writing: "B1" },
              weakSkills: ["writing"],
              recurringMistakes: [],
              globalUsedModelIds: [],
              examHistory: [],
              practiceHistory: [],
              practiceStats: { sessionsCompleted: 1, minutesPracticed: 10, skillPracticeCounts: {} },
              reportSummaries: [],
              aiRecommendations: [],
              updatedAt: new Date().toISOString(),
            },
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.imported.profile).toBe(true);

      const profile = await request(app).get("/student-profile").set("Cookie", cookie);
      expect(profile.body.data.profile.weakSkills).toContain("writing");
    });

    it("POST /migration/import persists legacy reports", async () => {
      const { cookie } = await registerAndLogin(app, "_s7r");
      const res = await request(app)
        .post("/migration/import")
        .set("Cookie", cookie)
        .send({
          payload: {
            austriaPathAIReports: [
              {
                id: randomUUID(),
                title: "Import Test",
                type: "ai_exam",
                level: "B1",
                summary: "Imported report",
                strengths: ["Struktur"],
                weaknesses: ["Grammatik"],
              },
            ],
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.imported.reports).toBe(1);

      const reports = await request(app).get("/reports").set("Cookie", cookie);
      expect(reports.body.data.items.length).toBe(1);
    });
  });

  describe("Cutover — Auth, idempotency, admin, registry", () => {
    it("POST /auth/forgot-password always returns success", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "nobody@test.local" });
      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(true);
    });

    it("GET /rule-registry/effective returns rubric", async () => {
      const res = await request(app)
        .get("/rule-registry/effective")
        .query({ level: "B1", skill: "writing" });
      expect(res.status).toBe(200);
      expect(res.body.data.registryVersion).toBeTruthy();
    });

    it("POST /internal/bootstrap-admin creates admin when secret set", async () => {
      const res = await request(app)
        .post("/internal/bootstrap-admin")
        .set("X-Bootstrap-Secret", "test-bootstrap-secret")
        .send({ name: "Admin", password: "adminpass123" });
      expect([201, 409]).toContain(res.status);
    });

    it("POST /subscription/consume-exam requires idempotency key", async () => {
      const { cookie } = await registerAndLogin(app, "_cut");
      const res = await request(app)
        .post("/subscription/consume-exam")
        .set("Cookie", cookie)
        .send({ productType: "ai_exam" });
      expect(res.status).toBe(400);
    });
  });

  describe("Cutover — Beta allowlist", () => {
    it("returns 403 when email is not on BETA_ALLOWED_EMAILS", async () => {
      process.env.BETA_ALLOWED_EMAILS = "invited@test.local";
      const res = await request(app).post("/auth/register").send({
        name: "Stranger",
        email: `stranger_${Date.now()}@test.local`,
        password: "password123",
        level: "B1",
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("BETA_REGISTRATION_CLOSED");
      delete process.env.BETA_ALLOWED_EMAILS;
    });

    it("middleware rejects before user is created (no duplicate on retry)", async () => {
      process.env.BETA_ALLOWED_EMAILS = "invited@test.local";
      const email = `blocked_${Date.now()}@test.local`;
      const first = await request(app).post("/auth/register").send({
        name: "Blocked",
        email,
        password: "password123",
        level: "B1",
      });
      expect(first.status).toBe(403);
      const second = await request(app).post("/auth/register").send({
        name: "Blocked",
        email,
        password: "password123",
        level: "B1",
      });
      expect(second.status).toBe(403);
      delete process.env.BETA_ALLOWED_EMAILS;
    });

    it("allows registration when email is on BETA_ALLOWED_EMAILS", async () => {
      const email = `invited_${Date.now()}@test.local`;
      process.env.BETA_ALLOWED_EMAILS = email;
      const res = await request(app).post("/auth/register").send({
        name: "Invited Tester",
        email,
        password: "password123",
        level: "B1",
      });
      expect(res.status).toBe(201);
      delete process.env.BETA_ALLOWED_EMAILS;
    });

    it("existing user can still login when allowlist is active", async () => {
      const { email } = await registerAndLogin(app, "_allowlist");
      process.env.BETA_ALLOWED_EMAILS = "someone-else@test.local";
      const login = await request(app).post("/auth/login").send({
        email,
        password: "password123",
      });
      expect(login.status).toBe(200);
      delete process.env.BETA_ALLOWED_EMAILS;
    });
  });
});
