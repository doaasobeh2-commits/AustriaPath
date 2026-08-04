/**
 * Anonymous Community Q&A tests.
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
import {
  assertNoContactInformation,
  validateCommunityText,
} from "../../server/src/services/contactFilterService.js";

/** @param {import('express').Express} app */
async function registerAndLogin(app, suffix) {
  const email = `community_${suffix}_${Date.now()}@test.local`;
  const password = "password123";
  await request(app).post("/auth/register").send({
    name: "Community User",
    email,
    password,
    level: "B1",
  });
  const login = await request(app).post("/auth/login").send({ email, password });
  const cookie = (login.headers["set-cookie"] || [])
    .find((c) => c.startsWith("austria_path_session="))
    ?.split(";")[0];
  return { email, password, cookie, userId: login.body.data.user.id };
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

const validQuestion = {
  title: "Wie bereite ich mich auf B1 vor?",
  body: "Ich lerne seit drei Monaten Deutsch und möchte wissen, welche Übungen am besten helfen.",
};

const validAnswer =
  "Üben Sie täglich Lesen und Hören mit offiziellen Modellen und wiederholen Sie Grammatik mit kurzen Sätzen.";

describe("contact filter", () => {
  it("accepts clean text", () => {
    const text = validateCommunityText(validQuestion.body, { min: 20, max: 1500 });
    expect(text).toContain("Deutsch");
  });

  it("rejects emails", () => {
    expect(() => assertNoContactInformation("Schreib mir an test@example.com")).toThrow();
  });

  it("rejects URLs", () => {
    expect(() => assertNoContactInformation("Mehr Infos unter https://example.com")).toThrow();
  });

  it("rejects whatsapp mentions", () => {
    expect(() => assertNoContactInformation("Schreib mir auf WhatsApp")).toThrow();
  });
});

describe("community Q&A API", () => {
  /** @type {import('express').Express} */
  let app;

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
  });

  afterAll(async () => {
    await closeDb();
  });

  it("requires authentication for feed", async () => {
    const res = await request(app).get("/community/questions");
    expect(res.status).toBe(401);
  });

  it("creates question and lists it anonymously", async () => {
    const { cookie } = await registerAndLogin(app, "ask");

    const create = await request(app)
      .post("/community/questions")
      .set("Cookie", cookie || "")
      .send(validQuestion);
    expect(create.status).toBe(201);
    expect(create.body.data.question.authorLabel).toBe("AustriaPath Member");
    expect(create.body.data.question).not.toHaveProperty("authorUserId");

    const feed = await request(app)
      .get("/community/questions")
      .set("Cookie", cookie || "");
    expect(feed.status).toBe(200);
    expect(feed.body.data.items.length).toBeGreaterThan(0);
    expect(feed.body.data.items[0]).not.toHaveProperty("authorUserId");
  });

  it("blocks contact information in questions", async () => {
    const { cookie } = await registerAndLogin(app, "contact");

    const res = await request(app)
      .post("/community/questions")
      .set("Cookie", cookie || "")
      .send({
        title: "Kontakt bitte schnell",
        body: "Schreib mir bitte an meine.email@example.com für Hilfe beim Lernen.",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("prevents owner from answering own question", async () => {
    const owner = await registerAndLogin(app, "owner");

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send(validQuestion);
    const questionId = created.body.data.question.id;

    const answer = await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", owner.cookie || "")
      .send({ body: validAnswer });
    expect(answer.status).toBe(400);
  });

  it("updates status to answered and closed with max 3 answers", async () => {
    const owner = await registerAndLogin(app, "status_owner");
    const a1 = await registerAndLogin(app, "status_a1");
    const a2 = await registerAndLogin(app, "status_a2");
    const a3 = await registerAndLogin(app, "status_a3");
    const a4 = await registerAndLogin(app, "status_a4");

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send({
        title: "Wie verbessere ich mein Sprechen?",
        body: "Ich habe Probleme beim Sprechen in Alltagssituationen und suche konkrete Tipps.",
      });
    const questionId = created.body.data.question.id;

    const first = await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", a1.cookie || "")
      .send({ body: validAnswer });
    expect(first.status).toBe(201);
    expect(first.body.data.answer.authorLabel).toBe("AustriaPath Member");

    const detail1 = await request(app)
      .get(`/community/questions/${questionId}`)
      .set("Cookie", a2.cookie || "");
    expect(detail1.body.data.question.status).toBe("answered");

    await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", a2.cookie || "")
      .send({ body: validAnswer });
    await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", a3.cookie || "")
      .send({ body: validAnswer });

    const detailClosed = await request(app)
      .get(`/community/questions/${questionId}`)
      .set("Cookie", a1.cookie || "");
    expect(detailClosed.body.data.question.status).toBe("closed");
    expect(detailClosed.body.data.answers).toHaveLength(3);

    const blocked = await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", a4.cookie || "")
      .send({ body: validAnswer });
    expect(blocked.status).toBe(400);
  });

  it("supports owner archive without hiding from public feed", async () => {
    const owner = await registerAndLogin(app, "archive_owner");
    const viewer = await registerAndLogin(app, "archive_viewer");

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send({
        title: "Archiv Test Frage hier",
        body: "Diese Frage dient nur zum Testen der privaten Archivfunktion im Profil.",
      });
    const questionId = created.body.data.question.id;

    await request(app)
      .post(`/community/my/questions/${questionId}/archive`)
      .set("Cookie", owner.cookie || "");

    const myList = await request(app)
      .get("/community/my/questions")
      .set("Cookie", owner.cookie || "");
    expect(myList.body.data.items).toHaveLength(0);

    const archived = await request(app)
      .get("/community/my/questions?archived=true")
      .set("Cookie", owner.cookie || "");
    expect(archived.body.data.items).toHaveLength(1);

    const feed = await request(app)
      .get("/community/questions")
      .set("Cookie", viewer.cookie || "");
    expect(feed.body.data.items.some((q) => q.id === questionId)).toBe(true);

    await request(app)
      .post(`/community/my/questions/${questionId}/restore`)
      .set("Cookie", owner.cookie || "");
  });

  it("allows admin to answer as AustriaPath Team and hide content", async () => {
    const owner = await registerAndLogin(app, "admin_owner");
    const admin = await loginAdmin(app);

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send({
        title: "Admin Moderation Testfall",
        body: "Diese Frage testet die Moderation und Team-Antworten im Admin-Bereich.",
      });
    const questionId = created.body.data.question.id;

    const teamAnswer = await request(app)
      .post(`/admin/community/questions/${questionId}/answer`)
      .set("Cookie", admin.cookie || "")
      .send({ body: validAnswer });
    expect(teamAnswer.status).toBe(201);
    expect(teamAnswer.body.data.answer.authorLabel).toBe("AustriaPath Team");

    await request(app)
      .patch(`/admin/community/questions/${questionId}/visibility`)
      .set("Cookie", admin.cookie || "")
      .send({ visibility: "hidden" });

    const hidden = await request(app)
      .get(`/community/questions/${questionId}`)
      .set("Cookie", owner.cookie || "");
    expect(hidden.status).toBe(404);

    const { rows: logs } = await query(
      `SELECT action FROM admin_activity_log WHERE action LIKE 'community_%' ORDER BY id DESC LIMIT 5`
    );
    expect(logs.some((r) => r.action === "community_question_hidden")).toBe(true);
  });
});

describe("community Q&A moderation visibility", () => {
  /** @type {import('express').Express} */
  let app;

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
  });

  afterAll(async () => {
    await closeDb();
  });

  async function createModeratedQuestion(ownerCookie, adminCookie, visibility) {
    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", ownerCookie || "")
      .send({
        title: `Moderation ${visibility} Testfrage`,
        body: "Diese Frage testet die Sichtbarkeit nach Moderation für den Eigentümer.",
      });
    const questionId = created.body.data.question.id;

    await request(app)
      .patch(`/admin/community/questions/${questionId}/visibility`)
      .set("Cookie", adminCookie || "")
      .send({ visibility });

    return questionId;
  }

  it("excludes hidden and removed questions from the public feed", async () => {
    const owner = await registerAndLogin(app, "feed_owner");
    const viewer = await registerAndLogin(app, "feed_viewer");
    const admin = await loginAdmin(app);

    const hiddenId = await createModeratedQuestion(owner.cookie, admin.cookie, "hidden");
    const removedId = await createModeratedQuestion(owner.cookie, admin.cookie, "removed");

    const feed = await request(app)
      .get("/community/questions")
      .set("Cookie", viewer.cookie || "");
    expect(feed.status).toBe(200);
    const ids = feed.body.data.items.map((q) => q.id);
    expect(ids).not.toContain(hiddenId);
    expect(ids).not.toContain(removedId);
  });

  it("includes own hidden and removed questions in Meine Fragen", async () => {
    const owner = await registerAndLogin(app, "my_owner");
    const admin = await loginAdmin(app);

    const hiddenId = await createModeratedQuestion(owner.cookie, admin.cookie, "hidden");
    const removedId = await createModeratedQuestion(owner.cookie, admin.cookie, "removed");

    const myList = await request(app)
      .get("/community/my/questions")
      .set("Cookie", owner.cookie || "");
    expect(myList.status).toBe(200);
    const ids = myList.body.data.items.map((q) => q.id);
    expect(ids).toContain(hiddenId);
    expect(ids).toContain(removedId);

    const hiddenItem = myList.body.data.items.find((q) => q.id === hiddenId);
    const removedItem = myList.body.data.items.find((q) => q.id === removedId);
    expect(hiddenItem.moderationState).toBe("hidden");
    expect(hiddenItem.moderationMessage).toBe(
      "Diese Frage wurde aus der Community ausgeblendet."
    );
    expect(removedItem.moderationState).toBe("removed");
    expect(removedItem.moderationMessage).toBe("Diese Frage wurde entfernt.");
  });

  it("blocks other learners from accessing hidden or removed questions", async () => {
    const owner = await registerAndLogin(app, "block_owner");
    const other = await registerAndLogin(app, "block_other");
    const admin = await loginAdmin(app);

    const hiddenId = await createModeratedQuestion(owner.cookie, admin.cookie, "hidden");
    const removedId = await createModeratedQuestion(owner.cookie, admin.cookie, "removed");

    const hiddenRes = await request(app)
      .get(`/community/questions/${hiddenId}`)
      .set("Cookie", other.cookie || "");
    const removedRes = await request(app)
      .get(`/community/questions/${removedId}`)
      .set("Cookie", other.cookie || "");
    expect(hiddenRes.status).toBe(404);
    expect(removedRes.status).toBe(404);
  });

  it("allows admin to inspect hidden and removed questions", async () => {
    const owner = await registerAndLogin(app, "admin_view_owner");
    const admin = await loginAdmin(app);

    const hiddenId = await createModeratedQuestion(owner.cookie, admin.cookie, "hidden");
    const removedId = await createModeratedQuestion(owner.cookie, admin.cookie, "removed");

    const list = await request(app)
      .get("/admin/community/questions")
      .set("Cookie", admin.cookie || "");
    expect(list.status).toBe(200);
    const ids = list.body.data.items.map((q) => q.id);
    expect(ids).toContain(hiddenId);
    expect(ids).toContain(removedId);

    const hidden = list.body.data.items.find((q) => q.id === hiddenId);
    const removed = list.body.data.items.find((q) => q.id === removedId);
    expect(hidden.visibility).toBe("hidden");
    expect(removed.visibility).toBe("removed");
  });

  it("does not expose personal identifiers in learner moderation responses", async () => {
    const owner = await registerAndLogin(app, "privacy_owner");
    const admin = await loginAdmin(app);

    const hiddenId = await createModeratedQuestion(owner.cookie, admin.cookie, "hidden");

    const myDetail = await request(app)
      .get(`/community/my/questions/${hiddenId}`)
      .set("Cookie", owner.cookie || "");
    expect(myDetail.status).toBe(200);

    const question = myDetail.body.data.question;
    const forbidden = [
      "authorUserId",
      "author_user_id",
      "email",
      "visibility",
      "moderator",
      "actorId",
      "targetUserId",
    ];
    for (const key of forbidden) {
      expect(question).not.toHaveProperty(key);
    }
    expect(question.authorLabel).toBe("AustriaPath Member");
    expect(question.moderationMessage).toBe(
      "Diese Frage wurde aus der Community ausgeblendet."
    );

    for (const answer of myDetail.body.data.answers) {
      expect(answer.authorLabel).toMatch(/AustriaPath (Member|Team)/);
      expect(answer).not.toHaveProperty("authorUserId");
      expect(answer).not.toHaveProperty("email");
    }
  });

  it("flags public unanswered questions after 40 hours for admin attention", async () => {
    const owner = await registerAndLogin(app, "attention_owner");
    const admin = await loginAdmin(app);

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send(validQuestion);
    const questionId = created.body.data.question.id;

    await query(
      `UPDATE community_questions
       SET created_at = NOW() - INTERVAL '41 hours'
       WHERE id = $1`,
      [questionId]
    );

    const list = await request(app)
      .get("/admin/community/questions")
      .set("Cookie", admin.cookie || "");
    expect(list.status).toBe(200);
    const item = list.body.data.items.find((q) => q.id === questionId);
    expect(item?.needsAdminAttention).toBe(true);
  });

  it("clears admin attention when a question receives an answer", async () => {
    const owner = await registerAndLogin(app, "attention_clear_owner");
    const answerer = await registerAndLogin(app, "attention_clear_answerer");
    const admin = await loginAdmin(app);

    const created = await request(app)
      .post("/community/questions")
      .set("Cookie", owner.cookie || "")
      .send({
        title: "Brauche Hilfe bei Grammatik",
        body: "Ich verstehe die deutschen Artikel nicht gut und suche einfache Erklärungen.",
      });
    const questionId = created.body.data.question.id;

    await query(
      `UPDATE community_questions
       SET created_at = NOW() - INTERVAL '41 hours'
       WHERE id = $1`,
      [questionId]
    );

    const beforeAnswer = await request(app)
      .get("/admin/community/questions")
      .set("Cookie", admin.cookie || "");
    const flagged = beforeAnswer.body.data.items.find((q) => q.id === questionId);
    expect(flagged?.needsAdminAttention).toBe(true);

    const answer = await request(app)
      .post(`/community/questions/${questionId}/answers`)
      .set("Cookie", answerer.cookie || "")
      .send({ body: validAnswer });
    expect(answer.status).toBe(201);

    const afterAnswer = await request(app)
      .get("/admin/community/questions")
      .set("Cookie", admin.cookie || "");
    const cleared = afterAnswer.body.data.items.find((q) => q.id === questionId);
    expect(cleared?.needsAdminAttention).toBe(false);
  });
});
