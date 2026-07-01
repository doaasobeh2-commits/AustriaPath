/**
 * AustriaPath ÖIF Exam Structure
 * Version: 1.1
 *
 * Central exam map for A2, B1 and B2.
 */

export const ExamStructure = {
  OEIF: {
    A2: {
      level: "A2",
      goal: "Basic communication in everyday situations.",
      sections: [
        {
          id: "a2_writing",
          skill: "writing",
          title: "Schreiben",
          parts: ["shortMessage", "email"],
          allowFollowUp: false,
        },
        {
          id: "a2_reading",
          skill: "reading",
          title: "Lesen",
          parts: ["shortTexts", "matching", "multipleChoice"],
          allowFollowUp: false,
        },
        {
          id: "a2_listening",
          skill: "listening",
          title: "Hören",
          parts: ["shortAnnouncements", "dialogues"],
          allowFollowUp: false,
        },
        {
          id: "a2_speaking",
          skill: "speaking",
          title: "Sprechen",
          parts: ["selfIntroduction", "imageDescription", "dialog"],
          allowFollowUp: true,
        },
      ],
    },

    B1: {
      level: "B1",
      goal: "Independent communication with reasons, experiences and planning.",
      sections: [
        {
          id: "b1_writing",
          skill: "writing",
          title: "Schreiben",
          parts: ["email", "opinion"],
          allowFollowUp: false,
        },
        {
          id: "b1_reading",
          skill: "reading",
          title: "Lesen",
          parts: ["clozeText", "brochureMatching", "trueFalse"],
          allowFollowUp: false,
        },
        {
          id: "b1_listening",
          skill: "listening",
          title: "Hören",
          parts: ["announcements", "dialogue", "opinions"],
          allowFollowUp: false,
        },
        {
          id: "b1_speaking",
          skill: "speaking",
          title: "Sprechen",
          parts: ["selfIntroduction", "imageDescription", "planning"],
          allowFollowUp: true,
        },
      ],
    },

    B2: {
      level: "B2",
      goal: "Advanced communication with analysis, comparison and argumentation.",
      sections: [
        {
          id: "b2_writing",
          skill: "writing",
          title: "Schreiben",
          parts: ["formalEmail", "opinionText"],
          allowFollowUp: false,
        },
        {
          id: "b2_reading",
          skill: "reading",
          title: "Lesen",
          parts: ["complexText", "languageElements", "argumentRecognition"],
          allowFollowUp: false,
        },
        {
          id: "b2_listening",
          skill: "listening",
          title: "Hören",
          parts: ["interview", "discussion", "presentation"],
          allowFollowUp: false,
        },
        {
          id: "b2_speaking",
          skill: "speaking",
          title: "Sprechen",
          parts: ["presentation", "discussion", "graphicDescription"],
          allowFollowUp: true,
        },
      ],
    },
  },
};

export function getExamStructure(examType = "OEIF", level = "B1") {
  return ExamStructure[examType]?.[level] || null;
}

export function getExamSections(examType = "OEIF", level = "B1") {
  return getExamStructure(examType, level)?.sections || [];
}

export function getSectionBySkill(examType = "OEIF", level = "B1", skill) {
  return getExamSections(examType, level).find(
    (section) => section.skill === skill
  );
}