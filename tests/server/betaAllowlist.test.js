import { describe, expect, it } from "vitest";
import {
  assertBetaRegistrationAllowed,
  getBetaAllowedEmails,
  normalizeAllowlistEmail,
  parseBetaAllowedEmails,
} from "../../server/src/config/betaAllowlist.js";
import { AppError } from "../../server/src/middleware/errorHandler.js";

describe("betaAllowlist", () => {
  it("parses comma-separated emails", () => {
    const set = parseBetaAllowedEmails("a@test.local, B@test.local");
    expect(set?.has("a@test.local")).toBe(true);
    expect(set?.has("b@test.local")).toBe(true);
  });

  it("parses JSON array emails", () => {
    const set = parseBetaAllowedEmails('["one@test.local","two@test.local"]');
    expect(set?.size).toBe(2);
  });

  it("reads process.env at runtime", () => {
    process.env.BETA_ALLOWED_EMAILS = "runtime@test.local";
    expect(getBetaAllowedEmails()?.has("runtime@test.local")).toBe(true);
    delete process.env.BETA_ALLOWED_EMAILS;
  });

  it("rejects in production when allowlist is missing", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevBeta = process.env.BETA_ALLOWED_EMAILS;
    process.env.NODE_ENV = "production";
    delete process.env.BETA_ALLOWED_EMAILS;

    try {
      assertBetaRegistrationAllowed("any@test.local");
      expect.unreachable("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(403);
      expect(e.code).toBe("BETA_REGISTRATION_CLOSED");
    }

    process.env.NODE_ENV = prevEnv;
    if (prevBeta !== undefined) process.env.BETA_ALLOWED_EMAILS = prevBeta;
  });

  it("normalizes email case and quotes", () => {
    expect(normalizeAllowlistEmail('"Tester@Example.com"')).toBe("tester@example.com");
  });
});
