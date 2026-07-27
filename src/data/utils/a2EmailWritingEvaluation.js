/**
 * Rule-based A2 E-Mail writing evaluation for Weekly Plan coach exercises.
 */
import {
  getA2SchreibenEvaluation,
  isA2SchreibenEvaluationTask,
} from '../a2SchreibenEvaluationCatalog.js';

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} text
 * @param {string[]} keywords
 */
function matchesKeywords(text, keywords = []) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

/**
 * @param {object} task
 * @param {string} learnerResponse
 */
export function evaluateA2EmailWriting(task, learnerResponse) {
  const meta = getA2SchreibenEvaluation(task);
  if (!meta) {
    return {
      summary: 'Deine Antwort wurde gespeichert.',
      lines: [{ text: 'Gut – du hast die Aufgabe bearbeitet.', tone: 'neutral' }],
    };
  }

  const response = String(learnerResponse || '').trim();
  const normalized = normalizeText(response);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  /** @type {Array<{ text: string, tone: string }>} */
  const lines = [];
  const covered = [];
  const missing = [];

  meta.taskPoints.forEach((point, index) => {
    const keywords = meta.pointKeywords?.[index] || [];
    if (matchesKeywords(normalized, keywords)) {
      covered.push(point);
      lines.push({ text: `Inhaltspunkt erfüllt: ${point}`, tone: 'success' });
    } else {
      missing.push(point);
      lines.push({ text: `Inhaltspunkt fehlt oder unklar: ${point}`, tone: 'retry' });
    }
  });

  const grammarIssues = [];
  (meta.grammarChecks || []).forEach((check) => {
    if (check.pattern.test(response)) {
      grammarIssues.push(check.message);
      lines.push({ text: `Grammatik: ${check.message}`, tone: 'partial' });
    }
  });

  if (!grammarIssues.length) {
    lines.push({ text: 'Grammatik: Keine typischen A2-Fehler gefunden.', tone: 'success' });
  }

  const vocabFound = (meta.vocabularyHints || []).filter((word) =>
    normalized.includes(String(word).toLowerCase())
  );
  const vocabMissing = (meta.vocabularyHints || []).filter(
    (word) => !normalized.includes(String(word).toLowerCase())
  );

  if (vocabFound.length) {
    lines.push({
      text: `Wortschatz gut verwendet: ${vocabFound.join(', ')}`,
      tone: 'success',
    });
  }
  if (vocabMissing.length) {
    lines.push({
      text: `Wortschatz könnte noch stärker sein. Nützliche Wörter: ${vocabMissing.join(', ')}`,
      tone: 'info',
    });
  }

  const hasGreeting = /(hallo|guten tag|sehr geehrte|liebe)/i.test(response);
  const hasClosing = /(grüße|gruss|tschüss|bis bald|freundliche)/i.test(response);
  let communicationScore = 0;
  if (hasGreeting) communicationScore += 1;
  if (hasClosing) communicationScore += 1;
  if (wordCount >= 25) communicationScore += 1;

  if (communicationScore >= 3) {
    lines.push({
      text: 'Kommunikation: Höfliche Struktur mit Anrede, Schlussformel und ausreichender Länge.',
      tone: 'success',
    });
  } else if (communicationScore === 2) {
    lines.push({
      text: 'Kommunikation: Grundstruktur vorhanden, aber noch ausbaufähig.',
      tone: 'partial',
    });
  } else {
    lines.push({
      text: 'Kommunikation: Bitte Anrede, Schlussformel und etwas mehr Text ergänzen.',
      tone: 'retry',
    });
  }

  const coverageRatio = meta.taskPoints.length ? covered.length / meta.taskPoints.length : 0;
  let summary = 'Deine E-Mail wurde ausgewertet.';
  if (coverageRatio === 1 && grammarIssues.length === 0) {
    summary = 'Sehr gut – alle Inhaltspunkte sind enthalten und die Struktur passt.';
  } else if (coverageRatio >= 0.5) {
    summary = 'Gut – einige Inhaltspunkte sind noch unvollständig. Vergleiche mit der Musterlösung.';
  } else {
    summary = 'Bitte ergänze die fehlenden Inhaltspunkte und vergleiche mit der Musterlösung.';
  }

  return {
    summary,
    lines,
    showSolution: true,
    solution: meta.modelAnswer,
    evaluationMeta: {
      coveredPoints: covered,
      missingPoints: missing,
      grammarIssues,
      vocabularyUsed: vocabFound,
      vocabularySuggested: vocabMissing,
      wordCount,
      learnerResponse: response,
      deterministicScore: {
        covered: covered.length,
        total: meta.taskPoints.length,
      },
    },
  };
}

export { isA2SchreibenEvaluationTask };
