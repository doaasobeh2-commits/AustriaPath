/**
 * A2 Schreiben evaluation metadata — linked to weekly-plan schreiben tasks.
 */
/** @type {Record<string, object>} */
export const A2_SCHREIBEN_EVALUATION_BY_TASK_ID = {
  'a2-schreiben-001': {
    scenario:
      'Sie können morgen nicht zum Deutschkurs kommen. Schreiben Sie eine kurze E-Mail an Ihren Kursleiter.',
    recipient: 'Ihr Deutschkursleiter / Ihre Deutschkursleiterin',
    context: 'Formelle oder halbformelle E-Mail an den Sprachkurs',
    taskPoints: [
      'Warum Sie morgen nicht kommen können',
      'Wann Sie wieder zum Kurs kommen',
      'Eine kurze Entschuldigung',
    ],
    pointKeywords: [
      ['weil', 'leider', 'kann nicht', 'arzt', 'termin', 'krank', 'arbeit', 'grund'],
      ['wieder', 'nächste woche', 'montag', 'dienstag', 'komme', 'zurück', 'wann'],
      ['entschuld', 'tut mir leid', 'sorry', 'leid'],
    ],
    modelAnswer: `Betreff: Ich kann morgen nicht zum Kurs kommen

Sehr geehrter Herr Müller,

leider kann ich morgen nicht zum Deutschkurs kommen, weil ich einen Arzttermin habe. Nächste Woche bin ich wieder da.

Es tut mir leid für die kurzfristige Absage.

Viele Grüße
Anna Berger`,
    vocabularyHints: ['Kurs', 'leider', 'weil', 'Entschuldigung', 'Grüße'],
    grammarChecks: [
      { pattern: /\bweil\s+ich\s+bin\b/i, message: 'Nach „weil“ steht das Verb am Satzende (… weil ich krank bin).' },
      { pattern: /\bweil\s+ich\s+habe\b/i, message: 'Nach „weil“ steht das Verb am Satzende.' },
    ],
  },
  'a2-schreiben-002': {
    scenario:
      'Sie möchten am Wochenende mit Ihrer Freundin Sara einkaufen gehen. Schreiben Sie ihr eine kurze Nachricht.',
    recipient: 'Ihre Freundin Sara',
    context: 'Informelle Nachricht an eine Freundin',
    taskPoints: ['Welcher Tag', 'Uhrzeit', 'Treffpunkt'],
    pointKeywords: [
      ['samstag', 'sonntag', 'wochenende', 'tag', 'morgen'],
      ['uhr', 'zeit', 'um ', 'halb', 'viertel'],
      ['treff', 'platz', 'stadt', 'zentrum', 'bahnhof', 'supermarkt', 'vor'],
    ],
    modelAnswer: `Hallo Sara,

am Samstag möchte ich mit dir einkaufen gehen. Passt es dir um 14 Uhr?

Wir können uns vor dem Supermarkt im Stadtzentrum treffen.

Ich freue mich auf deine Antwort.

Liebe Grüße
Anna`,
    vocabularyHints: ['einkaufen', 'treffen', 'Uhrzeit', 'Samstag', 'Grüße'],
    grammarChecks: [
      { pattern: /\bmit\s+dich\b/i, message: 'Nach „mit“ steht der Dativ: „mit dir“.' },
    ],
  },
  'a2-schreiben-003': {
    scenario: 'Sie möchten sich für einen Sprachkurs anmelden. Schreiben Sie kurze Angaben über sich.',
    recipient: 'Die Sprachschule / das Sekretariat',
    context: 'Kurze Vorstellung für eine Kursanmeldung',
    taskPoints: ['Ihr Name', 'Ihre Adresse', 'Ihre Telefonnummer', 'Ihr Geburtsdatum'],
    pointKeywords: [
      ['name', 'heiße', 'ich bin'],
      ['adresse', 'straße', 'wohn', 'plz', 'stadt', 'gasse'],
      ['telefon', 'handy', 'nummer', 'mobil', '0660', '0676'],
      ['geboren', 'geburtsdatum', 'geburtstag', 'datum'],
    ],
    modelAnswer: `Betreff: Anmeldung für den Deutschkurs

Sehr geehrte Damen und Herren,

mein Name ist Anna Berger. Ich wohne in der Hauptstraße 10, 1010 Wien.
Meine Telefonnummer ist 0660 1234567.
Ich bin am 12. März 1995 geboren.

Mit freundlichen Grüßen
Anna Berger`,
    vocabularyHints: ['Name', 'Adresse', 'Telefonnummer', 'Geburtsdatum', 'Grüße'],
    grammarChecks: [],
  },
};

/**
 * @param {object} task
 */
export function getA2SchreibenEvaluation(task) {
  if (!task?.id) return null;
  return A2_SCHREIBEN_EVALUATION_BY_TASK_ID[task.id] || null;
}

/**
 * @param {object} task
 */
export function isA2SchreibenEvaluationTask(task) {
  return Boolean(task?.level === 'A2' && task?.skill === 'schreiben' && getA2SchreibenEvaluation(task));
}
