/**
 * Database client — PostgreSQL (production) or PGLite (tests).
 * @see server/README.md deviation note
 */

import fs from "node:fs";
import { splitSqlStatements } from "./splitSql.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('pg').Pool | null} */
let pool = null;
/** @type {import('@electric-sql/pglite').PGlite | null} */
let pglite = null;

function adaptSqlForPglite(sql) {
  return sql
    .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/gi, "-- pgcrypto skipped (pglite)")
    .replace(/CREATE EXTENSION IF NOT EXISTS citext;/gi, "-- citext skipped (pglite)")
    .replace(/\bCITEXT\b/gi, "TEXT");
}

export async function initDb() {
  if (pool || pglite) return getDb();

  const isProduction = (process.env.NODE_ENV || "development") === "production";
  const databaseUrl = process.env.DATABASE_URL?.trim() || env.databaseUrl?.trim();

  if (isProduction) {
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is required in production (Neon PostgreSQL). PGlite fallback is disabled."
      );
    }
    if (process.env.USE_PGLITE === "true" || process.env.USE_PGLITE === "1") {
      throw new Error("USE_PGLITE is not allowed in production.");
    }
    pool = new pg.Pool({ connectionString: databaseUrl });
    await pool.query("SELECT 1");
    return { kind: "pg", pool };
  }

  if (databaseUrl && !env.usePglite) {
    pool = new pg.Pool({ connectionString: databaseUrl });
    await pool.query("SELECT 1");
    return { kind: "pg", pool };
  }

  if (env.usePglite) {
    const { PGlite } = await import("@electric-sql/pglite");
    pglite = new PGlite();
    return { kind: "pglite", pglite };
  }

  throw new Error(
    "DATABASE_URL is not set. Set PostgreSQL DATABASE_URL or USE_PGLITE=true for local embedded DB."
  );
}

export function getDb() {
  if (pool) return { kind: "pg", pool };
  if (pglite) return { kind: "pglite", pglite };
  throw new Error("Database not initialized — call initDb() first");
}

/**
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function query(text, params = []) {
  const db = getDb();
  if (db.kind === "pg") {
    return db.pool.query(text, params);
  }
  return db.pglite.query(text, params);
}

export async function withTransaction(fn) {
  const db = getDb();
  if (db.kind === "pg") {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn((text, params) => client.query(text, params));
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  await db.pglite.query("BEGIN");
  try {
    const result = await fn((text, params) => db.pglite.query(text, params));
    await db.pglite.query("COMMIT");
    return result;
  } catch (e) {
    await db.pglite.query("ROLLBACK");
    throw e;
  }
}

function resolveSchemaPath() {
  const candidates = [
    path.resolve(__dirname, "schema.sql"),
    path.resolve(__dirname, "../../../docs/backend-contract-pack/02-database-schema.sql"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `Database schema SQL not found. Expected one of: ${candidates.join(", ")}`
  );
}

export async function runMigrations() {
  await initDb();
  const schemaPath = resolveSchemaPath();
  let sql = fs.readFileSync(schemaPath, "utf8");
  const db = getDb();
  if (db.kind === "pglite") {
    sql = adaptSqlForPglite(sql);
  }

  const statements = splitSqlStatements(sql);
  if (process.env.DEBUG_MIGRATE) {
    console.log("statement count", statements.length);
    statements.filter((s) => s.includes("users")).forEach((s, i) =>
      console.log("users stmt", i, s.slice(0, 120))
    );
  }

  for (const statement of statements) {
    if (/^CREATE TRIGGER/i.test(statement)) continue;
    try {
      await query(statement);
    } catch (err) {
      const msg = String(err?.message || err);
      if (process.env.DEBUG_MIGRATE) {
        console.error("FAIL:", statement.slice(0, 80), msg);
      }
      if (msg.includes("already exists") || msg.includes("duplicate key")) continue;
      throw err;
    }
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (pglite) {
    await pglite.close();
    pglite = null;
  }
}
