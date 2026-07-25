/**
 * Phase 1 — Part B: every new Placement attempt must start from the
 * weak/A2 path. The learner-facing "Startniveau" picker is context only
 * (see its own UI copy: "nur Kontext — die Bewertung folgt Ihrer Leistung")
 * and must never bias the starting model or the pre-evidence routing calls.
 *
 * There is no component-render test harness in this project (no jsdom /
 * React Testing Library dependency), so the screen-level wiring is verified
 * at the source level: the routing call sites must use the fixed
 * conservative constant, never the learner-selected level, before any real
 * evidence exists. The underlying adaptive routing functions themselves are
 * pure and already covered by tests/placementHistoricalScoring.test.js and
 * tests/placementImagePool.test.js, which continue to pass unchanged since
 * this fix does not modify src/data/placementLogic.js at all.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getImageStepAfterSelfIntro,
  getPlacementStartModel,
  getReadingListeningStep,
} from "../src/data/placementLogic.js";

const screenSource = fs.readFileSync(
  path.resolve("src/app/screens/PlacementTestScreen.jsx"),
  "utf8"
);

describe("Phase 1: conservative Placement start (weak/A2 by default)", () => {
  it("defines a fixed A2 starting-level constant, independent of the learner-selected context level", () => {
    expect(screenSource).toMatch(/CONSERVATIVE_START_LEVEL\s*=\s*'A2'/);
  });

  it("starts every new attempt's Selbstvorstellung model from the fixed A2 constant, not the learner-selected level", () => {
    expect(screenSource).toMatch(/getPlacementStartModel\(CONSERVATIVE_START_LEVEL\)/);
    expect(screenSource).not.toMatch(/getPlacementStartModel\(selectedLevel\)/);
  });

  it("routes the pre-evidence Bild/Listening steps from the fixed A2 constant, not the learner-selected level", () => {
    expect(screenSource).toMatch(/getImageStepAfterSelfIntro\(selfBand, CONSERVATIVE_START_LEVEL, routingContext\)/);
    expect(screenSource).toMatch(/getReadingListeningStep\(selfBand, imageBand, CONSERVATIVE_START_LEVEL, routingContext\)/);
    expect(screenSource).not.toMatch(/getImageStepAfterSelfIntro\(selfBand, selectedLevel\)/);
    expect(screenSource).not.toMatch(/getReadingListeningStep\(selfBand, imageBand, selectedLevel\)/);
  });

  it("resolves the conservative constant to the real A2 Selbstvorstellung model", () => {
    expect(getPlacementStartModel("A2")?.id).toBe("a2_self_mittel");
  });

  it("keeps weak first-stage evidence on the A2 path (no optimistic default penalty)", () => {
    expect(getImageStepAfterSelfIntro("weak", "A2")).toMatchObject({
      skill: "bildbeschreibung",
      level: "A2",
    });
  });

  it("still allows strong first-stage evidence to route upward only after bridge confirmation", () => {
    expect(getImageStepAfterSelfIntro("strong", "A2")).toMatchObject({
      skill: "bildbeschreibung",
      level: "A2",
    });
    expect(
      getImageStepAfterSelfIntro("strong", "A2", { bridgeProbeStatus: "confirmed" })
    ).toMatchObject({
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "leicht",
    });
  });

  it("still lets confirmed strong evidence route to B1 listening bridge from an A2 start", () => {
    expect(
      getReadingListeningStep("strong", "strong", "A2", { bridgeProbeStatus: "confirmed" })
    ).toMatchObject({
      skill: "lesenHoeren",
      level: "B1",
      difficulty: "bridge",
    });
  });
});
