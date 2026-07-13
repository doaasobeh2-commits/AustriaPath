import { describe, it, expect, beforeEach, vi } from "vitest";

describe("backend session auth", () => {
  let clearSession;
  let resolveSessionUser;
  let syncSessionUser;
  let validateSessionFromBackend;
  let authenticateUser;
  let fetchMeOptional;
  let loginViaApi;
  let hydrateBackendFromApi;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock("../src/api/useBackend.js", () => ({
      useBackend: () => true,
    }));
    vi.doMock("../src/api/authService.js", () => ({
      fetchMeOptional: vi.fn(),
      loginViaApi: vi.fn(),
      logoutViaApi: vi.fn(),
      registerViaApi: vi.fn(),
    }));
    vi.doMock("../src/api/hydrateBackend.js", async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        hydrateBackendFromApi: vi.fn().mockResolvedValue(undefined),
      };
    });

    ({ fetchMeOptional, loginViaApi } = await import("../src/api/authService.js"));
    ({ hydrateBackendFromApi } = await import("../src/api/hydrateBackend.js"));
    ({
      clearSession,
      resolveSessionUser,
      syncSessionUser,
      validateSessionFromBackend,
      authenticateUser,
    } = await import("../src/app/userAccess.js"));

    clearSession();
    vi.clearAllMocks();
  });

  it("syncSessionUser preserves backend admin role without client email check", () => {
    syncSessionUser({
      id: "u-1",
      email: "admin@example.com",
      role: "admin",
      status: "approved",
      level: "B1",
    });

    expect(resolveSessionUser()?.role).toBe("admin");
    expect(resolveSessionUser()?.email).toBe("admin@example.com");
  });

  it("does not downgrade backend admin role for non-reserved emails", () => {
    syncSessionUser({
      id: "u-2",
      email: "other-admin@example.com",
      role: "admin",
      status: "approved",
      level: "B1",
    });

    expect(resolveSessionUser()?.role).toBe("admin");
  });

  it("validateSessionFromBackend does not clear session established during /auth/me race", async () => {
    fetchMeOptional.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(null), 20);
        })
    );

    syncSessionUser({
      id: "u-3",
      email: "admin@example.com",
      role: "admin",
      status: "approved",
      level: "B1",
    });

    const result = await validateSessionFromBackend();

    expect(result?.role).toBe("admin");
    expect(resolveSessionUser()?.role).toBe("admin");
  });

  it("authenticateUser returns synced session user after backend login without blocking hydration", async () => {
    loginViaApi.mockResolvedValue({
      id: "u-4",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "approved",
      level: "B1",
    });

    const result = await authenticateUser("admin@example.com", "secret123");

    expect(result.ok).toBe(true);
    expect(result.user?.role).toBe("admin");
    expect(resolveSessionUser()?.role).toBe("admin");
    expect(hydrateBackendFromApi).not.toHaveBeenCalled();
  });

  it("authenticateUser succeeds without awaiting post-login hydration", async () => {
    loginViaApi.mockResolvedValue({
      id: "u-5",
      email: "student@example.com",
      name: "Student",
      role: "student",
      status: "approved",
      level: "B1",
    });

    const result = await authenticateUser("student@example.com", "secret123");

    expect(result.ok).toBe(true);
    expect(result.user?.role).toBe("student");
    expect(hydrateBackendFromApi).not.toHaveBeenCalled();
  });
});
