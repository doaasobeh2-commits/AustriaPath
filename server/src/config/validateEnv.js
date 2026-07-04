import { parseDatabaseUrl } from "../utils/databaseUrl.js";

function isProduction() {
  return (process.env.NODE_ENV || "development") === "production";
}

/**
 * Production must use PostgreSQL via DATABASE_URL — never PGLite.
 * Call before prepareDatabase() so Railway fails fast with a clear log message.
 */
export function assertProductionDatabaseConfig() {
  if (!isProduction()) return;

  if (process.env.USE_PGLITE === "true" || process.env.USE_PGLITE === "1") {
    throw new Error(
      "USE_PGLITE is not allowed when NODE_ENV=production. Remove USE_PGLITE from Railway Variables."
    );
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required in production. Railway → API Web Service → Variables → add DATABASE_URL with your Neon pooled connection string (?sslmode=require), then redeploy."
    );
  }

  const parsed = parseDatabaseUrl(url);
  if (parsed.parseError || !parsed.host || !parsed.database) {
    throw new Error(
      "DATABASE_URL is set but invalid. Use Neon Connect → pooled URL, e.g. postgresql://role:password@ep-….neon.tech/neondb?sslmode=require"
    );
  }
}
