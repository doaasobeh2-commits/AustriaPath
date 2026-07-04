/**
 * Parse DATABASE_URL for diagnostics — never expose the password.
 */

/**
 * @param {string | undefined} connectionString
 */
export function parseDatabaseUrl(connectionString) {
  if (!connectionString?.trim()) {
    return {
      configured: false,
      host: null,
      port: null,
      database: null,
      role: null,
      pooled: false,
    };
  }

  try {
    const url = new URL(connectionString);
    return {
      configured: true,
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.replace(/^\//, "") || null,
      role: decodeURIComponent(url.username || ""),
      pooled: url.hostname.includes("-pooler"),
    };
  } catch {
    return {
      configured: true,
      host: null,
      port: null,
      database: null,
      role: null,
      pooled: false,
      parseError: true,
    };
  }
}
