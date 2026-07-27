/**
 * A2 Email Library for Weekly AI Coach.
 * Content-only task definitions — no solutions, samples, or AI prompts.
 * @module data/weeklyPlanA2EmailLibrary
 */

/**
 * @typedef {Object} WeeklyPlanEmailTask
 * @property {string} id
 * @property {'A2'} level
 * @property {'email'} category
 * @property {string} title
 * @property {string} scenario
 * @property {string[]} taskPoints
 */

/** @type {WeeklyPlanEmailTask[]} */
export const weeklyPlanA2EmailLibrary = [
  {
    id: 'A2-EM-001',
    level: 'A2',
    category: 'email',
    title: 'Online-Bestellung',
    scenario: 'Du hast etwas online bei der Firma Technix bestellt.',
    taskPoints: ['Grund des Schreibens', 'Wann hast du bestellt?', 'Preis'],
  },
  {
    id: 'A2-EM-002',
    level: 'A2',
    category: 'email',
    title: 'Pflege-Ausbildung',
    scenario: 'Sie haben eine Anzeige über eine Pflege-Ausbildung gelesen.',
    taskPoints: [
      'Stellen Sie sich kurz vor.',
      'Stellen Sie zwei Fragen zur Ausbildung.',
      'Fragen Sie nach einem Termin für ein Vorstellungsgespräch.',
    ],
  },
  {
    id: 'A2-EM-003',
    level: 'A2',
    category: 'email',
    title: 'Kurs findet oft nicht statt',
    scenario:
      'Sie besuchen seit drei Wochen einen Kurs, aber der Kurs findet oft nicht statt.',
    taskPoints: ['Welcher Kurs und wann?', 'Warum ist das ein Problem?', 'Was möchten Sie?'],
  },
  {
    id: 'A2-EM-004',
    level: 'A2',
    category: 'email',
    title: 'Nachbarin und Garten',
    scenario: 'Ihre Nachbarin hat sich während Ihres Urlaubs um Ihren Garten gekümmert.',
    taskPoints: [
      'Bedanken Sie sich.',
      'Was soll sie noch in Ihrem Haus machen?',
      'Den Schlüssel zurückgeben.',
    ],
  },
  {
    id: 'A2-EM-005',
    level: 'A2',
    category: 'email',
    title: 'Backkurs',
    scenario: 'Sie möchten sich für einen Backkurs anmelden.',
    taskPoints: [
      'Warum möchten Sie diesen Kurs besuchen?',
      'Welche Anforderungen gibt es?',
      'Stellen Sie Fragen zum Kurs.',
    ],
  },
  {
    id: 'A2-EM-006',
    level: 'A2',
    category: 'email',
    title: 'Zahnarzttermin absagen',
    scenario: 'Sie möchten einen Termin beim Zahnarzt absagen.',
    taskPoints: [
      'Entschuldigung',
      'Wann war der Termin?',
      'Warum können Sie nicht kommen?',
      'Bitten Sie um einen neuen Termin.',
    ],
  },
  {
    id: 'A2-EM-007',
    level: 'A2',
    category: 'email',
    title: 'Taschen im Treppenhaus',
    scenario: 'Ihr Hausbesitzer informiert Sie über Taschen im Treppenhaus.',
    taskPoints: [
      'Warum schreiben Sie?',
      'Erklären Sie, dass die Taschen nicht Ihnen gehören.',
      'Was soll der Hausbesitzer tun?',
    ],
  },
  {
    id: 'A2-EM-008',
    level: 'A2',
    category: 'email',
    title: 'Kinderbetreuung',
    scenario: 'Sie haben eine Anzeige einer Kinderbetreuung gelesen.',
    taskPoints: [
      'Warum brauchen Sie die Kinderbetreuung?',
      'Betreuungszeiten',
      'Informationen über Ihr Kind',
    ],
  },
  {
    id: 'A2-EM-009',
    level: 'A2',
    category: 'email',
    title: 'Kindergarten',
    scenario: 'Sie möchten Ihr Kind im Kindergarten anmelden.',
    taskPoints: [
      'Warum haben Sie diesen Kindergarten gewählt?',
      'Informationen zum Essen',
      'Besondere Aktivitäten',
    ],
  },
  {
    id: 'A2-EM-010',
    level: 'A2',
    category: 'email',
    title: 'Familienreise',
    scenario: 'Sie möchten eine Familienreise buchen.',
    taskPoints: ['Welche Reise?', 'Was möchten Sie dort machen?', 'Reisedatum', 'Preis'],
  },
  {
    id: 'A2-EM-011',
    level: 'A2',
    category: 'email',
    title: 'Zimmer streichen',
    scenario: 'Sie möchten ein Zimmer streichen lassen.',
    taskPoints: [
      'Warum?',
      'Welches Zimmer und welche Farbe?',
      'Wann soll die Arbeit beginnen und wie lange dauern?',
    ],
  },
  {
    id: 'A2-EM-012',
    level: 'A2',
    category: 'email',
    title: 'Reise nach Tirol',
    scenario: 'Sie möchten eine Reise nach Tirol buchen.',
    taskPoints: ['Erfahrung mit Skifahren', 'Wunschtermin', 'Wünsche für das Zimmer'],
  },
  {
    id: 'A2-EM-013',
    level: 'A2',
    category: 'email',
    title: 'Garagenplatz kündigen',
    scenario: 'Sie möchten Ihren Garagenplatz kündigen.',
    taskPoints: ['Grund der Kündigung', 'Bis wann bezahlen?', 'Vorschlag für einen neuen Mieter'],
  },
  {
    id: 'A2-EM-014',
    level: 'A2',
    category: 'email',
    title: 'Geburtstag',
    scenario: 'Sie können nicht zu einem 50. Geburtstag kommen.',
    taskPoints: ['Glückwünsche und Entschuldigung', 'Warum kommen Sie nicht?', 'Geschenk'],
  },
  {
    id: 'A2-EM-015',
    level: 'A2',
    category: 'email',
    title: 'Fotokurs',
    scenario: 'Sie möchten sich für einen Fotokurs anmelden.',
    taskPoints: [
      'Warum möchten Sie teilnehmen?',
      'Sie haben keine Kamera.',
      'Stellen Sie eine Frage zum Kurs.',
    ],
  },
  {
    id: 'A2-EM-016',
    level: 'A2',
    category: 'email',
    title: 'Termin beim Arbeitsamt',
    scenario: 'Sie haben einen Termin beim Arbeitsamt und können nicht kommen.',
    taskPoints: [
      'Entschuldigung',
      'Warum können Sie nicht kommen?',
      'Bitten Sie um einen neuen Termin.',
    ],
  },
  {
    id: 'A2-EM-017',
    level: 'A2',
    category: 'email',
    title: 'Hund mit zur Arbeit',
    scenario: 'Sie möchten Ihren Hund mit zur Arbeit nehmen.',
    taskPoints: ['Warum?', 'Wie oft?', 'Eigenschaften des Hundes'],
  },
  {
    id: 'A2-EM-018',
    level: 'A2',
    category: 'email',
    title: 'Schulfest',
    scenario: 'Ihr Kind hat ein Schulfest.',
    taskPoints: [
      'Warum mögen Sie das Schulfest?',
      'Was möchten Sie machen?',
      'Informationen zum Schulfest',
    ],
  },
  {
    id: 'A2-EM-019',
    level: 'A2',
    category: 'email',
    title: 'Verlorener Mantel',
    scenario: 'Sie haben Ihren Mantel im Restaurant vergessen.',
    taskPoints: ['Was ist passiert?', 'Was möchten Sie?', 'Größe und Farbe des Mantels'],
  },
  {
    id: 'A2-EM-020',
    level: 'A2',
    category: 'email',
    title: 'Geschenk liefern',
    scenario: 'Sie möchten ein Geschenk mit einem Lebensmittelkorb verschicken.',
    taskPoints: ['Welches Geschenk?', 'Wohin soll geliefert werden?', 'Kosten'],
  },
];

/**
 * @param {string} id
 * @returns {WeeklyPlanEmailTask|undefined}
 */
export function getA2EmailTaskById(id) {
  return weeklyPlanA2EmailLibrary.find((task) => task.id === id);
}
