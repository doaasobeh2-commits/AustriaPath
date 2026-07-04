/**
 * In-memory rate limits — production should use Redis for multi-instance.
 * @see docs/backend-contract-pack/04-auth-authorization.md
 * @see docs/backend-contract-pack/13-ai-gateway-contracts.md
 */

const buckets = new Map();

function pruneBucket(bucket, windowMs) {
  const now = Date.now();
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

/**
 * @param {string} key
 * @param {number} max
 * @param {number} windowMs
 */
export function hitRateLimit(key, max, windowMs) {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  pruneBucket(bucket, windowMs);
  if (bucket.timestamps.length >= max) {
    return false;
  }
  bucket.timestamps.push(Date.now());
  return true;
}

export function rateLimit(options) {
  const { max, windowMs, keyFn } = options;
  return (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();
    const key = keyFn(req);
    if (!hitRateLimit(key, max, windowMs)) {
      const err = Object.assign(new Error("Zu viele Anfragen. Bitte später erneut versuchen."), {
        code: "RATE_LIMITED",
        status: 429,
      });
      return next(err);
    }
    next();
  };
}

export const loginRateLimit = rateLimit({
  max: 10,
  windowMs: 60_000,
  keyFn: (req) => `login:ip:${req.ip}`,
});

export const loginEmailRateLimit = rateLimit({
  max: 5,
  windowMs: 60_000,
  keyFn: (req) => `login:email:${String(req.body?.email || "").toLowerCase()}`,
});

export const registerRateLimit = rateLimit({
  max: 3,
  windowMs: 3_600_000,
  keyFn: (req) => `register:ip:${req.ip}`,
});

export const aiRateLimit = rateLimit({
  max: 30,
  windowMs: 60_000,
  keyFn: (req) => `ai:min:${req.auth?.userId || req.ip}`,
});

export function aiDailyRateLimit(req, _res, next) {
  if (process.env.NODE_ENV === "test") return next();
  const key = `ai:day:${req.auth?.userId}`;
  if (!hitRateLimit(key, 500, 86_400_000)) {
    return next(
      Object.assign(new Error("Tageslimit für AI-Anfragen erreicht."), {
        code: "RATE_LIMITED",
        status: 429,
      })
    );
  }
  next();
}
