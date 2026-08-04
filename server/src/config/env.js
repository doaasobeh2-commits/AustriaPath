/**
 * Server environment configuration (Phase H).
 */

import { resolvePublicAppUrl } from "./publicAppUrl.js";

function envBool(name, defaultValue = false) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  return v === "true" || v === "1";
}

const nodeEnv = process.env.NODE_ENV || "development";
const databaseUrl = process.env.DATABASE_URL || "";

export const env = Object.freeze({
  nodeEnv,
  port: Number(process.env.PORT || 3000),
  databaseUrl,
  /** PGLite is allowed only in non-production test/dev — never in production. */
  usePglite:
    nodeEnv !== "production" &&
    (envBool("USE_PGLITE") ||
      (!databaseUrl.trim() && (nodeEnv === "test" || nodeEnv === "development"))),
  sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev-change-me-in-production",
  adminEmail: (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "fadisobehau@gmail.com")
    .trim()
    .toLowerCase(),
  adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  /** Public learner app URL for email deep links — never comma-separated CORS list. */
  publicAppUrl: resolvePublicAppUrl(),
  cookieSecure: envBool("COOKIE_SECURE", process.env.NODE_ENV === "production"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  /** B1 Weekly Training AI — dedicated credentials from server/.env only. */
  weeklyTrainingB1OpenAiApiKey: process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY || "",
  weeklyTrainingB1Model: process.env.WEEKLY_TRAINING_B1_MODEL || "",
  b1WeeklyPlanAiEnabled: envBool("B1_WEEKLY_PLAN_AI_ENABLED", false),
  b1WeeklyPlanAiTimeoutMs: Number(process.env.B1_WEEKLY_PLAN_AI_TIMEOUT_MS || 45_000),
  b1WeeklyPlanTaskAiRateLimitPerMin: Number(
    process.env.B1_WEEKLY_PLAN_TASK_AI_RATE_LIMIT_PER_MIN || 30
  ),
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
