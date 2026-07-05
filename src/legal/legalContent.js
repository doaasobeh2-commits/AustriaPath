import { LEGAL_LAST_UPDATED } from "./legalVersions.js";
import {
  LEGAL_OPERATOR,
  formatAddress,
  formatContactEmail,
  formatPrivacyEmail,
  formatWebsite,
  legalField,
} from "./legalConfig";

const DRAFT_NOTE =
  "Entwurf für die Closed Beta. Vor öffentlichem Launch durch Rechtsberatung prüfen und Operator-Daten in legalConfig.js eintragen.";

export const LEGAL_PAGES = {
  impressum: {
    title: "Impressum",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED} · ${DRAFT_NOTE}`,
    sections: [
      {
        heading: "Medieninhaber und Herausgeber",
        body: formatAddress(LEGAL_OPERATOR),
      },
      {
        heading: "Kontakt",
        body: `E-Mail: ${formatContactEmail(LEGAL_OPERATOR)}
Telefon: ${legalField(LEGAL_OPERATOR.phone, "Telefon optional")}
Website: ${formatWebsite(LEGAL_OPERATOR)}`,
      },
      {
        heading: "Unternehmensgegenstand",
        body: "Betrieb einer digitalen Lernplattform für Deutsch als Zweitsprache — mit Übungen für Lesen, Hören, Schreiben und Sprechen (Web-App). Keine Behörde, keine Prüfungsstelle.",
      },
      {
        heading: "UID-Nummer / Firmenbuch",
        body: `UID: ${legalField(LEGAL_OPERATOR.uid, "UID-Nummer falls vorhanden")}
Firmenbuch: ${legalField(LEGAL_OPERATOR.firmenbuch, "Firmenbuchnummer falls eingetragen")}`,
      },
      {
        heading: "Mitgliedschaft bei der Wirtschaftskammer",
        body: legalField(
          LEGAL_OPERATOR.wko,
          "Wirtschaftskammer / Fachgruppe falls zutreffend"
        ),
      },
      {
        heading: "Berufsrechtliche Vorschriften",
        body: "Es besteht keine behördliche Zulassung als Prüfungsinstitut. AustriaPath ist eine unabhängige Lernplattform und steht in keiner offiziellen Verbindung zu Behörden, Sprachschulen oder Prüfungsinstituten.",
      },
      {
        heading: "Online-Streitbeilegung",
        body: "Verbraucher können Beschwerden an die Online-Streitbeilegungsplattform der EU richten: https://ec.europa.eu/consumers/odr\nTeilnahme an Verbraucherschlichtungsverfahren nur, soweit gesetzlich zwingend oder vom Betreiber ausdrücklich erklärt.",
      },
      {
        heading: "Hinweis zur Beta",
        body: LEGAL_OPERATOR.launchNote,
      },
    ],
  },

  datenschutz: {
    title: "Datenschutzerklärung",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED} · ${DRAFT_NOTE}`,
    sections: [
      {
        heading: "1. Verantwortlicher",
        body: `Verantwortlich für die Datenverarbeitung ist der in Impressum genannte Medieninhaber von AustriaPath.\nKontakt: ${formatContactEmail(LEGAL_OPERATOR)} · Datenschutz: ${formatPrivacyEmail(LEGAL_OPERATOR)}`,
      },
      {
        heading: "2. Überblick",
        body: "AustriaPath verarbeitet personenbezogene Daten nur, soweit dies für den Betrieb der Lernplattform erforderlich ist. Es werden keine personenbezogenen Daten zu Werbezwecken verkauft. Details zu AI-Verarbeitung siehe AI-Datenschutzhinweise.",
      },
      {
        heading: "3. Verarbeitete Datenkategorien (Beta)",
        body: `• Kontodaten: Name, E-Mail, Passwort (derzeit clientseitig in localStorage — bis Backend-Migration)
• Nutzungsdaten: Trainingsfortschritt, gespeicherte AI-Berichte, Abonnementstatus (lokal)
• Technische Daten: Browser-Gerät, localStorage
• Profilbild: optional, lokal
• Kontaktanfragen: per E-Mail, wenn genutzt`,
      },
      {
        heading: "4. Rechtsgrundlagen (Art. 6 DSGVO — Entwurf)",
        body: `• Vertragserfüllung (Art. 6 Abs. 1 lit. b): Bereitstellung der Lernplattform
• Einwilligung (Art. 6 Abs. 1 lit. a): Registrierung, AI-Funktionen, optionale Cookies
• Berechtigtes Interesse (Art. 6 Abs. 1 lit. f): Sicherheit, Missbrauchsprävention
• Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c): Aufbewahrung, soweit gesetzlich erforderlich`,
      },
      {
        heading: "5. Speicherdauer",
        body: "Daten werden nur so lange gespeichert, wie für den Zweck nötig oder gesetzlich vorgeschrieben. Konkrete Fristen nach Konto-Löschung werden mit dem serverseitigen Backend festgelegt und hier aktualisiert.",
      },
      {
        heading: "6. Empfänger und Drittländer",
        body: `• AI-Anbieter: ${legalField(LEGAL_OPERATOR.aiProvider, "AI-Anbieter eintragen")} — Verarbeitung von Prüfungstexten nur nach Abschluss von Vertrags- und Sicherheitsmaßnahmen (geplant).
• Hosting: ${legalField(LEGAL_OPERATOR.hostingProvider, "Hosting-Anbieter vor Launch eintragen")}
Keine Weitergabe zu Werbezwecken.`,
      },
      {
        heading: "7. Ihre Rechte",
        body: `Sie haben nach der DSGVO u. a. Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf erteilter Einwilligungen. Beschwerderecht bei der Österreichischen Datenschutzbehörde: https://www.dsb.gv.at\nAnfragen: ${formatPrivacyEmail(LEGAL_OPERATOR)}`,
      },
      {
        heading: "8. Datensicherheit",
        body: "Geplante technische und organisatorische Maßnahmen (Verschlüsselung in Transit, Zugriffskontrollen, serverseitige Authentifizierung) werden vor Produktivstart dokumentiert und umgesetzt.",
      },
      {
        heading: "9. Minderjährige",
        body: "Die Nutzung durch Personen unter 14 Jahren ist nur mit Zustimmung der Erziehungsberechtigten vorgesehen.",
      },
      {
        heading: "10. Änderungen",
        body: "Bei wesentlichen Änderungen informieren wir in der App. Neue Versionen können eine erneute Zustimmung erfordern.",
      },
    ],
  },

  agb: {
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED} · ${DRAFT_NOTE}`,
    sections: [
      {
        heading: "1. Geltungsbereich",
        body: "Diese AGB gelten für die Nutzung der AustriaPath Web-App durch registrierte Nutzer. Abweichende Bedingungen gelten nur bei ausdrücklicher schriftlicher Vereinbarung.",
      },
      {
        heading: "2. Leistungsbeschreibung",
        body: "AustriaPath bietet digitale Lerninhalte, tägliche Übungen und optionale AI-gestützte Trainingssimulationen für Deutsch im Alltag. Es handelt sich nicht um behördliche Prüfungen oder Zertifizierungen.",
      },
      {
        heading: "3. Registrierung und Konto",
        body: "Nutzer müssen wahrheitsgemäße Angaben machen und Zugangsdaten geheim halten. Missbrauch soll unverzüglich gemeldet werden. Der Betreiber kann Konten bei schwerwiegenden Verstößen sperren oder löschen.",
      },
      {
        heading: "4. Nutzungsrechte",
        body: "Inhalte der Plattform sind urheberrechtlich geschützt. Nutzung nur für persönliche Lernzwecke. Vervielfältigung, Weitergabe oder kommerzielle Nutzung ohne Zustimmung ist untersagt.",
      },
      {
        heading: "5. AI-Funktionen",
        body: "AI-Bewertungen sind Lernhilfen und ersetzen keine menschliche Prüferentscheidung. Siehe AI-Hinweis und AI-Datenschutzhinweise. Haftung für AI-Fehler ist ausgeschlossen, soweit gesetzlich zulässig.",
      },
      {
        heading: "6. Premium und Zahlungen",
        body: "Preise und Kündigungsbedingungen werden vor Abschluss angezeigt. In der Closed Beta können Premium-Funktionen testweise lokal im Browser verwaltet werden — ohne echte Zahlungsabwicklung.",
      },
      {
        heading: "7. Verfügbarkeit",
        body: "Der Betreiber bemüht sich um Verfügbarkeit, garantiert diese jedoch nicht. Wartung und technische Störungen können zu Unterbrechungen führen.",
      },
      {
        heading: "8. Haftung",
        body: "Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig. Für Vorsatz, grobe Fahrlässigkeit und Personenschäden gilt gesetzliche Haftung. Lern- oder Prüfungserfolg wird nicht garantiert.",
      },
      {
        heading: "9. Kündigung",
        body: "Nutzer können ihr Konto löschen (siehe Datenschutzerklärung). Der Betreiber kann bei schwerwiegenden Verstößen fristlos kündigen.",
      },
      {
        heading: "10. Anwendbares Recht",
        body: "Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist, soweit zulässig, der Sitz des Betreibers in Österreich.",
      },
    ],
  },

  kontakt: {
    title: "Kontakt",
    subtitle: "Fragen zu Konto, Datenschutz und Support.",
    sections: [
      {
        heading: "Allgemeine Anfragen",
        body: `E-Mail: ${formatContactEmail(LEGAL_OPERATOR)}\nAntwortzeit: angestrebt innerhalb von 3 Werktagen (Beta).`,
      },
      {
        heading: "Datenschutz",
        body: `Auskunfts-, Lösch- oder Exportanfragen:\nE-Mail: ${formatPrivacyEmail(LEGAL_OPERATOR)}\nBetreff: „DSGVO-Anfrage“`,
      },
      {
        heading: "Impressum",
        body: "Vollständige Anbieterkennzeichnung finden Sie unter Impressum.",
      },
      {
        heading: "Beta-Hinweis",
        body: LEGAL_OPERATOR.launchNote,
      },
    ],
  },

  cookies: {
    title: "Cookie-Richtlinie",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        heading: "1. Was sind Cookies und lokale Speicher?",
        body: "AustriaPath verwendet primär localStorage im Browser (keine klassischen Tracking-Cookies). Dies speichert Login-Status, Lernfortschritt und Einstellungen lokal auf Ihrem Gerät.",
      },
      {
        heading: "2. Erforderliche Speicherung",
        body: `• Sitzung / Login-Status
• Rechtliche Einwilligung (Zeitstempel + Version)
• Lernfortschritt und App-Einstellungen
Diese Speicherung ist für die Funktion der App technisch erforderlich.`,
      },
      {
        heading: "3. Optionale / Analytische Cookies",
        body: "Derzeit setzen wir keine Marketing- oder Analyse-Cookies ein. Sollte sich dies vor Launch ändern, wird diese Richtlinie aktualisiert und eine Einwilligung eingeholt.",
      },
      {
        heading: "4. Verwaltung",
        body: "Sie können localStorage über die Browser-Einstellungen löschen. Dadurch werden Login und lokaler Fortschritt zurückgesetzt.",
      },
      {
        heading: "5. Weitere Informationen",
        body: "Details in der Datenschutzerklärung.",
      },
    ],
  },

  aiDisclaimer: {
    title: "AI-Hinweis (Disclaimer)",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        heading: "Kein behördliches Prüfungsergebnis",
        body: "AI-gestützte Funktionen simulieren Übungssituationen zu Lernzwecken. Sie stellen keine behördliche Prüfung, keine Behördenentscheidung und keine Zertifizierung dar.",
      },
      {
        heading: "Kein zertifizierter Prüfer",
        body: "Die AI ist kein menschlicher Prüfer und nicht bei Behörden akkreditiert. Bewertungen können unvollständig oder fehlerhaft sein.",
      },
      {
        heading: "Lernempfehlung",
        body: "Nutzen Sie AI-Feedback als Ergänzung zu Unterricht, Selbststudium und weiteren Lernmaterialien — nicht als alleinige Vorbereitung.",
      },
      {
        heading: "Examiner Lab",
        body: "Manuell ausgewählte Beispielübungen im Examiner Lab dienen dem internen Regelabgleich und werden nicht als behördliche Bewertung ausgegeben.",
      },
      {
        heading: "Haftung",
        body: "Der Betreiber übernimmt keine Haftung für Entscheidungen, die allein auf AI-Feedback basieren, soweit gesetzlich zulässig.",
      },
      {
        heading: "Weitere Informationen",
        body: "Siehe AI-Datenschutzhinweise in dieser App.",
      },
    ],
  },

  aiPrivacy: {
    title: "AI-Datenschutzhinweise",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED} · ${DRAFT_NOTE}`,
    sections: [
      {
        heading: "1. Zweck",
        body: "AI-Funktionen (z. B. mündliche Simulation, Schreibfeedback, Probeprüfung) verarbeiten von Ihnen eingegebene oder gesprochene Texte, um Lernfeedback zu erzeugen.",
      },
      {
        heading: "2. Welche Daten können betroffen sein?",
        body: `• Texte aus Schreib- und Sprechübungen
• Metadaten zur Sitzung (Zeitpunkt, Niveau, Modul)
• Optional gespeicherte AI-Berichte (derzeit lokal im Browser)`,
      },
      {
        heading: "3. Verarbeitung in der Beta",
        body: "In der Closed Beta werden AI-Anfragen über einen Server-Proxy geleitet. Eine produktive AI-Anbindung mit Vertrags- und Sicherheitsprüfung ist geplant. Bis dahin sollten Sie keine besonders sensiblen personenbezogenen Daten in AI-Felder eingeben.",
      },
      {
        heading: "4. Drittanbieter",
        body: `Geplanter Anbieter: ${legalField(LEGAL_OPERATOR.aiProvider, "AI-Anbieter")}. Vor Produktivstart: Auftragsverarbeitungsvertrag, Transfer-Mechanismen (z. B. Standardvertragsklauseln) und Dokumentation.`,
      },
      {
        heading: "5. Speicherdauer",
        body: "AI-Eingaben werden nicht dauerhaft zu Trainingszwecken des Anbieters genutzt, soweit vertraglich so vereinbart. Konkrete Aufbewahrungsfristen werden mit dem Backend dokumentiert.",
      },
      {
        heading: "6. Ihre Wahlmöglichkeiten",
        body: "Sie können AI-Funktionen unterlassen und weiterhin statische Übungsinhalte nutzen. Gespeicherte Berichte können in den Kontoeinstellungen gelöscht werden (Beta: lokal).",
      },
      {
        heading: "7. Kontakt",
        body: `Datenschutz-Anfragen: ${formatPrivacyEmail(LEGAL_OPERATOR)}`,
      },
    ],
  },
};

export const LEGAL_PAGE_IDS = Object.keys(LEGAL_PAGES);
