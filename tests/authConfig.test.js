import { describe, expect, it } from "vitest";
import { isAdminAccount, isAdminEmail } from "../src/config/authConfig.js";

describe("authConfig admin role", () => {
  it("isAdminAccount requires backend role and approved status only", () => {
    expect(
      isAdminAccount({
        email: "fadisobehau@gmail.com",
        role: "admin",
        status: "approved",
      })
    ).toBe(true);

    expect(
      isAdminAccount({
        email: "fadisobehau@gmail.com",
        role: "student",
        status: "approved",
      })
    ).toBe(false);

    expect(
      isAdminAccount({
        email: "other@example.com",
        role: "admin",
        status: "approved",
      })
    ).toBe(true);
  });

  it("does not grant admin from email alone without role", () => {
    expect(
      isAdminAccount({
        email: "fadisobehau@gmail.com",
        role: "student",
        status: "approved",
      })
    ).toBe(false);
  });

  it("isAdminEmail remains for registration guard only", () => {
    expect(isAdminEmail("fadisobehau@gmail.com")).toBe(true);
    expect(isAdminEmail("student@example.com")).toBe(false);
  });
});
