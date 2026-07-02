import { callOpenAI } from "../../providers/openaiProvider";

export const modelRouter = {
  grammarJudge: "rule",
  vocabularyJudge: "rule",
  communicationJudge: "rule",
  structureJudge: "rule",
  reasoningJudge: "rule",
  taskJudge: "rule",

  reflectionEngine: "openai",
  reportBuilder: "openai",
  followUpQuestionBuilder: "openai",
  feedbackBuilder: "openai",

  providers: {
    rule: {
      enabled: true,
      local: true,
      model: "local-rules",
    },

    openai: {
      enabled: true,
      local: false,
      model: "gpt-4.1-mini",
    },

    gemini: {
      enabled: false,
      local: false,
      model: "gemini-2.5-flash",
    },

    claude: {
      enabled: false,
      local: false,
      model: "claude-3.5-haiku",
    },
  },
};

export function getProviderConfig(providerName = "rule") {
  return modelRouter.providers[providerName] || modelRouter.providers.rule;
}

export function getActiveAIProvider() {
  if (modelRouter.providers.openai?.enabled) return "openai";
  if (modelRouter.providers.gemini?.enabled) return "gemini";
  if (modelRouter.providers.claude?.enabled) return "claude";
  return "rule";
}

export function getEngineProvider(engineName) {
  const providerName = modelRouter[engineName] || "rule";
  const providerConfig = getProviderConfig(providerName);

  if (!providerConfig.enabled) {
    return {
      name: "rule",
      config: modelRouter.providers.rule,
    };
  }

  return {
    name: providerName,
    config: providerConfig,
  };
}

export async function runModelRouter({
  engineName = "reflectionEngine",
  mode = "normal",
  prompt = "",
  studentAnswer = "",
  context = {},
}) {
  const provider = getEngineProvider(engineName);

  if (provider.name === "rule") {
    return {
      success: true,
      provider: "rule",
      model: "local-rules",
      mode,
      result: null,
    };
  }

  if (provider.name === "openai") {
    return await callOpenAI({
      mode,
      prompt,
      studentAnswer,
      context: {
        ...context,
        engineName,
        model: provider.config.model,
      },
    });
  }

  return {
    success: false,
    provider: provider.name,
    errorCode: "PROVIDER_NOT_CONNECTED",
  };
}