import { describe, it, expect } from "vitest";
import {
  mergeExtraction,
  approveSuggestion,
  rejectSuggestion,
  normalizeSuggestions,
} from "../src/content/extractionState.js";
import { flattenAkademieFromModel, normalizeContentModel } from "../src/content/contentModelSchema.js";
import { extractFromContent } from "../src/content/contentExtractor.js";

const SAMPLE = {
  title: "Termin verschieben",
  level: "B1",
  type: "schreiben",
  content: "Schreiben Sie an die Ordination.",
  solution: "Sehr geehrte Damen und Herren,\n\nleider kann ich nicht kommen, weil mein Kind krank ist.\nKönnten Sie bitte den Termin verschieben?\n\nMit freundlichen Grüßen\nMaria",
};

describe("extractionState merge", () => {
  it("preserves approved content on regenerate merge", () => {
    const first = extractFromContent(SAMPLE);
    const merged = mergeExtraction(null, first);
    const { extraction: afterApprove } = approveSuggestion(
      merged,
      "grammar",
      normalizeSuggestions(merged.pending.grammar, "grammar")[0].id
    );

    const second = extractFromContent({ ...SAMPLE, solution: SAMPLE.solution + "\n\nIch danke Ihnen." });
    const regen = mergeExtraction(afterApprove, second, {
      mode: "merge",
      formLists: { grammar: afterApprove.approved?.grammar || [] },
    });

    expect(afterApprove.approved?.grammar?.length).toBeGreaterThan(0);
    expect(regen.approved?.grammar?.length).toBe(afterApprove.approved.grammar.length);
  });

  it("rejects suggestion and excludes from pending", () => {
    const ext = mergeExtraction(null, extractFromContent(SAMPLE));
    const grammarItems = normalizeSuggestions(ext.pending.grammar, "grammar");
    expect(grammarItems.length).toBeGreaterThan(0);
    const id = grammarItems[0].id;
    const rejected = rejectSuggestion(ext, "grammar", id);
    expect(normalizeSuggestions(rejected.pending.grammar, "grammar").length).toBe(grammarItems.length - 1);
    expect(rejected.rejected?.grammar?.length).toBe(1);
  });
});

describe("published akademie feed", () => {
  it("only includes explicitly approved akademie entries", () => {
    const extraction = extractFromContent(SAMPLE);
    const model = normalizeContentModel({
      id: 99,
      title: SAMPLE.title,
      level: "B1",
      status: "published",
      grammar: ["weil-Satz: Verb am Ende"],
      akademieEntries: [
        { id: "a1", category: "grammar", title: "Pending", approved: false },
        { id: "a2", category: "grammar", title: "Approved", approved: true, rule: "weil" },
      ],
    });

    const flat = flattenAkademieFromModel(model);
    expect(flat.grammar.some((g) => g.includes("weil"))).toBe(true);
    expect(flat.akademieEntries).toHaveLength(1);
    expect(flat.akademieEntries[0].title).toBe("Approved");
  });
});
