/**
 * AustriaPath B2 Speaking Knowledge
 * Version 1.0
 */

export const B2SpeakingKnowledge = {
  metadata: {
    id: "B2-SPEAKING",
    level: "B2",
    skill: "speaking",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Present a topic clearly.",
    "Discuss advantages and disadvantages.",
    "Describe and interpret a simple graphic.",
    "Defend a personal opinion with reasons.",
    "React to follow-up questions.",
  ],

  examinerChecks: [
    {
      id: "B2-SP-001",
      title: "Presentation",
      importance: "high",
      description: "Checks whether the student presents a topic in a structured way.",
    },
    {
      id: "B2-SP-002",
      title: "Discussion",
      importance: "high",
      description: "Checks whether the student argues and reacts.",
    },
    {
      id: "B2-SP-003",
      title: "Graphic Description",
      importance: "medium",
      description: "Checks description, comparison and interpretation.",
    },
    {
      id: "B2-SP-004",
      title: "Opinion and Reasons",
      importance: "high",
      description: "Checks whether the student supports opinion with reasons.",
    },
  ],

  expectedElements: [
    "Thema nennen",
    "kurze Struktur",
    "Vorteile",
    "Nachteile",
    "eigene Meinung",
    "Begründung",
    "Grafik beschreiben",
    "Vergleich",
  ],

  commonMistakes: [
    {
      id: "B2-SP-M01",
      title: "Only describes without analysis",
      linkedCheck: "B2-SP-003",
    },
    {
      id: "B2-SP-M02",
      title: "Opinion without support",
      linkedCheck: "B2-SP-004",
    },
    {
      id: "B2-SP-M03",
      title: "No clear presentation structure",
      linkedCheck: "B2-SP-001",
    },
  ],

  scoringRules: {
    excellent: { minScore: 85, description: "Clear B2 speaking with arguments and structure." },
    good: { minScore: 70, description: "Good communication with some weaknesses." },
    acceptable: { minScore: 55, description: "Understandable but not fully B2 developed." },
    weak: { minScore: 40, description: "Too short or too simple for B2." },
    critical: { minScore: 0, description: "Not sufficient for B2 speaking readiness." },
  },

  examinerFeedback: {
    excellent: ["The student presents and argues clearly at B2 level."],
    good: ["The student communicates well but needs more precision."],
    acceptable: ["The student needs more structure and stronger arguments."],
    weak: ["The student should practise presentation and discussion patterns."],
    critical: ["The speaking performance is not sufficient for B2 readiness."],
  },

  improvementPlan: [
    {
      id: "B2-SP-P01",
      title: "Practise presentation structure",
      focus: "Introduction, main points, conclusion.",
    },
    {
      id: "B2-SP-P02",
      title: "Practise discussion",
      focus: "Agree, disagree, give reasons.",
    },
    {
      id: "B2-SP-P03",
      title: "Practise graphic description",
      focus: "Describe, compare, interpret.",
    },
  ],
};