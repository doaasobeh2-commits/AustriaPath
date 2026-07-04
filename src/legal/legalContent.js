import { LEGAL_LAST_UPDATED } from "./legalVersions";

export const LEGAL_PAGES = {
  impressum: {
    title: "Impressum",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        heading: "Medieninhaber und Herausgeber",
        body: `AustriaPath
[Vor- und Nachname / Firma eintragen]
[Straße und Hausnummer eintragen]
[PLZ Ort, Österreich eintragen]`,
      },
      {
        heading: "Kontakt",
        body: `E-Mail: [kontakt@austriaPath.at eintragen]
Telefon: [optional eintragen]
Website: https://[Ihre-Domain].at`,
      },
      {
        heading: "Unternehmensgegenstand",
        body: "Betrieb einer digitalen Lernplattform für Deutsch als Zweitsprache und ÖIF-Prüfungsvorbereitung (Web-App).",
      },
      {
        heading: "UID-Nummer / Firmenbuch",
        body: "[UID-Nummer eintragen, falls vorhanden]\n[Firmenbuchnummer eintragen, falls eingetragen]",
      },
      {
        heading: "Mitgliedschaft bei der Wirtschaftskammer",
        body: "[Wirtschaftskammer / Fachgruppe eintragen, falls zutreffend]",
      },
      {
        heading: "Berufsrechtliche Vorschriften",
        body: "Es besteht keine behördliche Zulassung als Prüfungsinstitut. AustriaPath ist eine unabhängige Lernplattform und steht in keiner Verbindung zu Behörden, Sprachschulen oder offiziellen Prüfungsinstituten.",
      },
      {
        heading: "Online-Streitbeilegung",
        body: "Verbraucher haben die Möglichkeit, Beschwerden an die Online-Streitbeilegungsplattform der EU zu richten: https://ec.europa.eu/consumers/odr\nWir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen, sofern nicht gesetzlich zwingend.",
      },
    ],
  },

  datenschutz: {
    title: "Datenschutzerklärung",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED} · DSGVO-konform`,
    sections: [
      {
        heading: "1. Verantwortlicher",
        body: "Verantwortlich für die Datenverarbeitung ist der in Impressum genannte Medieninhaber von AustriaPath. Kontakt: siehe Impressum / Kontakt.",
      },
      {
        heading: "2. Überblick",
        body: "AustriaPath verarbeitet personenbezogene Daten nur, soweit dies für den Betrieb der Lernplattform erforderlich ist. Wir verkaufen keine personenbezogenen Daten. Details zu AI-Daten finden Sie in der AI-Datenschutzrichtlinie (Dokumentation).",
      },
      {
        heading: "3. Verarbeitete Datenkategorien",
        body: `• Kontodaten: Name, E-Mail, Passwort (bis Backend-Migration clientseitig), Lernniveau, Sprache
• Nutzungsdaten: Trainingsfortschritt, gespeicherte AI-Berichte, Abonnementstatus (lokal)
• Technische Daten: Geräteinformationen im Browser, lokale Speicherung (localStorage)
• Profilbild: optional, lokal gespeichert
• Kommunikation: Kontaktanfragen per E-Mail (wenn genutzt)`,
      },
      {
        heading: "4. Rechtsgrundlagen (Art. 6 DSGVO)",
        body: `• Vertragserfüllung (Art. 6 Abs. 1 lit. b): Bereitstellung der Lernplattform
• Einwilligung (Art. 6 Abs. 1 lit. a): Registrierung, AI-Funktionen, optionale Cookies
• Berechtigtes Interesse (Art. 6 Abs. 1 lit. f): Sicherheit, Missbrauchsprävention
• Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c): Aufbewahrung wo gesetzlich erforderlich`,
      },
      {
        heading: "5. Speicherdauer",
        body: "Personenbezogene Daten werden nur so lange gespeichert, wie für den jeweiligen Zweck erforderlich oder gesetzlich vorgeschrieben. Nach Konto-Löschung werden personenbezogene Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzliche Aufbewahrungspflicht entgegensteht. Details siehe GDPR-Readiness-Review.",
      },
      {
        heading: "6. Empfänger und Drittländer",
        body: `• OpenAI (USA): Verarbeitung von Prüfungstexten über gesicherten Server-Proxy (geplant). Standardvertragsklauseln und Datenschutz-Folgenabschätzung erforderlich vor Produktivstart.
• Hosting-Anbieter: [einsetzen vor Launch]
Keine Weitergabe zu Werbezwecken.`,
      },
      {
        heading: "7. Ihre Rechte",
        body: `Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf erteilter Einwilligungen. Beschwerderecht bei der Österreichischen Datenschutzbehörde (https://www.dsb.gv.at). Kontakt: siehe Kontaktseite.`,
      },
      {
        heading: "8. Datensicherheit",
        body: "Wir setzen technische und organisatorische Maßnahmen ein (Verschlüsselung in Transit, Zugriffskontrollen, Backend-Härtung). Details siehe Backend Security Requirements und Launch Checklist.",
      },
      {
        heading: "9. Minderjährige",
        body: "Die Nutzung durch Personen unter 14 Jahren ist nur mit Zustimmung der Erziehungsberechtigten gestattet.",
      },
      {
        heading: "10. Änderungen",
        body: "Bei wesentlichen Änderungen informieren wir in der App. Neue Versionen können eine erneute Zustimmung erfordern.",
      },
    ],
  },

  agb: {
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        heading: "1. Geltungsbereich",
        body: "Diese AGB gelten für die Nutzung der AustriaPath Web-App durch registrierte Nutzer. Abweichende Bedingungen gelten nur bei ausdrücklicher schriftlicher Vereinbarung.",
      },
      {
        heading: "2. Leistungsbeschreibung",
        body: "AustriaPath bietet digitale Lerninhalte, Übungen und optionale AI-gestützte Prüfungssimulationen zur Vorbereitung auf Deutsch- und ÖIF-Prüfungen. Es handelt sich nicht um offizielle Prüfungen oder Zertifizierungen.",
      },
      {
        heading: "3. Registrierung und Konto",
        body: "Nutzer müssen wahrheitsgemäße Angaben machen und Zugangsdaten geheim halten. Missbrauch muss unverzüglich gemeldet werden. Der Betreiber kann Konten bei Verstößen sperren oder löschen.",
      },
      {
        heading: "4. Nutzungsrechte",
        body: "Inhalte der Plattform sind urheberrechtlich geschützt. Eine Nutzung ist nur für persönliche Lernzwecke gestattet. Vervielfältigung, Weitergabe oder kommerzielle Nutzung ohne Zustimmung ist untersagt.",
      },
      {
        heading: "5. AI-Funktionen",
        body: "AI-Bewertungen sind Lernhilfen und ersetzen keine menschliche Prüferentscheidung. Details siehe AI-Disclaimer und AI-Transparency-Dokument. Der Betreiber haftet nicht für AI-Fehler, soweit gesetzlich zulässig.",
      },
      {
        heading: "6. Premium und Zahlungen",
        body: "Preise, Laufzeiten und Kündigungsbedingungen für Premium-Leistungen werden vor Abschluss angezeigt. Bis zur Backend-Integration können Premium-Funktionen testweise lokal verwaltet werden.",
      },
      {
        heading: "7. Verfügbarkeit",
        body: "Der Betreiber bemüht sich um hohe Verfügbarkeit, garantiert diese jedoch nicht. Wartungsfenster und technische Störungen können zu Unterbrechungen führen.",
      },
      {
        heading: "8. Haftung",
        body: "Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig. Für Vorsatz und grobe Fahrlässigkeit sowie Personenschäden haftet der Betreiber nach gesetzlichen Vorschriften. Prüfungsergebnisse in echten ÖIF-Prüfungen werden nicht garantiert.",
      },
      {
        heading: "9. Kündigung",
        body: "Nutzer können ihr Konto jederzeit löschen (siehe Datenschutzerklärung). Der Betreiber kann bei schwerwiegenden Verstößen fristlos kündigen.",
      },
      {
        heading: "10. Anwendbares Recht",
        body: "Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist, soweit zulässig, der Sitz des Betreibers in Österreich.",
      },
    ],
  },

  kontakt: {
    title: "Kontakt",
    subtitle: "Wir helfen bei Fragen zu Konto, Datenschutz und Support.",
    sections: [
      {
        heading: "Allgemeine Anfragen",
        body: "E-Mail: [kontakt@austriaPath.at eintragen]\nAntwortzeit: in der Regel innerhalb von 3 Werktagen.",
      },
      {
        heading: "Datenschutz",
        body: "Für Auskunfts-, Lösch- oder Exportanfragen gemäß DSGVO:\nE-Mail: [datenschutz@austriaPath.at eintragen]\nBetreff: „DSGVO-Anfrage“",
      },
      {
        heading: "Impressum",
        body: "Vollständige Anbieterkennzeichnung finden Sie unter Impressum.",
      },
    ],
  },

  cookies: {
    title: "Cookie-Richtlinie",
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        heading: "1. Was sind Cookies und lokale Speicher?",
        body: "AustriaPath verwendet primär localStorage im Browser (keine klassischen Tracking-Cookies). Diese speichern Login-Status, Lernfortschritt und Einstellungen lokal auf Ihrem Gerät.",
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
        heading: "Keine offizielle Prüfung",
        body: "AI-gestützte Funktionen in AustriaPath simulieren Prüfungssituationen zu Lernzwecken. Sie stellen keine ÖIF-Prüfung, keine Behördenentscheidung und keine Zertifizierung dar.",
      },
      {
        heading: "Kein zertifizierter Prüfer",
        body: "Die AI ist kein menschlicher Prüfer und nicht bei Behörden akkreditiert. Bewertungen können unvollständig oder fehlerhaft sein.",
      },
      {
        heading: "Lernempfehlung",
        body: "Nutzen Sie AI-Feedback als Ergänzung zu Unterricht, Selbststudium und offiziellen Materialien — nicht als alleinige Prüfungsvorbereitung.",
      },
      {
        heading: "Examiner Lab",
        body: "Manuell ausgewählte Beispielprüfungen im Examiner Lab dienen dem internen Regelabgleich mit menschlichen Prüfern und werden nicht als offizielle Bewertung ausgegeben.",
      },
      {
        heading: "Haftung",
        body: "Der Betreiber übernimmt keine Haftung für Entscheidungen, die allein auf AI-Feedback basieren, soweit gesetzlich zulässig.",
      },
      {
        heading: "Weitere Informationen",
        body: "Siehe AI Transparency und AI Privacy Policy (Projektdokumentation).",
      },
    ],
  },
};

export const LEGAL_PAGE_IDS = Object.keys(LEGAL_PAGES);
