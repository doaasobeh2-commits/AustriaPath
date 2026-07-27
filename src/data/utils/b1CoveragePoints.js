/**
 * Stable coverage point IDs for B1 interactive coach exercises.
 * @module data/utils/b1CoveragePoints
 */

/**
 * @param {string[]} points
 */
export function buildCoveragePoints(points = []) {
  return points
    .map((text, index) => ({
      id: `point-${index + 1}`,
      text: String(text || '').trim(),
    }))
    .filter((point) => point.text);
}
