/**
 * AustriaPath A2 Speaking Knowledge
 * Version 1.0
 */

export const A2SpeakingKnowledge = {
  metadata: {
    id: "A2-SPEAKING",
    level: "A2",
    skill: "speaking",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Introduce oneself with simple information.",
    "Describe a picture with simple sentences.",
    "Answer simple follow-up questions.",
    "Take part in a short everyday dialogue.",
    "Communicate basic needs and personal information.",
  ],

  examinerChecks: [
    {
      id: "A2-SP-001",
      title: "Self Introduction",
      importance: "high",
      description: "Checks name, origin, residence, family, work and hobbies.",
    },
    {
      id: "A2-SP-002",
      title: "Picture Description",
      importance: "high",
      description: "Checks whether the student can describe people, place and actions.",
    },
    {
      id: "A2-SP-003",
      title: "Simple Answers",
      importance: "high",
      description: "Checks whether answers are understandable and relevant.",
    },
    {
      id: "A2-SP-004",
      title: "Everyday Dialogue",
      importance: "medium",
      description: "Checks simple asking and answering in practical situations.",
    },
    {
      id: "A2-SP-005",
      title: "Fluency Basics",
      importance: "medium",
      description: "Checks whether the student can speak in short connected phrases.",
    },
  ],

  expectedElements: [
    "Name",
    "Herkunft",
    "Wohnort",
    "Familie",
    "Arbeit oder Kurs",
    "Hobbys",
    "Ort im Bild",
    "Personen im Bild",
    "Aktivitäten im Bild",
  ],

  commonMistakes: [
    {
      id: "A2-SP-M01",
      title: "Only one-word answers",
      linkedCheck: "A2-SP-003",
    },
    {
      id: "A2-SP-M02",
      title: "Picture not described clearly",
      linkedCheck: "A2-SP-002",
    },
    {
      id: "A2-SP-M03",
      title: "Missing personal information",
      linkedCheck: "A2-SP-001",
    },
    {
      id: "A2-SP-M04",
      title: "Cannot continue dialogue",
      linkedCheck: "A2-SP-004",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student speaks clearly in simple A2 sentences.",
    },
    good: {
      minScore: 70,
      description: "The student communicates well with some pauses and mistakes.",
    },
    acceptable: {
      minScore: 55,
      description: "Basic communication is possible with support.",
    },
    weak: {
      minScore: 40,
      description: "The student gives very short or unclear answers.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot communicate enough for A2 speaking.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student can introduce themselves and answer simple questions clearly.",
      "The picture description is understandable for A2.",
    ],
    good: [
      "The student communicates basic ideas well.",
      "Some grammar mistakes remain, but communication is possible.",
    ],
    acceptable: [
      "The student can answer simple questions but needs more complete sentences.",
      "The student should practise speaking longer answers.",
    ],
    weak: [
      "The student often answers too shortly.",
      "More practice with self-introduction and picture description is needed.",
    ],
    critical: [
      "The speaking performance is not clear enough for A2 readiness.",
      "The student needs basic oral practice before exam simulation.",
    ],
  },

  improvementPlan: [
    {
      id: "A2-SP-P01",
      title: "Practise self introduction",
      focus: "Name, country, city, family, work, hobbies.",
    },
    {
      id: "A2-SP-P02",
      title: "Practise picture description",
      focus: "Who? Where? What are they doing?",
    },
    {
      id: "A2-SP-P03",
      title: "Practise full answers",
      focus: "Answer with complete short sentences.",
    },
  ],
};