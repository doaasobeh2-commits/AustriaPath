import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPlacementSession,
  loadPlacementRecentContent,
  loadPlacementSession,
  PLACEMENT_HISTORY_LIMIT,
  recordCompletedPlacementContent,
  savePlacementSession,
} from "../src/utils/placementSession.js";
import {
  claimPlacementReportFinalization,
  isPlanningEvaluationComplete,
  placementTurnIdempotencyKey,
  releasePlacementReportFinalization,
} from "../src/data/placementLogic.js";

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

  it("preserves the sticky Planning scenario and current move", () => {
    savePlacementSession("attempt-planning", {
      currentModelId: "b2_planung_weiterbildung",
      planningMoveId: "training-format",
      planningPhase: "responding",
      planningResponseSeconds: 42,
    });
    expect(loadPlacementSession("attempt-planning")).toMatchObject({
      currentModelId: "b2_planung_weiterbildung",
      planningMoveId: "training-format",
      planningPhase: "responding",
      planningResponseSeconds: 42,
    });
  });

  it("uses stable per-move Planning keys while preserving non-Planning semantics", () => {
    const keyFor = (moveId) => placementTurnIdempotencyKey({
      stageIndex: 3,
      followUpCount: 4,
      skill: "planung",
      modelId: "a2_planung_picknick",
      moveId,
    });
    expect(keyFor("picnic-items")).toBe("turn:3:a2_planung_picknick:picnic-items");
    expect(keyFor("picnic-reaction")).toBe("turn:3:a2_planung_picknick:picnic-reaction");
    expect(keyFor("picnic-close")).toBe("turn:3:a2_planung_picknick:picnic-close");
    expect(keyFor("picnic-close")).toBe(keyFor("picnic-close"));
    expect(placementTurnIdempotencyKey({
      stageIndex: 0,
      followUpCount: 2,
      skill: "selbstvorstellung",
      modelId: "a2_self_mittel",
      moveId: null,
    })).toBe("turn:0:2");
  });

  it("requires an explicitly completed Planning evaluation before finalization", () => {
    expect(isPlanningEvaluationComplete({ band: "A2", planningComplete: true })).toBe(true);
    expect(isPlanningEvaluationComplete({ band: "A2", planningComplete: false })).toBe(false);
    expect(isPlanningEvaluationComplete({ band: "A2" })).toBe(false);
    expect(isPlanningEvaluationComplete(null)).toBe(false);
  });

  it("allows only one in-flight final report request per attempt", async () => {
    const inFlightRef = { current: null };
    const reportRequest = vi.fn(async () => "report");
    const finalize = async () => {
      if (!claimPlacementReportFinalization(inFlightRef, "attempt-1")) return null;
      return reportRequest();
    };

    await Promise.all([finalize(), finalize()]);
    expect(reportRequest).toHaveBeenCalledTimes(1);
    releasePlacementReportFinalization(inFlightRef, "attempt-1");
    expect(claimPlacementReportFinalization(inFlightRef, "attempt-1")).toBe(true);
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
