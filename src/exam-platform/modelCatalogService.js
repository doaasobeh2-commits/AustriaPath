/**
 * Model catalog helpers — resolve section content from catalog entries.
 *
 * @module exam-platform/modelCatalogService
 */

/**
 * @param {import('./contracts.js').ModelCatalogEntry[]} catalog
 * @param {string} modelId
 * @returns {import('./contracts.js').ModelCatalogEntry|undefined}
 */
export function findCatalogEntry(catalog, modelId) {
  return catalog.find((entry) => entry.id === modelId);
}

/**
 * @param {import('./contracts.js').ModelCatalogEntry} entry
 * @returns {Record<string, unknown>}
 */
export function resolveSectionContent(entry) {
  if (!entry) return {};
  const ref = entry.contentRef || {};
  if (ref.content && typeof ref.content === "object") {
    return /** @type {Record<string, unknown>} */ (ref.content);
  }
  if (ref.payload && typeof ref.payload === "object") {
    return /** @type {Record<string, unknown>} */ (ref.payload);
  }
  return { ...ref };
}

/**
 * @param {import('./contracts.js').ModelCatalogEntry[]} catalog
 * @param {import('./contracts.js').BlueprintSection} section
 * @returns {Record<string, unknown>}
 */
export function resolveSectionContentForBlueprint(catalog, section) {
  const entry = findCatalogEntry(catalog, section.modelId);
  const base = resolveSectionContent(entry);
  return {
    ...base,
    ...(section.sectionConfig || {}),
    _modelId: section.modelId,
    _skill: section.skill,
  };
}

export const modelCatalogService = {
  findCatalogEntry,
  resolveSectionContent,
  resolveSectionContentForBlueprint,
};
