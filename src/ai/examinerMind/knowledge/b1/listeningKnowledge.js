/**
 * AustriaPath B1 Listening Knowledge
 * Version 1.0
 */

export const B1ListeningKnowledge = {
  metadata: {
    id: "B1-LISTENING",
    level: "B1",
    skill: "listening",
    version: "1.0",
    examSystem: "OEIF",
  },

  objectives: [
    "Understand everyday announcements and messages.",
    "Recognize important details such as time, reason, change and action.",
    "Understand dialogues and practical information.",
    "Understand different opinions on one topic.",
    "Identify speaker attitude and intention.",
  ],

  examinerChecks: [
    {
      id: "B1-LI-001",
      title: "Main Message",
      importance: "high",
      description: "Checks whether the student understands the main message.",
    },
    {
      id: "B1-LI-002",
      title: "Important Details",
      importance: "high",
      description: "Checks time, place, reason, platform, room, number and action.",
    },
    {
      id: "B1-LI-003",
      title: "Opinion Recognition",
      importance: "high",
      description: "Checks whether the student recognizes speaker opinions.",
    },
    {
      id: "B1-LI-004",
      title: "Speaker Intention",
      importance: "medium",
      description: "Checks whether the student understands what the speaker wants.",
    },
  ],

  expectedAudioTypes: [
    "Durchsage",
    "Telefonansage",
    "Dialog",
    "Voicemail",
    "Kursinformation",
    "Verkehrsmeldung",
    "Meinungsbeitrag",
    "mehrere Sprecher",
  ],

  commonMistakes: [
    {
      id: "B1-LI-M01",
      title: "Misses reason for change",
      linkedCheck: "B1-LI-002",
    },
    {
      id: "B1-LI-M02",
      title: "Confuses speaker opinions",
      linkedCheck: "B1-LI-003",
    },
    {
      id: "B1-LI-M03",
      title: "Understands words but not intention",
      linkedCheck: "B1-LI-004",
    },
    {
      id: "B1-LI-M04",
      title: "Misses important numbers or times",
      linkedCheck: "B1-LI-002",
    },
  ],

  scoringRules: {
    excellent: {
      minScore: 85,
      description: "The student understands main information, details and opinions.",
    },
    good: {
      minScore: 70,
      description: "The student understands most B1 listening tasks.",
    },
    acceptable: {
      minScore: 55,
      description: "The student understands the main point but misses details or opinions.",
    },
    weak: {
      minScore: 40,
      description: "The student often misses key information.",
    },
    critical: {
      minScore: 0,
      description: "The student cannot understand enough for B1 listening readiness.",
    },
  },

  examinerFeedback: {
    excellent: [
      "The student understands B1 listening tasks well.",
      "Important details and opinions are recognized correctly.",
    ],
    good: [
      "The student understands most listening situations.",
      "Some details such as reasons or speaker opinions need more practice.",
    ],
    acceptable: [
      "The main message is understood, but important details are sometimes missed.",
      "The student should practise listening for reasons and opinions.",
    ],
    weak: [
      "The student should practise announcements, dialogues and opinion sections.",
      "Important details are often missed.",
    ],
    critical: [
      "The listening performance is not stable enough for B1 readiness.",
      "Basic listening strategies should be trained.",
    ],
  },

  improvementPlan: [
    {
      id: "B1-LI-P01",
      title: "Practise opinion listening",
      focus: "Who thinks what and why?",
    },
    {
      id: "B1-LI-P02",
      title: "Practise details",
      focus: "Time, place, room, platform, number, reason.",
    },
    {
      id: "B1-LI-P03",
      title: "Practise speaker intention",
      focus: "What does the speaker want the listener to do?",
    },
  ],
};