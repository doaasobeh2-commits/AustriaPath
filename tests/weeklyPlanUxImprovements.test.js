import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAufgabeLoesenPronunciationNote } from '../src/data/utils/a2AufgabeLoesenTurnEvaluation.js';
import {
  formatSchreibenAiError,
  SCHREIBEN_AI_UNAVAILABLE_MESSAGE,
} from '../src/data/utils/schreibenAiErrorMessages.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('Bildbeschreibung voice-first UX', () => {
  it('starts with a recording button and transcript review', () => {
    const panels = readSrc('src/app/screens/weeklyPlan/CoachExercisePanels.jsx');
    expect(panels).toMatch(/Aufnahme starten/);
    expect(panels).toMatch(/useWeeklyPlanSpeechRecognition/);
    expect(panels).toMatch(/Manuell tippen \(Fallback\)/);
    expect(panels).not.toMatch(/BildbeschreibungExercisePanel[\s\S]*fake/i);
  });
});

describe('Aufgabe lösen learner-speaks UX', () => {
  it('shows the guided sentence during speaking practice', () => {
    const panel = readSrc('src/app/screens/speaking/AufgabeLoesenGuidedPanel.jsx');
    expect(panel).not.toMatch(/Das können Sie sagen:/);
    expect(panel).toMatch(/guidedSpeakingRecordInstruction/);
    expect(panel).toMatch(/getScreenLabels\(getUserLanguage\(\)\)/);
    expect(panel).toMatch(/Ihr Satz:/);
    expect(panel).toMatch(/Aufnahme starten/);
    expect(panel).not.toMatch(/Musterantwort:/);
  });

  it('evaluates pronunciation coverage without hiding the guided sentence', () => {
    const note = getAufgabeLoesenPronunciationNote(
      'Guten Tag, ich möchte einen Termin.',
      'Guten Tag, ich hätte gern einen Termin.'
    );
    expect(note.message).not.toMatch(/Guten Tag, ich hätte/);
    expect(['success', 'partial', 'retry']).toContain(note.tone);
  });
});

describe('Hören same-screen UX', () => {
  it('keeps audio and questions on one screen and locks answers during playback', () => {
    const panel = readSrc('src/app/screens/horen/A2HorenGuidedPanel.jsx');
    expect(panel).toMatch(/Clip abspielen/);
    expect(panel).toMatch(/audioPlaying/);
    expect(panel).toMatch(/clip1Unlocked|clip2Unlocked/);
    expect(panel).not.toMatch(/Weiter zu Frage 1/);
    expect(panel).toMatch(/Antworten einreichen/);
  });
});

describe('Schreiben AI retry messaging', () => {
  it('maps auth errors to a writing-safe unavailable message', () => {
    expect(
      formatSchreibenAiError({ code: 'AUTH_INVALID', message: 'E-Mail oder Passwort ist falsch.' })
    ).toBe(SCHREIBEN_AI_UNAVAILABLE_MESSAGE);
    expect(SCHREIBEN_AI_UNAVAILABLE_MESSAGE).toMatch(/sicher gespeichert/);
    expect(SCHREIBEN_AI_UNAVAILABLE_MESSAGE).toMatch(/KI-Korrektur erneut versuchen/);
  });

  it('wires formatted errors in coach screen', () => {
    const coach = readSrc('src/app/screens/CoachExerciseScreen.jsx');
    expect(coach).toMatch(/formatSchreibenAiError/);
    expect(coach).toMatch(/showStaticModelAnswer=\{aiStatus === 'failed'\}/);
  });
});
