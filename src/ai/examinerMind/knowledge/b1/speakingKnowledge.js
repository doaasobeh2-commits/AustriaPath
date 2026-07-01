/**
 * AustriaPath B1 Speaking Knowledge
 * Version 1.0
 */

export const B1SpeakingKnowledge = {
  metadata: {
    id: "B1-SPEAKING",
    level: "B1",
    skill: "speaking",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Introduce oneself with details.",
    "Describe a picture and express opinion.",
    "Give personal experience related to the topic.",
    "Plan something together with another person.",
    "Answer follow-up questions with reasons.",
  ],

  examinerChecks: [
    {
      id: "B1-SP-001",
      title: "Self Introduction",
      importance: "medium",
      description: "Checks whether the student introduces themselves clearly.",
    },
    {
      id: "B1-SP-002",
      title: "Picture Description",
      importance: "high",
      description: "Checks description, interpretation and opinion.",
    },
    {
      id: "B1-SP-003",
      title: "Planning",
      importance: "high",
      description: "Checks suggestions, agreement, alternatives and decisions.",
    },
    {
      id: "B1-SP-004",
      title: "Reasons and Experience",
      importance: "high",
      description: "Checks whether answers include reasons or personal examples.",
    },
    {
      id: "B1-SP-005",
      title: "Interaction",
      importance: "medium",
      description: "Checks whether the student can react and continue conversation.",
    },
  ],

  expectedElements: [
    "Vorstellung",
    "Bildbeschreibung",
    "Meinung",
    "Erfahrung",
    "Begründung",
    "Vorschlag",
    "Zustimmung",
    "Alternative",
    "Entscheidung",
  ],

  commonMistakes: [
    {
      id: "B1-SP-M01",
      title: "Only describes without opinion",
      linkedCheck: "B1-SP-002",
    },
    {
      id: "B1-SP-M02",
      title: "No reason given",
      linkedCheck: "B1-SP-004",
    },
    {
      id: "B1-SP-M03",
      title: "Cannot continue planning",
      linkedCheck: "B1-SP-003",
    },
    {
      id: "B1-SP-M04",
      title: "Answers too shortly",
      linkedCheck: "B1-SP-005",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student speaks clearly, gives reasons and interacts well.",
    },
    good: {
      minScore: 70,
      description: "The student communicates well with some mistakes.",
    },
    acceptable: {
      minScore: 55,
      description: "Basic B1 communication is possible but limited.",
    },
    weak: {
      minScore: 40,
      description: "Answers are too short or lack reasons.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot communicate enough for B1 speaking.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student gives clear answers with reasons and examples.",
      "The planning task is handled actively.",
    ],
    good: [
      "The student communicates well and can answer follow-up questions.",
      "Some fluency or grammar problems remain.",
    ],
    acceptable: [
      "The student can communicate, but answers need more detail.",
      "More reasons and personal examples are needed.",
    ],
    weak: [
      "The student often answers too shortly.",
      "Planning and opinion tasks need more practice.",
    ],
    critical: [
      "The speaking performance is not sufficient for B1 readiness.",
      "Basic speaking structure should be trained.",
    ],
  },

  improvementPlan: [
    {
      id: "B1-SP-P01",
      title: "Practise opinion answers",
      focus: "Ich finde ..., weil ...",
    },
    {
      id: "B1-SP-P02",
      title: "Practise planning language",
      focus: "Vorschläge, Zustimmung, Alternativen.",
    },
    {
      id: "B1-SP-P03",
      title: "Practise picture description",
      focus: "Beschreibung, Meinung, Erfahrung.",
    },
  ],
};