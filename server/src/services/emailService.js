/**
 * Transactional email — Resend in production, console log in dev/test.
 */

import { env } from "../config/env.js";

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} params
 */
export async function sendEmail({ to, subject, html, text }) {
  if (env.resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " "),
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Email send failed: ${detail}`);
    }
    return { sent: true, provider: "resend" };
  }

  if (env.nodeEnv !== "production") {
    console.info(`[email] to=${to} subject=${subject}`);
    return { sent: true, provider: "log" };
  }

  throw new Error("Email provider not configured");
}

export async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    to: email,
    subject: "AustriaPath — Passwort zurücksetzen",
    html: `<p>Sie haben eine Passwort-Zurücksetzung angefordert.</p><p><a href="${resetUrl}">Passwort zurücksetzen</a></p><p>Gültig für 1 Stunde.</p>`,
  });
}

export async function sendVerificationEmail(email, verifyUrl) {
  return sendEmail({
    to: email,
    subject: "AustriaPath — E-Mail bestätigen",
    html: `<p>Bitte bestätigen Sie Ihre E-Mail-Adresse.</p><p><a href="${verifyUrl}">E-Mail bestätigen</a></p>`,
  });
}
