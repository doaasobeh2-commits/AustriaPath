/**
 * AustriaPath A2 Grammar Knowledge
 * Version 2.0
 *
 * Structured examiner knowledge for A2 grammar evaluation.
 */

export const A2GrammarKnowledge = {
  metadata: {
    id: "A2-GRAMMAR",
    level: "A2",
    skill: "grammar",
    version: "2.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Use simple complete sentences.",
    "Communicate basic information clearly.",
    "Use present tense and simple past/perfect forms.",
    "Use basic connectors such as und, aber and weil.",
    "Make understandable sentences even with some mistakes.",
  ],

  examinerChecks: [
    {
      id: "A2-GR-001",
      title: "Verb Position",
      importance: "high",
      description: "Checks whether the verb appears in an understandable position.",
    },
    {
      id: "A2-GR-002",
      title: "Complete Sentence",
      importance: "high",
      description: "Checks whether the student produces complete sentences.",
    },
    {
      id: "A2-GR-003",
      title: "Basic Connectors",
      importance: "medium",
      description: "Checks use of und, aber, weil, deshalb.",
    },
    {
      id: "A2-GR-004",
      title: "Article Use",
      importance: "medium",
      description: "Checks basic use of der, die, das, ein, eine.",
    },
    {
      id: "A2-GR-005",
      title: "Akkusativ and Dativ",
      importance: "medium",
      description: "Checks simple case usage without expecting perfection.",
    },
    {
      id: "A2-GR-006",
      title: "Modal Verbs",
      importance: "medium",
      description: "Checks basic use of können, müssen, wollen, dürfen.",
    },
  ],

  expectedStructures: [
    "Präsens",
    "Perfekt",
    "Modalverben",
    "Akkusativ",
    "Dativ",
    "Imperativ",
    "und",
    "aber",
    "oder",
    "weil",
    "dass",
  ],

  commonMistakes: [
    {
      id: "A2-GR-M01",
      title: "Wrong verb position",
      linkedCheck: "A2-GR-001",
    },
    {
      id: "A2-GR-M02",
      title: "Missing verb",
      linkedCheck: "A2-GR-002",
    },
    {
      id: "A2-GR-M03",
      title: "Article mistakes",
      linkedCheck: "A2-GR-004",
    },
    {
      id: "A2-GR-M04",
      title: "Akkusativ/Dativ confusion",
      linkedCheck: "A2-GR-005",
    },
    {
      id: "A2-GR-M05",
      title: "Very short sentences only",
      linkedCheck: "A2-GR-002",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "Clear A2 grammar with several correct structures.",
    },
    good: {
      minScore: 70,
      description: "Mostly understandable grammar with some mistakes.",
    },
    acceptable: {
      minScore: 55,
      description: "Basic communication is possible despite frequent mistakes.",
    },
    weak: {
      minScore: 40,
      description: "Many grammar problems make the answer limited.",
    },
    critical: {
      minScore: 0,
      description: "Grammar prevents clear communication.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student uses simple A2 grammar clearly.",
      "The answer contains understandable and mostly complete sentences.",
    ],
    good: [
      "The student communicates well, although some grammar mistakes remain.",
      "Basic sentence structure is present and understandable.",
    ],
    acceptable: [
      "The student can communicate basic ideas, but grammar needs improvement.",
      "The answer is understandable, but sentence structure is still unstable.",
    ],
    weak: [
      "Grammar mistakes often make the answer difficult to understand.",
      "The student should practise word order and complete sentences.",
    ],
    critical: [
      "The answer is not grammatically clear enough for reliable evaluation.",
      "More basic sentence training is needed before exam readiness.",
    ],
  },

  improvementPlan: [
    {
      id: "A2-GR-P01",
      title: "Practise verb position",
      focus: "Verb in position 2 in main clauses.",
    },
    {
      id: "A2-GR-P02",
      title: "Practise complete sentences",
      focus: "Subject + verb + object.",
    },
    {
      id: "A2-GR-P03",
      title: "Practise articles",
      focus: "der, die, das, ein, eine.",
    },
    {
      id: "A2-GR-P04",
      title: "Practise simple connectors",
      focus: "und, aber, weil, deshalb.",
    },
  ],
};