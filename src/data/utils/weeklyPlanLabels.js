export const COACH_TYPE_LABELS = {
  speaking: 'Sprechen',
  listening: 'Hören',
  reading: 'Lesen',
  email: 'Schreiben',
  grammar: 'Grammatik',
};

export const SKILL_LABELS = {
  selbstvorstellung: 'Selbstvorstellung',
  hoeren: 'Hören',
  bildbeschreibung: 'Bildbeschreibung',
  planung: 'Aufgabe lösen',
  aufgabe_loesen: 'Aufgabe lösen',
  lesen: 'Lesen',
  schreiben: 'Schreiben',
  diskussion: 'Diskussion',
  grammatik: 'Grammatik',
  satzbau: 'Grammatik',
  konnektoren: 'Grammatik',
  grafikbeschreibung: 'Bildbeschreibung',
};

export const SKILL_ICONS = {
  hoeren: '🎧',
  bildbeschreibung: '🖼️',
  grafikbeschreibung: '🖼️',
  grammatik: '📝',
  satzbau: '📝',
  konnektoren: '📝',
  schreiben: '✉️',
  lesen: '📖',
  diskussion: '💬',
  planung: '📞',
  aufgabe_loesen: '📞',
  selbstvorstellung: '💬',
};

export const COACH_TYPE_ICONS = {
  speaking: '💬',
  listening: '🎧',
  reading: '📖',
  email: '✉️',
  grammar: '📝',
};

function skillLabelFallback(task) {
  if (!task) return 'Übung';
  const skill = String(task.skill || '').toLowerCase();
  if (skill && SKILL_LABELS[skill]) {
    return SKILL_LABELS[skill];
  }
  const coachType = task.coachType;
  if (coachType && COACH_TYPE_LABELS[coachType]) {
    return COACH_TYPE_LABELS[coachType];
  }
  return 'Übung';
}

/**
 * Learner-facing activity title — activity-first with safe fallbacks for legacy plans.
 * @param {{ activityName?: string, title?: string, skill?: string, coachType?: string } | null} task
 * @param {{ activityName?: string, coachType?: string } | null} [exercise]
 */
export function getExerciseCardTitle(task, exercise = null) {
  const persisted = String(exercise?.activityName || '').trim();
  if (persisted) return persisted;

  const fromTask = String(task?.activityName || '').trim();
  if (fromTask) return fromTask;

  const fromTitle = String(task?.title || '').trim();
  if (fromTitle) return fromTitle;

  return skillLabelFallback(task || exercise);
}

/**
 * Short card subtitle — library title or truncated task hint (not the full prompt).
 * @param {{ task?: string, title?: string } | null} libraryTask
 */
export function getExerciseCardSubtitle(libraryTask) {
  if (!libraryTask) return 'Kurze Übung mit deinem Coach.';

  const title = String(libraryTask.title || '').trim();
  if (title) {
    const sentence = title.endsWith('.') ? title : `${title}.`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  const raw = String(libraryTask.task || '').trim();
  if (!raw) return 'Kurze Übung mit deinem Coach.';

  const maxLen = 80;
  const clipped = raw.length > maxLen ? `${raw.slice(0, maxLen - 1).trim()}…` : raw;
  const sentence = clipped.endsWith('.') ? clipped : `${clipped}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * @param {{ skill?: string, coachType?: string } | null} task
 */
export function getExerciseIcon(task) {
  if (!task) return '⭐';
  const skill = String(task.skill || '').toLowerCase();
  if (skill && SKILL_ICONS[skill]) return SKILL_ICONS[skill];
  return coachTypeIcon(task.coachType);
}

export function focusName(skill) {
  return SKILL_LABELS[skill] || skill || 'Training';
}

export function coachTypeLabel(coachType) {
  return COACH_TYPE_LABELS[coachType] || 'Übung';
}

export function coachTypeIcon(coachType) {
  return COACH_TYPE_ICONS[coachType] || '⭐';
}

export function exerciseStatusLabel(status) {
  if (status === 'completed') return 'Erledigt';
  if (status === 'in_progress') return 'Läuft';
  return 'Offen';
}

export function planStatusLabel(status) {
  if (status === 'completed') return 'Abgeschlossen';
  if (status === 'in_progress') return 'Aktiv';
  if (status === 'available') return 'Bereit';
  return 'Gesperrt';
}
