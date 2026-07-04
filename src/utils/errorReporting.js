/**
 * Frontend error reporting hook — structured for future Sentry integration.
 * Production build strips console.*; errors should eventually POST to /api/client-errors.
 */

export function reportClientError(error, context = {}) {
  const payload = {
    message: error?.message || String(error),
    name: error?.name || "Error",
    context,
    url: typeof window !== "undefined" ? window.location.href : "",
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.error("[AustriaPath]", payload);
  }

  return payload;
}

export function reportClientWarning(message, context = {}) {
  const payload = { message, context, timestamp: new Date().toISOString() };

  if (import.meta.env.DEV) {
    console.warn("[AustriaPath]", payload);
  }

  return payload;
}
