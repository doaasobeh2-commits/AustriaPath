/**
 * Canonical learner-facing activity names for the Weekly Plan coach-v1 product.
 * Data only — no generation logic.
 */

/** @type {Record<'A2'|'B1'|'B2', Record<string, string[]>>} */
export const WEEKLY_PLAN_ACTIVITY_CATALOG = {
  A2: {
    listening: [
      'Nachricht anhören',
      'Kurzes Gespräch hören',
      'Informationen verstehen',
    ],
    reading: [
      'Kurzen Text lesen',
      'Informationen finden',
      'Fragen beantworten',
    ],
    writing: [
      'E-Mail schreiben',
      'Nachricht schreiben',
      'Formular ausfüllen',
    ],
    grammar: [
      'Lückentext',
      'Sätze verbinden',
      'Satz richtig bilden',
    ],
    speaking: [
      'Bild beschreiben',
      'Über sich sprechen',
      'Aufgabe lösen',
    ],
  },
  B1: {
    listening: [
      'Interview anhören',
      'Alltagsgespräch verstehen',
      'Informationen auswählen',
    ],
    reading: [
      'Artikel lesen',
      'Text verstehen',
      'Aussagen zuordnen',
    ],
    writing: [
      'E-Mail schreiben',
      'Meinung schreiben',
      'Beschwerde schreiben',
    ],
    grammar: [
      'Lückentext',
      'Fehler korrigieren',
      'Satz umformen',
    ],
    speaking: [
      'Situation beschreiben',
      'Gespräch führen',
      'Gemeinsam planen',
    ],
  },
  B2: {
    listening: [
      'Diskussion anhören',
      'Vortrag verstehen',
      'Informationen analysieren',
    ],
    reading: [
      'Artikel analysieren',
      'Argumente verstehen',
      'Aussagen bewerten',
    ],
    writing: [
      'Formelle E-Mail schreiben',
      'Stellungnahme schreiben',
      'Argumentation schreiben',
    ],
    grammar: [
      'Komplexe Strukturen',
      'Fehler korrigieren',
      'Satz umformulieren',
    ],
    speaking: [
      'Grafik beschreiben',
      'Situation analysieren',
      'Diskussion führen',
    ],
  },
};

/**
 * @param {string} level
 * @returns {'A2'|'B1'|'B2'|null}
 */
export function normalizeCatalogLevel(level = 'B1') {
  const raw = String(level).trim().toUpperCase();
  if (raw.startsWith('A2')) return 'A2';
  if (raw.startsWith('B1')) return 'B1';
  if (raw.startsWith('B2')) return 'B2';
  return null;
}

/**
 * @param {string} level
 * @returns {string[]}
 */
export function getActivityNamesForLevel(level) {
  const normalized = normalizeCatalogLevel(level);
  if (!normalized || !WEEKLY_PLAN_ACTIVITY_CATALOG[normalized]) return [];
  return Object.values(WEEKLY_PLAN_ACTIVITY_CATALOG[normalized]).flat();
}

/**
 * @param {string} level
 * @param {string} activityName
 * @returns {boolean}
 */
export function isValidActivityNameForLevel(level, activityName) {
  if (!activityName) return false;
  return getActivityNamesForLevel(level).includes(String(activityName).trim());
}
