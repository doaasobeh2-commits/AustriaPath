import { query } from "../db/client.js";

export async function createAuthSession({
  userId,
  tokenHash,
  expiresAt,
  ipAddress,
  userAgent,
}) {
  const { rows } = await query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null]
  );
  return rows[0];
}

export async function revokeSession(tokenHash) {
  await query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}
