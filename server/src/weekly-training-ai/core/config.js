/**
 * B1 Weekly Training AI configuration — isolated from generic OpenAI gateway.
 * Reads dedicated env vars at call time; never falls back to the generic gateway key.
 * @module weekly-training-ai/core/config
 */

import { AppError } from "../../middleware/errorHandler.js";

function envBool(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1";
}

export const B1_WEEKLY_TRAINING_PRODUCT_SCOPE = "b1_weekly_plan_task_ai";
export const B1_WEEKLY_TRAINING_LEVEL = "B1";

/**
 * @returns {{
 *   enabled: boolean,
 *   apiKey: string,
 *   model: string,
 *   timeoutMs: number,
 *   rateLimitPerMin: number,
 * }}
 */
export function getB1WeeklyTrainingAiConfig() {
  return Object.freeze({
    enabled: envBool("B1_WEEKLY_PLAN_AI_ENABLED", false),
    apiKey: process.env.WEEKLY_TRAINING_B1_OPENAI_API_KEY || "",
    model: process.env.WEEKLY_TRAINING_B1_MODEL || "",
    timeoutMs: Number(process.env.B1_WEEKLY_PLAN_AI_TIMEOUT_MS || 45_000),
    rateLimitPerMin: Number(process.env.B1_WEEKLY_PLAN_TASK_AI_RATE_LIMIT_PER_MIN || 30),
  });
}

/**
 * @returns {{
 *   weeklyTrainingEnabled: boolean,
 *   apiKeyConfigured: boolean,
 *   configuredModel: string | null,
 * }}
 */
export function getWeeklyTrainingStartupDiagnostics() {
  const config = getB1WeeklyTrainingAiConfig();
  const configuredModel = String(config.model || "").trim();

  return {
    weeklyTrainingEnabled: config.enabled,
    apiKeyConfigured: Boolean(String(config.apiKey || "").trim()),
    configuredModel: configuredModel || null,
  };
}

export function logWeeklyTrainingStartupDiagnostics() {
  const diagnostics = getWeeklyTrainingStartupDiagnostics();
  console.log(
    `[weekly-training-b1] Weekly Training enabled: ${diagnostics.weeklyTrainingEnabled}`
  );
  console.log(
    `[weekly-training-b1] API key configured: ${diagnostics.apiKeyConfigured}`
  );
  console.log(
    `[weekly-training-b1] configured model: ${diagnostics.configuredModel || "(not set)"}`
  );
}

export function assertB1WeeklyTrainingAiEnabled() {
  const config = getB1WeeklyTrainingAiConfig();
  if (!config.enabled) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      "B1 Weekly Training AI ist deaktiviert.",
      503
    );
  }
  return config;
}

export function assertB1WeeklyTrainingModelConfigured() {
  const config = assertB1WeeklyTrainingAiEnabled();
  if (!String(config.model || "").trim()) {
    throw new AppError(
      "CONFIG_ERROR",
      "WEEKLY_TRAINING_B1_MODEL fehlt.",
      503
    );
  }
  return config;
}

export function assertB1WeeklyTrainingApiKeyConfigured() {
  const config = assertB1WeeklyTrainingModelConfigured();
  if (!String(config.apiKey || "").trim()) {
    throw new AppError(
      "CONFIG_ERROR",
      "WEEKLY_TRAINING_B1_OPENAI_API_KEY fehlt.",
      503
    );
  }
  return config;
}

/**
 * Guardrail test hook — generic OpenAI key must never be used as fallback.
 */
export function usesDedicatedB1ApiKeyOnly() {
  const config = getB1WeeklyTrainingAiConfig();
  return {
    dedicatedKeyPresent: Boolean(String(config.apiKey || "").trim()),
    wouldUseGenericFallback: false,
  };
}
