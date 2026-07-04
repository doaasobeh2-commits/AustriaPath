import { describe, it, expect, beforeEach, vi } from "vitest";
import { setStorage } from "./setup.js";
import { ADMIN_EMAIL } from "../src/config/authConfig.js";

vi.mock("../src/api/useBackend.js", () => ({
  useBackend: () => false,
}));

const {
  resolveSessionUser,
  validateSessionOnStartup,
  syncSessionUser,
  clearSession,
  authenticateUser,
  getCurrentUser,
} = await import("../src/app/userAccess.js");

describe("session auth security", () => {
  beforeEach(() => {
    clearSession();
  });

  it("does not restore session from isLoggedIn localStorage flag", () => {
    localStorage.setItem("isLoggedIn", "true");
    setStorage("austriaPathCurrentUser", {
      email: "fake@example.com",
      role: "admin",
      status: "approved",
    });

    expect(validateSessionOnStartup()).toBeNull();
    expect(resolveSessionUser()).toBeNull();
    expect(localStorage.getItem("isLoggedIn")).toBeNull();
  });

  it("does not grant admin from forged localStorage userRole", () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "admin");
    setStorage("austriaPathCurrentUser", {
      email: "student@example.com",
      role: "admin",
      status: "approved",
    });

    expect(resolveSessionUser()).toBeNull();
  });

  it("creates session only after successful authenticateUser", async () => {
    localStorage.setItem(
      "austriaPathUsers",
      JSON.stringify([
        {
          id: 1,
          name: "Student",
          email: "student@example.com",
          password: "secret123",
          level: "B1",
          role: "student",
          status: "approved",
        },
      ])
    );

    expect(resolveSessionUser()).toBeNull();

    const result = await authenticateUser("student@example.com", "secret123");
    expect(result.ok).toBe(true);
    expect(getCurrentUser()?.email).toBe("student@example.com");
    expect(localStorage.getItem("isLoggedIn")).toBeNull();
  });

  it("rejects fake login without valid credentials", async () => {
    const result = await authenticateUser("nobody@example.com", "wrong");
    expect(result.ok).toBe(false);
    expect(resolveSessionUser()).toBeNull();
  });

  it("does not treat syncSessionUser as persistent auth across reload", () => {
    syncSessionUser({
      id: "admin-1",
      email: ADMIN_EMAIL,
      role: "admin",
      status: "approved",
      level: "B1",
    });

    expect(resolveSessionUser()?.role).toBe("admin");

    clearSession();
    expect(validateSessionOnStartup()).toBeNull();
    expect(resolveSessionUser()).toBeNull();
  });
});
