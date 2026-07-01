/**
 * AustriaPath A2 Listening Knowledge
 * Version 1.0
 */

export const A2ListeningKnowledge = {
  metadata: {
    id: "A2-LISTENING",
    level: "A2",
    skill: "listening",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand short everyday announcements.",
    "Recognize important details such as time, place, number and reason.",
    "Understand simple dialogues and messages.",
    "Identify the main information in slow and clear speech.",
    "React to practical information in daily situations.",
  ],

  examinerChecks: [
    {
      id: "A2-LI-001",
      title: "Main Message",
      importance: "high",
      description: "Checks whether the student understands the main point.",
    },
    {
      id: "A2-LI-002",
      title: "Key Details",
      importance: "high",
      description: "Checks time, place, numbers, dates and names.",
    },
    {
      id: "A2-LI-003",
      title: "Reason",
      importance: "medium",
      description: "Checks whether the student understands why something happens.",
    },
    {
      id: "A2-LI-004",
      title: "Action Required",
      importance: "medium",
      description: "Checks whether the student understands what should be done.",
    },
  ],

  expectedAudioTypes: [
    "Bahnhofsdurchsage",
    "Arzttermin",
    "Telefonansage",
    "Sprachkursinformation",
    "Supermarktangebot",
    "Verkehrsmeldung",
    "kurzer Dialog",
  ],

  commonMistakes: [
    {
      id: "A2-LI-M01",
      title: "Misses numbers",
      linkedCheck: "A2-LI-002",
    },
    {
      id: "A2-LI-M02",
      title: "Confuses time or date",
      linkedCheck: "A2-LI-002",
    },
    {
      id: "A2-LI-M03",
      title: "Understands words but not the main message",
      linkedCheck: "A2-LI-001",
    },
    {
      id: "A2-LI-M04",
      title: "Misses required action",
      linkedCheck: "A2-LI-004",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student understands main information and details reliably.",
    },
    good: {
      minScore: 70,
      description: "The student understands most A2 listening tasks.",
    },
    acceptable: {
      minScore: 55,
      description: "The student understands the main point but misses details.",
    },
    weak: {
      minScore: 40,
      description: "The student often misses important listening information.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot understand enough for A2 listening readiness.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student understands short listening tasks well.",
      "Important details are recognized correctly.",
    ],
    good: [
      "The student understands most simple listening situations.",
      "Some details such as numbers or times need more practice.",
    ],
    acceptable: [
      "The student understands the general message but misses details.",
      "Listening accuracy should be improved.",
    ],
    weak: [
      "The student should practise short announcements and phone messages.",
      "Important details are often missed.",
    ],
    critical: [
      "The listening performance is not stable enough for A2 exam readiness.",
      "The student needs basic listening practice.",
    ],
  },

  improvementPlan: [
    {
      id: "A2-LI-P01",
      title: "Practise numbers and times",
      focus: "Phone numbers, dates, times, prices.",
    },
    {
      id: "A2-LI-P02",
      title: "Practise announcements",
      focus: "Where? When? What changed?",
    },
    {
      id: "A2-LI-P03",
      title: "Practise short dialogues",
      focus: "Who speaks? What is the problem? What happens next?",
    },
  ],
};