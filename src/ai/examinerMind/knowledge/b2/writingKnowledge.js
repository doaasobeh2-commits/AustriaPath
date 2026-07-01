/**
 * AustriaPath B2 Writing Knowledge
 * Version 1.0
 */

export const B2WritingKnowledge = {
  metadata: {
    id: "B2-WRITING",
    level: "B2",
    skill: "writing",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Write a structured formal email or opinion text.",
    "Present arguments clearly.",
    "Compare advantages and disadvantages.",
    "Give a justified personal opinion.",
    "Use coherent paragraphs.",
  ],

  examinerChecks: [
    {
      id: "B2-WR-001",
      title: "Structure",
      importance: "high",
      description: "Checks introduction, main points and conclusion.",
    },
    {
      id: "B2-WR-002",
      title: "Argumentation",
      importance: "high",
      description: "Checks whether the student gives clear arguments and reasons.",
    },
    {
      id: "B2-WR-003",
      title: "Comparison",
      importance: "medium",
      description: "Checks advantages, disadvantages or alternatives.",
    },
    {
      id: "B2-WR-004",
      title: "Formal Style",
      importance: "medium",
      description: "Checks whether tone and phrasing fit the task.",
    },
  ],

  expectedElements: [
    "Einleitung",
    "Argumente",
    "Begründung",
    "Vergleich",
    "eigene Meinung",
    "Schluss",
  ],

  commonMistakes: [
    {
      id: "B2-WR-M01",
      title: "Opinion without argument",
      linkedCheck: "B2-WR-002",
    },
    {
      id: "B2-WR-M02",
      title: "No clear structure",
      linkedCheck: "B2-WR-001",
    },
    {
      id: "B2-WR-M03",
      title: "Only simple B1 language",
      linkedCheck: "B2-WR-004",
    },
  ],

  scoringRules: {
    excellent: { minScore: 85, description: "Clear B2 writing with structure and arguments." },
    good: { minScore: 70, description: "Good writing with some weak argument details." },
    acceptable: { minScore: 55, description: "Understandable but not fully developed." },
    weak: { minScore: 40, description: "Too simple or incomplete for B2." },
    critical: { minScore: 0, description: "Does not fulfill B2 writing task." },
  },

  examinerFeedback: {
    excellent: ["The text is structured and argumentation is clear."],
    good: ["The text is understandable and mostly B2 appropriate."],
    acceptable: ["The text needs stronger arguments and clearer structure."],
    weak: ["The student should practise B2 opinion writing."],
    critical: ["The writing is not sufficient for B2 readiness."],
  },

  improvementPlan: [
    {
      id: "B2-WR-P01",
      title: "Practise argument structure",
      focus: "Claim + reason + example.",
    },
    {
      id: "B2-WR-P02",
      title: "Practise comparison",
      focus: "Vorteile, Nachteile, Alternativen.",
    },
  ],
};