/**
 * Operator-fillable legal fields. Leave empty strings until verified data is available.
 * Empty fields render as [Platzhalter] in the app — no unverifiable claims are inserted automatically.
 *
 * Before public launch: complete this file and have counsel review legalContent.js.
 */
export const LEGAL_OPERATOR = {
  /** Natural person or registered company name */
  legalName: "",
  street: "",
  postalCode: "",
  city: "",
  country: "Österreich",

  /** Public contact */
  email: "",
  privacyEmail: "",
  phone: "",
  website: "",

  /** Optional business identifiers — only fill when verified */
  uid: "",
  firmenbuch: "",
  wko: "",

  /** Planned or active subprocessors (hosting, AI) — fill before production */
  hostingProvider: "",
  aiProvider: "OpenAI (USA, über Server-Proxy — geplant)",

  /** Beta / launch status note shown on legal pages */
  launchNote:
    "Closed Beta: Kontodaten und Fortschritt werden derzeit primär lokal im Browser gespeichert. Serverseitige Verarbeitung und Zahlungen sind noch nicht produktiv.",
};

/** Renders operator value or a visible placeholder for incomplete fields. */
export function legalField(value, placeholderLabel) {
  const trimmed = String(value ?? "").trim();
  if (trimmed) return trimmed;
  return `[${placeholderLabel} — vom Betreiber einzutragen]`;
}

export function formatAddress(operator = LEGAL_OPERATOR) {
  const lines = [
    legalField(operator.legalName, "Name / Firma"),
    legalField(
      [operator.street, `${operator.postalCode} ${operator.city}`.trim()]
        .filter(Boolean)
        .join(", ") || "",
      "Adresse"
    ),
    operator.country || "Österreich",
  ].filter((line) => !line.startsWith("[Adresse") || !operator.street);

  if (!operator.street && !operator.city) {
    return `${legalField("", "Name / Firma")}\n${legalField("", "Straße und Hausnummer")}\n${legalField("", "PLZ Ort")}, ${operator.country}`;
  }

  return lines.join("\n");
}

export function formatContactEmail(operator = LEGAL_OPERATOR) {
  return legalField(operator.email, "kontakt@ihre-domain.at");
}

export function formatPrivacyEmail(operator = LEGAL_OPERATOR) {
  return legalField(
    operator.privacyEmail || operator.email,
    "datenschutz@ihre-domain.at"
  );
}

export function formatWebsite(operator = LEGAL_OPERATOR) {
  const site = String(operator.website || "").trim();
  if (site) return site.startsWith("http") ? site : `https://${site}`;
  return legalField("", "www.ihre-domain.at");
}
