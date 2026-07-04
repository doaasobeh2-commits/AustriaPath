import { describe, it, expect, afterEach } from "vitest";
import { closeDb, initDb } from "../../server/src/db/client.js";
import { assertProductionDatabaseConfig } from "../../server/src/config/validateEnv.js";

describe("production database config", () => {
  const saved = { ...process.env };

  afterEach(async () => {
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, saved);
    await closeDb();
  });

  it("rejects production startup without DATABASE_URL", () => {
    process.env.NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    delete process.env.USE_PGLITE;

    expect(() => assertProductionDatabaseConfig()).toThrow(/DATABASE_URL is required/);
  });

  it("rejects USE_PGLITE in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
    process.env.USE_PGLITE = "true";

    expect(() => assertProductionDatabaseConfig()).toThrow(/USE_PGLITE is not allowed/);
  });

  it("accepts valid DATABASE_URL in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
    delete process.env.USE_PGLITE;

    expect(() => assertProductionDatabaseConfig()).not.toThrow();
  });

  it("initDb refuses PGlite fallback in production without DATABASE_URL", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    delete process.env.USE_PGLITE;

    await expect(initDb()).rejects.toThrow(/DATABASE_URL is required/);
  });
});
