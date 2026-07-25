/** Placement-only listening pool selection tests. */
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getPlacementModel,
  stagedPlacementListeningB1Plus,
} from "../src/data/aiPlacementLibrary.js";
import {
  PLACEMENT_LISTENING_POOLS,
  listPlacementListeningModels,
  selectPlacementListeningModel,
} from "../src/data/utils/placementListeningPool.js";

const APPROVED = Object.freeze({
  A2: [
    "placement_listening_02",
    "placement_listening_04",
    "placement_listening_10",
    "placement_listening_a2_support",
  ],
  B1: [
    "placement_listening_b1_bridge",
    "placement_listening_06",
    "placement_listening_11",
    "placement_listening_12",
    "placement_listening_14",
  ],
  B2: [
    "b2_hoeren_buerotermin",
    "b2_hoeren_bewerbung",
    "b2_hoeren_digitalisierung",
  ],
});

const LIVE_A2 = ["placement_listening_04", "placement_listening_10", "placement_listening_a2_support"];
const LIVE_B1 = [
  "placement_listening_b1_bridge",
  "placement_listening_06",
  "placement_listening_11",
  "placement_listening_12",
  "placement_listening_14",
];

const ANSWER_INDEXES = Object.freeze({
  placement_listening_02: [1, 2, 0],
  placement_listening_04: [2, 0, 1],
  placement_listening_10: [1, 2, 0],
  placement_listening_06: [2, 0, 1, 2],
  placement_listening_11: [1, 2, 0, 1],
  placement_listening_12: [2, 1, 0, 2],
  placement_listening_14: [0, 2, 1, 0],
});

describe("Placement listening pools", () => {
  it("contains exactly the approved active IDs for A2 and B1", () => {
    expect(PLACEMENT_LISTENING_POOLS.A2).toEqual(APPROVED.A2);
    expect(PLACEMENT_LISTENING_POOLS.B1).toEqual(APPROVED.B1);
    expect(PLACEMENT_LISTENING_POOLS.B2).toEqual(APPROVED.B2);
  });

  it.each(["A2", "B1"])(
    "%s live models remain strictly isolated and contain 2-4 objective questions",
    (level) => {
      const models = listPlacementListeningModels(level);
      const liveIds = level === "A2" ? LIVE_A2 : LIVE_B1;
      expect(models.map((model) => model.id)).toEqual(liveIds);
      for (const model of models) {
        expect(model.level).toBe(level);
        expect(model.skill).toBe("hoeren");
        expect(model.audioText.length).toBeGreaterThan(30);
        expect(model.listeningQuestions.length).toBeGreaterThanOrEqual(2);
        expect(model.listeningQuestions.length).toBeLessThanOrEqual(4);
        if (model.id !== "placement_listening_b1_bridge" && model.placementTier !== "support") {
          expect(model.audioUrl).toBeTruthy();
        }
        for (const question of model.listeningQuestions) {
          expect(question.options).toHaveLength(3);
          expect(question.options).toContain(question.correctOption);
        }
      }
    }
  );

  it("keeps B2 models in the library but excludes them from live runtime selection", () => {
    expect(listPlacementListeningModels("B2")).toEqual([]);
    expect(selectPlacementListeningModel({ level: "B2", difficulty: "mittel" })).toBeNull();
    for (const id of APPROVED.B2) {
      expect(getPlacementModel(id)).toBeTruthy();
    }
  });

  it("never exposes an A2 model through B1 or B2 selection", () => {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const b1Selected = selectPlacementListeningModel(
        { level: "B1", difficulty: "mittel" },
        { random: () => random }
      );
      expect(b1Selected).toBeTruthy();
      expect(APPROVED.A2).not.toContain(b1Selected.id);
    }
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(
        selectPlacementListeningModel({ level: "B2", difficulty: "mittel" }, { random: () => random })
      ).toBeNull();
    }
  });

  it("never exposes a B1 model through A2 live selection", () => {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(LIVE_B1).not.toContain(
        selectPlacementListeningModel({ level: "A2", difficulty: "mittel" }, { random: () => random }).id
      );
    }
  });

  it("keeps Listening_19 and Listening_20 staged, inactive, and outside every runtime pool", () => {
    expect(stagedPlacementListeningB1Plus.map((model) => model.id)).toEqual([
      "placement_listening_19",
      "placement_listening_20",
    ]);
    for (const model of stagedPlacementListeningB1Plus) {
      expect(model.active).toBe(false);
      expect(model.classification).toBe("B1+");
      expect(getPlacementModel(model.id)).toBeUndefined();
      expect(Object.values(PLACEMENT_LISTENING_POOLS).flat()).not.toContain(model.id);
    }
    expect(listPlacementListeningModels("B2").map((model) => model.id))
      .not.toEqual(expect.arrayContaining(["placement_listening_19", "placement_listening_20"]));
  });

  it("preserves the approved answer keys and question-type metadata", () => {
    for (const [id, expectedIndexes] of Object.entries(ANSWER_INDEXES)) {
      const model = getPlacementModel(id);
      expect(model.listeningQuestions.map((question) => question.options.indexOf(question.correctOption)))
        .toEqual(expectedIndexes);
      expect(model.listeningQuestions.every((question) => Boolean(question.questionType))).toBe(true);
    }
  });

  it("uses the real approved static audio assets", () => {
    for (const id of [...APPROVED.A2, ...APPROVED.B1]) {
      const model = getPlacementModel(id);
      if (!model.audioUrl) continue;
      const asset = fileURLToPath(new URL(`../public${model.audioUrl}`, import.meta.url));
      expect(existsSync(asset)).toBe(true);
      expect(statSync(asset).size).toBeGreaterThan(0);
    }
  });

  it.each(["A2", "B1"])("avoids duplicate %s clips until its difficulty slice is exhausted", (level) => {
    const recentIds = [];
    const mittelPool = listPlacementListeningModels(level).filter(
      (model) => model.difficulty === "mittel"
    );
    const iterations = Math.max(1, mittelPool.length);
    for (let index = 0; index < iterations; index += 1) {
      const selected = selectPlacementListeningModel(
        { level, difficulty: "mittel" },
        { recentIds, random: () => 0 }
      );
      expect(recentIds).not.toContain(selected.id);
      expect(selected.difficulty).toBe("mittel");
      recentIds.unshift(selected.id);
    }
    expect(new Set(recentIds)).toEqual(new Set(mittelPool.map((model) => model.id)));
  });

  it("does not serve hard-A2 Befund on default A2-mittel selection", () => {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const selected = selectPlacementListeningModel(
        { level: "A2", difficulty: "mittel" },
        { random: () => random }
      );
      expect(selected.id).not.toBe("placement_listening_02");
      expect(selected.difficulty).toBe("mittel");
    }
    expect(getPlacementModel("placement_listening_02").difficulty).toBe("stark");
    expect(
      selectPlacementListeningModel(
        { level: "A2", difficulty: "stark" },
        { random: () => 0 }
      ).id
    ).toBe("placement_listening_02");
  });

  it("selects the B1 bridge clip for B1 bridge routing", () => {
    const selected = selectPlacementListeningModel(
      { level: "B1", difficulty: "bridge", b1Entry: true },
      { random: () => 0 }
    );
    expect(selected.id).toBe("placement_listening_b1_bridge");
    expect(selected.listeningQuestions).toHaveLength(3);
  });

  it("rotates weak A2 leicht listening clips across recent history", () => {
    const step = { level: "A2", difficulty: "leicht" };
    const first = selectPlacementListeningModel(step, { random: () => 0.1 });
    const second = selectPlacementListeningModel(step, {
      recentIds: [first.id],
      random: () => 0.1,
    });
    expect(first.id).not.toBe(second.id);
    expect(["placement_listening_10", "placement_listening_a2_support"]).toContain(first.id);
    expect(["placement_listening_10", "placement_listening_a2_support"]).toContain(second.id);
  });

  it("returns null instead of crossing levels for an unavailable pool", () => {
    expect(selectPlacementListeningModel({ level: "B1+" })).toBeNull();
    expect(selectPlacementListeningModel({ level: "C1" })).toBeNull();
  });
});
