import { describe, expect, it } from "vitest";
import { setStorage } from "./setup.js";
import { isPremiumActive } from "../src/utils/subscriptionAccess.js";

describe("isPremiumActive", () => {
  it("returns true when premiumActive flag set", () => {
    setStorage("premiumActive", "true");
    expect(isPremiumActive()).toBe(true);
  });

  it("returns true for active subscription JSON", () => {
    setStorage(
      "austriaPathSubscription",
      JSON.stringify({ status: "active", type: "ai_exam" })
    );
    expect(isPremiumActive()).toBe(true);
  });

  it("returns false for fresh storage", () => {
    expect(isPremiumActive()).toBe(false);
  });
});
