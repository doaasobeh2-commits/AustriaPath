import { afterEach, describe, expect, it, vi } from "vitest";

describe("Placement provider evaluation", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("evaluates a voice transcript through the configured provider path", async () => {
    process.env.OPENAI_API_KEY = "test-provider-placeholder";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                band: "strong",
                coveredTopics: ["Name", "Wohnort", "Arbeit oder Kurs"],
                missingTopics: ["Freizeit"],
                needsFollowUp: true,
                followUpQuestion: "Was machen Sie am Wochenende?",
                followUpSource: "examinerQuestions",
                notes: ["zusammenhängende Antwort"],
              }),
            },
          },
        ],
      }),
    });

    const { evaluatePlacementTurn } = await import(
      "../../server/src/services/placementEvaluateService.js"
    );
    const result = await evaluatePlacementTurn({
      userId: "provider-test-user",
      productType: "placement_test",
      modelId: "a2_self_mittel",
      answerText: "Ich heiße Mina, wohne in Wien und arbeite in einem Hotel.",
      currentQuestion: "Stellen Sie sich bitte kurz vor.",
      inputMode: "voice_transcript",
      conversation: [],
      authUser: {
        role: "admin",
        email: process.env.ADMIN_EMAIL || "fadisobehau@gmail.com",
      },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      band: "strong",
      evaluationMethod: "placement-ai-turn-v1",
      needsFollowUp: true,
      followUpQuestion: "Was machen Sie am Wochenende?",
    });
  });
});
