import { describe, it, expect } from "vitest";
import { extractFromContent, approveExtractionFields } from "../src/content/contentExtractor.js";
import { normalizeContentModel, flattenAkademieFromModel } from "../src/content/contentModelSchema.js";

const SAMPLE = {
  title: "Termin bei der Ordination verschieben",
  level: "B1",
  type: "schreiben",
  content: `Sie müssen einen Termin verschieben.
Schreiben Sie an die Ordination.
Erklären Sie warum.`,
  solution: `Sehr geehrte Damen und Herren,

leider kann ich morgen nicht kommen, weil mein Kind krank ist.
Könnten Sie bitte den Termin auf Freitag verschieben?

Mit freundlichen Grüßen
Maria`,
};

describe("contentExtractor", () => {
  it("extracts grammar, connectors, and vocabulary from model text", () => {
    const result = extractFromContent(SAMPLE);
    expect(result.error).toBeUndefined();
    expect(result.pending.grammar.length).toBeGreaterThan(0);
    expect(result.pending.konnektoren.some((k) => k.includes("weil"))).toBe(true);
    expect(result.pending.words.length).toBeGreaterThan(0);
    expect(result.pending.verbs.length).toBeGreaterThan(0);
  });

  it("builds akademie entries from extraction", () => {
    const result = extractFromContent(SAMPLE);
    expect(result.akademieEntries.length).toBeGreaterThan(0);
    const grammarEntry = result.akademieEntries.find((e) => e.category === "grammar");
    expect(grammarEntry).toBeTruthy();
    expect(grammarEntry.tip).toBeTruthy();
    expect(grammarEntry.level).toBe("B1");
  });

  it("suggests topic tags for Austrian everyday themes", () => {
    const result = extractFromContent({
      ...SAMPLE,
      content: "Termin bei der MA35 und Meldezettel in Wien",
      solution: SAMPLE.solution,
    });
    expect(result.pending.topicTags).toContain("MA35 / Aufenthalt");
  });

  it("approveExtractionFields merges into approved bucket", () => {
    const result = extractFromContent(SAMPLE);
    const updated = approveExtractionFields(result, ["grammar"]);
    expect(updated.approved.grammar.length).toBeGreaterThan(0);
    expect(updated.pending.grammar).toEqual([]);
  });
});

describe("contentModelSchema", () => {
  it("normalizes and flattens akademie for student feed", () => {
    const extraction = extractFromContent(SAMPLE);
    const model = normalizeContentModel({
      id: 1,
      title: SAMPLE.title,
      level: "B1",
      type: "schreiben",
      content: SAMPLE.content,
      solution: SAMPLE.solution,
      status: "published",
      akademieEntries: extraction.akademieEntries.map((e) => ({ ...e, approved: true })),
      grammar: extraction.pending.grammar,
    });

    const flat = flattenAkademieFromModel(model);
    expect(flat.grammar.length).toBeGreaterThan(0);
    expect(flat.akademieEntries.length).toBeGreaterThan(0);
  });
});
