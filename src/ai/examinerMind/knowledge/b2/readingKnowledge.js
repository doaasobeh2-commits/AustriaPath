/**
 * AustriaPath B2 Reading Knowledge
 * Version 1.0
 */

export const B2ReadingKnowledge = {
  metadata: {
    id: "B2-READING",
    level: "B2",
    skill: "reading",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand complex texts.",
    "Recognize arguments and opinions.",
    "Identify author's intention.",
    "Compare viewpoints.",
    "Draw logical conclusions.",
  ],

  examinerChecks: [
    {
      id: "B2-RD-001",
      title: "Main Argument",
      importance: "high",
      description: "Recognizes the central argument of the text.",
    },
    {
      id: "B2-RD-002",
      title: "Supporting Details",
      importance: "high",
      description: "Identifies important evidence and examples.",
    },
    {
      id: "B2-RD-003",
      title: "Author Intention",
      importance: "medium",
      description: "Understands why the author wrote the text.",
    },
    {
      id: "B2-RD-004",
      title: "Comparison",
      importance: "medium",
      description: "Compares different viewpoints or situations.",
    },
  ],

  commonMistakes: [
    {
      id: "B2-RD-M01",
      title: "Focuses only on keywords",
      linkedCheck: "B2-RD-001",
    },
    {
      id: "B2-RD-M02",
      title: "Misses hidden meaning",
      linkedCheck: "B2-RD-003",
    },
    {
      id: "B2-RD-M03",
      title: "Cannot compare arguments",
      linkedCheck: "B2-RD-004",
    },
  ],

  scoringRules: {
    excellent: { minScore: 85, description: "Excellent text understanding." },
    good: { minScore: 70, description: "Good understanding with minor weaknesses." },
    acceptable: { minScore: 55, description: "Main ideas understood." },
    weak: { minScore: 40, description: "Important arguments are missed." },
    critical: { minScore: 0, description: "Reading level below B2." },
  },

  examinerFeedback: {
    excellent: ["The student understands complex written information."],
    good: ["The student understands most arguments correctly."],
    acceptable: ["The student understands the general meaning but misses deeper ideas."],
    weak: ["The student should practise analysing written arguments."],
    critical: ["Reading performance is below B2 expectations."],
  },

  improvementPlan: [
    {
      id: "B2-RD-P01",
      title: "Practise identifying arguments",
      focus: "Claim, reason, evidence.",
    },
    {
      id: "B2-RD-P02",
      title: "Practise comparing viewpoints",
      focus: "Similarities and differences.",
    },
  ],
};