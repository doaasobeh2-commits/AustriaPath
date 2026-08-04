/**
 * Fire-and-forget client activity tracking for authenticated backend users.
 */
import { apiFetch } from "./httpClient.js";
import { useBackend } from "./useBackend.js";

/**
 * @param {"open_placement"|"open_weekly_training"|"open_coming_soon"} event
 */
export function trackUserActivity(event) {
  if (!useBackend() || !event) return Promise.resolve();
  return apiFetch("/auth/activity", {
    method: "POST",
    json: { event },
  }).catch(() => undefined);
}
