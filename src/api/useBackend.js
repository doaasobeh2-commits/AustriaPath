/**
 * Backend feature flag — Gate 0 contract pack.
 */
export function useBackend() {
  return import.meta.env.VITE_USE_BACKEND === "true";
}

export function apiBase() {
  return import.meta.env.VITE_API_BASE || "/v1";
}
