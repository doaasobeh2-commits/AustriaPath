import { describe, it, expect } from "vitest";
import { shouldShowResetPasswordScreen } from "../src/utils/resetPasswordDeepLink.js";

describe("reset password deep link", () => {
  it("opens reset screen for valid token regardless of login state contract", () => {
    expect(shouldShowResetPasswordScreen({ type: "reset", token: "abc" })).toBe(true);
    expect(shouldShowResetPasswordScreen({ type: "reset", token: "" })).toBe(false);
    expect(shouldShowResetPasswordScreen({ type: "verify", token: "abc" })).toBe(false);
    expect(shouldShowResetPasswordScreen(null)).toBe(false);
  });
});
