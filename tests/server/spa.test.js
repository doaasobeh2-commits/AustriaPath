import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { attachProductionFrontend } from "../../server/src/spa.js";

describe("attachProductionFrontend", () => {
  it("serves index.html at GET / when dist exists", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ap-spa-"));
    fs.writeFileSync(
      path.join(tmp, "index.html"),
      "<!DOCTYPE html><html><body>AustriaPath</body></html>"
    );

    const app = express();
    app.use("/v1", express.Router().get("/health", (_req, res) => res.json({ ok: true })));
    attachProductionFrontend(app, tmp);

    const home = await request(app).get("/");
    expect(home.status).toBe(200);
    expect(home.text).toContain("AustriaPath");

    const api = await request(app).get("/v1/health");
    expect(api.status).toBe(200);
    expect(api.body.ok).toBe(true);
  });

  it("returns JSON at GET / when dist is missing", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ap-spa-empty-"));
    const app = express();
    attachProductionFrontend(app, tmp);

    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe("api-only");
    expect(res.body.data.health).toBe("/v1/health");
  });
});
