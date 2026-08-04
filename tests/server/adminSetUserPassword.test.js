/**
 * Admin password reset — pilot-only set-password endpoint.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.VITE_ADMIN_INITIAL_PASSWORD = "test-admin-pass-12345";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { closeDb, query } from "../../server/src/db/client.js";
import { prepareServerTestDb } from "../helpers/serverTestDb.js";
import { ensureLocalAdminPassword } from "../../server/src/db/ensureLocalAdminPassword.js";
import { env } from "../../server/src/config/env.js";
import { verifyPassword } from "../../server/src/utils/password.js";

/** @param {import('express').Express} app */
async function registerLearner(app, suffix) {
  const email = `admin_pwd_learner_${suffix}_${Date.now()}@test.local`;
  const password = "password123";
  await request(app).post("/auth/register").send({
    name: "Learner",
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
  expect(login.status).toBe(200);
  const cookie = (login.headers["set-cookie"] || [])
    .find((c) => c.startsWith("austria_path_session="))
    ?.split(";")[0];
  return { cookie, userId: login.body.data.user.id };
}

describe("admin set user password", () => {
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    await prepareServerTestDb();
    await ensureLocalAdminPassword();
    app = createApp();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("rejects non-admin callers", async () => {
    const learner = await registerLearner(app, "forbidden");
    const res = await request(app)
      .post(`/admin/users/${learner.userId}/set-password`)
      .set("Cookie", learner.cookie)
      .send({ password: "newpassword123" });
    expect(res.status).toBe(403);
  });

  it("validates minimum password length", async () => {
    const admin = await loginAdmin(app);
    const learner = await registerLearner(app, "short");
    const res = await request(app)
      .post(`/admin/users/${learner.userId}/set-password`)
      .set("Cookie", admin.cookie)
      .send({ password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("sets password, revokes sessions, and logs admin activity", async () => {
    const admin = await loginAdmin(app);
    const learner = await registerLearner(app, "happy");

    const setRes = await request(app)
      .post(`/admin/users/${learner.userId}/set-password`)
      .set("Cookie", admin.cookie)
      .send({ password: "adminsetpass1" });
    expect(setRes.status).toBe(200);
    expect(setRes.body.data).toEqual({ updated: true });
    expect(setRes.body.data.password_hash).toBeUndefined();

    const me = await request(app).get("/auth/me").set("Cookie", learner.cookie);
    expect(me.status).toBe(401);

    const oldLogin = await request(app)
      .post("/auth/login")
      .send({ email: learner.email, password: learner.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/auth/login")
      .send({ email: learner.email, password: "adminsetpass1" });
    expect(newLogin.status).toBe(200);

    const { rows } = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [learner.userId]
    );
    const matches = await verifyPassword("adminsetpass1", rows[0].password_hash);
    expect(matches).toBe(true);

    const { rows: logs } = await query(
      `SELECT action, metadata FROM admin_activity_log
       WHERE actor_id = $1 AND action = 'admin_set_user_password'
       ORDER BY created_at DESC LIMIT 1`,
      [admin.userId]
    );
    expect(logs[0]?.action).toBe("admin_set_user_password");
    expect(logs[0]?.metadata?.userId).toBe(learner.userId);
  });

  it("returns 404 for unknown user", async () => {
    const admin = await loginAdmin(app);
    const res = await request(app)
      .post("/admin/users/00000000-0000-0000-0000-000000000099/set-password")
      .set("Cookie", admin.cookie)
      .send({ password: "validpass123" });
    expect(res.status).toBe(404);
  });
});
