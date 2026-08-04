/**
 * Admin user-management PATCH actions (block / unblock).
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

/** @param {import('express').Express} app */
async function registerLearner(app) {
  const email = `admin_mgmt_${Date.now()}@test.local`;
  const password = "password123";
  const reg = await request(app).post("/auth/register").send({
    name: "Learner",
    email,
    password,
    level: "B1",
  });
  expect(reg.status).toBe(201);
  return { email, password, userId: reg.body.data.user.id };
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
  return { cookie };
}

describe("admin user management PATCH", () => {
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

  it("blocks a user and prevents login", async () => {
    const admin = await loginAdmin(app);
    const learner = await registerLearner(app);

    const blockRes = await request(app)
      .patch(`/admin/users/${learner.userId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "blocked" });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.user.status).toBe("blocked");

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: learner.email, password: learner.password });
    expect(loginRes.status).toBe(403);
  });

  it("unblocks a user so they can log in again", async () => {
    const admin = await loginAdmin(app);
    const learner = await registerLearner(app);

    await request(app)
      .patch(`/admin/users/${learner.userId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "blocked" });

    const unblockRes = await request(app)
      .patch(`/admin/users/${learner.userId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "approved" });
    expect(unblockRes.status).toBe(200);
    expect(unblockRes.body.data.user.status).toBe("approved");

    const { rows } = await query(`SELECT status FROM users WHERE id = $1`, [learner.userId]);
    expect(rows[0].status).toBe("approved");

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: learner.email, password: learner.password });
    expect(loginRes.status).toBe(200);
  });
});
