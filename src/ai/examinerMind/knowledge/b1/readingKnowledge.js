/**
 * AustriaPath B1 Reading Knowledge
 * Version 1.0
 */

export const B1ReadingKnowledge = {
  metadata: {
    id: "B1-READING",
    level: "B1",
    skill: "reading",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand longer everyday texts.",
    "Recognize main ideas and important details.",
    "Match situations with suitable advertisements or brochures.",
    "Understand opinions, reasons and text intention.",
    "Distinguish similar keywords and meanings.",
  ],

  examinerChecks: [
    {
      id: "B1-RD-001",
      title: "Main Idea",
      importance: "high",
      description: "Checks whether the student understands the main meaning.",
    },
    {
      id: "B1-RD-002",
      title: "Detail Recognition",
      importance: "high",
      description: "Checks important details such as time, condition, place and purpose.",
    },
    {
      id: "B1-RD-003",
      title: "Brochure Matching",
      importance: "high",
      description: "Checks whether the student matches situations with the correct advertisement.",
    },
    {
      id: "B1-RD-004",
      title: "Inference",
      importance: "medium",
      description: "Checks whether the student understands meaning beyond one keyword.",
    },
  ],

  expectedTextTypes: [
    "E-Mail",
    "Anzeige",
    "Broschüre",
    "Informationstext",
    "Forumbeitrag",
    "kurzer Artikel",
    "Mitteilung",
  ],

  commonMistakes: [
    {
      id: "B1-RD-M01",
      title: "Chooses answer by one keyword only",
      linkedCheck: "B1-RD-003",
    },
    {
      id: "B1-RD-M02",
      title: "Misses conditions or exceptions",
      linkedCheck: "B1-RD-002",
    },
    {
      id: "B1-RD-M03",
      title: "Confuses similar advertisements",
      linkedCheck: "B1-RD-003",
    },
    {
      id: "B1-RD-M04",
      title: "Does not understand the author's intention",
      linkedCheck: "B1-RD-004",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student understands main ideas, details and implied meaning.",
    },
    good: {
      minScore: 70,
      description: "The student understands most B1 reading tasks.",
    },
    acceptable: {
      minScore: 55,
      description: "The student understands the main idea but misses some details.",
    },
    weak: {
      minScore: 40,
      description: "The student often chooses answers by keywords only.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot understand enough for B1 reading readiness.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student understands B1 reading texts well.",
      "Details and text purpose are recognized correctly.",
    ],
    good: [
      "The student understands most texts and details.",
      "Some similar options still require more careful reading.",
    ],
    acceptable: [
      "The main meaning is understood, but details need improvement.",
      "The student should avoid choosing by one keyword only.",
    ],
    weak: [
      "The student should practise brochure matching and detailed reading.",
      "Similar keywords often cause wrong answers.",
    ],
    critical: [
      "The reading performance is not stable enough for B1 readiness.",
      "Basic reading strategies should be trained.",
    ],
  },

  improvementPlan: [
    {
      id: "B1-RD-P01",
      title: "Practise brochure matching",
      focus: "Compare details, not only keywords.",
    },
    {
      id: "B1-RD-P02",
      title: "Practise condition words",
      focus: "nur, außer, mindestens, spätestens, kostenlos.",
    },
    {
      id: "B1-RD-P03",
      title: "Practise main idea recognition",
      focus: "What is the text mainly about?",
    },
  ],
};