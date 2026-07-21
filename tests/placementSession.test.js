import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPlacementSession,
  loadPlacementSession,
  savePlacementSession,
} from "../src/utils/placementSession.js";

describe("Placement in-progress browser session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores the transcript and adaptive state for the same attempt", () => {
    savePlacementSession("attempt-1", {
      currentModelId: "a2_self_mittel",
      stageIndex: 0,
      finalizedTranscript: "Ich heiße Mina und wohne in Wien.",
      retryAnswer: {
        text: "Ich heiße Mina und wohne in Wien.",
        inputMode: "voice_transcript",
      },
    });

    expect(loadPlacementSession("attempt-1")).toMatchObject({
      version: 1,
      currentModelId: "a2_self_mittel",
      finalizedTranscript: "Ich heiße Mina und wohne in Wien.",
    });
    expect(loadPlacementSession("another-attempt")).toBeNull();
  });

  it("clears completed attempt state", () => {
    savePlacementSession("attempt-2", { currentModelId: "a2_self_mittel" });
    clearPlacementSession("attempt-2");
    expect(loadPlacementSession("attempt-2")).toBeNull();
  });
});
