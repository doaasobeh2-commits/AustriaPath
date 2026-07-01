import { A2GrammarKnowledge } from "./a2/grammarKnowledge";
import { A2WritingKnowledge } from "./a2/writingKnowledge";
import { A2SpeakingKnowledge } from "./a2/speakingKnowledge";
import { A2ReadingKnowledge } from "./a2/readingKnowledge";
import { A2ListeningKnowledge } from "./a2/listeningKnowledge";

/**
 * AustriaPath Knowledge Loader
 * Version 1.1
 *
 * Loads examiner knowledge by level and skill.
 */

export function loadKnowledge(level = "A2", skill = "grammar") {
  const key = `${level}_${skill}`.toLowerCase();

  const knowledgeMap = {
    a2_grammar: A2GrammarKnowledge,
    a2_writing: A2WritingKnowledge,
    a2_speaking: A2SpeakingKnowledge,
    a2_reading: A2ReadingKnowledge,
    a2_listening: A2ListeningKnowledge,
  };

  return knowledgeMap[key] || null;
}

export function loadLevelKnowledge(level = "A2") {
  const normalizedLevel = level.toLowerCase();

  return {
    grammar: loadKnowledge(normalizedLevel, "grammar"),
    writing: loadKnowledge(normalizedLevel, "writing"),
    speaking: loadKnowledge(normalizedLevel, "speaking"),
    reading: loadKnowledge(normalizedLevel, "reading"),
    listening: loadKnowledge(normalizedLevel, "listening"),
  };
}