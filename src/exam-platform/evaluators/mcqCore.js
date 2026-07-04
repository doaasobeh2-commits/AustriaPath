/**
 * Deterministic MCQ / gap-fill scoring utilities.
 * @module exam-platform/evaluators/mcqCore
 */

/** @typedef {import('../contracts.js').CEFRLabel} CEFRLabel */
/** @typedef {import('../contracts.js').EvaluationEvidence} EvaluationEvidence */

/**
 * @typedef {'exact'|'letter'|'option_key'|'text_fuzzy'} MatchMode
 */

/**
 * @typedef {Object} NormalizedQuestion
 * @property {string} id
 * @property {string} prompt
 * @property {string} expected
 * @property {MatchMode} matchMode
 * @property {Record<string, string>|string[]} [options]
 */

export const MCQ_CORE_VERSION = "1.0.0";

/** @param {string} [value] */
export function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:"'„“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {string} value */
export function isLetterAnswer(value) {
  return /^[a-hA-H]$/.test(String(value || "").trim());
}

/**
 * @param {string} expected
 * @param {string} student
 * @param {MatchMode} mode
 */
export function compareAnswer(expected, student, mode = "exact") {
  const exp = String(expected || "").trim();
  const stu = String(student ?? "").trim();

  if (!stu) {
    return { correct: false, partial: false, ratio: 0, detail: "Keine Antwort gegeben." };
  }

  if (mode === "letter" || (mode === "exact" && isLetterAnswer(exp))) {
    const match = exp.toUpperCase() === stu.toUpperCase();
    return {
      correct: match,
      partial: false,
      ratio: match ? 1 : 0,
      detail: match ? "Richtige Auswahl." : `Erwartet: ${exp.toUpperCase()}, gegeben: ${stu.toUpperCase()}.`,
    };
  }

  if (mode === "option_key") {
    const match = exp.toLowerCase() === stu.toLowerCase();
    return {
      correct: match,
      partial: false,
      ratio: match ? 1 : 0,
      detail: match ? "Richtige Option." : `Erwartet: ${exp.toLowerCase()}, gegeben: ${stu.toLowerCase()}.`,
    };
  }

  if (mode === "text_fuzzy") {
    const expNorm = normalizeText(exp);
    const stuNorm = normalizeText(stu);
    if (expNorm === stuNorm) {
      return { correct: true, partial: false, ratio: 1, detail: "Antwort korrekt." };
    }
    if (stuNorm.includes(expNorm) || expNorm.includes(stuNorm)) {
      return { correct: true, partial: false, ratio: 1, detail: "Antwort inhaltlich korrekt." };
    }
    const expTokens = expNorm.split(" ").filter((t) => t.length > 2);
    if (!expTokens.length) {
      return { correct: false, partial: false, ratio: 0, detail: "Antwort nicht korrekt." };
    }
    const matched = expTokens.filter((token) => stuNorm.includes(token)).length;
    const ratio = matched / expTokens.length;
    if (ratio >= 0.6) {
      return {
        correct: true,
        partial: ratio < 0.85,
        ratio,
        detail: `Schlüsselbegriffe erkannt (${matched}/${expTokens.length}).`,
      };
    }
    if (ratio >= 0.35) {
      return {
        correct: false,
        partial: true,
        ratio: 0.5,
        detail: `Teilweise richtig (${matched}/${expTokens.length} Begriffe).`,
      };
    }
    return { correct: false, partial: false, ratio: 0, detail: "Antwort nicht korrekt." };
  }

  const expNorm = normalizeText(exp);
  const stuNorm = normalizeText(stu);
  const match = expNorm === stuNorm;
  return {
    correct: match,
    partial: false,
    ratio: match ? 1 : 0,
    detail: match ? "Richtig." : `Erwartet: „${exp}", gegeben: „${stu}".`,
  };
}

/** @param {NormalizedQuestion[]} questions @param {Record<string, string>} [studentAnswers] */
export function scoreQuestionSet(questions = [], studentAnswers = {}) {
  /** @type {EvaluationEvidence[]} */
  const evidence = [];
  let rawScore = 0;
  const maxScore = questions.length || 1;

  questions.forEach((question) => {
    const student =
      studentAnswers[question.id] ?? studentAnswers[String(question.id)] ?? "";

    const result = compareAnswer(question.expected, student, question.matchMode);
    let points = 0;
    let code = "INCORRECT";

    if (result.correct) {
      points = 1;
      code = "CORRECT";
    } else if (result.partial) {
      points = 0.5;
      code = "PARTIAL";
    } else if (!String(student).trim()) {
      code = "UNANSWERED";
    }

    rawScore += points;
    evidence.push({
      code: `${code}:${question.id}`,
      label: question.prompt,
      passed: result.correct,
      detail: result.detail,
    });
  });

  const normalizedScore = Math.round((rawScore / maxScore) * 100);

  return {
    rawScore,
    maxScore,
    normalizedScore,
    evidence,
    answeredCount: questions.filter((q) =>
      String(studentAnswers[q.id] ?? studentAnswers[String(q.id)] ?? "").trim()
    ).length,
    totalCount: questions.length,
  };
}

/** @param {number} normalizedScore @param {CEFRLabel} [targetLevel] */
export function mapScoreToSkillLevel(normalizedScore, targetLevel = "B1") {
  const isB2Context = String(targetLevel).toUpperCase().startsWith("B2");
  if (isB2Context) {
    if (normalizedScore >= 85) return "B2";
    if (normalizedScore >= 70) return "B1+";
    if (normalizedScore >= 55) return "B1";
    return "A2+";
  }
  if (normalizedScore >= 85) return "B1+";
  if (normalizedScore >= 70) return "B1";
  if (normalizedScore >= 55) return "A2+";
  return "A2";
}

/** @param {number} normalizedScore @param {number} answeredCount @param {number} totalCount */
export function buildSkillFeedback(normalizedScore, answeredCount, totalCount) {
  const strengths = [];
  const weaknesses = [];

  if (normalizedScore >= 75) strengths.push("Gute Antwortgenauigkeit");
  if (normalizedScore >= 85) strengths.push("Sehr sicheres Verständnis");
  if (normalizedScore < 55) weaknesses.push("Viele falsche oder fehlende Antworten");
  else if (normalizedScore < 70) weaknesses.push("Detailverständnis ausbaufähig");
  if (totalCount > 0 && answeredCount < totalCount) {
    weaknesses.push(`${totalCount - answeredCount} Frage(n) ohne Antwort`);
  }

  return { strengths, weaknesses };
}
