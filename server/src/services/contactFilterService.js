import { AppError } from "../middleware/errorHandler.js";

const CONTACT_MESSAGE =
  "Bitte teilen Sie keine Kontaktdaten (E-Mail, Telefonnummer, WhatsApp, Telegram oder externe Links). Verwenden Sie nur den Bereich Fragen & Antworten.";

const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,6})?/;

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s]+/i;

const HANDLE_PATTERNS = [
  /\bwhatsapp\b/i,
  /\btelegram\b/i,
  /\bsignal\b/i,
  /\bwa\.me\b/i,
  /\bt\.me\b/i,
  /\binstagram\b/i,
  /\bfacebook\b/i,
  /\btiktok\b/i,
  /\bsnapchat\b/i,
  /@[a-z0-9._]{3,}/i,
];

/**
 * @param {string} value
 * @param {{ min?: number, max?: number }} limits
 */
export function sanitizeCommunityText(value, { min = 1, max = 1500 } = {}) {
  const text = String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < min) {
    throw new AppError("VALIDATION_ERROR", "Der Text ist zu kurz.", 400);
  }
  if (text.length > max) {
    throw new AppError("VALIDATION_ERROR", "Der Text ist zu lang.", 400);
  }
  return text;
}

/**
 * Reject publication when contact details are detected.
 * @param {string} value
 */
export function assertNoContactInformation(value) {
  const text = String(value ?? "");
  if (EMAIL_PATTERN.test(text)) {
    throw new AppError("VALIDATION_ERROR", CONTACT_MESSAGE, 400);
  }
  if (URL_PATTERN.test(text)) {
    throw new AppError("VALIDATION_ERROR", CONTACT_MESSAGE, 400);
  }
  for (const pattern of HANDLE_PATTERNS) {
    if (pattern.test(text)) {
      throw new AppError("VALIDATION_ERROR", CONTACT_MESSAGE, 400);
    }
  }
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 8 && PHONE_PATTERN.test(text)) {
    throw new AppError("VALIDATION_ERROR", CONTACT_MESSAGE, 400);
  }
}

/**
 * @param {string} value
 * @param {{ min?: number, max?: number }} limits
 */
export function validateCommunityText(value, limits) {
  const text = sanitizeCommunityText(value, limits);
  assertNoContactInformation(text);
  return text;
}
