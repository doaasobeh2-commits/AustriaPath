export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { prompt, studentAnswer } = req.body;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "Du bist ein offizieller ÖIF-Prüfer. Antworte ausschließlich auf Deutsch.",
            },
            {
              role: "user",
              content: `${prompt}\n\n${studentAnswer}`,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json({
      success: true,
      result: data.choices?.[0]?.message?.content || "",
      raw: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}