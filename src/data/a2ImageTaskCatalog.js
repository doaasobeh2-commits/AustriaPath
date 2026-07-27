/**
 * Canonical A2 Bildbeschreibung task mapping for Weekly AI Coach / Premium.
 * Placement pools continue to use numeric a2Images ids via placementImagePool.js.
 */

import { a2Images } from './a2Images.js';

/** @typedef {'available' | 'missing'} A2ImageAssetStatus */

/**
 * Weekly-plan topic tasks (legacy labels) with explicit catalog binding.
 * Missing topics stay excluded from runtime image selection.
 */
export const weeklyPlanA2ImageTasks = [
  {
    topicId: 'A2-IMG-TOPIC-BAECKEREI',
    label: 'Bäckerei',
    canonicalImageId: 'A2-IMG-12',
    catalogImageId: 12,
    image: '/images/a2/baeckerei.jpeg',
    assetStatus: 'available',
    premiumModelId: 'a2-premium-bild-baeckerei',
  },
  {
    topicId: 'A2-IMG-TOPIC-KOCHEN',
    label: 'Kochen zu Hause',
    canonicalImageId: 'A2-IMG-10',
    catalogImageId: 10,
    image: '/images/a2/kueche-salat.jpeg',
    assetStatus: 'available',
    premiumModelId: 'a2-premium-bild-kochen',
  },
  {
    topicId: 'A2-IMG-TOPIC-FAMILIENAUSFLUG',
    label: 'Familienausflug',
    canonicalImageId: 'A2-IMG-13',
    catalogImageId: 13,
    image: '/images/a2/familienausflug.jpeg',
    assetStatus: 'available',
    premiumModelId: 'a2-premium-bild-familienausflug',
  },
];

/** @type {Record<string, { canonicalId: string, catalogImageId: number, title: string, image: string, assetStatus: A2ImageAssetStatus }>} */
export const A2_CANONICAL_IMAGE_TASK_MAP = Object.fromEntries(
  a2Images.map((img) => [
    img.canonicalId,
    {
      canonicalId: img.canonicalId,
      catalogImageId: img.id,
      title: img.title,
      image: img.image,
      assetStatus: img.assetStatus,
    },
  ])
);

const MISSING_TOPIC_LABELS = new Set(
  weeklyPlanA2ImageTasks.filter((task) => task.assetStatus === 'missing').map((task) => task.label)
);

const MISSING_CATALOG_TITLES = new Set(
  a2Images.filter((img) => img.assetStatus === 'missing').map((img) => img.title)
);

/**
 * @param {{ assetStatus?: A2ImageAssetStatus } | null | undefined} entry
 */
export function isA2ImageAssetAvailable(entry) {
  return entry?.assetStatus !== 'missing';
}

export function getAvailableA2Images() {
  return a2Images.filter(isA2ImageAssetAvailable);
}

/**
 * @param {string} canonicalId
 */
export function getA2ImageByCanonicalId(canonicalId) {
  return a2Images.find((img) => img.canonicalId === canonicalId) || null;
}

/**
 * @param {{ canonicalImageId?: string, imageId?: number, level?: string }} target
 */
export function resolveA2ImageNavigationTarget(target) {
  if (!target || target.level !== 'A2') return null;

  if (target.canonicalImageId) {
    const image = getA2ImageByCanonicalId(target.canonicalImageId);
    return isA2ImageAssetAvailable(image) ? image : null;
  }

  if (target.imageId != null) {
    const image = a2Images.find((img) => img.id === target.imageId);
    return isA2ImageAssetAvailable(image) ? image : null;
  }

  return null;
}

export function getExcludedA2ImageTopics() {
  return [...MISSING_TOPIC_LABELS, ...MISSING_CATALOG_TITLES];
}

export function getWeeklyPlanA2ImageTaskByLabel(label) {
  return weeklyPlanA2ImageTasks.find((task) => task.label === label) || null;
}
