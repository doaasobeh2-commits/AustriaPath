/**
 * Placement-only Bildbeschreibung image pools (approved curation).
 * Reads existing a2Images / b1Images catalogs — does not modify Training/Premium.
 */

import { a2Images } from "../a2Images.js";
import { b1Images } from "../b1Images.js";
import { b2Images } from "../b2Images.js";
import { b2Grafiken } from "../b2Grafiken.js";

const b2PlacementCatalog = [
  ...b2Images,
  ...b2Grafiken.map((item) => ({
    ...item,
    placementCatalogId: 100 + Number(item.id),
  })),
];

/** Approved Placement pools: level|difficulty → catalog ids */
export const PLACEMENT_BILD_POOLS = Object.freeze({
  "A2|leicht": Object.freeze([1, 3, 5, 7]),
  "A2|mittel": Object.freeze([2, 6, 8, 9, 10]),
  "B1|leicht": Object.freeze([2, 4, 5, 6, 7, 12, 13, 20]),
  // Existing B2 training: KI scene, sustainability scene, age-use graphic.
  "B2|mittel": Object.freeze([3, 5, 101]),
});

function catalogForLevel(level) {
  if (level === "A2") return a2Images;
  if (level === "B1") return b1Images;
  if (level === "B2") return b2PlacementCatalog;
  return [];
}

function sceneDescriptionFromCatalog(item) {
  const parts = [];
  if (item.shortText) parts.push(String(item.shortText).trim());
  if (Array.isArray(item.description)) {
    parts.push(item.description.map((l) => String(l).trim()).filter(Boolean).join(" "));
  } else if (item.description) {
    parts.push(String(item.description).trim());
  }
  return parts.filter(Boolean).join(" ").slice(0, 800);
}

/**
 * Resolve a pool entry to learner-safe + evaluator-safe image context.
 * Excludes vocab lists, model answers, mistakes, tips.
 */
export function resolvePlacementBildCatalogEntry(level, id) {
  const item = catalogForLevel(level).find(
    (x) => Number(x.placementCatalogId ?? x.id) === Number(id)
  );
  if (!item?.image) return null;

  return {
    catalogLevel: level,
    catalogId: Number(item.placementCatalogId ?? item.id),
    imagePath: String(item.image),
    title: String(item.title || "").slice(0, 120),
    sceneDescription: sceneDescriptionFromCatalog(item),
  };
}

export function listPlacementBildPoolEntries(level, difficulty) {
  const key = `${level}|${difficulty}`;
  const ids = PLACEMENT_BILD_POOLS[key];
  if (!ids?.length) return [];

  return ids
    .map((id) => resolvePlacementBildCatalogEntry(level, id))
    .filter(Boolean);
}

/**
 * Pick one image for a historical Bild routing step.
 * @param {{ level: string, difficulty: string }} step
 * @param {{ random?: () => number, filter?: (entry) => boolean }} [options]
 * @returns {object|null} selected image context or null if pool empty/unavailable
 */
export function selectPlacementBildImage(step, options = {}) {
  const level = step?.level;
  const difficulty = step?.difficulty;
  if (!level || !difficulty) return null;

  // A2 stark intentionally has no pool
  if (level === "A2" && difficulty === "stark") return null;

  let entries = listPlacementBildPoolEntries(level, difficulty);
  if (typeof options.filter === "function") {
    entries = entries.filter(options.filter);
  }
  if (!entries.length) return null;

  const rnd =
    typeof options.random === "function" ? options.random() : Math.random();
  const index = Math.min(
    entries.length - 1,
    Math.max(0, Math.floor(rnd * entries.length))
  );
  return entries[index];
}

/**
 * Browser helper: drop entries whose asset fails to load.
 * @param {object[]} entries
 * @returns {Promise<object[]>}
 */
export async function filterExistingBildAssets(entries = []) {
  const checks = await Promise.all(
    entries.map(
      (entry) =>
        new Promise((resolve) => {
          if (typeof Image === "undefined") {
            resolve(entry);
            return;
          }
          const img = new Image();
          img.onload = () => resolve(entry);
          img.onerror = () => resolve(null);
          img.src = entry.imagePath;
        })
    )
  );
  return checks.filter(Boolean);
}

/**
 * Select with broken-asset fail-closed filtering (browser).
 */
export async function selectPlacementBildImageSafe(step, options = {}) {
  let entries = listPlacementBildPoolEntries(step?.level, step?.difficulty);
  if (!entries.length) return null;

  entries = await filterExistingBildAssets(entries);
  if (!entries.length) return null;

  const rnd =
    typeof options.random === "function" ? options.random() : Math.random();
  const index = Math.min(
    entries.length - 1,
    Math.max(0, Math.floor(rnd * entries.length))
  );
  return entries[index];
}
