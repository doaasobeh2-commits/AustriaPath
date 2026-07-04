/**
 * Server environment configuration (Phase H).
 */

function envBool(name, defaultValue = false) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  return v === "true" || v === "1";
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || "",
  /** PGLite is allowed only in non-production test/dev — never in production. */
  usePglite:
    process.env.NODE_ENV !== "production" &&
    (envBool("USE_PGLITE") ||
      (process.env.NODE_ENV === "test" && !process.env.DATABASE_URL)),
  sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev-change-me-in-production",
  adminEmail: (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "fadisobehau@gmail.com")
    .trim()
    .toLowerCase(),
  adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  cookieSecure: envBool("COOKIE_SECURE", process.env.NODE_ENV === "production"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "AustriaPath <noreply@austriapath.at>",
  stripePrices: Object.freeze({
    placement_test: process.env.STRIPE_PRICE_PLACEMENT || "",
    weekly_plan: process.env.STRIPE_PRICE_WEEKLY_PLAN || "",
    ai_exam: process.env.STRIPE_PRICE_AI_EXAM || "",
    intensive_week: process.env.STRIPE_PRICE_INTENSIVE_WEEK || "",
    premium_month: process.env.STRIPE_PRICE_PREMIUM_MONTH || "",
  }),
});
