import { requestOpenAIProxy } from "../../../security/secureOpenAI";

export async function callOpenAI({ mode, prompt, studentAnswer, context = {} }) {
  try {
    return await requestOpenAIProxy({
      mode,
      prompt,
      studentAnswer,
      context,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("OpenAI Provider Error:", error);
    }

    return {
      success: false,
      error: true,
      message: "Der KI-Dienst ist gerade nicht erreichbar.",
    };
  }
}
