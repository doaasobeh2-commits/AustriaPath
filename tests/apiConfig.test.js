import { describe, it, expect } from "vitest";
import {
  DEFAULT_API_BASE,
  buildApiUrl,
  resolveApiBasePath,
} from "../src/api/apiConfig.js";

describe("apiConfig", () => {
  it("defaults API base to /v1", () => {
    expect(resolveApiBasePath("", "true")).toBe("/v1");
    expect(buildApiUrl("/auth/login")).toBe("/v1/auth/login");
  });

  it("uses VITE_API_BASE for API paths", () => {
    expect(resolveApiBasePath("/v1", "true")).toBe("/v1");
    expect(`${resolveApiBasePath("/v1", "true")}/auth/login`).toBe(
      "/v1/auth/login"
    );
  });

  it("never uses VITE_USE_BACKEND as the API base", () => {
    expect(resolveApiBasePath("true", "true")).toBe(DEFAULT_API_BASE);
    expect(`${resolveApiBasePath("true", "true")}/auth/login`).toBe(
      "/v1/auth/login"
    );
    expect(`${resolveApiBasePath("true", "true")}/auth/login`).not.toContain(
      "/true/"
    );
  });

  it("rejects boolean-like VITE_API_BASE values", () => {
    expect(resolveApiBasePath("false", "")).toBe("/v1");
    expect(`${resolveApiBasePath("false", "")}/auth/login`).toBe(
      "/v1/auth/login"
    );
  });

  it("strips trailing slashes from configured base", () => {
    expect(resolveApiBasePath("/v1/", "true")).toBe("/v1");
  });
});
