export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const MAX_PROMPT_LENGTH = 8000;
  const MAX_MESSAGES = 30;

  function trimText(value, maxLength) {
    return String(value ?? "").slice(0, maxLength);
  }

  try {
    const { prompt, studentAnswer, messages, mode, context } = req.body || {};

    const systemMessage = {
      role: "system",
      content:
        "Du bist ein offizieller ÖIF-Prüfer. Antworte ausschließlich auf Deutsch.",
    };

    let chatMessages = [];

    if (Array.isArray(messages) && messages.length > 0) {
      chatMessages = messages
        .slice(-MAX_MESSAGES)
        .map((entry) => ({
          role: entry?.role === "assistant" ? "assistant" : "user",
          content: trimText(entry?.content, MAX_PROMPT_LENGTH),
        }))
        .filter((entry) => entry.content.length > 0);
    } else {
      const userContent = [trimText(prompt, MAX_PROMPT_LENGTH), trimText(studentAnswer, MAX_PROMPT_LENGTH)]
        .filter(Boolean)
        .join("\n\n");

      if (!userContent) {
        return res.status(400).json({
          success: false,
          error: "prompt, studentAnswer, or messages required",
        });
      }

      chatMessages = [{ role: "user", content: userContent }];
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          messages: [systemMessage, ...chatMessages],
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "OpenAI request failed",
        errorCode: "OPENAI_UPSTREAM_ERROR",
      });
    }

    return res.status(200).json({
      success: true,
      result: data.choices?.[0]?.message?.content || "",
      mode: mode || null,
      serviceType: context?.serviceType || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      errorCode: "OPENAI_PROXY_ERROR",
    });
  }
}
