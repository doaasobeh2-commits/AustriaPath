import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isPlacementAnswerTooShortValidationError,
} from "../src/data/placementLogic.js";

const screenSource = fs.readFileSync(
  new URL("../src/app/screens/PlacementTestScreen.jsx", import.meta.url),
  "utf8"
);

function tooShortValidationCatchBranch() {
  const marker =
    "if (!isAdminQaMode() && isPlacementAnswerTooShortValidationError(err))";
  const start = screenSource.indexOf(marker);
  const end = screenSource.indexOf("const msg =", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return screenSource.slice(start, end);
}

describe("Placement answer-too-short validation handling", () => {
  it("detects the backend VALIDATION_ERROR for a too-short answer", () => {
    expect(
      isPlacementAnswerTooShortValidationError({
        code: "VALIDATION_ERROR",
        message: "Antwort ist zu kurz für die Auswertung.",
      })
    ).toBe(true);
    expect(
      isPlacementAnswerTooShortValidationError({
        code: "VALIDATION_ERROR",
        message: "Antwort fehlt für die Auswertung.",
      })
    ).toBe(true);
    expect(
      isPlacementAnswerTooShortValidationError({
        code: "VALIDATION_ERROR",
        message: "modelId ist erforderlich.",
      })
    ).toBe(false);
    expect(
      isPlacementAnswerTooShortValidationError({
        code: "INTERNAL_ERROR",
        message: "Antwort ist zu kurz für die Auswertung.",
      })
    ).toBe(false);
  });

  it("keeps the learner on the same turn without retrying the rejected answer", () => {
    const branch = tooShortValidationCatchBranch();
    expect(branch).toContain("isPlacementAnswerTooShortValidationError(err)");
    expect(branch).toContain("setRetryAnswer(null)");
    expect(branch).toContain("setAnswerTooShortBlocked(true)");
    expect(branch).toContain("setAnswerSubmitted(false)");
    expect(branch).toContain("setControlMessage(PLACEMENT_ANSWER_TOO_SHORT_MESSAGE)");
    expect(branch).toContain("return;");
    expect(branch).not.toContain("setRetryAnswer({ text, inputMode })");
  });

  it("does not show the STT fallback hint while the too-short validation message is active", () => {
    expect(screenSource).toContain("!answerTooShortBlocked");
    expect(screenSource).toContain("Die Spracherkennung ist nicht verfügbar");
    expect(screenSource).toMatch(
      /\{!answerTooShortBlocked \? \([\s\S]*?Die Spracherkennung ist nicht verfügbar/
    );
  });
});
