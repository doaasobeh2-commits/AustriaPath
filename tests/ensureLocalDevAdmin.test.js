/**
 * Local PGLite admin bootstrap on startup.
 */
process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";
process.env.VITE_ADMIN_EMAIL = "fadisobehau@gmail.com";
process.env.VITE_ADMIN_INITIAL_PASSWORD = "local-test-admin-pass-123";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, query, runMigrations } from "../server/src/db/client.js";
import { ensureLocalAdminPassword } from "../server/src/db/ensureLocalAdminPassword.js";
import { prepareDatabase } from "../server/src/db/startup.js";
import { verifyPassword } from "../server/src/utils/password.js";

describe("ensureLocalAdminPassword", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates the admin on empty PGLite and syncs password on next run", async () => {
    const first = await ensureLocalAdminPassword();
    expect(first.action).toBe("created");
    expect(first.userId).toBeTruthy();

    const { rows } = await query(
      `SELECT email, role FROM users WHERE id = $1`,
      [first.userId]
    );
    expect(rows[0].email).toBe("fadisobehau@gmail.com");
    expect(rows[0].role).toBe("admin");

    const second = await ensureLocalAdminPassword();
    expect(second.action).toBe("unchanged");

    process.env.VITE_ADMIN_INITIAL_PASSWORD = "local-test-admin-pass-456";
    const third = await ensureLocalAdminPassword();
    expect(third.action).toBe("password_updated");

    const { rows: updated } = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [first.userId]
    );
    const matches = await verifyPassword("local-test-admin-pass-456", updated[0].password_hash);
    expect(matches).toBe(true);
  });

  it("prepareDatabase bootstraps admin through startup hook", async () => {
    await closeDb();
    await prepareDatabase();
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count FROM users WHERE LOWER(email) = LOWER($1)`,
      ["fadisobehau@gmail.com"]
    );
    expect(rows[0].count).toBe(1);
  });
});
