/**
 * A2 Bildbeschreibung library alignment — canonical IDs, asset status, navigation.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { a2Images } from '../src/data/a2Images.js';
import {
  A2_CANONICAL_IMAGE_TASK_MAP,
  getAvailableA2Images,
  getExcludedA2ImageTopics,
  getWeeklyPlanA2ImageTaskByLabel,
  resolveA2ImageNavigationTarget,
  weeklyPlanA2ImageTasks,
} from '../src/data/a2ImageTaskCatalog.js';
import { aiPremiumLibrary } from '../src/data/aiPremiumLibrary.js';
import { imageTasks } from '../src/data/weeklyPlanLibrary.js';
import { weeklyPlanTaskNavigation } from '../src/data/weeklyPlanTaskNavigation.js';
import { listPlacementBildPoolEntries } from '../src/data/utils/placementImagePool.js';
import { buildModelCatalog } from '../src/exam-platform/adapters/modelCatalogBuilder.js';

const PUBLIC_ROOT = resolve(process.cwd(), 'public');

const NEW_ASSET_BINDINGS = [
  {
    canonicalId: 'A2-IMG-11',
    title: 'Wartezimmer beim Arzt',
    image: '/images/a2/wartezimmer-arzt.jpeg',
    catalogImageId: 11,
  },
  {
    canonicalId: 'A2-IMG-12',
    title: 'Bäckerei',
    image: '/images/a2/baeckerei.jpeg',
    catalogImageId: 12,
  },
  {
    canonicalId: 'A2-IMG-13',
    title: 'Familienausflug',
    image: '/images/a2/familienausflug.jpeg',
    catalogImageId: 13,
  },
];

describe('A2 canonical image catalog', () => {
  it('assigns unique canonical IDs to all 13 catalog entries', () => {
    const ids = a2Images.map((img) => img.canonicalId);
    expect(ids).toHaveLength(13);
    expect(new Set(ids).size).toBe(13);
    expect(ids).toEqual([
      'A2-IMG-01',
      'A2-IMG-02',
      'A2-IMG-03',
      'A2-IMG-04',
      'A2-IMG-05',
      'A2-IMG-06',
      'A2-IMG-07',
      'A2-IMG-08',
      'A2-IMG-09',
      'A2-IMG-10',
      'A2-IMG-11',
      'A2-IMG-12',
      'A2-IMG-13',
    ]);
  });

  it('keeps all 13 A2 image files loadable on disk', () => {
    const available = a2Images.filter((img) => img.assetStatus === 'available');
    expect(available).toHaveLength(13);
    available.forEach((img) => {
      const filePath = resolve(PUBLIC_ROOT, img.image.replace(/^\//, ''));
      expect(existsSync(filePath), img.image).toBe(true);
    });
  });

  it('binds the three newly integrated assets', () => {
    NEW_ASSET_BINDINGS.forEach((binding) => {
      const entry = a2Images.find((img) => img.canonicalId === binding.canonicalId);
      expect(entry, binding.canonicalId).toMatchObject({
        id: binding.catalogImageId,
        title: binding.title,
        image: binding.image,
        assetStatus: 'available',
      });
      expect(
        existsSync(resolve(PUBLIC_ROOT, binding.image.replace(/^\//, ''))),
        binding.image
      ).toBe(true);
    });
  });

  it('exposes canonical map entries for every image task id', () => {
    expect(Object.keys(A2_CANONICAL_IMAGE_TASK_MAP)).toHaveLength(13);
    NEW_ASSET_BINDINGS.forEach((binding) => {
      expect(A2_CANONICAL_IMAGE_TASK_MAP[binding.canonicalId]).toMatchObject({
        catalogImageId: binding.catalogImageId,
        image: binding.image,
        assetStatus: 'available',
      });
    });
  });
});

describe('weekly plan A2 image topic tasks', () => {
  it('replaces legacy string topics with explicit catalog entries', () => {
    expect(imageTasks.A2).toBe(weeklyPlanA2ImageTasks);
    expect(imageTasks.A2.map((task) => task.label)).toEqual([
      'Bäckerei',
      'Kochen zu Hause',
      'Familienausflug',
    ]);
  });

  it('binds topic tasks to canonical image assets', () => {
    expect(getWeeklyPlanA2ImageTaskByLabel('Bäckerei')).toMatchObject({
      canonicalImageId: 'A2-IMG-12',
      catalogImageId: 12,
      image: '/images/a2/baeckerei.jpeg',
      assetStatus: 'available',
    });
    expect(getWeeklyPlanA2ImageTaskByLabel('Kochen zu Hause')).toMatchObject({
      canonicalImageId: 'A2-IMG-10',
      catalogImageId: 10,
      image: '/images/a2/kueche-salat.jpeg',
      assetStatus: 'available',
    });
    expect(getWeeklyPlanA2ImageTaskByLabel('Familienausflug')).toMatchObject({
      canonicalImageId: 'A2-IMG-13',
      catalogImageId: 13,
      image: '/images/a2/familienausflug.jpeg',
      assetStatus: 'available',
    });
  });

  it('has no excluded A2 image topics after asset integration', () => {
    expect(getExcludedA2ImageTopics()).toEqual([]);
    expect(getAvailableA2Images()).toHaveLength(13);
    weeklyPlanA2ImageTasks.forEach((task) => {
      expect(task.assetStatus).toBe('available');
    });
  });

  it('navigates a2-bild-001 to the cooking image', () => {
    const nav = weeklyPlanTaskNavigation['a2-bild-001'];
    expect(nav).toMatchObject({
      canonicalImageId: 'A2-IMG-10',
      imageId: 10,
    });

    const resolved = resolveA2ImageNavigationTarget(nav);
    expect(resolved).toMatchObject({
      id: 10,
      canonicalId: 'A2-IMG-10',
      title: 'Küche und Salat',
      image: '/images/a2/kueche-salat.jpeg',
    });
  });

  it('resolves newly available catalog images for navigation', () => {
    expect(
      resolveA2ImageNavigationTarget({ level: 'A2', imageId: 11 })
    ).toMatchObject({
      canonicalId: 'A2-IMG-11',
      image: '/images/a2/wartezimmer-arzt.jpeg',
    });
    expect(
      resolveA2ImageNavigationTarget({ level: 'A2', canonicalImageId: 'A2-IMG-12' })
    ).toMatchObject({
      id: 12,
      image: '/images/a2/baeckerei.jpeg',
    });
  });
});

describe('premium A2 bild task IDs', () => {
  it('removes ambiguous a2-bild-00x collision with weekly plan task id', () => {
    const legacyIds = aiPremiumLibrary
      .filter((item) => item.skill === 'bildbeschreibung' && item.level === 'A2')
      .map((item) => item.id);
    expect(legacyIds).not.toContain('a2-bild-001');
    expect(legacyIds).toEqual([
      'a2-premium-bild-baeckerei',
      'a2-premium-bild-kochen',
      'a2-premium-bild-familienausflug',
    ]);
  });

  it('binds all premium A2 bild tasks to available image metadata', () => {
    expect(aiPremiumLibrary.find((item) => item.id === 'a2-premium-bild-baeckerei')).toMatchObject({
      canonicalImageId: 'A2-IMG-12',
      catalogImageId: 12,
      image: '/images/a2/baeckerei.jpeg',
      assetStatus: 'available',
    });
    expect(aiPremiumLibrary.find((item) => item.id === 'a2-premium-bild-kochen')).toMatchObject({
      canonicalImageId: 'A2-IMG-10',
      catalogImageId: 10,
      image: '/images/a2/kueche-salat.jpeg',
      assetStatus: 'available',
    });
    expect(
      aiPremiumLibrary.find((item) => item.id === 'a2-premium-bild-familienausflug')
    ).toMatchObject({
      canonicalImageId: 'A2-IMG-13',
      catalogImageId: 13,
      image: '/images/a2/familienausflug.jpeg',
      assetStatus: 'available',
    });
  });
});

describe('runtime surfaces include integrated assets', () => {
  it('lists all 13 A2 images in the model catalog', () => {
    const a2CatalogImages = buildModelCatalog().filter(
      (entry) =>
        entry.level === 'A2' &&
        entry.skill === 'picture_description' &&
        entry.contentRef?.content?.kind === 'picture'
    );
    expect(a2CatalogImages).toHaveLength(13);
    NEW_ASSET_BINDINGS.forEach((binding) => {
      expect(
        a2CatalogImages.some((entry) => entry.contentRef?.content?.image === binding.image)
      ).toBe(true);
    });
  });
});

describe('placement pools remain unchanged', () => {
  it('still serves numeric A2 placement image pools', () => {
    const leicht = listPlacementBildPoolEntries('A2', 'leicht');
    const mittel = listPlacementBildPoolEntries('A2', 'mittel');
    expect(leicht.map((img) => img.catalogId)).toEqual([1, 3, 5, 7]);
    expect(mittel.map((img) => img.catalogId)).toEqual([2, 6, 8, 9, 10]);
  });
});
