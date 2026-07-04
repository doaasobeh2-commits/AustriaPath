import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { closeDb, query } from "../../server/src/db/client.js";
import { prepareDatabase } from "../../server/src/db/startup.js";

describe("server database startup", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.USE_PGLITE = "true";
    await closeDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("prepares an empty database (migrations + rule registry seed)", async () => {
    await prepareDatabase();

    const tables = await query(
      `SELECT to_regclass('public.rule_registry_snapshots') AS registry_table`
    );
    expect(tables.rows[0]?.registry_table).toBeTruthy();

    const current = await query(
      `SELECT id FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    expect(current.rows.length).toBe(1);
  });
});
