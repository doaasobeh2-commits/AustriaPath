/**
 * Password reset flow — forgot-password + reset-password.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.PUBLIC_APP_URL = "https://app.example.com";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { closeDb } from "../../server/src/db/client.js";
import { prepareServerTestDb } from "../helpers/serverTestDb.js";
import * as emailService from "../../server/src/services/emailService.js";
import * as tokenStore from "../../server/src/repositories/tokenStoreRepository.js";

/** @param {import('express').Express} app */
async function registerUser(app, suffix) {
  const email = `reset_${suffix}_${Date.now()}@test.local`;
  const password = "password123";
  const register = await request(app).post("/auth/register").send({
    name: "Reset User",
    email,
    password,
    level: "B1",
  });
  expect(register.status).toBe(201);
  return { email, password };
}

describe("Password reset flow", () => {
  /** @type {import('express').Express} */
  let app;
  let capturedResetUrl = "";

  beforeAll(async () => {
    await prepareServerTestDb();
    app = createApp();
    vi.spyOn(emailService, "sendPasswordResetEmail").mockImplementation(async (_email, resetUrl) => {
      capturedResetUrl = resetUrl;
      return { sent: true, provider: "test" };
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await closeDb();
  });

  it("POST /auth/forgot-password always returns success for unknown email", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "nobody@test.local" });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
    expect(capturedResetUrl).toBe("");
  });

  it("completes reset end-to-end and allows login with new password", async () => {
    const { email, password } = await registerUser(app, "happy");
    capturedResetUrl = "";

    const forgot = await request(app).post("/auth/forgot-password").send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.data.sent).toBe(true);
    expect(capturedResetUrl).toContain("resetPassword=");

    const token = new URL(capturedResetUrl).searchParams.get("resetPassword");
    expect(token).toBeTruthy();

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpassword123" });
    expect(reset.status).toBe(200);
    expect(reset.body.data.reset).toBe(true);

    const oldLogin = await request(app).post("/auth/login").send({ email, password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/auth/login")
      .send({ email, password: "newpassword123" });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.user.email).toBe(email);
  });

  it("rejects reused reset tokens", async () => {
    const { email } = await registerUser(app, "reuse");
    capturedResetUrl = "";

    await request(app).post("/auth/forgot-password").send({ email });
    const token = new URL(capturedResetUrl).searchParams.get("resetPassword");

    const first = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "anotherpass1" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "anotherpass2" });
    expect(second.status).toBe(401);
  });

  it("rejects expired reset tokens", async () => {
    const { email } = await registerUser(app, "expired");
    const userLogin = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });
    expect(userLogin.status).toBe(200);

    const token = await tokenStore.createOneTimeToken(
      "auth:password-reset",
      { userId: userLogin.body.data.user.id, email },
      -1
    );

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "freshpass123" });
    expect(reset.status).toBe(401);
  });

  it("invalidates previous reset tokens when a new one is requested", async () => {
    const { email } = await registerUser(app, "invalidate");
    capturedResetUrl = "";

    await request(app).post("/auth/forgot-password").send({ email });
    const firstToken = new URL(capturedResetUrl).searchParams.get("resetPassword");

    capturedResetUrl = "";
    await request(app).post("/auth/forgot-password").send({ email });
    const secondToken = new URL(capturedResetUrl).searchParams.get("resetPassword");

    expect(firstToken).toBeTruthy();
    expect(secondToken).toBeTruthy();
    expect(firstToken).not.toBe(secondToken);

    const stale = await request(app)
      .post("/auth/reset-password")
      .send({ token: firstToken, password: "stalepass123" });
    expect(stale.status).toBe(401);

    const fresh = await request(app)
      .post("/auth/reset-password")
      .send({ token: secondToken, password: "freshpass123" });
    expect(fresh.status).toBe(200);
  });
});
