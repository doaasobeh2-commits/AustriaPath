import { A2GrammarKnowledge } from "./a2/grammarKnowledge";
import { A2WritingKnowledge } from "./a2/writingKnowledge";
import { A2SpeakingKnowledge } from "./a2/speakingKnowledge";
import { A2ReadingKnowledge } from "./a2/readingKnowledge";
import { A2ListeningKnowledge } from "./a2/listeningKnowledge";

import { B1GrammarKnowledge } from "./b1/grammarKnowledge";
import { B1WritingKnowledge } from "./b1/writingKnowledge";
import { B1SpeakingKnowledge } from "./b1/speakingKnowledge";
import { B1ReadingKnowledge } from "./b1/readingKnowledge";
import { B1ListeningKnowledge } from "./b1/listeningKnowledge";

import { B2GrammarKnowledge } from "./b2/grammarKnowledge";
import { B2WritingKnowledge } from "./b2/writingKnowledge";
import { B2SpeakingKnowledge } from "./b2/speakingKnowledge";
import { B2ReadingKnowledge } from "./b2/readingKnowledge";
import { B2ListeningKnowledge } from "./b2/listeningKnowledge";

/**
 * AustriaPath Examiner Knowledge
 * Version 2.0
 *
 * Human examiner principles + level-based knowledge.
 */

export const ExaminerKnowledge = {
  principles: [
    "Never judge the student from one mistake.",
    "Always evaluate the whole performance.",
    "Adapt difficulty gradually.",
    "Ask follow-up questions when information is missing.",
    "Separate grammar mistakes from communication ability.",
    "Evaluate fluency, vocabulary, grammar and communication independently.",
    "Follow the official ÖIF exam structure.",
    "Keep the student calm during the exam.",
    "Never jump between levels without evidence.",
    "Record every important observation.",
  ],

  levels: {
    A2: {
      grammar: A2GrammarKnowledge,
      writing: A2WritingKnowledge,
      speaking: A2SpeakingKnowledge,
      reading: A2ReadingKnowledge,
      listening: A2ListeningKnowledge,
    },

    B1: {
      grammar: B1GrammarKnowledge,
      writing: B1WritingKnowledge,
      speaking: B1SpeakingKnowledge,
      reading: B1ReadingKnowledge,
      listening: B1ListeningKnowledge,
    },

    B2: {
      grammar: B2GrammarKnowledge,
      writing: B2WritingKnowledge,
      speaking: B2SpeakingKnowledge,
      reading: B2ReadingKnowledge,
      listening: B2ListeningKnowledge,
    },
  },
};