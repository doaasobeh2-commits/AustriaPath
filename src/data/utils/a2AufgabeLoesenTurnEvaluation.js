/**
 * Pronunciation / coverage notes for guided A2 Aufgabe lösen speaking practice.
 */

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * @param {string} learnerText
 * @param {string} requiredSentence
 * @returns {{ tone: 'success' | 'partial' | 'retry', message: string }}
 */
export function getAufgabeLoesenPronunciationNote(learnerText, requiredSentence) {
  const learner = String(learnerText || '').trim();
  if (!learner) {
    return {
      tone: 'retry',
      message: 'Kein Transkript erkannt – bitte den Satz noch einmal langsam vorlesen.',
    };
  }

  const learnerTokens = new Set(tokenize(learner));
  const requiredTokens = tokenize(requiredSentence);
  const overlap = requiredTokens.filter((token) => learnerTokens.has(token)).length;
  const ratio = requiredTokens.length ? overlap / requiredTokens.length : 0;

  if (ratio >= 0.55) {
    return {
      tone: 'success',
      message: 'Gute Aussprache – die meisten Wörter wurden erkannt.',
    };
  }

  if (ratio >= 0.25) {
    return {
      tone: 'partial',
      message: 'Teilweise erkannt – sprechen Sie den Satz etwas deutlicher und langsamer.',
    };
  }

  return {
    tone: 'retry',
    message: 'Wenige Wörter erkannt – lesen Sie den Satz noch einmal klar vor.',
  };
}
