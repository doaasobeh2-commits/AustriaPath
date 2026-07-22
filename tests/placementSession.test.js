import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPlacementSession,
  loadPlacementRecentContent,
  loadPlacementSession,
  PLACEMENT_HISTORY_LIMIT,
  recordCompletedPlacementContent,
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

  it("keeps only compact content ids for the five most recent completed attempts", () => {
    for (let i = 0; i < PLACEMENT_HISTORY_LIMIT + 2; i += 1) {
      recordCompletedPlacementContent({
        attemptId: `attempt-${i}`, bild: `B1:${i}`, listening: `listen-${i}`,
        planning: `plan-${i}`,
      });
    }
    const history = loadPlacementRecentContent();
    expect(history).toHaveLength(PLACEMENT_HISTORY_LIMIT);
    expect(history[0].attemptId).toBe("attempt-6");
    expect(history.some((item) => "transcript" in item)).toBe(false);
  });
});
