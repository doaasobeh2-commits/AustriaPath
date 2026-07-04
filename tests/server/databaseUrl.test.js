import { describe, it, expect } from "vitest";
import { parseDatabaseUrl } from "../../server/src/utils/databaseUrl.js";

describe("parseDatabaseUrl", () => {
  it("returns configured=false when DATABASE_URL is empty", () => {
    expect(parseDatabaseUrl("")).toEqual({
      configured: false,
      host: null,
      port: null,
      database: null,
      role: null,
      pooled: false,
    });
  });

  it("parses host, role, and database without password", () => {
    const parsed = parseDatabaseUrl(
      "postgresql://neondb_owner:secret@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
    );
    expect(parsed.configured).toBe(true);
    expect(parsed.host).toBe(
      "ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech"
    );
    expect(parsed.database).toBe("neondb");
    expect(parsed.role).toBe("neondb_owner");
    expect(parsed.pooled).toBe(true);
    expect(parsed).not.toHaveProperty("password");
  });
});
