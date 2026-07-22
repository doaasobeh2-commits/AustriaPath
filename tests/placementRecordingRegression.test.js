import fs from "node:fs";
import { describe, expect, it } from "vitest";

const screenSource = fs.readFileSync(
  new URL("../src/app/screens/PlacementTestScreen.jsx", import.meta.url),
  "utf8"
);

function functionBody(name, nextName) {
  const start = screenSource.indexOf(`const ${name} =`);
  const end = screenSource.indexOf(`const ${nextName} =`, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return screenSource.slice(start, end);
}

describe("Placement recording regression", () => {
  const startRecording = functionBody("startRecording", "stopRecording");

  it("binds the fresh Selbstvorstellung start button to SpeechRecognition.start without qaSkip", () => {
    expect(screenSource).toMatch(/onClick=\{startRecording\}/);
    expect(startRecording).toContain("const recognition = new SpeechRecognitionCtor()");
    expect(startRecording).toContain("recognition.start()");
    expect(startRecording).not.toContain("qaSkip");
  });

  it("does not gate restored Selbstvorstellung recording on restored answer state", () => {
    expect(screenSource).toContain("setControlMessage('Ihr begonnener Einstufungstest wurde wiederhergestellt.')");
    expect(startRecording).not.toContain("answerSubmitted");
    expect(startRecording).not.toContain("hydratingRef");
  });

  it("preserves the unsupported-browser typed fallback", () => {
    expect(startRecording).toContain("if (!SpeechRecognitionCtor)");
    expect(startRecording).toContain("setTypedFallbackAllowed(true)");
    expect(startRecording).toContain("Spracherkennung wird in diesem Browser nicht unterstützt");
  });

  it("preserves visible permission and recording failure messages", () => {
    expect(startRecording).toContain("err === 'not-allowed' || err === 'service-not-allowed'");
    expect(startRecording).toContain("Mikrofonzugriff verweigert");
    expect(startRecording).toContain("Spracherkennung fehlgeschlagen");
    expect(startRecording).toMatch(/try\s*\{[\s\S]*?recognition\.start\(\)[\s\S]*?\}\s*catch/);
  });

  it("keeps isPlanningRecordingAllowed as the sole Planning recording gate", () => {
    expect(startRecording).toContain("skill === 'planung' && !isPlanningRecordingAllowed({");
    expect(startRecording).toContain("phase: planningPhase");
    expect(startRecording).toContain("examinerAudioActive: Boolean(listeningAudioRef.current)");
    expect(startRecording.match(/skill === 'planung'/g)).toHaveLength(1);
  });

  it("keeps Weiter guarded by valid evaluated evidence", () => {
    const handleWeiter = functionBody("handleWeiter", "startRecording");
    expect(handleWeiter).toContain("if (!qaSkip && (!band || score == null))");
    expect(handleWeiter).toContain("Bitte senden Sie zuerst eine ausgewertete Antwort");
    expect(handleWeiter).toContain("if (!qaSkip && last?.needsFollowUp && activeFollowUp)");
  });

  it("shows remaining Planning time without changing configured durations or retry semantics", () => {
    expect(screenSource).toContain("Verbleibende Antwortzeit: {planningResponseSeconds} Sekunden");
    expect(screenSource).toContain("setPlanningResponseSeconds(move.responseSeconds)");
    expect(screenSource).toContain("Math.max(0, value - 1)");
    expect(screenSource).toContain("Number(saved.planningResponseSeconds) || 0");
    expect(screenSource).toContain("setRetryAnswer({ text, inputMode })");
    expect(screenSource).toContain("Bitte versuchen Sie die Auswertung erneut");
  });
});
