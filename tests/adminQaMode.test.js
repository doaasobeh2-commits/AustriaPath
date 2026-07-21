/**
 * Admin QA mode — access bypass helpers (no scoring changes).
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  ADMIN_QA_NOT_EVALUATED,
  disableAdminQaMode,
  enableAdminQaMode,
  isAdminQaMode,
} from "../src/utils/adminQaMode.js";
import { isAdminUser } from "../server/src/utils/adminAccess.js";

describe("adminQaMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("is off for non-admin even with flag set", () => {
    enableAdminQaMode();
    expect(isAdminQaMode({ role: "user", status: "approved" })).toBe(false);
  });

  it("is on only for approved admin with preview flag", () => {
    const admin = { role: "admin", status: "approved", email: "a@b.c" };
    expect(isAdminQaMode(admin)).toBe(false);
    enableAdminQaMode();
    expect(isAdminQaMode(admin)).toBe(true);
    disableAdminQaMode();
    expect(isAdminQaMode(admin)).toBe(false);
  });

  it("exposes stable not-evaluated marker", () => {
    expect(ADMIN_QA_NOT_EVALUATED).toBe("not evaluated / QA only");
  });
});

describe("server isAdminUser", () => {
  it("matches admin role + configured email", () => {
    expect(
      isAdminUser({ role: "admin", email: "fadisobehau@gmail.com" })
    ).toBe(true);
    expect(isAdminUser({ role: "admin", email: "other@example.com" })).toBe(
      false
    );
    expect(
      isAdminUser({ role: "user", email: "fadisobehau@gmail.com" })
    ).toBe(false);
  });
});
