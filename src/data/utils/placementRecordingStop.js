/**
 * Exactly-once voice transcript submission after the learner stops recording.
 * Guards against browsers where SpeechRecognition.onend never fires.
 */

/** Safe interval before forcing submit when onend is missing (ms). */
export const PLACEMENT_STT_STOP_FALLBACK_MS = 1500;

/**
 * @returns {{
 *   reset: () => void;
 *   clearFallbackTimer: () => void;
 *   armStopFallback: (opts: {
 *     scheduleTimeout: (ms: number, fn: () => void) => number;
 *     onFallback: () => void;
 *   }) => void;
 *   submitOnce: (onSubmit: () => void) => boolean;
 *   hasCommitted: () => boolean;
 * }}
 */
export function createPlacementStopSubmitCoordinator() {
  let committed = false;
  /** @type {number | null} */
  let fallbackTimerId = null;

  const clearFallbackTimer = () => {
    if (fallbackTimerId != null) {
      clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
  };

  return {
    reset() {
      committed = false;
      clearFallbackTimer();
    },
    clearFallbackTimer,
    armStopFallback({ scheduleTimeout, onFallback }) {
      clearFallbackTimer();
      fallbackTimerId = scheduleTimeout(PLACEMENT_STT_STOP_FALLBACK_MS, () => {
        fallbackTimerId = null;
        onFallback();
      });
    },
    submitOnce(onSubmit) {
      if (committed) return false;
      committed = true;
      clearFallbackTimer();
      onSubmit();
      return true;
    },
    hasCommitted() {
      return committed;
    },
  };
}
