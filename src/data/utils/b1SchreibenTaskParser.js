/**
 * B1 Schreiben task parsing for coach UI — no AI, no evaluation.
 * @module data/utils/b1SchreibenTaskParser
 */

export const B1_SCHREIBEN_DEFAULT_MIN_LENGTH = 80;

const RECIPIENT_LINE =
  /^schreiben\s+sie\s+(?:eine\s+)?(?:e-?mail|nachricht)\s+an\s+(.+?)\.?$/i;

/**
 * @param {string[]} taskLines
 */
export function parseB1SchreibenTaskLines(taskLines = []) {
  const lines = taskLines.map((line) => String(line || '').trim()).filter(Boolean);

  let recipientLineIndex = -1;
  let recipient = '';

  lines.forEach((line, index) => {
    const match = line.match(RECIPIENT_LINE);
    if (match) {
      recipientLineIndex = index;
      recipient = match[1].trim();
    }
  });

  const scenarioLines =
    recipientLineIndex > 0 ? lines.slice(0, recipientLineIndex) : lines.length ? [lines[0]] : [];

  const taskPoints =
    recipientLineIndex >= 0
      ? lines.slice(recipientLineIndex + 1)
      : lines.length > 1
        ? lines.slice(1)
        : [];

  return {
    scenario: scenarioLines.join(' ').trim(),
    recipient: recipient || 'Empfänger/in der E-Mail',
    taskPoints,
  };
}

/**
 * Deterministic email pick until Weekly Training AI session snapshot is wired.
 * @param {Array<{ emailIndex?: number }>} emails
 * @param {number} [planIndex]
 * @param {number} [exerciseSlot]
 */
export function selectB1SchreibenEmail(emails = [], planIndex = 1, exerciseSlot = 1) {
  if (!emails.length) return null;
  const index = (Number(planIndex) + Number(exerciseSlot) - 2) % emails.length;
  return emails[index] || emails[0];
}

/**
 * Shared deterministic email index for client + server session freeze.
 * @param {Array<{ emailIndex?: number }>} emails
 * @param {number} [planIndex]
 * @param {number} [exerciseSlot]
 */
export function resolveDeterministicSchreibenEmailIndex(emails = [], planIndex = 1, exerciseSlot = 1) {
  const email = selectB1SchreibenEmail(emails, planIndex, exerciseSlot);
  return Number(email?.emailIndex) > 0 ? Number(email.emailIndex) : null;
}

/**
 * Stable required-point IDs for coverage checks (shared client + server).
 * @param {string[]} taskPoints
 */
export function buildSchreibenRequiredPoints(taskPoints = []) {
  return taskPoints
    .map((text, index) => ({
      id: `point-${index + 1}`,
      text: String(text || '').trim(),
    }))
    .filter((point) => point.text);
}

/**
 * @param {object} email
 * @param {object} [options]
 * @param {number} [options.minimumLength]
 */
export function buildB1SchreibenWritingMeta(email, options = {}) {
  const parsed = parseB1SchreibenTaskLines(email?.task || []);
  const minimumLength =
    Number(options.minimumLength) > 0 ? Number(options.minimumLength) : B1_SCHREIBEN_DEFAULT_MIN_LENGTH;

  return {
    emailTitle: String(email?.title || '').trim(),
    scenario: parsed.scenario,
    recipient: parsed.recipient,
    taskPoints: parsed.taskPoints,
    minimumLength,
    selectedEmailIndex: email?.emailIndex ?? 1,
  };
}

/**
 * @param {string} learnerResponse
 * @param {number} minimumLength
 */
export function isB1SchreibenResponseReady(learnerResponse, minimumLength = B1_SCHREIBEN_DEFAULT_MIN_LENGTH) {
  return String(learnerResponse || '').trim().length >= minimumLength;
}
