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

  it.each([
    ["leicht", "b1_hoeren_supermarkt"],
    ["mittel", "b1_hoeren_bahnhof"],
    ["stark", "b1_hoeren_arzttermin"],
  ])("B1 %s selects the exact requested difficulty", (difficulty, id) => {
    expect(selectPlacementListeningModel(
      { level: "B1", difficulty }, { random: () => 0.999 }
    ).id).toBe(id);
  });

  it("uses deterministic nearest same-level difficulty when exact is absent", () => {
    const selected = selectPlacementListeningModel(
      { level: "A2", difficulty: "stark" }, { random: () => 0 }
    );
    expect(selected.level).toBe("A2");
    expect(selected.difficulty).toBe("mittel");
  });

  it("random choice among eligible models never crosses the requested level", () => {
    for (const random of [0, 0.5, 0.999]) {
      expect(selectPlacementListeningModel(
        { level: "B2", difficulty: "mittel" }, { random: () => random }
      ).level).toBe("B2");
    }
  });

  it("prefers unseen eligible content and falls back when every option is recent", () => {
    const step = { level: "B2", difficulty: "mittel" };
    const ids = listPlacementListeningModels("B2")
      .filter((model) => model.difficulty === "mittel").map((model) => model.id);
    expect(selectPlacementListeningModel(step, {
      recentIds: ids.slice(0, -1), random: () => 0,
    }).id).toBe(ids.at(-1));
    expect(selectPlacementListeningModel(step, {
      recentIds: ids, random: () => 0,
    })).toBeTruthy();
  });

  it("uses each model's most recent occurrence for true LRU with duplicates", () => {
    const step = { level: "A2", difficulty: "mittel" };
    const selected = selectPlacementListeningModel(step, {
      // Newest first: mittel was just used; Arzt was used less recently.
      recentIds: [
        "a2_hoeren_mittel",
        "a2_hoeren_arzt_apotheke",
        "a2_hoeren_mittel",
      ],
      random: () => 0,
    });
    expect(selected.id).toBe("a2_hoeren_arzt_apotheke");
  });

  it("returns null instead of crossing levels for an unavailable pool", () => {
    expect(selectPlacementListeningModel({ level: "C1" })).toBeNull();
  });
});
