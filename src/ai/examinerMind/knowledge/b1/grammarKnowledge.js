/**
 * AustriaPath B1 Grammar Knowledge
 * Version 1.0
 */

export const B1GrammarKnowledge = {
  metadata: {
    id: "B1-GRAMMAR",
    level: "B1",
    skill: "grammar",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Use connected sentences with reasons and explanations.",
    "Use subordinate clauses with weil, dass, wenn.",
    "Use past tense forms in everyday communication.",
    "Use basic Akkusativ and Dativ more reliably than A2.",
    "Express opinions and experiences understandably.",
  ],

  examinerChecks: [
    {
      id: "B1-GR-001",
      title: "Subordinate Clauses",
      importance: "high",
      description: "Checks use of weil, dass, wenn with understandable word order.",
    },
    {
      id: "B1-GR-002",
      title: "Verb Position",
      importance: "high",
      description: "Checks sentence structure in main and subordinate clauses.",
    },
    {
      id: "B1-GR-003",
      title: "Tense Use",
      importance: "medium",
      description: "Checks Präsens, Perfekt and simple past references.",
    },
    {
      id: "B1-GR-004",
      title: "Cases",
      importance: "medium",
      description: "Checks basic Akkusativ and Dativ use.",
    },
    {
      id: "B1-GR-005",
      title: "Connectors",
      importance: "high",
      description: "Checks weil, deshalb, trotzdem, aber, denn.",
    },
  ],

  expectedStructures: [
    "Präsens",
    "Perfekt",
    "Modalverben",
    "Nebensätze",
    "weil",
    "dass",
    "wenn",
    "deshalb",
    "trotzdem",
    "Akkusativ",
    "Dativ",
  ],

  commonMistakes: [
    {
      id: "B1-GR-M01",
      title: "Verb not at the end after weil/dass",
      linkedCheck: "B1-GR-001",
    },
    {
      id: "B1-GR-M02",
      title: "Only simple main clauses",
      linkedCheck: "B1-GR-002",
    },
    {
      id: "B1-GR-M03",
      title: "Weak use of reasons",
      linkedCheck: "B1-GR-005",
    },
    {
      id: "B1-GR-M04",
      title: "Akkusativ/Dativ instability",
      linkedCheck: "B1-GR-004",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "Clear B1 grammar with connected sentences and reasons.",
    },
    good: {
      minScore: 70,
      description: "Mostly understandable B1 grammar with some mistakes.",
    },
    acceptable: {
      minScore: 55,
      description: "Communication is possible, but B1 structures are unstable.",
    },
    weak: {
      minScore: 40,
      description: "Grammar remains closer to A2 and limits expression.",
    },
    critical: {
      minScore: 0,
      description: "Grammar prevents reliable B1 evaluation.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student uses B1 grammar structures clearly.",
      "Reasons and connected sentences are present.",
    ],
    good: [
      "The student communicates at B1 level with some grammar mistakes.",
      "Sentence connection is mostly understandable.",
    ],
    acceptable: [
      "The answer is understandable, but B1 grammar needs more stability.",
      "More practice with subordinate clauses is recommended.",
    ],
    weak: [
      "The student mostly uses short A2-style sentences.",
      "B1 sentence structure is not stable enough yet.",
    ],
    critical: [
      "Grammar is too limited for reliable B1 performance.",
      "Basic sentence structure should be trained again.",
    ],
  },

  improvementPlan: [
    {
      id: "B1-GR-P01",
      title: "Practise weil and dass clauses",
      focus: "Verb position at the end.",
    },
    {
      id: "B1-GR-P02",
      title: "Practise giving reasons",
      focus: "weil, denn, deshalb.",
    },
    {
      id: "B1-GR-P03",
      title: "Practise Dativ and Akkusativ",
      focus: "Common verbs and prepositions.",
    },
  ],
};