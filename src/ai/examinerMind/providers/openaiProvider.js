export async function callOpenAI({ mode, prompt, studentAnswer, context = {} }) {
  try {
    const response = await fetch("/api/ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        prompt,
        studentAnswer,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error("AI request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("OpenAI Provider Error:", error);

    return {
      success: false,
      error: true,
      message: "Der KI-Dienst ist gerade nicht erreichbar.",
    };
  }
}