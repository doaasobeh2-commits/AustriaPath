/**
 * Safety hardening — placeholder turn/complete blocked until category handlers ship.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.B1_WEEKLY_PLAN_AI_ENABLED = "true";
process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = "test-b1-weekly-key";
process.env.WEEKLY_TRAINING_B1_MODEL = "gpt-5.4-test";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { createApp } from "../../server/src/app.js";
import { initDb, runMigrations, closeDb, query } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { runWeeklyTrainingAiMigration } from "../../server/src/db/weeklyTrainingAiMigration.js";
import { runRegistrationCapacityMigration } from "../../server/src/db/registrationCapacityMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";
import { grantWeeklyPlanAccess } from "../../server/src/services/weeklyPlanEntitlementService.js";
import { resolveAndFreezeB1CatalogModel } from "../../server/src/weekly-training-ai/core/catalogResolver.js";
import {
  B1_CATEGORY_COMPLETE_CAPABILITIES,
  B1_CATEGORY_TURN_CAPABILITIES,
} from "../../server/src/weekly-training-ai/core/categoryCapabilities.js";
import { getSessionById } from "../../server/src/weekly-training-ai/core/sessionStore.js";

const START_BODY = {
  trainingLevel: "B1",
  category: "hoeren",
  modelId: "b1wp-hoeren-001",
  planHash: "safety-plan",
  planIndex: 1,
  exerciseSlot: 1,
};

/** @param {import('express').Express} app */
async function registerAndLogin(app) {
  const email = `b1wt_safety_${Date.now()}@test.local`;
  await request(app).post("/auth/register").send({
    name: "Safety Student",
    email,
    password: "password123",
    level: "B1",
  });
  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  await grantWeeklyPlanAccess(login.body.data.user.id);
  return login.headers["set-cookie"];
}

describe("Weekly Training AI safety hardening", () => {
  /** @type {import('express').Express} */
  let app;
  /** @type {string[]} */
  let cookie;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await runTrialAccessMigration();
    await runWeeklyTrainingAiMigration();
    await runRegistrationCapacityMigration();
    await seedRuleRegistryIfEmpty();
    app = createApp();
    cookie = await registerAndLogin(app);
  });

  afterAll(async () => {
    await closeDb();
  });

  it("keeps per-exercise complete disabled; interactive turn enabled for speaking categories", () => {
    expect(B1_CATEGORY_TURN_CAPABILITIES).toEqual({
      selbstvorstellung: true,
      schreiben: false,
      hoeren: false,
      bildbeschreibung: true,
      planung: true,
    });
    expect(B1_CATEGORY_COMPLETE_CAPABILITIES).toEqual({
      selbstvorstellung: false,
      schreiben: false,
      hoeren: false,
      bildbeschreibung: false,
      planung: false,
    });
  });

  it("resolves B1 catalog through the Node server ESM import chain", () => {
    const frozen = resolveAndFreezeB1CatalogModel("hoeren", "b1wp-hoeren-001");
    expect(frozen.modelId).toBe("b1wp-hoeren-001");
    expect(frozen.modelVersion).toBe(1);
    expect(frozen.modelSnapshot.parts).toHaveLength(2);
    expect(frozen.modelSnapshot).not.toBe(
      resolveAndFreezeB1CatalogModel("hoeren", "b1wp-hoeren-001").modelSnapshot
    );
  });

  it("exposes routes at /v1/weekly-training-ai/b1/*", async () => {
    const root = express();
    root.use("/v1", createApp());
    const res = await request(root)
      .post("/v1/weekly-training-ai/b1/sessions/start")
      .send({ ...START_BODY, idempotencyKey: "safety-mount" });
    expect(res.status).not.toBe(404);
  });

  it("migration 002_weekly_training_ai_v1 is idempotent on repeated startup", async () => {
    await runWeeklyTrainingAiMigration();
    await runWeeklyTrainingAiMigration();
    const { rows } = await query(
      `SELECT id FROM schema_migrations WHERE id = $1`,
      ["002_weekly_training_ai_v1"]
    );
    expect(rows).toHaveLength(1);

    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('weekly_training_task_sessions', 'weekly_training_ai_logs')
      ORDER BY table_name
    `);
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      "weekly_training_ai_logs",
      "weekly_training_task_sessions",
    ]);
  });

  describe("unimplemented turn/complete are blocked", () => {
    /** @type {string} */
    let sessionId;

    beforeAll(async () => {
      const started = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookie)
        .send({ ...START_BODY, planHash: "safety-block", idempotencyKey: "safety-block" });
      sessionId = started.body.data.session.sessionId;
    });

    it("starts session as in_progress", async () => {
      const session = await getSessionById(sessionId);
      expect(session.status).toBe("in_progress");
      expect(session.transcript).toEqual([]);
      expect(session.finalReport).toBeNull();
      expect(session.completedAt).toBeNull();
    });

    it("POST /turn returns 501 without mutating session", async () => {
      const res = await request(app)
        .post(`/weekly-training-ai/b1/sessions/${sessionId}/turn`)
        .set("Cookie", cookie)
        .send({ learnerMessage: "Hallo" });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe("NOT_IMPLEMENTED");

      const session = await getSessionById(sessionId);
      expect(session.status).toBe("in_progress");
      expect(session.transcript).toEqual([]);
      expect(session.completedAt).toBeNull();
    });

    it("POST /complete returns 501 without final_report or completed_at", async () => {
      const res = await request(app)
        .post(`/weekly-training-ai/b1/sessions/${sessionId}/complete`)
        .set("Cookie", cookie)
        .send({ idempotencyKey: "safety-hoeren-complete" });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe("NOT_IMPLEMENTED");

      const session = await getSessionById(sessionId);
      expect(session.status).toBe("in_progress");
      expect(session.finalReport).toBeNull();
      expect(session.completedAt).toBeNull();
      expect(session.transcript).toEqual([]);
    });
  });
});
