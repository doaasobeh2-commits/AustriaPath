/**
 * Phase 1 — Part B: every new Placement attempt must start from the
 * weak/A2 path. The learner-facing "Startniveau" picker is context only
 * and must never bias the starting model or routing before real evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getImageStepAfterSelfIntro,
  getPlacementStartModel,
  getReadingListeningStep,
  workingLevelAfterSelf,
} from "../src/data/placementLogic.js";

const screenSource = fs.readFileSync(
  path.resolve("src/app/screens/PlacementTestScreen.jsx"),
  "utf8"
);

describe("Phase 1: conservative Placement start (weak/A2 by default)", () => {
  it("tracks adaptive working level in the screen", () => {
    expect(screenSource).toMatch(/const \[workingLevel, setWorkingLevel\] = useState\('A2'\)/);
  });

  it("starts every new attempt's Selbstvorstellung model from A2 only", () => {
    expect(screenSource).toMatch(/getPlacementStartModel\(\)/);
    expect(screenSource).not.toMatch(/getPlacementStartModel\(selectedLevel\)/);
    expect(getPlacementStartModel()?.id).toBe("a2_self_mittel");
  });

  it("routes subsequent stages from performance-derived working level", () => {
    expect(screenSource).toMatch(/getImageStepAfterSelfIntro\(selfBand\)/);
    expect(screenSource).toMatch(/getReadingListeningStep\(selfBand, imageBand/);
    expect(screenSource).toMatch(/speakingWorkingLevel: nextWorkingLevel/);
    expect(screenSource).not.toMatch(/getImageStepAfterSelfIntro\(selfBand, selectedLevel/);
  });

  it("keeps weak first-stage evidence on the A2 path", () => {
    expect(getImageStepAfterSelfIntro("weak")).toMatchObject({
      skill: "bildbeschreibung",
      level: "A2",
    });
    expect(workingLevelAfterSelf("weak")).toBe("A2");
  });

  it("routes strong first-stage evidence to B1 bild only (never B2)", () => {
    expect(getImageStepAfterSelfIntro("strong")).toMatchObject({
      skill: "bildbeschreibung",
      level: "B1",
    });
  });

  it("routes B1 working level to B1 listening bridge", () => {
    expect(
      getReadingListeningStep("medium", "medium", { speakingWorkingLevel: "B1" })
    ).toMatchObject({
      skill: "lesenHoeren",
      level: "B1",
      difficulty: "bridge",
    });
  });
});
