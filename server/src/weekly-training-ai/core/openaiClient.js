/**
 * Dedicated OpenAI client for B1 Weekly Training AI.
 * Never reads OPENAI_API_KEY or reuses generic AI gateway clients.
 * @module weekly-training-ai/core/openaiClient
 */

import { assertB1WeeklyTrainingApiKeyConfigured } from "./config.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * @returns {{ apiKey: string, model: string, timeoutMs: number }}
 */
export function getB1WeeklyTrainingOpenAiClientConfig() {
  const config = assertB1WeeklyTrainingApiKeyConfigured();
  return {
    apiKey: config.apiKey,
    model: config.model,
    timeoutMs: config.timeoutMs,
  };
}

/**
 * @param {{ model: string, system: string, user: string, maxCompletionTokens?: number }} params
 */
export function buildB1WeeklyTrainingCompletionBody({ model, system, user, maxCompletionTokens }) {
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const tokenLimit = Number(maxCompletionTokens) > 0 ? Number(maxCompletionTokens) : 1200;

  if (String(model || "").startsWith("gpt-5.6")) {
    return { ...body, max_completion_tokens: tokenLimit };
  }

  return { ...body, temperature: 0.2, max_tokens: tokenLimit };
}

/**
 * @param {{ system: string, user: string, maxCompletionTokens?: number }} params
 */
export async function createB1WeeklyTrainingJsonCompletion({ system, user, maxCompletionTokens }) {
  const { apiKey, model, timeoutMs } = getB1WeeklyTrainingOpenAiClientConfig();
  const requestBody = buildB1WeeklyTrainingCompletionBody({
    model,
    system,
    user,
    maxCompletionTokens,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("OPENAI_UPSTREAM_ERROR", "KI-Korrektur hat zu lange gedauert.", 504);
    }
    throw new AppError(
      "OPENAI_UPSTREAM_ERROR",
      "KI-Dienst vorübergehend nicht verfügbar.",
      502,
      { cause: error instanceof Error ? error.message : String(error) }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(
      "[weekly-training-b1] OpenAI upstream error:",
      JSON.stringify(data, null, 2)
    );
    throw new AppError(
      "OPENAI_UPSTREAM_ERROR",
      "KI-Dienst vorübergehend nicht verfügbar.",
      502,
      data
    );
  }

  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError("AI_INVALID_RESPONSE", "KI-Antwort war ungültig.", 502);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError("AI_INVALID_RESPONSE", "KI-Antwort war ungültig.", 502);
  }
}

/**
 * Phase 1 placeholder alias — category handlers call createB1WeeklyTrainingJsonCompletion.
 */
export async function createB1WeeklyTrainingCompletion(params) {
  return createB1WeeklyTrainingJsonCompletion(params);
}
