/**
 * Password reset — forgot-password returns neutral success even when email delivery fails.
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

describe("Password reset production safety", () => {
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    await prepareServerTestDb();
    app = createApp();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await closeDb();
  });

  it("POST /auth/forgot-password returns success when email provider fails", async () => {
    const email = `reset_fail_${Date.now()}@test.local`;
    const password = "password123";
    const register = await request(app).post("/auth/register").send({
      name: "Reset Fail User",
      email,
      password,
      level: "B1",
    });
    expect(register.status).toBe(201);

    vi.spyOn(emailService, "sendPasswordResetEmail").mockRejectedValueOnce(
      new Error("Email provider not configured")
    );

    const res = await request(app).post("/auth/forgot-password").send({ email });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
  });
});
