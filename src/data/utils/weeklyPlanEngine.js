// src/data/utils/weeklyPlanEngine.js

export function getPlacementProfile() {
  try {
    return JSON.parse(localStorage.getItem('austriaPathPlacementProfile'));
  } catch {
    return null;
  }
}

export function buildWeeklyPlan({ selectedLevel, selectedDays, selectedTime, focusAreas = [] }) {
  const placement = getPlacementProfile();

  const level = placement?.level?.replace('+', '') || selectedLevel || 'B1';

  const focus =
    placement?.recommendedFocus?.length
      ? placement.recommendedFocus
      : focusAreas.length
      ? focusAreas
      : ['selbstvorstellung', 'hoeren', 'planung'];

  const sessions = [
    {
      id: 1,
      day: selectedDays[0] || 'Montag',
      time: selectedTime || '19:00',
      title: 'Sitzung 1',
      duration: 20,
      focus: focus[0] || 'selbstvorstellung',
      linkedTabs: ['speaking'],
      task: getSessionTask(level, focus[0] || 'selbstvorstellung'),
      status: 'geplant',
    },
    {
      id: 2,
      day: selectedDays[1] || 'Mittwoch',
      time: selectedTime || '19:00',
      title: 'Sitzung 2',
      duration: 20,
      focus: focus[1] || 'hoeren',
      linkedTabs: ['hoeren', 'images'],
      task: getSessionTask(level, focus[1] || 'hoeren'),
      status: 'geplant',
    },
    {
      id: 3,
      day: selectedDays[2] || 'Samstag',
      time: selectedTime || '10:00',
      title: 'Sitzung 3',
      duration: 20,
      focus: focus[2] || 'planung',
      linkedTabs: ['speaking'],
      task: getSessionTask(level, focus[2] || 'planung'),
      status: 'geplant',
    },
  ];

  return {
    id: Date.now(),
    type: 'weekly_ai_plan',
    level,
    source: placement ? 'placement' : 'manual',
    totalMinutes: sessions.reduce((sum, session) => sum + session.duration, 0),
    createdAt: new Date().toISOString(),
    focusAreas: focus,
    sessions,
  };
}

function getSessionTask(level, focus) {
  const tasks = {
    selbstvorstellung: `${level} Selbstvorstellung trainieren: frei sprechen, Nachfragen beantworten und bessere Sätze bilden.`,
    hoeren: `${level} Hören trainieren: kostenlose Hörmodelle üben, Informationen erkennen und Antworten formulieren.`,
    bildbeschreibung: `${level} Bildbeschreibung trainieren: kostenlose Bildmodelle üben, Meinung und eigene Erfahrung nennen.`,
    planung: `${level} Planung trainieren: gemeinsam planen, Vorschläge machen, begründen und Alternativen nennen.`,
    grafikbeschreibung: `${level} Grafikbeschreibung trainieren: Thema, wichtigste Werte, Vergleich, Interpretation und eigene Meinung üben.`,
diskussion: `${level} Diskussion trainieren: Meinung sagen, begründen, Beispiele geben und auf Gegenargumente reagieren.`,
    lesen: `${level} Lesen trainieren: kostenlose Lesemodelle bearbeiten und wichtige Informationen markieren.`,
    schreiben: `${level} Schreiben trainieren: kostenlose Schreibmodelle lesen und Satzbau verbessern.`,
  };

  return tasks[focus] || `${level} gezielt mit kostenlosen Modellen trainieren.`;
}

export function saveWeeklyPlan(plan) {
  localStorage.setItem('austriaPathWeeklyPlan', JSON.stringify(plan));
}

export function getWeeklyPlan() {
  try {
    return JSON.parse(localStorage.getItem('austriaPathWeeklyPlan'));
  } catch {
    return null;
  }
}