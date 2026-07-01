/**
 * AustriaPath B1 Writing Knowledge
 * Version 1.0
 */

export const B1WritingKnowledge = {
  metadata: {
    id: "B1-WRITING",
    level: "B1",
    skill: "writing",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Write a clear email or short text.",
    "Answer all task points completely.",
    "Give reasons and personal experience when required.",
    "Use suitable greeting and closing.",
    "Use connected sentences and understandable structure.",
  ],

  examinerChecks: [
    {
      id: "B1-WR-001",
      title: "Task Completion",
      importance: "high",
      description: "Checks whether all required points are answered.",
    },
    {
      id: "B1-WR-002",
      title: "Reason and Opinion",
      importance: "high",
      description: "Checks whether the student gives reasons or opinions.",
    },
    {
      id: "B1-WR-003",
      title: "Text Structure",
      importance: "high",
      description: "Checks greeting, body, logical order and closing.",
    },
    {
      id: "B1-WR-004",
      title: "Language Accuracy",
      importance: "medium",
      description: "Checks grammar and sentence structure.",
    },
    {
      id: "B1-WR-005",
      title: "Appropriate Length",
      importance: "medium",
      description: "Checks whether the answer is developed enough.",
    },
  ],

  expectedElements: [
    "Anrede",
    "Einleitung",
    "Antwort auf alle Punkte",
    "Begründung",
    "persönliche Erfahrung",
    "Schluss",
    "Grußformel",
  ],

  commonMistakes: [
    {
      id: "B1-WR-M01",
      title: "Missing task point",
      linkedCheck: "B1-WR-001",
    },
    {
      id: "B1-WR-M02",
      title: "Opinion without reason",
      linkedCheck: "B1-WR-002",
    },
    {
      id: "B1-WR-M03",
      title: "No clear structure",
      linkedCheck: "B1-WR-003",
    },
    {
      id: "B1-WR-M04",
      title: "Too short for B1",
      linkedCheck: "B1-WR-005",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "All task points are answered with clear reasons and structure.",
    },
    good: {
      minScore: 70,
      description: "The writing is clear and mostly complete.",
    },
    acceptable: {
      minScore: 55,
      description: "The main message is understandable but incomplete or simple.",
    },
    weak: {
      minScore: 40,
      description: "Several task points or reasons are missing.",
    },
    critical: {
      minScore: 0,
      description: "The writing does not fulfill the B1 task.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The text is complete and well structured for B1.",
      "The student gives reasons and answers the task clearly.",
    ],
    good: [
      "The writing is understandable and mostly complete.",
      "Some grammar or structure mistakes remain.",
    ],
    acceptable: [
      "The message is understandable, but reasons or details are limited.",
      "The student should develop task points more clearly.",
    ],
    weak: [
      "Important task points are missing.",
      "The student needs more practice with B1 email structure.",
    ],
    critical: [
      "The text is not sufficient for B1 writing readiness.",
      "Basic writing structure should be practised again.",
    ],
  },

  improvementPlan: [
    {
      id: "B1-WR-P01",
      title: "Practise answering all task points",
      focus: "Read every bullet point and answer it.",
    },
    {
      id: "B1-WR-P02",
      title: "Practise reasons",
      focus: "Use weil, denn, deshalb.",
    },
    {
      id: "B1-WR-P03",
      title: "Practise B1 email structure",
      focus: "Greeting, introduction, details, closing.",
    },
  ],
  emailRules: {
    greeting: {
      accepted: [
        "sehr geehrte",
        "sehr geehrter",
        "guten tag",
        "liebe frau",
        "lieber herr",
      ],
      informal: [
        "hallo",
        "hi",
        "servus",
      ],
      weaknessIfInformal: "Begrüßung zu informell",
      weaknessIfMissing: "Begrüßung fehlt",
      strengthIfAccepted: "Passende Begrüßung",
    },

    closing: {
      accepted: [
        "mit freundlichen grüßen",
        "freundliche grüße",
        "vielen dank",
        "danke im voraus",
      ],
      informal: [
        "lg",
        "liebe grüße",
        "grüße",
      ],
      weaknessIfInformal: "Abschluss zu informell",
      weaknessIfMissing: "Abschluss fehlt",
      strengthIfAccepted: "Passender Abschluss",
    },

    taskSignals: {
      request: ["bitte", "könnten", "kannst", "möchte", "ich möchte", "frage"],
      reason: ["weil", "denn", "deshalb", "wegen", "da"],
      strengthIfRequest: "Aufgabe bearbeitet",
      strengthIfReason: "Begründung vorhanden",
      weaknessIfNoRequest: "Aufgabe unvollständig",
      weaknessIfNoReason: "Begründung fehlt",
    },

    minimumWords: 40,
    weaknessIfTooShort: "Text zu kurz für B1",
    strengthIfEnoughLength: "Ausreichende Textlänge",
  },
};