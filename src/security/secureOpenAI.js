import { reportClientError } from "../utils/errorReporting.js";

const MAX_PROMPT_LENGTH = 8000;
const MAX_ANSWER_LENGTH = 8000;
const MAX_MESSAGES = 30;

function trimText(value, maxLength) {
  return String(value ?? "").slice(0, maxLength);
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-MAX_MESSAGES)
    .map((entry) => ({
      role: entry?.role === "assistant" ? "assistant" : "user",
      content: trimText(entry?.content, MAX_PROMPT_LENGTH),
    }))
    .filter((entry) => entry.content.length > 0);
}

export async function requestOpenAIProxy(payload = {}) {
  const body = {
    mode: trimText(payload.mode, 64),
    prompt: trimText(payload.prompt, MAX_PROMPT_LENGTH),
    studentAnswer: trimText(payload.studentAnswer, MAX_ANSWER_LENGTH),
    context:
      payload.context && typeof payload.context === "object"
        ? payload.context
        : {},
    messages: sanitizeMessages(payload.messages),
  };

  const response = await fetch("/api/ai/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error("AI request failed");
    reportClientError(error, { status: response.status, mode: body.mode });
    throw error;
  }

  const data = await response.json();
  if (!data || data.success === false) {
    const error = new Error(data?.error || "AI request failed");
    reportClientError(error, { errorCode: data?.errorCode, mode: body.mode });
    throw error;
  }

  return {
    success: true,
    result: typeof data.result === "string" ? data.result : "",
  };
}
