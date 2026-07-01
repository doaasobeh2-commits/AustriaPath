/**
 * AustriaPath B2 Listening Knowledge
 * Version 1.0
 */

export const B2ListeningKnowledge = {
  metadata: {
    id: "B2-LISTENING",
    level: "B2",
    skill: "listening",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand discussions.",
    "Recognize opinions and attitudes.",
    "Follow presentations.",
    "Understand implied meaning.",
    "Compare different speakers.",
  ],

  examinerChecks: [
    {
      id: "B2-LI-001",
      title: "Main Topic",
      importance: "high",
      description: "Identifies the overall topic.",
    },
    {
      id: "B2-LI-002",
      title: "Opinion Recognition",
      importance: "high",
      description: "Recognizes different speaker opinions.",
    },
    {
      id: "B2-LI-003",
      title: "Speaker Intention",
      importance: "medium",
      description: "Understands purpose and attitude.",
    },
    {
      id: "B2-LI-004",
      title: "Implicit Meaning",
      importance: "medium",
      description: "Recognizes ideas that are not stated directly.",
    },
  ],

  commonMistakes: [
    {
      id: "B2-LI-M01",
      title: "Confuses speakers",
      linkedCheck: "B2-LI-002",
    },
    {
      id: "B2-LI-M02",
      title: "Misses implied meaning",
      linkedCheck: "B2-LI-004",
    },
    {
      id: "B2-LI-M03",
      title: "Misses supporting arguments",
      linkedCheck: "B2-LI-003",
    },
  ],

  scoringRules: {
    excellent: { minScore: 85, description: "Excellent listening comprehension." },
    good: { minScore: 70, description: "Good understanding of discussions." },
    acceptable: { minScore: 55, description: "General meaning understood." },
    weak: { minScore: 40, description: "Important ideas are missed." },
    critical: { minScore: 0, description: "Listening level below B2." },
  },

  examinerFeedback: {
    excellent: ["The student understands complex spoken German."],
    good: ["The student understands most opinions correctly."],
    acceptable: ["The student understands the main topic but misses subtle details."],
    weak: ["The student should practise discussions and interviews."],
    critical: ["Listening performance is below B2 expectations."],
  },

  improvementPlan: [
    {
      id: "B2-LI-P01",
      title: "Practise discussions",
      focus: "Different speakers and opinions.",
    },
    {
      id: "B2-LI-P02",
      title: "Practise implied meaning",
      focus: "Understand ideas beyond the spoken words.",
    },
  ],
};