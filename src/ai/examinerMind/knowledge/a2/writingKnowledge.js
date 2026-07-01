/**
 * AustriaPath A2 Writing Knowledge
 * Version 1.0
 */

export const A2WritingKnowledge = {
  metadata: {
    id: "A2-WRITING",
    level: "A2",
    skill: "writing",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Write a short understandable message or email.",
    "Answer the required points of the task.",
    "Use simple greetings and closing phrases.",
    "Use basic sentence structure.",
    "Communicate the main message clearly.",
  ],

  examinerChecks: [
    {
      id: "A2-WR-001",
      title: "Task Completion",
      importance: "high",
      description: "Checks whether all required task points are answered.",
    },
    {
      id: "A2-WR-002",
      title: "Greeting and Closing",
      importance: "medium",
      description: "Checks simple email opening and closing.",
    },
    {
      id: "A2-WR-003",
      title: "Clear Message",
      importance: "high",
      description: "Checks whether the reader can understand the message.",
    },
    {
      id: "A2-WR-004",
      title: "Simple Structure",
      importance: "medium",
      description: "Checks basic sentence order and short connected sentences.",
    },
    {
      id: "A2-WR-005",
      title: "Appropriate Length",
      importance: "medium",
      description: "Checks whether the answer is long enough for A2 writing.",
    },
  ],

  expectedElements: [
    "Anrede",
    "Grund der Nachricht",
    "Antwort auf alle Punkte",
    "kurze Erklärung",
    "Grußformel",
  ],

  commonMistakes: [
    {
      id: "A2-WR-M01",
      title: "Missing greeting",
      linkedCheck: "A2-WR-002",
    },
    {
      id: "A2-WR-M02",
      title: "Task point missing",
      linkedCheck: "A2-WR-001",
    },
    {
      id: "A2-WR-M03",
      title: "Message unclear",
      linkedCheck: "A2-WR-003",
    },
    {
      id: "A2-WR-M04",
      title: "Too short answer",
      linkedCheck: "A2-WR-005",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "All task points are answered clearly with simple correct structure.",
    },
    good: {
      minScore: 70,
      description: "The message is clear with minor mistakes.",
    },
    acceptable: {
      minScore: 55,
      description: "The main message is understandable, but some parts are weak.",
    },
    weak: {
      minScore: 40,
      description: "Several required points are missing or unclear.",
    },
    critical: {
      minScore: 0,
      description: "The writing does not communicate the required message.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student answered the writing task clearly.",
      "The email/message is understandable and complete for A2.",
    ],
    good: [
      "The message is clear, but some small grammar or structure mistakes remain.",
      "The student can write a simple A2 message.",
    ],
    acceptable: [
      "The main idea is understandable, but some task points need more detail.",
      "The answer needs better structure and clearer sentences.",
    ],
    weak: [
      "The student should practise writing complete short emails.",
      "Important task points are missing or unclear.",
    ],
    critical: [
      "The writing is not clear enough for reliable A2 evaluation.",
      "The student needs basic writing practice before exam readiness.",
    ],
  },

  improvementPlan: [
    {
      id: "A2-WR-P01",
      title: "Practise email structure",
      focus: "Greeting, reason, answer, closing.",
    },
    {
      id: "A2-WR-P02",
      title: "Practise task points",
      focus: "Answer every bullet point in the task.",
    },
    {
      id: "A2-WR-P03",
      title: "Practise short clear sentences",
      focus: "One idea per sentence.",
    },
  ],
};