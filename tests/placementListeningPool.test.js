/** Placement-only listening pool selection tests. */
import { describe, expect, it } from "vitest";
import {
  PLACEMENT_LISTENING_POOLS,
  listPlacementListeningModels,
  selectPlacementListeningModel,
} from "../src/data/utils/placementListeningPool.js";

describe("Placement listening pools", () => {
  it("contains the approved number of variants per CEFR level", () => {
    expect(PLACEMENT_LISTENING_POOLS.A2).toHaveLength(2);
    expect(PLACEMENT_LISTENING_POOLS.B1).toHaveLength(3);
    expect(PLACEMENT_LISTENING_POOLS.B2).toHaveLength(3);
  });

  it.each(["A2", "B1", "B2"])(
    "%s models contain one short clip and 2-3 objective questions",
    (level) => {
      const models = listPlacementListeningModels(level);
      expect(models).toHaveLength(PLACEMENT_LISTENING_POOLS[level].length);
      for (const model of models) {
        expect(model.level).toBe(level);
        expect(model.skill).toBe("hoeren");
        expect(model.audioText.length).toBeGreaterThan(30);
        expect(model.listeningQuestions.length).toBeGreaterThanOrEqual(2);
        expect(model.listeningQuestions.length).toBeLessThanOrEqual(3);
        for (const question of model.listeningQuestions) {
          expect(question.options).toContain(question.correctOption);
        }
      }
    }
  );

  it("reuses the selected B1 training tasks", () => {
    expect(listPlacementListeningModels("B1").map((model) => model.title)).toEqual([
      "B1 Hören – Supermarkt-Durchsage",
      "B1 Hören – Bahnhofsdurchsage",
      "B1 Hören – Arzttermin verschieben",
    ]);
  });

  it("reuses the selected B2 training excerpts", () => {
    expect(listPlacementListeningModels("B2").map((model) => model.title)).toEqual([
      "B2 Hören – Büro und Terminplanung",
      "B2 Hören – Bewerbung und Arbeitswelt",
      "B2 Hören – Digitalisierung und Online-Meeting",
    ]);
  });

  it("rotates by random position and is stable for a fixed session choice", () => {
    const step = { skill: "lesenHoeren", level: "B1", difficulty: "mittel" };
    const first = selectPlacementListeningModel(step, { random: () => 0 });
    const middle = selectPlacementListeningModel(step, { random: () => 0.5 });
    const last = selectPlacementListeningModel(step, { random: () => 0.999 });
    expect(new Set([first.id, middle.id, last.id]).size).toBe(3);
    expect(selectPlacementListeningModel(step, { random: () => 0.5 })).toBe(
      middle
    );
  });

  it("returns null instead of crossing levels for an unavailable pool", () => {
    expect(selectPlacementListeningModel({ level: "C1" })).toBeNull();
  });
});
