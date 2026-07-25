import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DAILY_LEARNING_SOURCE_REGISTRY } from "../src/data/dailyLearningSourceRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseFile(filePath, level) {
  const text = fs.readFileSync(filePath, "utf8");
  const blocks = text.split(/^### /m).slice(1);
  const cards = [];
  for (const block of blocks) {
    const id = block.match(/^([A-Z0-9-]+)/)?.[1];
    if (!id) continue;
    const getField = (key) => {
      const re = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`, "m");
      return block.match(re)?.[1]?.trim();
    };
    const getOption = (letter) => {
      const re = new RegExp(`\\*\\*${letter}\\)\\*\\*\\s*(.+)`, "m");
      return block.match(re)?.[1]?.trim();
    };
    const better = getField("Better");
    const optionA = getOption("A");
    const optionB = getOption("B");
    const sourceRef = DAILY_LEARNING_SOURCE_REGISTRY[id];
    if (!sourceRef) {
      throw new Error(`Missing sourceRef in registry for ${id}`);
    }
    cards.push({
      id,
      level,
      category: getField("Category"),
      situation: getField("Situation"),
      question: "Welche Antwort passt besser?",
      optionA,
      optionB,
      recommended: better === "A" ? optionA : optionB,
      reason: getField("Reason"),
      sourceRef,
    });
  }
  return cards;
}

const cards = [
  ...parseFile(path.join(root, "review-only/daily-learning-bank-A2.md"), "A2"),
  ...parseFile(path.join(root, "review-only/daily-learning-bank-B1.md"), "B1"),
  ...parseFile(path.join(root, "review-only/daily-learning-bank-B2.md"), "B2"),
];

if (cards.length !== 270) {
  throw new Error(`Expected 270 cards, got ${cards.length}`);
}

const out = `/** Auto-generated from review-only/daily-learning-bank-*.md — do not edit by hand */
export const dailyLearningCards = ${JSON.stringify(cards, null, 2)};

export const dailyLearningCardsByLevel = {
  A2: dailyLearningCards.filter((c) => c.level === "A2"),
  B1: dailyLearningCards.filter((c) => c.level === "B1"),
  B2: dailyLearningCards.filter((c) => c.level === "B2"),
};

export function getDailyLearningCard(id) {
  return dailyLearningCards.find((c) => c.id === id) || null;
}
`;

fs.writeFileSync(path.join(root, "src/data/dailyLearningBank.js"), out);
console.log(`Wrote ${cards.length} cards with explicit sourceRef`);
