/**
 * Weekly Training AI architecture alignment tests.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.B1_WEEKLY_PLAN_AI_ENABLED = "true";
process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = "test-b1-weekly-key";
process.env.WEEKLY_TRAINING_B1_MODEL = "gpt-5.4-test";

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { initDb, runMigrations, closeDb } from "../../server/src/db/client.js";
import { runTrialAccessMigration } from "../../server/src/db/trialAccessMigration.js";
import { runWeeklyTrainingAiMigration } from "../../server/src/db/weeklyTrainingAiMigration.js";
import { runRegistrationCapacityMigration } from "../../server/src/db/registrationCapacityMigration.js";
import { seedRuleRegistryIfEmpty } from "../../server/src/db/seed.js";
import { grantWeeklyPlanAccess } from "../../server/src/services/weeklyPlanEntitlementService.js";
import { b1WeeklyPlanSchreibenCatalog } from "../../src/data/weekly-plan/b1/index.js";
import { buildB1CoachWeeklyPlan } from "../../src/data/weekly-plan/b1/planGeneration.js";
import {
  resolveDeterministicSchreibenEmailIndex,
} from "../../src/data/utils/b1SchreibenTaskParser.js";
import { buildSchreibenTrainingMemory } from "../../src/data/utils/weeklyPlanTrainingMemory.js";
import {
  collectTrainingMemoriesForDay,
  finishTrainingDay,
  startExercise,
  submitExerciseResponse,
} from "../../src/data/utils/weeklyPlanCoachState.js";
import {
  B1_CATEGORY_COMPLETE_CAPABILITIES,
  B1_CATEGORY_TURN_CAPABILITIES,
} from "../../server/src/weekly-training-ai/core/categoryCapabilities.js";
import * as openaiClient from "../../server/src/weekly-training-ai/core/openaiClient.js";
import { resetB1DailyReportCache } from "../../server/src/weekly-training-ai/handlers/b1-daily-report.handler.js";
import { getSessionById } from "../../server/src/weekly-training-ai/core/sessionStore.js";
import { resetB1TrainingDayCache } from "../../server/src/weekly-training-ai/core/dayService.js";

const SCHREIBEN_MODEL = b1WeeklyPlanSchreibenCatalog[0];
const LEARNER_EMAIL = `Sehr geehrte Frau Korma,

ich schreibe Ihnen weil ich eine neue Ausbildung machen möchte. Ich heiße Ahmed und wohne in Wien.
Ich interessiere mich für Pflege und möchte wissen wann die Ausbildung beginnt.

Mit freundlichen Grüßen
Ahmed`;

const MOCK_DAILY_REPORT = {
  summary: "Guter Trainingstag mit klarer E-Mail und aktivem Zuhören.",
  overallPerformance: "Solide B1-Leistung über alle Übungen.",
  strongestSkill: "Schreiben",
  weakestSkill: "Sprechen",
  tomorrowPriorities: [
    "Mehr Sprechübungen mit Nachfragen",
    "Hörverständnis wiederholen",
    "Grammatik in E-Mails üben",
  ],
  repeatedGrammarPatterns: {
    items: ["Artikel", "Präpositionen"],
    encouragement:
      "Konzentrieren Sie sich im nächsten Training besonders auf diese wiederholten Grammatikmuster.",
  },
  exercises: [
    {
      category: "schreiben",
      title: "E-Mail",
      originalText: LEARNER_EMAIL,
      correctedText: "Korrigierte Version der E-Mail.",
      coveredPoints: [{ id: "point-1", text: "Warum schreiben Sie?" }],
      missingPoints: [],
      feedback: "Die E-Mail ist verständlich und höflich formuliert.",
      cefrPerformance: "B1",
    },
  ],
  writing: {
    originalText: LEARNER_EMAIL,
    correctedText: "Korrigierte Version der E-Mail.",
    coveredPoints: [{ id: "point-1", text: "Warum schreiben Sie?" }],
    missingPoints: [],
  },
  listening: { notes: "Hörverständnis gespeichert." },
  speaking: { notes: "Keine Sprechdialoge heute." },
};

function fullB1Selections() {
  return {
    schreiben: b1WeeklyPlanSchreibenCatalog.slice(0, 7).map((m) => m.id),
    hoeren: Array.from({ length: 7 }, (_, i) => `b1wp-hoeren-${String(i + 1).padStart(3, "0")}`),
    bildbeschreibung: Array.from({ length: 7 }, (_, i) => `b1wp-bild-${String(i + 1).padStart(3, "0")}`),
    planung: Array.from({ length: 7 }, (_, i) => `b1wp-planung-${String(i + 1).padStart(2, "0")}`),
  };
}

/** @param {import('express').Express} app */
async function registerAndLogin(app) {
  const email = `b1arch_${Date.now()}@test.local`;
  await request(app).post("/auth/register").send({
    name: "Arch Student",
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

describe("Weekly Training AI architecture alignment", () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
    resetB1DailyReportCache();
    resetB1TrainingDayCache();
  });

  it("disables per-exercise complete and enables interactive turn categories only", () => {
    expect(B1_CATEGORY_COMPLETE_CAPABILITIES).toEqual({
      selbstvorstellung: false,
      schreiben: false,
      hoeren: false,
      bildbeschreibung: false,
      planung: false,
    });
    expect(B1_CATEGORY_TURN_CAPABILITIES.schreiben).toBe(false);
    expect(B1_CATEGORY_TURN_CAPABILITIES.hoeren).toBe(false);
    expect(B1_CATEGORY_TURN_CAPABILITIES.bildbeschreibung).toBe(true);
    expect(B1_CATEGORY_TURN_CAPABILITIES.planung).toBe(true);
    expect(B1_CATEGORY_TURN_CAPABILITIES.selbstvorstellung).toBe(true);
  });

  it("stores Schreiben training memory without AI correction on /memory", async () => {
    const selectedEmailIndex = resolveDeterministicSchreibenEmailIndex(
      SCHREIBEN_MODEL.emails,
      1,
      1
    );

    const started = await request(app)
      .post("/weekly-training-ai/b1/sessions/start")
      .set("Cookie", cookie)
      .send({
        trainingLevel: "B1",
        category: "schreiben",
        modelId: SCHREIBEN_MODEL.id,
        planHash: "arch-plan",
        planIndex: 1,
        exerciseSlot: 1,
        selectedEmailIndex,
        idempotencyKey: `arch-memory-start-${Date.now()}`,
      });

    const sessionId = started.body.data.session.sessionId;

    const saved = await request(app)
      .post(`/weekly-training-ai/b1/sessions/${sessionId}/memory`)
      .set("Cookie", cookie)
      .send({
        memory: {
          category: "schreiben",
          originalEmail: LEARNER_EMAIL,
          selectedEmailIndex,
        },
      });

    expect(saved.status).toBe(200);
    expect(saved.body.data.session.status).toBe("memory_saved");

    const complete = await request(app)
      .post(`/weekly-training-ai/b1/sessions/${sessionId}/complete`)
      .set("Cookie", cookie)
      .send({ idempotencyKey: "arch-should-fail" });

    expect(complete.status).toBe(501);

    const session = await getSessionById(sessionId);
    expect(session.finalReport).toBeNull();
    expect(session.transcript.some((entry) => entry.kind === "exercise_submission")).toBe(true);
  });

  it("generates one Final Daily Report on /days/complete", async () => {
    const openAiSpy = vi
      .spyOn(openaiClient, "createB1WeeklyTrainingJsonCompletion")
      .mockResolvedValue(MOCK_DAILY_REPORT);

    const first = await request(app)
      .post("/weekly-training-ai/b1/days/complete")
      .set("Cookie", cookie)
      .send({
        planIndex: 1,
        planHash: "arch-day",
        trainingMemories: [
          { category: "schreiben", originalEmail: LEARNER_EMAIL },
          { category: "hoeren", selectedAnswers: { "p0-q0": "A" } },
        ],
        idempotencyKey: "arch-day-complete",
      });

    expect(first.status).toBe(200);
    expect(openAiSpy).toHaveBeenCalledTimes(1);
    expect(first.body.data.dailyReport.summary).toBe(MOCK_DAILY_REPORT.summary);
    expect(first.body.data.dailyReport.writing.originalText).toBe(LEARNER_EMAIL);
    expect(first.body.data.dailyReport.score).toBeUndefined();

    const replay = await request(app)
      .post("/weekly-training-ai/b1/days/complete")
      .set("Cookie", cookie)
      .send({
        planIndex: 1,
        planHash: "arch-day",
        trainingMemories: [
          { category: "schreiben", originalEmail: LEARNER_EMAIL },
          { category: "hoeren", selectedAnswers: { "p0-q0": "A" } },
        ],
        idempotencyKey: "arch-day-complete",
      });

    expect(replay.body.data.replayed).toBe(true);
    expect(openAiSpy).toHaveBeenCalledTimes(1);
  });

  it("returns deterministic fallback on /days/complete when OpenAI is unavailable", async () => {
    resetB1TrainingDayCache();
    resetB1DailyReportCache();
    const originalKey = process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY;
    process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = "";

    const response = await request(app)
      .post("/weekly-training-ai/b1/days/complete")
      .set("Cookie", cookie)
      .set("Idempotency-Key", "arch-day-fallback")
      .send({
        planIndex: 1,
        planHash: "arch-day",
        trainingMemories: [
          { category: "schreiben", originalEmail: LEARNER_EMAIL },
          { category: "hoeren", selectedAnswers: { "p0-q0": "A" } },
        ],
      });

    process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY = originalKey;

    expect(response.status).toBe(200);
    expect(response.body.data.dailyReport.source).toBe("deterministic_fallback");
    expect(response.body.data.dailyReport.summary).toBeTruthy();
    expect(response.body.data.dailyReport.exercises.length).toBeGreaterThan(0);
  });

  it("client defers plan completion until finishTrainingDay", () => {
    let plan = buildB1CoachWeeklyPlan(fullB1Selections());
    const schreiben = plan.plans[0].exercises.find((e) => e.b1Category === "schreiben");

    plan = startExercise(plan, 1, schreiben.slot).plan;
    plan = submitExerciseResponse(plan, 1, schreiben.slot, {
      learnerResponse: LEARNER_EMAIL,
    }).plan;

    expect(plan.plans[0].status).not.toBe("completed");

    const plans = plan.plans.map((p) => {
      if (p.planIndex !== 1) return p;
      return {
        ...p,
        status: "ready_to_finish",
        exercises: p.exercises.map((exercise) => ({
          ...exercise,
          status: "completed",
          submittedAt: exercise.submittedAt || new Date().toISOString(),
          trainingMemory: exercise.trainingMemory || {
            category: exercise.b1Category,
            submittedAt: new Date().toISOString(),
          },
        })),
      };
    });
    plan = { ...plan, plans };

    const memories = collectTrainingMemoriesForDay(plan, 1);
    expect(memories.some((m) => m.category === "schreiben")).toBe(true);

    const finished = finishTrainingDay(plan, 1, MOCK_DAILY_REPORT);
    expect(finished.plan.plans[0].status).toBe("completed");
    expect(finished.plan.plans[0].dailyReport.summary).toBe(MOCK_DAILY_REPORT.summary);
  });

  it("buildSchreibenTrainingMemory preserves original email verbatim", () => {
    const memory = buildSchreibenTrainingMemory(
      {
        learnerResponse: LEARNER_EMAIL,
        selectedEmailIndex: 1,
        b1WritingSnapshot: { requiredPoints: [{ id: "point-1", text: "Test" }] },
      },
      { id: "b1wp-schreiben-001" }
    );
    expect(memory.originalEmail).toBe(LEARNER_EMAIL);
    expect(memory.correctedText).toBeUndefined();
  });
});
