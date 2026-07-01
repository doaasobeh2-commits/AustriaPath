/**
 * AustriaPath B2 Grammar Knowledge
 * Version 1.0
 */

export const B2GrammarKnowledge = {
  metadata: {
    id: "B2-GRAMMAR",
    level: "B2",
    skill: "grammar",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Use varied sentence structures.",
    "Express arguments, comparisons and conclusions clearly.",
    "Use subordinate clauses and connectors reliably.",
    "Maintain understandable accuracy in longer answers.",
  ],

  examinerChecks: [
    {
      id: "B2-GR-001",
      title: "Complex Sentence Structure",
      importance: "high",
      description: "Checks whether the student can use connected and varied sentences.",
    },
    {
      id: "B2-GR-002",
      title: "Argument Connectors",
      importance: "high",
      description: "Checks use of connectors such as außerdem, trotzdem, deshalb, einerseits, andererseits.",
    },
    {
      id: "B2-GR-003",
      title: "Accuracy",
      importance: "medium",
      description: "Checks whether mistakes do not disturb communication.",
    },
  ],

  expectedStructures: [
    "Nebensätze",
    "Relativsätze",
    "Konjunktoren",
    "Vergleiche",
    "Passiv basic",
    "Infinitiv mit zu",
  ],

  commonMistakes: [
    {
      id: "B2-GR-M01",
      title: "Only B1-style simple sentences",
      linkedCheck: "B2-GR-001",
    },
    {
      id: "B2-GR-M02",
      title: "Weak connectors for argumentation",
      linkedCheck: "B2-GR-002",
    },
    {
      id: "B2-GR-M03",
      title: "Mistakes disturb clarity",
      linkedCheck: "B2-GR-003",
    },
  ],

  scoringRules: {
    excellent: { minScore: 85, description: "Clear B2 grammar with varied structure." },
    good: { minScore: 70, description: "Mostly B2-level grammar with some mistakes." },
    acceptable: { minScore: 55, description: "Understandable but closer to B1 in structure." },
    weak: { minScore: 40, description: "Grammar is too simple for stable B2." },
    critical: { minScore: 0, description: "Grammar prevents B2 evaluation." },
  },

  examinerFeedback: {
    excellent: ["The student uses varied and connected B2 structures."],
    good: ["The answer is mostly clear with some grammar weaknesses."],
    acceptable: ["The answer is understandable but needs more B2-level structure."],
    weak: ["The student should practise connectors and complex sentences."],
    critical: ["The grammar is not sufficient for B2 readiness."],
  },

  improvementPlan: [
    {
      id: "B2-GR-P01",
      title: "Practise argument connectors",
      focus: "einerseits, andererseits, trotzdem, außerdem, daher.",
    },
    {
      id: "B2-GR-P02",
      title: "Practise longer sentence structure",
      focus: "Main clause + subordinate clause + conclusion.",
    },
  ],
};