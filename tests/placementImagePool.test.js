/**
 * Placement-only Bild image pool selection tests.
 */
import { describe, expect, it } from "vitest";
import {
  PLACEMENT_BILD_POOLS,
  listPlacementBildPoolEntries,
  resolvePlacementBildCatalogEntry,
  selectPlacementBildImage,
} from "../src/data/utils/placementImagePool.js";
import {
  buildExaminerSystemPrompt,
  sanitizeSelectedImageContext,
  buildAllowedFollowUps,
} from "../server/src/services/placementEvaluateService.js";
import { getPlacementModel } from "../src/data/aiPlacementLibrary.js";
import { getImageStepAfterSelfIntro } from "../src/data/placementLogic.js";

describe("placementImagePool — approved pools", () => {
  it("matches curated A2 leicht / A2 mittel / B1 leicht ids exactly", () => {
    expect(PLACEMENT_BILD_POOLS["A2|leicht"]).toEqual([1, 3, 5, 7]);
    expect(PLACEMENT_BILD_POOLS["A2|mittel"]).toEqual([2, 6, 8, 9, 10]);
    expect(PLACEMENT_BILD_POOLS["B1|leicht"]).toEqual([
      2, 4, 5, 6, 7, 12, 13, 20,
    ]);
    expect(PLACEMENT_BILD_POOLS["B2|mittel"]).toEqual([3, 5, 101]);
    expect(PLACEMENT_BILD_POOLS["A2|stark"]).toBeUndefined();
  });

  it("resolves every approved id to a catalog image with safe context only", () => {
    for (const [key, ids] of Object.entries(PLACEMENT_BILD_POOLS)) {
      const [level] = key.split("|");
      for (const id of ids) {
        const entry = resolvePlacementBildCatalogEntry(level, id);
        expect(entry, `${key} id ${id}`).toBeTruthy();
        expect(entry.imagePath).toMatch(/^\/images\//);
        expect(entry.sceneDescription.length).toBeGreaterThan(10);
        expect(entry).not.toHaveProperty("words");
        expect(entry).not.toHaveProperty("sentences");
        expect(entry).not.toHaveProperty("verbs");
        expect(entry).not.toHaveProperty("mistakes");
        expect(entry).not.toHaveProperty("tip");
      }
    }
  });

  it("only returns images from the matching approved pool", () => {
    const mittel = listPlacementBildPoolEntries("A2", "mittel");
    expect(mittel.map((e) => e.catalogId).sort((a, b) => a - b)).toEqual([
      2, 6, 8, 9, 10,
    ]);

    const b1 = listPlacementBildPoolEntries("B1", "leicht");
    expect(b1.every((e) => e.catalogLevel === "B1")).toBe(true);
    expect(b1.some((e) => [1, 3, 8, 9, 10, 11].includes(e.catalogId))).toBe(
      false
    );

    const b2 = listPlacementBildPoolEntries("B2", "mittel");
    expect(b2.map((entry) => entry.imagePath)).toEqual([
      "/images/b2/b2-03.jpeg",
      "/images/b2/b2-05.jpeg",
      "/images/b2/b2-09.jpeg",
    ]);
    expect(b2.map((entry) => entry.title)).toEqual([
      "Künstliche Intelligenz im Alltag",
      "Umweltschutz und Nachhaltigkeit",
      "Internetnutzung nach Alter",
    ]);
  });

  it("returns null for A2 stark (no pool)", () => {
    expect(selectPlacementBildImage({ level: "A2", difficulty: "stark" })).toBe(
      null
    );
    expect(listPlacementBildPoolEntries("A2", "stark")).toEqual([]);
  });
});

describe("placementImagePool — selection stickiness & rotation", () => {
  it("can select different images across attempts from the same pool", () => {
    const step = { level: "A2", difficulty: "mittel" };
    const picks = new Set();
    for (let i = 0; i < 5; i++) {
      const selected = selectPlacementBildImage(step, {
        random: () => i / 5,
      });
      expect(selected).toBeTruthy();
      expect(PLACEMENT_BILD_POOLS["A2|mittel"]).toContain(selected.catalogId);
      picks.add(selected.catalogId);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("keeps the same resolved entry when random is fixed (session sticky)", () => {
    const step = getImageStepAfterSelfIntro("stark");
    expect(step).toMatchObject({
      skill: "bildbeschreibung",
      level: "B1",
      difficulty: "leicht",
    });

    const first = selectPlacementBildImage(step, { random: () => 0.42 });
    const second = selectPlacementBildImage(step, { random: () => 0.42 });
    expect(first).toEqual(second);
    expect(PLACEMENT_BILD_POOLS["B1|leicht"]).toContain(first.catalogId);
  });

  it("maps routing steps to the correct approved pool", () => {
    const weak = getImageStepAfterSelfIntro("weak");
    const medium = getImageStepAfterSelfIntro("medium");
    const strong = getImageStepAfterSelfIntro("strong");

    expect(
      selectPlacementBildImage(weak, { random: () => 0 }).catalogLevel
    ).toBe("A2");
    expect(
      PLACEMENT_BILD_POOLS["A2|mittel"]
    ).toContain(selectPlacementBildImage(weak, { random: () => 0 }).catalogId);

    expect(
      PLACEMENT_BILD_POOLS["A2|mittel"]
    ).toContain(
      selectPlacementBildImage(medium, { random: () => 0.9 }).catalogId
    );

    expect(
      PLACEMENT_BILD_POOLS["B1|leicht"]
    ).toContain(
      selectPlacementBildImage(strong, { random: () => 0.1 }).catalogId
    );
  });

  it("selects B2 training assets for the normal B2 image route", () => {
    const step = getImageStepAfterSelfIntro("medium", "B2");
    const selected = selectPlacementBildImage(step, { random: () => 0.99 });
    expect(step).toMatchObject({ level: "B2", difficulty: "mittel" });
    expect(selected).toMatchObject({
      catalogLevel: "B2",
      catalogId: 101,
      imagePath: "/images/b2/b2-09.jpeg",
    });
  });
});

describe("placementEvaluate — selected image context", () => {
  const bildModel = getPlacementModel("a2_bild_mittel");

  it("sanitizes learner-safe image context and drops helper junk", () => {
    const clean = sanitizeSelectedImageContext({
      catalogLevel: "A2",
      catalogId: 10,
      imagePath: "/images/a2/kueche-salat.jpeg",
      title: "Küche",
      sceneDescription: "Zwei Personen kochen.",
      words: ["should-not-pass"],
      sentences: ["model answer"],
    });
    expect(clean).toEqual({
      catalogLevel: "A2",
      catalogId: 10,
      imagePath: "/images/a2/kueche-salat.jpeg",
      title: "Küche",
      sceneDescription: "Zwei Personen kochen.",
    });
    expect(clean).not.toHaveProperty("words");
  });

  it("rejects incomplete image context", () => {
    expect(sanitizeSelectedImageContext(null)).toBeNull();
    expect(
      sanitizeSelectedImageContext({
        catalogLevel: "A2",
        catalogId: 1,
        imagePath: "/x",
        title: "t",
      })
    ).toBeNull();
  });

  it("puts selected image into examiner prompt and omits stale imagePrompt", () => {
    const selected = resolvePlacementBildCatalogEntry("A2", 2);
    const allowed = buildAllowedFollowUps(bildModel);
    const system = buildExaminerSystemPrompt(bildModel, allowed, selected);

    expect(system).toContain(selected.sceneDescription);
    expect(system).toContain(`"catalogId":${selected.catalogId}`);
    expect(system).not.toContain(bildModel.imagePrompt);
    expect(system).toMatch(/Ignoriere jedes model\.imagePrompt/i);
    expect(system).not.toMatch(/words|Modellantworten sind Pflicht/i);
  });

  it("does not embed a different scene imagePrompt when evaluating park vs cooking model", () => {
    const parkish = resolvePlacementBildCatalogEntry("A2", 3);
    const allowed = buildAllowedFollowUps(bildModel);
    const system = buildExaminerSystemPrompt(bildModel, allowed, parkish);

    expect(system).toContain(parkish.sceneDescription);
    expect(system).not.toContain("kochen zusammen in einer hellen Küche");
  });
});
