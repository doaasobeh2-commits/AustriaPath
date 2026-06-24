// src/data/utils/placementEngine.js

export function evaluateSkillLevel({ selectedLevel = 'A2', skillScores = {} }) {
  const values = Object.values(skillScores || {});

  const count = {
    A2: values.filter((v) => v === 'A2').length,
    A2PLUS: values.filter((v) => v === 'A2+').length,
    B1: values.filter((v) => v === 'B1').length,
    B1PLUS: values.filter((v) => v === 'B1+').length,
    B2: values.filter((v) => v === 'B2').length,
  };

  if (count.B2 >= 2) return 'B2';
  if (count.B1PLUS >= 2 && count.B2 >= 1) return 'B2';
  if (count.B1PLUS >= 2) return 'B1+';
  if (count.B1 >= 2 || count.B1PLUS >= 1) return 'B1';
  if (count.A2PLUS >= 2 || count.B1 === 1) return 'A2+';

  if (selectedLevel === 'B1' && count.A2 >= 3) return 'A2+';
  if (selectedLevel === 'B2' && count.B1 >= 2) return 'B1+';

  return 'A2';
}

export function buildPlacementProfile({ selectedLevel = 'A2', skillScores = {} }) {
  const level = evaluateSkillLevel({ selectedLevel, skillScores });

  const strengths = [];
  const weaknesses = [];
  const focusAreas = [];

  Object.entries(skillScores).forEach(([skill, value]) => {
    if (value === 'B1' || value === 'B1+' || value === 'B2') {
      strengths.push(skill);
    }

    if (value === 'A2') {
      weaknesses.push(skill);
      focusAreas.push(skill);
    }

    if (value === 'A2+') {
      focusAreas.push(skill);
    }
  });

  const studyPlan = buildStudyPlan(level, focusAreas);

  return {
    level,
    selectedStartLevel: selectedLevel,
    date: new Date().toISOString(),
    skillScores,
    strengths,
    weaknesses,
    focusAreas,
    recommendedFocus: focusAreas,
    studyPlan,
  };
}

function buildStudyPlan(level, focusAreas = []) {
  const defaultFocus = ['bildbeschreibung', 'hoeren', 'planung'];
  const focus = focusAreas.length > 0 ? focusAreas : defaultFocus;

  const first = focus[0] || 'bildbeschreibung';
  const second = focus[1] || 'hoeren';
  const third = focus[2] || 'planung';

  return [
    {
      day: 'Tag 1',
      task: buildTaskText(level, first),
      focus: first,
    },
    {
      day: 'Tag 3',
      task: buildTaskText(level, second),
      focus: second,
    },
    {
      day: 'Tag 5',
      task: buildTaskText(level, third),
      focus: third,
    },
    {
      day: 'Tag 7',
      task: `${level} kurze Wiederholung: Fehler wiederholen, laut sprechen und eine kleine Probeprüfung machen.`,
      focus: 'prüfungsvorbereitung',
    },
  ];
}

function buildTaskText(level, skill) {
  const tasks = {
    selbstvorstellung: `${level} Selbstvorstellung üben: 1 Minute frei sprechen, dann 3 Nachfragen beantworten.`,
    bildbeschreibung: `${level} Bildbeschreibung üben: Personen, Ort, Handlung, Meinung und eigene Erfahrung nennen.`,
    grafikbeschreibung: `${level} Grafikbeschreibung üben: Thema, wichtigste Werte, Vergleich, Interpretation und Meinung nennen.`,
    hoeren: `${level} Hören üben: kurze Nachricht hören, Hauptinformationen notieren und in ganzen Sätzen antworten.`,
    planung: `${level} Planung üben: Vorschläge machen, begründen, zustimmen, ablehnen und Alternativen nennen.`,
    diskussion: `${level} Diskussion üben: Meinung sagen, begründen, Beispiel geben und Gegenargument nennen.`,
  };

  return tasks[skill] || `${level} ${skill} gezielt üben.`;
}

export function savePlacementProfile(profile) {
  localStorage.setItem(
    'austriaPathPlacementProfile',
    JSON.stringify(profile)
  );

  localStorage.setItem('userLevel', profile.level.replace('+', ''));
}

export function getPlacementProfile() {
  try {
    return JSON.parse(localStorage.getItem('austriaPathPlacementProfile'));
  } catch {
    return null;
  }
}