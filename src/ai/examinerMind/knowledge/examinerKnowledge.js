import { A2GrammarKnowledge } from "./a2/grammarKnowledge.js";
import { A2WritingKnowledge } from "./a2/writingKnowledge.js";
import { A2SpeakingKnowledge } from "./a2/speakingKnowledge.js";
import { A2ReadingKnowledge } from "./a2/readingKnowledge.js";
import { A2ListeningKnowledge } from "./a2/listeningKnowledge.js";

import { B1GrammarKnowledge } from "./b1/grammarKnowledge.js";
import { B1WritingKnowledge } from "./b1/writingKnowledge.js";
import { B1SpeakingKnowledge } from "./b1/speakingKnowledge.js";
import { B1ReadingKnowledge } from "./b1/readingKnowledge.js";
import { B1ListeningKnowledge } from "./b1/listeningKnowledge.js";

import { B2GrammarKnowledge } from "./b2/grammarKnowledge.js";
import { B2WritingKnowledge } from "./b2/writingKnowledge.js";
import { B2SpeakingKnowledge } from "./b2/speakingKnowledge.js";
import { B2ReadingKnowledge } from "./b2/readingKnowledge.js";
import { B2ListeningKnowledge } from "./b2/listeningKnowledge.js";

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