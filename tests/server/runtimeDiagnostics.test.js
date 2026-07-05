import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { attachProductionFrontend } from "../../server/src/spa.js";
import { attachRequestLogger } from "../../server/src/middleware/requestLogger.js";
import healthzRoutes from "../../server/src/routes/healthz.routes.js";

describe("runtime diagnostics", () => {
  it("GET /healthz returns ok and time before SPA fallback", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ap-healthz-"));
    fs.writeFileSync(path.join(tmp, "index.html"), "<!DOCTYPE html><html></html>");

    const app = express();
    app.use("/healthz", healthzRoutes);
    attachProductionFrontend(app, tmp);

    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.time).toBe("string");
    expect(Number.isNaN(Date.parse(res.body.time))).toBe(false);
  });

  it("logs method, path, status, and duration for each request", async () => {
    const app = express();
    attachRequestLogger(app);
    app.use("/healthz", healthzRoutes);

    const logs = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });

    await request(app).get("/healthz");

    spy.mockRestore();
    expect(logs.some((line) => /\[http\] GET \/healthz 200/.test(line))).toBe(true);
  });
});
