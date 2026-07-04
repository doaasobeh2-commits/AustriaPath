/**
 * API environment config — backend flag vs base URL are separate concerns.
 *
 * VITE_USE_BACKEND: boolean flag only ("true" enables backend mode).
 * VITE_API_BASE: API path prefix (default "/v1"). Must not be "true" or "false".
 */

export const DEFAULT_API_BASE = "/v1";

const INVALID_API_BASE_VALUES = new Set(["true", "false", "1", "0", "yes", "no"]);

function readConfiguredApiBase() {
  const raw = import.meta.env.VITE_API_BASE;
  return typeof raw === "string" ? raw.trim() : "";
}

/** Pure resolver — used by apiBase() and unit tests. */
export function resolveApiBasePath(configuredBase, backendFlag = "") {
  const configured =
    typeof configuredBase === "string" ? configuredBase.trim() : "";

  if (!configured) {
    return DEFAULT_API_BASE;
  }

  const normalized = configured.replace(/\/+$/, "") || DEFAULT_API_BASE;
  const lower = normalized.toLowerCase();

  if (INVALID_API_BASE_VALUES.has(lower)) {
    return DEFAULT_API_BASE;
  }

  if (normalized === String(backendFlag || "").trim()) {
    return DEFAULT_API_BASE;
  }

  return normalized;
}

/** Backend mode flag — never used as a URL. */
export function useBackend() {
  return import.meta.env.VITE_USE_BACKEND === "true";
}

/**
 * Resolved API base path or absolute URL for apiFetch().
 * Uses VITE_API_BASE only; falls back to "/v1" when unset or invalid.
 */
export function apiBase() {
  return resolveApiBasePath(
    readConfiguredApiBase(),
    import.meta.env.VITE_USE_BACKEND
  );
}

/** Build a full API URL for a relative path such as "/auth/login". */
export function buildApiUrl(path) {
  const base = apiBase();
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}
