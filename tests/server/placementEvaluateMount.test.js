/**
 * Confirms Placement evaluate-turn is mounted at /v1/placement/evaluate-turn
 * via createApp() registration (app is mounted under /v1 in index.js).
 */
import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../server/src/app.js";

describe("placement routes mount", () => {
  it("registers POST /placement/evaluate-turn on the /v1 app", async () => {
    const root = express();
    root.use("/v1", createApp());

    // Unauthenticated → auth middleware rejects; proves route exists (not 404)
    const res = await request(root)
      .post("/v1/placement/evaluate-turn")
      .send({
        productType: "placement_test",
        modelId: "a2_self_mittel",
        answerText: "Ich heiße Anna und wohne in Wien.",
      });

    expect(res.status).not.toBe(404);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });

  it("registers POST /placement/report on the /v1 app", async () => {
    const root = express();
    root.use("/v1", createApp());

    const res = await request(root).post("/v1/placement/report").send({
      level: "B1-",
      skillBands: { selbstvorstellung: "medium" },
    });

    expect(res.status).not.toBe(404);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });

  it("registers authenticated GET /placement/entitlement", async () => {
    const root = express();
    root.use("/v1", createApp());

    const res = await request(root).get("/v1/placement/entitlement");

    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });

  it("keeps the Placement grant endpoint admin-only", async () => {
    const root = express();
    root.use("/v1", createApp());

    const res = await request(root).post("/v1/admin/users/test-user/grant-placement");

    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });

  it("protects the one-shot Placement consumption endpoint", async () => {
    const root = express();
    root.use("/v1", createApp());

    const res = await request(root)
      .post("/v1/placement/consume-entitlement")
      .send({ idempotencyKey: "placement-test-key" });

    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toMatch(/AUTH/);
  });
});
