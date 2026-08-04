/**
 * Lightweight user activity summary tests.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { closeDb, query } from "../../server/src/db/client.js";
import { runUserActivityMigration } from "../../server/src/db/userActivityMigration.js";
import { prepareServerTestDb } from "../helpers/serverTestDb.js";
import {
  deriveUserActivityStatus,
  INACTIVE_AFTER_DAYS,
  mapUserActivitySummary,
} from "../../server/src/services/userActivityService.js";

/** @param {import('express').Express} app */
async function registerAndLogin(app, suffix) {
  const email = `activity_${suffix}_${Date.now()}@test.local`;
  const password = "password123";
  await request(app).post("/auth/register").send({
    name: "Activity User",
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

describe("user activity summary", () => {
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    await prepareServerTestDb({ extra: [runUserActivityMigration] });
    app = createApp();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("records login count and feature opens", async () => {
    const { cookie, userId } = await registerAndLogin(app, "login");

    const feature = await request(app)
      .post("/auth/activity")
      .set("Cookie", cookie || "")
      .send({ event: "open_weekly_training" });
    expect(feature.status).toBe(200);

    const { rows } = await query(
      `SELECT login_count, last_feature_opened, last_activity_at, last_login_at
       FROM users WHERE id = $1`,
      [userId]
    );
    expect(rows[0].login_count).toBe(1);
    expect(rows[0].last_feature_opened).toBe("Weekly Training");
    expect(rows[0].last_login_at).toBeTruthy();
    expect(rows[0].last_activity_at).toBeTruthy();
  });

  it("maps activity summary fields from user row", async () => {
    const { cookie, userId } = await registerAndLogin(app, "summary");
    await request(app)
      .post("/auth/activity")
      .set("Cookie", cookie || "")
      .send({ event: "open_placement" });

    const { rows } = await query(
      `SELECT login_count, last_feature_opened, last_activity_at, last_login_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const summary = mapUserActivitySummary(rows[0]);
    expect(summary.loginCount).toBe(1);
    expect(summary.lastFeatureOpened).toBe("Placement");
    expect(summary.activityStatus).toBe("active");
    expect(summary.lastActivity).toBeTruthy();
    expect(summary.lastLogin).toBeTruthy();
  });

  it("derives registered-only and inactive statuses", () => {
    expect(
      deriveUserActivityStatus({
        last_feature_opened: null,
        last_activity_at: new Date().toISOString(),
      })
    ).toBe("registered_only");

    const inactiveDate = new Date(
      Date.now() - (INACTIVE_AFTER_DAYS + 2) * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(
      deriveUserActivityStatus({
        last_feature_opened: "Weekly Training",
        last_activity_at: inactiveDate,
      })
    ).toBe("inactive");
  });
});
