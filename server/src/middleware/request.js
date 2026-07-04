import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

export function newRequestId(req, _res, next) {
  req.requestId = req.headers["x-request-id"] || randomUUID();
  next();
}

export function attachResReq(req, res, next) {
  res.req = req;
  next();
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken() {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}
