export const modelRouter = {
  // Current local engines
  grammarJudge: "rule",
  vocabularyJudge: "rule",
  communicationJudge: "rule",
  structureJudge: "rule",
  reasoningJudge: "rule",
  taskJudge: "rule",

  // Future AI services
  reflectionEngine: "rule",
  reportBuilder: "rule",

  providers: {
    rule: {
      enabled: true,
      local: true,
    },

    openai: {
      enabled: false,
      model: "gpt-4.1-mini",
    },

    gemini: {
      enabled: false,
      model: "gemini-2.5-flash",
    },

    claude: {
      enabled: false,
      model: "claude-3.5-haiku",
    },
  },
};