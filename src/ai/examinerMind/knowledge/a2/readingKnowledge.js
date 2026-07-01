/**
 * AustriaPath A2 Reading Knowledge
 * Version 1.0
 */

export const A2ReadingKnowledge = {
  metadata: {
    id: "A2-READING",
    level: "A2",
    skill: "reading",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand short everyday texts.",
    "Find important information such as time, place, price and contact details.",
    "Match simple situations with suitable texts.",
    "Understand basic notices, messages and emails.",
    "Recognize the main meaning of a short text.",
  ],

  examinerChecks: [
    {
      id: "A2-RD-001",
      title: "Main Idea",
      importance: "high",
      description: "Checks whether the student understands the general meaning.",
    },
    {
      id: "A2-RD-002",
      title: "Important Details",
      importance: "high",
      description: "Checks time, place, date, price, phone number and names.",
    },
    {
      id: "A2-RD-003",
      title: "Text Matching",
      importance: "medium",
      description: "Checks whether a text matches a simple situation.",
    },
    {
      id: "A2-RD-004",
      title: "Everyday Vocabulary",
      importance: "medium",
      description: "Checks recognition of common daily-life words.",
    },
  ],

  expectedTextTypes: [
    "E-Mail",
    "SMS",
    "Anzeige",
    "Aushang",
    "Einladung",
    "Informationstext",
    "kurze Mitteilung",
  ],

  commonMistakes: [
    {
      id: "A2-RD-M01",
      title: "Confuses similar details",
      linkedCheck: "A2-RD-002",
    },
    {
      id: "A2-RD-M02",
      title: "Misses time or place",
      linkedCheck: "A2-RD-002",
    },
    {
      id: "A2-RD-M03",
      title: "Matches by one keyword only",
      linkedCheck: "A2-RD-003",
    },
    {
      id: "A2-RD-M04",
      title: "Does not understand main idea",
      linkedCheck: "A2-RD-001",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student understands main ideas and details reliably.",
    },
    good: {
      minScore: 70,
      description: "The student understands most A2 reading tasks.",
    },
    acceptable: {
      minScore: 55,
      description: "The student understands basic information but misses details.",
    },
    weak: {
      minScore: 40,
      description: "The student often misses important details.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot understand enough of the text.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student understands short everyday texts well.",
      "Important details are identified correctly.",
    ],
    good: [
      "The student understands most simple texts.",
      "Some details still need more careful reading.",
    ],
    acceptable: [
      "The student understands the main idea but misses some important details.",
      "Reading accuracy should be improved.",
    ],
    weak: [
      "The student should practise reading short notices and emails.",
      "Important information such as time and place is often missed.",
    ],
    critical: [
      "The reading result is not stable enough for A2 exam readiness.",
      "The student needs basic reading practice.",
    ],
  },

  improvementPlan: [
    {
      id: "A2-RD-P01",
      title: "Practise detail search",
      focus: "Time, date, place, phone number, price.",
    },
    {
      id: "A2-RD-P02",
      title: "Practise short emails",
      focus: "Who writes? Why? What should the reader do?",
    },
    {
      id: "A2-RD-P03",
      title: "Practise matching tasks",
      focus: "Do not choose only by one keyword.",
    },
  ],
};