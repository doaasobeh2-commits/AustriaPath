import { describe, expect, it } from "vitest";
import { parseCorsOrigins } from "../../server/src/config/cors.js";

describe("parseCorsOrigins", () => {
  it("defaults to localhost when empty", () => {
    expect(parseCorsOrigins("")).toEqual(["http://localhost:5173"]);
  });

  it("parses comma-separated production and dev origins", () => {
    expect(
      parseCorsOrigins(
        "https://austriapath-exam-ai.vercel.app,http://localhost:5173"
      )
    ).toEqual([
      "https://austriapath-exam-ai.vercel.app",
      "http://localhost:5173",
    ]);
  });

  it("deduplicates origins", () => {
    expect(parseCorsOrigins("http://localhost:5173,http://localhost:5173")).toEqual([
      "http://localhost:5173",
    ]);
  });
});
