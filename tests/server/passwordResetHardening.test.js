/**
 * Password reset production hardening — PUBLIC_APP_URL, sessions, rate limits.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.SESSION_SECRET = "test-secret";
process.env.PUBLIC_APP_URL = "https://app.example.com";
process.env.CORS_ORIGIN =
  "https://comma-contaminated.example.com,https://also-wrong.example.com";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../server/src/app.js";
import { closeDb } from "../../server/src/db/client.js";
import { prepareServerTestDb } from "../helpers/serverTestDb.js";
import * as emailService from "../../server/src/services/emailService.js";
import { buildPublicAppQueryUrl } from "../../server/src/config/publicAppUrl.js";
import { assertProductionAuthConfig } from "../../server/src/config/validateEnv.js";

/** @param {import('express').Express} app */
async function registerUser(app, suffix) {
  const email = `reset_hard_${suffix}_${Date.now()}@test.local`;
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

describe("Password reset hardening", () => {
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

  it("buildPublicAppQueryUrl uses PUBLIC_APP_URL not comma-separated CORS_ORIGIN", () => {
    const url = buildPublicAppQueryUrl("resetPassword=test-token");
    expect(url).toBe("https://app.example.com?resetPassword=test-token");
    expect(url).not.toContain(",");
  });

  it("forgot-password email link uses PUBLIC_APP_URL", async () => {
    const { email } = await registerUser(app, "public_url");
    capturedResetUrl = "";
    await request(app).post("/auth/forgot-password").send({ email });
    expect(capturedResetUrl.startsWith("https://app.example.com?resetPassword=")).toBe(true);
    expect(capturedResetUrl).not.toContain(",");
  });

  it("revokes all sessions after successful password reset", async () => {
    const { email, password } = await registerUser(app, "sessions");
    const login = await request(app).post("/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const cookie = login.headers["set-cookie"];

    capturedResetUrl = "";
    await request(app).post("/auth/forgot-password").send({ email });
    const token = new URL(capturedResetUrl).searchParams.get("resetPassword");

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpass1234" });
    expect(reset.status).toBe(200);

    const me = await request(app).get("/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("returns 429 when forgot-password rate limit is exceeded", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const { email } = await registerUser(app, "ratelimit");
      for (let i = 0; i < 3; i++) {
        const ok = await request(app).post("/auth/forgot-password").send({ email });
        expect(ok.status).toBe(200);
      }
      const limited = await request(app).post("/auth/forgot-password").send({ email });
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe("RATE_LIMITED");
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it("assertProductionAuthConfig validates PUBLIC_APP_URL when set and allows missing email provider", () => {
    const prev = {
      NODE_ENV: process.env.NODE_ENV,
      PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
    };
    process.env.NODE_ENV = "production";
    delete process.env.PUBLIC_APP_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    expect(() => assertProductionAuthConfig()).not.toThrow();

    process.env.PUBLIC_APP_URL = "not-a-valid-url";
    expect(() => assertProductionAuthConfig()).toThrow(/PUBLIC_APP_URL/);

    process.env.PUBLIC_APP_URL = "https://app.example.com";
    expect(() => assertProductionAuthConfig()).not.toThrow();

    process.env.NODE_ENV = prev.NODE_ENV;
    process.env.PUBLIC_APP_URL = prev.PUBLIC_APP_URL;
    process.env.RESEND_API_KEY = prev.RESEND_API_KEY;
    process.env.EMAIL_FROM = prev.EMAIL_FROM;
  });
});
