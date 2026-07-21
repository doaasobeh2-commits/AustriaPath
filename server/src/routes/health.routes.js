import { Router } from "express";
import { success } from "../utils/response.js";
import { env } from "../config/env.js";
import { getDb, query } from "../db/client.js";
import { parseDatabaseUrl } from "../utils/databaseUrl.js";

const router = Router();

router.get("/", (_req, res) => {
  success(res, {
    status: "ok",
    service: "austria-path-api",
    version: "2.0.0-gate0",
    registration: "open",
    placementAi: {
      configured: Boolean(env.openaiApiKey),
      modelConfigured: Boolean(env.openaiModel),
    },
  });
});

/**
 * Read-only DB fingerprint — no passwords or connection strings.
 * GET /v1/health/db
 */
router.get("/db", async (_req, res, next) => {
  try {
    let dbKind = "not_initialized";
    try {
      dbKind = getDb().kind;
    } catch {
      dbKind = "not_initialized";
    }

    const configured = parseDatabaseUrl(process.env.DATABASE_URL || env.databaseUrl);

    let database = null;
    let role = null;
    let publicTableCount = 0;
    let usersTableExists = false;

    if (dbKind === "pg" || dbKind === "pglite") {
      const identity = await query(
        "SELECT current_database() AS db, current_user AS role"
      );
      database = identity.rows[0]?.db ?? null;
      role = identity.rows[0]?.role ?? null;

      const tables = await query(
        `SELECT COUNT(*)::int AS count
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      );
      publicTableCount = tables.rows[0]?.count ?? 0;

      const users = await query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'users'
         ) AS ok`
      );
      usersTableExists = Boolean(users.rows[0]?.ok);
    }

    success(res, {
      dbKind,
      host: dbKind === "pg" ? configured.host : null,
      database,
      role,
      usersTableExists,
      publicTableCount,
      databaseUrlConfigured: configured.configured,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
