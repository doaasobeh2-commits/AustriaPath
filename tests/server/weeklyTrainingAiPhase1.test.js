/**
 * Phase 1 — B1 Weekly Training AI server shell tests.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.B1_WEEKLY_PLAN_AI_ENABLED = "true";
process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = "test-b1-weekly-key";
process.env.WEEKLY_TRAINING_B1_MODEL = "gpt-5.4-test";

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createApp } from "../../server/src/app.js";
import { initDb, runMigrations, closeDb, query } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { runWeeklyTrainingAiMigration } from "../../server/src/db/weeklyTrainingAiMigration.js";
import { runRegistrationCapacityMigration } from "../../server/src/db/registrationCapacityMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";
import { grantWeeklyPlanAccess } from "../../server/src/services/weeklyPlanEntitlementService.js";
import {
  assertB1WeeklyTrainingApiKeyConfigured,
  getB1WeeklyTrainingAiConfig,
  usesDedicatedB1ApiKeyOnly,
} from "../../server/src/weekly-training-ai/core/config.js";
import { getB1WeeklyTrainingOpenAiClientConfig } from "../../server/src/weekly-training-ai/core/openaiClient.js";
import * as catalogResolver from "../../server/src/weekly-training-ai/core/catalogResolver.js";
import { getSessionById } from "../../server/src/weekly-training-ai/core/sessionStore.js";
import {
  b1WeeklyPlanHoerenCatalog,
  b1WeeklyPlanSchreibenCatalog,
  b1WeeklyPlanBildbeschreibungCatalog,
  b1WeeklyPlanPlanungCatalog,
  b1WeeklyPlanSelbstvorstellungCatalog,
} from "../../src/data/weekly-plan/b1/index.js";

const START_BODY = {
  trainingLevel: "B1",
  category: "hoeren",
  modelId: "b1wp-hoeren-001",
  planHash: "plan-hash-phase1",
  planIndex: 1,
  exerciseSlot: 1,
  idempotencyKey: "phase1-start-001",
};

/** @param {import('express').Express} app */
async function registerAndLogin(app, suffix = "") {
  const email = `b1wt_${Date.now()}${suffix}@test.local`;
  await request(app).post("/auth/register").send({
    name: "B1 WT Student",
    email,
    password: "password123",
    level: "B1",
  });
  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  await grantWeeklyPlanAccess(login.body.data.user.id);
  return { email, cookie: login.headers["set-cookie"] };
}

describe("Weekly Training AI Phase 1", () => {
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await runTrialAccessMigration();
    await runWeeklyTrainingAiMigration();
    await runRegistrationCapacityMigration();
    await seedRuleRegistryIfEmpty();
    app = createApp();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("dedicated env isolation", () => {
    it("reads only B1 weekly training env vars", () => {
      const config = getB1WeeklyTrainingAiConfig();
      expect(config.enabled).toBe(true);
      expect(config.apiKey).toBe("test-b1-weekly-key");
      expect(config.model).toBe("gpt-5.4-test");
      expect(config.timeoutMs).toBeGreaterThan(0);
      expect(config.rateLimitPerMin).toBeGreaterThan(0);
    });

    it("never falls back to generic OPENAI_API_KEY", () => {
      const isolation = usesDedicatedB1ApiKeyOnly();
      expect(isolation.wouldUseGenericFallback).toBe(false);
      expect(isolation.dedicatedKeyPresent).toBe(true);
    });

    it("openai client config uses dedicated B1 key and model only", () => {
      const clientConfig = getB1WeeklyTrainingOpenAiClientConfig();
      expect(clientConfig.apiKey).toBe("test-b1-weekly-key");
      expect(clientConfig.model).toBe("gpt-5.4-test");
      expect(clientConfig.apiKey).not.toBe(process.env.OPENAI_API_KEY || "");
      expect(clientConfig.model).not.toBe(process.env.OPENAI_MODEL || "");
    });
  });

  describe("missing B1 key handling", () => {
    const originalKey = process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY;
    const originalModel = process.env.WEEKLY_TRAINING_B1_MODEL;

    afterEach(() => {
      process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = originalKey;
      process.env.WEEKLY_TRAINING_B1_MODEL = originalModel;
    });

    it("rejects when enabled but dedicated key is missing", () => {
      process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = "";
      expect(() => assertB1WeeklyTrainingApiKeyConfigured()).toThrow(/WEEKLY_TRAINING_B1_OPENAI_API_KEY/);
    });

    it("rejects when enabled but dedicated model is missing", () => {
      process.env.WEEKLY_TRAINING_B1_MODEL = "";
      expect(() => assertB1WeeklyTrainingApiKeyConfigured()).toThrow(/WEEKLY_TRAINING_B1_MODEL/);
    });
  });

  describe("module isolation guards", () => {
    it("weekly-training-ai sources do not import placement, examiner, or generic ai routes", () => {
      const root = resolve("server/src/weekly-training-ai");
      const files = readdirSync(root, { recursive: true })
        .filter((file) => String(file).endsWith(".js"))
        .map((file) => join(root, String(file)));

      const forbidden = [
        "placement",
        "examiner",
        "ai.routes",
        "a2Schreiben",
        "placementEvaluate",
        "ai_credits",
      ];

      files.forEach((file) => {
        const source = readFileSync(file, "utf8");
        forbidden.forEach((needle) => {
          expect(source.toLowerCase()).not.toContain(needle.toLowerCase());
        });
        expect(source).not.toMatch(/process\.env\.OPENAI_API_KEY/);
        expect(source).not.toMatch(/process\.env\.OPENAI_MODEL/);
        expect(source).not.toMatch(/process\.env\.B1_WEEKLY_PLAN_OPENAI_MODEL/);
        expect(source).not.toMatch(/env\.openaiApiKey/);
        expect(source).not.toMatch(/env\.openaiModel/);
      });
    });
  });

  describe("B1 catalog modelVersion", () => {
    it("assigns modelVersion 1 to all B1 weekly catalog models", () => {
      const catalogs = [
        b1WeeklyPlanSelbstvorstellungCatalog,
        b1WeeklyPlanSchreibenCatalog,
        b1WeeklyPlanHoerenCatalog,
        b1WeeklyPlanBildbeschreibungCatalog,
        b1WeeklyPlanPlanungCatalog,
      ];
      catalogs.forEach((catalog) => {
        catalog.forEach((model) => {
          expect(model.modelVersion).toBe(1);
        });
      });
    });
  });

  describe("session lifecycle routes", () => {
    /** @type {string[]} */
    let cookieA;
    /** @type {string[]} */
    let cookieB;

    beforeAll(async () => {
      const userA = await registerAndLogin(app, "a");
      const userB = await registerAndLogin(app, "b");
      cookieA = userA.cookie;
      cookieB = userB.cookie;
    });

    it("mounts B1 weekly training routes under /v1", async () => {
      const root = express();
      root.use("/v1", createApp());
      const res = await request(root)
        .post("/v1/weekly-training-ai/b1/sessions/start")
        .send(START_BODY);
      expect(res.status).not.toBe(404);
      expect(res.body?.error?.code).toMatch(/AUTH/);
    });

    it("starts session with frozen snapshot and modelVersion", async () => {
      const res = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send({ ...START_BODY, planHash: "phase1-start-snapshot", idempotencyKey: "phase1-start-snapshot" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.modelId).toBe("b1wp-hoeren-001");
      expect(res.body.data.session.modelVersion).toBe(1);
      expect(res.body.data.session.productScope).toBe("b1_weekly_plan_task_ai");
      expect(res.body.data.session.status).toBe("in_progress");
      expect(res.body.data.replayed).toBe(false);

      const dbSession = await getSessionById(res.body.data.session.sessionId);
      expect(dbSession.modelSnapshot.id).toBe("b1wp-hoeren-001");
      expect(dbSession.modelSnapshot.modelVersion).toBe(1);
      expect(dbSession.modelSnapshot.parts).toHaveLength(2);
    });

    it("rejects wrong training level", async () => {
      const res = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send({
          ...START_BODY,
          trainingLevel: "A2",
          idempotencyKey: "phase1-wrong-level",
          planHash: "phase1-wrong-level",
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects wrong category/task pairing", async () => {
      const res = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send({
          ...START_BODY,
          category: "schreiben",
          modelId: "b1wp-hoeren-001",
          idempotencyKey: "phase1-wrong-pair",
          planHash: "phase1-wrong-pair",
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns idempotent replay for duplicate start scope", async () => {
      const body = {
        ...START_BODY,
        planHash: "phase1-idempotent-start",
        idempotencyKey: "phase1-idempotent-start",
      };
      const first = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send(body);
      const second = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send(body);

      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(second.body.data.replayed).toBe(true);
      expect(second.body.data.session.sessionId).toBe(first.body.data.session.sessionId);
    });

    it("rejects cross-user session access", async () => {
      const started = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send({ ...START_BODY, planHash: "phase1-cross-user", idempotencyKey: "phase1-cross-user" });

      const sessionId = started.body.data.session.sessionId;
      const denied = await request(app)
        .get(`/weekly-training-ai/b1/sessions/${sessionId}`)
        .set("Cookie", cookieB);

      expect(denied.status).toBe(403);
      expect(denied.body.error.code).toBe("FORBIDDEN");
    });

    it("does not reload live catalog after session start", async () => {
      const resolveSpy = vi.spyOn(catalogResolver, "resolveAndFreezeB1CatalogModel");

      const started = await request(app)
        .post("/weekly-training-ai/b1/sessions/start")
        .set("Cookie", cookieA)
        .send({ ...START_BODY, planHash: "phase1-no-reload", idempotencyKey: "phase1-no-reload" });

      const sessionId = started.body.data.session.sessionId;
      resolveSpy.mockClear();

      const loaded = await request(app)
        .get(`/weekly-training-ai/b1/sessions/${sessionId}`)
        .set("Cookie", cookieA);

      expect(loaded.status).toBe(200);
      expect(resolveSpy).not.toHaveBeenCalled();

      resolveSpy.mockRestore();
    });
  });

  describe("legacy systems untouched", () => {
    it("placement evaluate route still mounts independently", async () => {
      const root = express();
      root.use("/v1", createApp());
      const res = await request(root)
        .post("/v1/placement/evaluate-turn")
        .send({ attemptId: "x", turnIndex: 0 });
      expect(res.status).not.toBe(404);
    });

    it("weekly-plan schreiben route still mounts independently", async () => {
      const root = express();
      root.use("/v1", createApp());
      const res = await request(root)
        .post("/v1/weekly-plan/correct-schreiben")
        .send({ input: {}, idempotencyKey: "legacy-schreiben" });
      expect(res.status).not.toBe(404);
      expect(res.body?.error?.code).toMatch(/AUTH/);
    });
  });
});
