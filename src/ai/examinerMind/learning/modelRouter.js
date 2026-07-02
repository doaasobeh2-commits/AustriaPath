import { callOpenAI } from "../providers/openaiProvider";
import { getCurrentUser, saveCurrentUser } from "../../../app/userAccess";
import { canUseAI, consumeAICredits } from "../../../utils/aiCredits";

const FREE_RULE_SERVICES = ["placement_test", "weekly_plan"];

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

export function getEngineProvider(engineName, serviceType) {
  if (FREE_RULE_SERVICES.includes(serviceType)) {
    return {
      name: "rule",
      config: modelRouter.providers.rule,
    };
  }

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
  const serviceType = context.serviceType || "ai_exam";
  const provider = getEngineProvider(engineName, serviceType);

  if (provider.name === "rule") {
    return {
      success: true,
      provider: "rule",
      model: "local-rules",
      mode,
      serviceType,
      result: null,
      usedCredits: false,
    };
  }

  if (provider.name === "openai") {
    const currentUser = getCurrentUser();

    if (!canUseAI(currentUser, serviceType)) {
      return {
        success: false,
        provider: "openai",
        error: true,
        errorCode: "AI_CREDITS_OR_ACCESS_DENIED",
        message:
          "Ihr KI-Guthaben ist aufgebraucht oder Ihr Konto ist nicht freigegeben.",
      };
    }

    const aiResponse = await callOpenAI({
      mode,
      prompt,
      studentAnswer,
      context: {
        ...context,
        engineName,
        model: provider.config.model,
        serviceType,
        userId: currentUser?.id,
      },
    });

    console.log("AI credit check:", {
      userId: currentUser?.id,
      serviceType,
      aiResponse,
    });

    if (!aiResponse?.error && currentUser?.id) {
      const updatedUser = consumeAICredits(currentUser.id, serviceType);

      if (updatedUser) {
        saveCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }

    return {
      ...aiResponse,
      usedCredits: true,
    };
  }

  return {
    success: false,
    provider: provider.name,
    error: true,
    errorCode: "PROVIDER_NOT_CONNECTED",
  };
}