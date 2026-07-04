import cors from "cors";
import { env } from "./env.js";

/**
 * Comma-separated CORS_ORIGIN — e.g.
 * https://austriapath-exam-ai.vercel.app,http://localhost:5173
 */
export function parseCorsOrigins(raw = env.corsOrigin) {
  const value = String(raw || "").trim();
  if (!value) return ["http://localhost:5173"];
  return [...new Set(value.split(/[,;\n]+/).map((entry) => entry.trim()).filter(Boolean))];
}

export function createCorsMiddleware() {
  const allowed = new Set(parseCorsOrigins());

  return cors({
    origin(origin, callback) {
      // Same-origin / server-side / curl — no Origin header
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  });
}
