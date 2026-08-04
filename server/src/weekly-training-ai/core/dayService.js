/**
 * B1 training day completion — Final Daily Report only.
 * @module weekly-training-ai/core/dayService
 */

import { createHash } from "node:crypto";
import { assertB1WeeklyTrainingAiEnabled } from "./config.js";
import { runB1DailyReportGeneration } from "../handlers/b1-daily-report.handler.js";
import { logWeeklyTrainingAiEvent } from "./usageLogger.js";
import { getB1WeeklyTrainingOpenAiClientConfig } from "./openaiClient.js";
import { AppError } from "../../middleware/errorHandler.js";

/** @type {Map<string, object>} */
const completedDayCache = new Map();

/**
 * @param {object} input
 */
export async function completeB1TrainingDay(input) {
  assertB1WeeklyTrainingAiEnabled();

  const planIndex = Number(input.planIndex);
  const planHash = String(input.planHash || "no-plan");
  const trainingMemories = Array.isArray(input.trainingMemories) ? input.trainingMemories : [];

  if (!Number.isInteger(planIndex) || planIndex < 1) {
    throw new AppError("VALIDATION_ERROR", "planIndex ist ungültig.", 400);
  }
  if (!trainingMemories.length) {
    throw new AppError("VALIDATION_ERROR", "trainingMemories ist erforderlich.", 400);
  }

  const cacheKey = `${input.userId}:${input.idempotencyKey || createHash("sha256").update(`${planHash}|${planIndex}|${JSON.stringify(trainingMemories)}`).digest("hex")}`;
  if (completedDayCache.has(cacheKey)) {
    return { dailyReport: completedDayCache.get(cacheKey), replayed: true };
  }

  const dailyReport = await runB1DailyReportGeneration({
    userId: input.userId,
    planIndex,
    planHash,
    trainingMemories,
    idempotencyKey: input.idempotencyKey,
  });

  completedDayCache.set(cacheKey, dailyReport);

  let modelName = null;
  try {
    modelName = getB1WeeklyTrainingOpenAiClientConfig().model;
  } catch {
    modelName =
      dailyReport?.source === "deterministic_fallback" ? "deterministic_fallback" : null;
  }

  await logWeeklyTrainingAiEvent({
    userId: input.userId,
    eventType: "daily_report_completed",
    modelName,
    payload: {
      planIndex,
      planHash,
      memoryCount: trainingMemories.length,
      reportVersion: dailyReport.version,
    },
  });

  return { dailyReport, replayed: false };
}

/** Test helper */
export function resetB1TrainingDayCache() {
  completedDayCache.clear();
}
