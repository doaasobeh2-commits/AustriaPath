/**
 * Canonical public app origin for transactional email links (password reset, etc.).
 * Never use raw comma-separated CORS_ORIGIN for link building.
 */

function parseCorsOriginsList(raw) {
  const value = String(raw || "").trim();
  if (!value) return ["http://localhost:5173"];
  return [...new Set(value.split(/[,;\n]+/).map((entry) => entry.trim()).filter(Boolean))];
}

/**
 * @param {string} [raw]
 */
export function resolvePublicAppUrl(raw = process.env.PUBLIC_APP_URL) {
  const explicit = String(raw || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const [fallback] = parseCorsOriginsList(process.env.CORS_ORIGIN);
  return fallback || "http://localhost:5173";
}

export function buildPublicAppQueryUrl(pathAndQuery) {
  const base = resolvePublicAppUrl();
  const suffix = pathAndQuery.startsWith("?") ? pathAndQuery : `?${pathAndQuery}`;
  return `${base}${suffix}`;
}
