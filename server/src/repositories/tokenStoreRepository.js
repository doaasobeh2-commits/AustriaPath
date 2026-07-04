/**
 * One-time tokens via idempotency_records (frozen schema).
 */

import { randomUUID, createHash } from "node:crypto";
import { query } from "../db/client.js";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * @param {string} endpoint
 * @param {object} payload
 * @param {number} ttlHours
 */
export async function createOneTimeToken(endpoint, payload, ttlHours = 1) {
  const token = randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 3600000);
  await query(
    `INSERT INTO idempotency_records (idempotency_key, endpoint, request_hash, response_status, response_body, expires_at)
     VALUES ($1, $2, 'token', 200, $3::jsonb, $4)`,
    [tokenHash, endpoint, JSON.stringify(payload), expiresAt]
  );
  return token;
}

export async function consumeOneTimeToken(endpoint, token) {
  const tokenHash = hashToken(token);
  const { rows } = await query(
    `SELECT response_body FROM idempotency_records
     WHERE idempotency_key = $1 AND endpoint = $2 AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash, endpoint]
  );
  if (!rows.length) return null;
  await query(`DELETE FROM idempotency_records WHERE idempotency_key = $1`, [tokenHash]);
  return rows[0].response_body;
}
