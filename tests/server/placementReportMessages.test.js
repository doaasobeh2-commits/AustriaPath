import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "placement-message-test-secret";

import { createApp } from "../../server/src/app.js";
import { closeDb, initDb, query, runMigrations } from "../../server/src/db/client.js";
import {
  beginPlacementAttempt,
  completePlacementAttempt,
  getPlacementEntitlement,
  grantPlacementAttempt,
} from "../../server/src/services/placementEntitlementService.js";
import { getMessage, listMessages } from "../../server/src/services/messageService.js";
import { placementReportSnapshot } from "../helpers/placementReportSnapshot.js";

async function registerAndLogin(app, email) {
  await request(app).post("/auth/register").send({
    name: "Placement Learner",
    email,
    password: "password123",
    level: "B1",
  });
  const login = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  return { userId: rows[0].id, cookie: login.headers["set-cookie"] };
}

describe("Placement final report messages", () => {
  let app;
  let learner;
  let otherLearner;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    app = createApp();
    learner = await registerAndLogin(app, "placement-message-owner@test.local");
    otherLearner = await registerAndLogin(app, "placement-message-other@test.local");
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await closeDb();
  });

  it("creates exactly one owned snapshot, preserves report content, and reopens without AI", async () => {
    const beforeCredits = await query(`SELECT ai_credits FROM users WHERE id = $1`, [learner.userId]);
    await grantPlacementAttempt(learner.userId);
    const attempt = await beginPlacementAttempt(learner.userId);
    const snapshot = placementReportSnapshot({
      learnerReport: {
        ...placementReportSnapshot().learnerReport,
        improvements: [
          ...placementReportSnapshot().learnerReport.improvements,
          { skill: "planung", text: "Darf nicht erscheinen", finalState: "not_assessed" },
        ],
      },
    });

    const completed = await completePlacementAttempt(learner.userId, attempt.attemptId, snapshot);
    expect(completed).toMatchObject({ completed: true, replayed: false });
    expect(completed.messageId).toBeTruthy();

    const replay = await completePlacementAttempt(
      learner.userId,
      attempt.attemptId,
      placementReportSnapshot({ level: "B2" })
    );
    expect(replay).toMatchObject({ completed: false, replayed: true, messageId: completed.messageId });
    expect(await listMessages(learner.userId)).toHaveLength(1);

    const stored = await getMessage(learner.userId, completed.messageId);
    expect(stored).toMatchObject({
      title: "Ihr Ergebnis der Einstufung",
      sourceType: "placement_report",
      sourceId: attempt.attemptId,
    });
    expect(stored.subtitle).toContain("B1");
    expect(stored.snapshot.level).toBe("B1");
    expect(stored.snapshot.learnerReport.areas.map((area) => area.skill)).toEqual([
      "selbstvorstellung",
      "bildbeschreibung",
      "lesenHoeren",
      "planung",
    ]);
    expect(stored.snapshot.learnerReport.strengths).toEqual(snapshot.learnerReport.strengths);
    expect(stored.snapshot.learnerReport.recommendations).toEqual(snapshot.learnerReport.recommendations);
    expect(stored.snapshot.learnerReport.transcripts).toEqual(snapshot.learnerReport.transcripts);
    expect(JSON.stringify(stored.snapshot)).not.toContain("Darf nicht erscheinen");
    expect(JSON.stringify(stored.snapshot)).not.toContain("not_assessed");

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const listResponse = await request(app)
      .get(`/messages?userId=${otherLearner.userId}`)
      .set("Cookie", learner.cookie);
    const detailResponse = await request(app)
      .get(`/messages/${completed.messageId}`)
      .set("Cookie", learner.cookie);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.message.snapshot).toEqual(stored.snapshot);
    expect(fetchSpy).not.toHaveBeenCalled();

    const denied = await request(app)
      .get(`/messages/${completed.messageId}`)
      .set("Cookie", otherLearner.cookie);
    expect(denied.status).toBe(404);
    expect(await getMessage(otherLearner.userId, completed.messageId)).toBeNull();

    const afterCredits = await query(`SELECT ai_credits FROM users WHERE id = $1`, [learner.userId]);
    expect(afterCredits.rows[0].ai_credits).toBe(beforeCredits.rows[0].ai_credits);
  });

  it("keeps each future attempt as a separate message", async () => {
    await grantPlacementAttempt(learner.userId);
    const secondAttempt = await beginPlacementAttempt(learner.userId);
    await completePlacementAttempt(
      learner.userId,
      secondAttempt.attemptId,
      placementReportSnapshot({ level: "B2" })
    );
    const messages = await listMessages(learner.userId);
    expect(messages).toHaveLength(2);
    expect(new Set(messages.map((message) => message.sourceId)).size).toBe(2);
  });

  it("leaves an attempt recoverable after invalid snapshot failure", async () => {
    await grantPlacementAttempt(otherLearner.userId);
    const attempt = await beginPlacementAttempt(otherLearner.userId);
    await expect(
      completePlacementAttempt(otherLearner.userId, attempt.attemptId, { level: "B1" })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(getPlacementEntitlement(otherLearner.userId)).resolves.toMatchObject({
      attemptStatus: "in_progress",
      attemptId: attempt.attemptId,
    });
    expect(await listMessages(otherLearner.userId)).toHaveLength(0);

    await query(`ALTER TABLE user_messages RENAME TO user_messages_unavailable`);
    await expect(
      completePlacementAttempt(otherLearner.userId, attempt.attemptId, placementReportSnapshot())
    ).rejects.toBeTruthy();
    await query(`ALTER TABLE user_messages_unavailable RENAME TO user_messages`);
    await expect(getPlacementEntitlement(otherLearner.userId)).resolves.toMatchObject({
      attemptStatus: "in_progress",
      attemptId: attempt.attemptId,
    });

    await expect(
      completePlacementAttempt(otherLearner.userId, attempt.attemptId, placementReportSnapshot())
    ).resolves.toMatchObject({ completed: true });
    expect(await listMessages(otherLearner.userId)).toHaveLength(1);
  });
});
