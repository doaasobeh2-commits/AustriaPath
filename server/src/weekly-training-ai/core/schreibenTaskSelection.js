/**
 * Schreiben email task selection contract for Phase 2+.
 *
 * Problem: each `b1wp-schreiben-*` catalog model may contain multiple `emails[]`
 * entries (`emailIndex` 1..n). Session AI must grade exactly one selected email.
 *
 * Required deterministic identity at session start:
 * - `modelId` — catalog model id (e.g. `b1wp-schreiben-001`)
 * - `selectedEmailIndex` — 1-based index matching `emails[].emailIndex`
 *
 * Required frozen `model_snapshot` shape (no live `emailIndex` lookup after start):
 * ```json
 * {
 *   "id": "b1wp-schreiben-001",
 *   "modelVersion": 1,
 *   "category": "schreiben",
 *   "title": "...",
 *   "selectedEmailIndex": 2,
 *   "selectedEmail": {
 *     "emailIndex": 2,
 *     "title": "...",
 *     "task": ["..."],
 *     "solution": "...",
 *     "akademie": { }
 *   }
 * }
 * ```
 *
 * Rules:
 * 1. `selectedEmail` must be a deep-cloned copy of the chosen catalog email object.
 * 2. Do not keep the full mutable `emails[]` array in the snapshot unless every
 *    entry is frozen and `selectedEmailIndex` is persisted separately.
 * 3. Extend `idempotency_scope` with `selectedEmailIndex` so two emails from the
 *    same model on the same plan slot produce distinct sessions.
 * 4. Turn/complete handlers read only `model_snapshot.selectedEmail` — never
 *    `resolveB1WeeklyPlanModel('schreiben', modelId).emails[emailIndex]`.
 *
 * Phase 2 enables `schreiben` in categoryCapabilities only after this freeze path
 * is implemented and tested.
 *
 * @module weekly-training-ai/core/schreibenTaskSelection
 */

export const SCHREIBEN_SNAPSHOT_FIELDS = Object.freeze([
  "id",
  "modelVersion",
  "category",
  "title",
  "selectedEmailIndex",
  "selectedEmail",
]);

/**
 * @param {number} selectedEmailIndex
 */
export function buildSchreibenIdempotencyEmailSuffix(selectedEmailIndex) {
  return `email:${Number(selectedEmailIndex)}`;
}
