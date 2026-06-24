export function generatePlacementReport({
  finalLevel = 'A2',
  internalLevel = 'A2',
  strengths = [],
  weaknesses = [],
  recommendedSkills = [],
} = {}) {
  return {
    type: 'placement',
    title: 'Einstufungstest Bericht',
    finalLevel,
    internalLevel,
    summary: `Dein aktuelles Niveau ist ungefähr ${finalLevel}.`,
    strengths,
    weaknesses,
    recommendedSkills,
    studyPlan: generateShortStudyPlan(finalLevel, recommendedSkills, weaknesses),
  };
}

export function generateExamReport({
  level = 'B1',
  examType = 'probepruefung',
  strengths = [],
  weaknesses = [],
  pronunciationNotes = [],
  grammarNotes = [],
  vocabularyNotes = [],
} = {}) {
  return {
    type: examType,
    title: 'AI Prüfungsbericht',
    level,
    summary: `Du hast eine ${level} Probeprüfung abgeschlossen.`,
    strengths,
    weaknesses,
    pronunciationNotes,
    grammarNotes,
    vocabularyNotes,
    nextSteps: generateNextSteps(level, weaknesses),
  };
}

export function generateShortStudyPlan(level, skills = [], weaknesses = []) {
  return [
    {
      day: 'Tag 1',
      focus: skills[0] || 'Sprechen',
      tasks: [
        `Übe ${level} Selbstvorstellung.`,
        'Wiederhole wichtige Wörter.',
        weaknesses[0] ? `Arbeite an: ${weaknesses[0]}` : 'Sprich 5 Minuten laut.',
      ],
    },
    {
      day: 'Tag 2',
      focus: skills[1] || 'Bildbeschreibung',
      tasks: [
        `Übe eine ${level} Bildbeschreibung.`,
        'Beantworte 3 Nachfragen.',
        weaknesses[1] ? `Wiederhole: ${weaknesses[1]}` : 'Schreibe 5 neue Sätze.',
      ],
    },
  ];
}

export function generateWeeklyPlan({
  level = 'B1',
  selectedSkills = ['Sprechen', 'Bildbeschreibung', 'Grammatik'],
  minutesPerDay = 30,
  weaknesses = [],
} = {}) {
  return Array.from({ length: 7 }, (_, index) => {
    const skill = selectedSkills[index % selectedSkills.length];

    return {
      day: `Tag ${index + 1}`,
      minutes: minutesPerDay,
      focus: skill,
      tasks: [
        `${skill} auf Niveau ${level} üben.`,
        weaknesses[index % Math.max(weaknesses.length, 1)]
          ? `Schwäche trainieren: ${weaknesses[index % weaknesses.length]}`
          : 'Neue Wörter wiederholen.',
        'Kurze Wiederholung am Ende.',
      ],
    };
  });
}

export function generateMonthlyPlan({
  level = 'B1',
  weaknesses = [],
} = {}) {
  return [
    {
      week: 'Woche 1',
      focus: `${level} Grundlagen festigen`,
      goal: 'Sicherheit und Wortschatz aufbauen',
    },
    {
      week: 'Woche 2',
      focus: 'Sprechen und Bildbeschreibung',
      goal: weaknesses[0] || 'Längere Antworten geben',
    },
    {
      week: 'Woche 3',
      focus: 'Planung, Lesen und Hören',
      goal: weaknesses[1] || 'Prüfungssituationen trainieren',
    },
    {
      week: 'Woche 4',
      focus: 'Probeprüfung und Wiederholung',
      goal: 'Fortschritt vergleichen und letzte Schwächen verbessern',
    },
  ];
}

export function generateNextSteps(level, weaknesses = []) {
  if (!weaknesses.length) {
    return [
      `Mache eine weitere ${level} Übung.`,
      'Wiederhole wichtige Wörter.',
      'Sprich jeden Tag 5 Minuten laut.',
    ];
  }

  return weaknesses.map((weakness) => `Trainiere gezielt: ${weakness}`);
}