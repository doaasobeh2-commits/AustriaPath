/**
 * Idempotency middleware — Gate 0 contract (idempotency_records, 72h TTL).
 */

import { createHash } from "node:crypto";
import { query } from "../db/client.js";
import { AppError } from "./errorHandler.js";

const TTL_HOURS = 72;

function hashBody(body) {
  return createHash("sha256").update(JSON.stringify(body || {})).digest("hex");
}

/**
 * @param {string} endpoint e.g. "POST /exam-sessions"
 */
export function requireIdempotency(endpoint) {
  return async (req, res, next) => {
    const key =
      req.headers["idempotency-key"] ||
      req.headers["Idempotency-Key"] ||
      req.body?.idempotencyKey;

    if (!key) {
      return next(new AppError("VALIDATION_ERROR", "Idempotency-Key erforderlich.", 400));
    }

    req.idempotencyKey = String(key);
    const requestHash = hashBody(req.body);

    const { rows } = await query(
      `SELECT request_hash, response_status, response_body FROM idempotency_records
       WHERE idempotency_key = $1 AND endpoint = $2 AND expires_at > NOW()
       LIMIT 1`,
      [req.idempotencyKey, endpoint]
    );

    if (rows.length) {
      const row = rows[0];
      if (row.request_hash !== requestHash) {
        return next(
          new AppError("IDEMPOTENCY_MISMATCH", "Idempotency-Key mit anderer Anfrage verwendet.", 409)
        );
      }
      return res.status(row.response_status).json(row.response_body);
    }

    req.storeIdempotency = async (status, envelope) => {
      const expiresAt = new Date(Date.now() + TTL_HOURS * 3600000);
      await query(
        `INSERT INTO idempotency_records (idempotency_key, user_id, endpoint, request_hash, response_status, response_body, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          req.idempotencyKey,
          req.auth?.userId || null,
          endpoint,
          requestHash,
          status,
          JSON.stringify(envelope),
          expiresAt,
        ]
      );
    };

    next();
  };
}
