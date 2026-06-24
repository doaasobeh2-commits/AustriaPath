export const selfIntroductionTasks = {
  A2: [
    {
      title: 'Selbstvorstellung A2',
      questions: [
        'Wie heißen Sie?',
        'Woher kommen Sie?',
        'Wo wohnen Sie?',
        'Was machen Sie beruflich?',
        'Welche Hobbys haben Sie?',
      ],
    },
  ],

  B1: [
    {
      title: 'Selbstvorstellung B1',
      questions: [
        'Erzählen Sie etwas über sich.',
        'Warum lernen Sie Deutsch?',
        'Welche Ziele haben Sie in Österreich?',
        'Beschreiben Sie Ihren Alltag.',
        'Was möchten Sie in Zukunft erreichen?',
      ],
    },
  ],

  B2: [
    {
      title: 'Selbstvorstellung B2',
      questions: [
        'Stellen Sie sich bitte ausführlich vor.',
        'Welche beruflichen Erfahrungen haben Sie?',
        'Welche Herausforderungen hatten Sie?',
        'Welche Pläne haben Sie für die nächsten Jahre?',
      ],
    },
  ],
};

export const listeningTasks = {
  A2: ['Termin beim Arzt', 'Einladung zur Geburtstagsfeier'],
  B1: ['Wohnungsbesichtigung', 'Bewerbungsgespräch'],
  B2: ['Interview im Radio', 'Diskussion über Digitalisierung'],
};

export const imageTasks = {
  A2: ['Bäckerei', 'Kochen zu Hause', 'Familienausflug'],
  B1: ['Arbeitssuche', 'Familie beim Backen', 'Werkstatt'],
  B2: ['Grafik Arbeitsmarkt', 'Grafik Digitalisierung'],
};

export const planningTasks = {
  A2: ['Geburtstagsfeier planen'],
  B1: ['Abschlussfeier organisieren'],
  B2: ['Diskussion Umwelt und Verkehr'],
};

export const readingTasks = {
  A2: ['Sprachkurs Information', 'Wohnungsanzeige'],
  B1: ['Online-Einkauf', 'Stress im Beruf', 'Deutschkurs am Abend'],
  B2: ['Digitalisierung in der Arbeitswelt', 'Freundschaft im digitalen Zeitalter'],
};

export const grammarTasks = {
  A2: ['Artikel einsetzen', 'Akkusativ oder Dativ', 'Verbposition'],
  B1: ['Weil / Deshalb', 'Relativsätze', 'Konjunktiv II'],
  B2: ['Passiv', 'Nominalisierung', 'Komplexe Satzverbindungen'],
};

export const weeklyPlanLibrary = [
  // =====================
  // A2 CORE
  // =====================
  {
    id: 'a2-selbst-001',
    level: 'A2',
    skill: 'selbstvorstellung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 1,
    title: 'Kurze Selbstvorstellung',
    duration: 4,
    task: 'Bitte stellen Sie sich kurz vor.',
    followUps: ['Wo wohnen Sie?', 'Was machen Sie gern in der Freizeit?'],
    answerMode: 'audio',
  },
  {
    id: 'a2-hoeren-001',
    level: 'A2',
    skill: 'hoeren',
    type: 'listening',
    sessionRole: 'core',
    priority: 2,
    title: 'Termin beim Arzt',
    duration: 3,
    audioText: 'Guten Tag. Ihr Termin beim Arzt ist am Dienstag um 10 Uhr.',
    questions: [
      {
        q: 'Wann ist der Termin?',
        answer: 'Am Dienstag um 10 Uhr.',
        answerMode: 'text',
      },
    ],
  },
  {
    id: 'a2-bild-001',
    level: 'A2',
    skill: 'bildbeschreibung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 3,
    title: 'Bild beschreiben',
    duration: 4,
    task: 'Beschreiben Sie das Bild einfach: Wer ist da? Wo sind die Personen? Was machen sie?',
    followUps: ['Gefällt Ihnen die Situation?', 'Haben Sie so etwas schon erlebt?'],
    answerMode: 'audio',
  },
  {
    id: 'a2-planung-001',
    level: 'A2',
    skill: 'planung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 4,
    title: 'Geburtstag planen',
    duration: 4,
    task: 'Sie planen eine kleine Geburtstagsfeier. Sprechen Sie über Ort, Zeit, Essen und Gäste.',
    followUps: ['Wann möchten Sie feiern?', 'Was möchten Sie mitbringen?'],
    answerMode: 'audio',
  },

  // A2 FILLER
  {
    id: 'a2-grammatik-001',
    level: 'A2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 5,
    title: 'Satz mit weil',
    duration: 2,
    task: 'Bilden Sie einen Satz mit „weil“.',
    example: 'Ich lerne Deutsch, weil ich in Österreich lebe.',
    answerMode: 'text',
  },
  {
    id: 'a2-satzbau-001',
    level: 'A2',
    skill: 'satzbau',
    type: 'writing',
    sessionRole: 'filler',
    priority: 6,
    title: 'Satz ordnen',
    duration: 2,
    task: 'Ordnen Sie den Satz: heute / ich / Deutsch / lerne',
    solution: 'Ich lerne heute Deutsch.',
    answerMode: 'text',
  },
  {
    id: 'a2-lesen-001',
    level: 'A2',
    skill: 'lesen',
    type: 'reading',
    sessionRole: 'filler',
    priority: 7,
    title: 'Kurze Nachricht',
    duration: 3,
    text: 'Hallo Sara, ich komme heute später. Der Bus hat Verspätung. Ich bin um 18 Uhr bei dir. Liebe Grüße, Anna',
    questions: [
      {
        q: 'Warum kommt Anna später?',
        answer: 'Der Bus hat Verspätung.',
        answerMode: 'text',
      },
      {
        q: 'Anna ist um 18 Uhr da.',
        answer: 'richtig',
        answerMode: 'trueFalse',
      },
    ],
  },
  {
    id: 'a2-grammatik-002',
    level: 'A2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 8,
    title: 'Akkusativ oder Dativ',
    duration: 2,
    task: 'Ergänzen Sie: Ich gehe ___ Supermarkt. Ich bin ___ Supermarkt.',
    solution: 'in den Supermarkt / im Supermarkt',
    answerMode: 'text',
  },
  {
    id: 'a2-grammatik-003',
    level: 'A2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 9,
    title: 'Perfekt bilden',
    duration: 2,
    task: 'Bilden Sie einen Satz im Perfekt mit „einkaufen“.',
    example: 'Ich habe gestern eingekauft.',
    answerMode: 'text',
  },

  // =====================
  // B1 CORE
  // =====================
  {
    id: 'b1-selbst-001',
    level: 'B1',
    skill: 'selbstvorstellung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 1,
    title: 'Selbstvorstellung mit Details',
    duration: 4,
    task: 'Bitte stellen Sie sich vor und erzählen Sie auch etwas über Ihre Arbeit, Ihren Alltag und Ihre Pläne.',
    followUps: ['Warum lernen Sie Deutsch?', 'Welche Pläne haben Sie für die Zukunft?'],
    answerMode: 'audio',
  },
  {
    id: 'b1-hoeren-001',
    level: 'B1',
    skill: 'hoeren',
    type: 'listening',
    sessionRole: 'core',
    priority: 2,
    title: 'Kurs verschoben',
    duration: 4,
    audioText:
      'Der Deutschkurs findet heute nicht um 18 Uhr statt. Wegen einer Besprechung beginnt der Kurs erst um 19 Uhr im Raum 204.',
    questions: [
      {
        q: 'Warum beginnt der Kurs später?',
        answer: 'Wegen einer Besprechung.',
        answerMode: 'text',
      },
      {
        q: 'In welchem Raum findet der Kurs statt?',
        answer: 'Im Raum 204.',
        answerMode: 'text',
      },
    ],
  },
  {
    id: 'b1-bild-001',
    level: 'B1',
    skill: 'bildbeschreibung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 3,
    title: 'Bild + Meinung',
    duration: 5,
    task: 'Beschreiben Sie das Bild. Sagen Sie auch Ihre Meinung und erzählen Sie von einer eigenen Erfahrung.',
    followUps: ['Warum finden Sie diese Situation wichtig?', 'Wie ist das in Ihrem Heimatland?'],
    answerMode: 'audio',
  },
  {
    id: 'b1-planung-001',
    level: 'B1',
    skill: 'planung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 4,
    title: 'Gemeinsamen Ausflug planen',
    duration: 5,
    task: 'Sie möchten mit Ihrem Deutschkurs einen Ausflug machen. Planen Sie gemeinsam: Ziel, Zeit, Kosten, Essen und Aufgaben.',
    followUps: ['Wer übernimmt welche Aufgabe?', 'Warum ist dieser Ort geeignet?'],
    answerMode: 'audio',
  },

  // B1 FILLER
  {
    id: 'b1-grammatik-001',
    level: 'B1',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 5,
    title: 'weil / deshalb',
    duration: 3,
    task: 'Schreiben Sie zwei Sätze: einen Satz mit „weil“ und einen Satz mit „deshalb“.',
    example: 'Ich lerne Deutsch, weil ich eine Ausbildung machen möchte. Deshalb übe ich jeden Tag.',
    answerMode: 'text',
  },
  {
    id: 'b1-satzbau-001',
    level: 'B1',
    skill: 'satzbau',
    type: 'writing',
    sessionRole: 'filler',
    priority: 6,
    title: 'Nebensatz bilden',
    duration: 3,
    task: 'Verbinden Sie die Sätze mit „obwohl“: Ich bin müde. Ich gehe zum Deutschkurs.',
    solution: 'Obwohl ich müde bin, gehe ich zum Deutschkurs.',
    answerMode: 'text',
  },
  {
    id: 'b1-lesen-001',
    level: 'B1',
    skill: 'lesen',
    type: 'reading',
    sessionRole: 'filler',
    priority: 7,
    title: 'Information im Haus',
    duration: 4,
    text: 'Liebe Bewohnerinnen und Bewohner, am Freitag wird das Wasser von 9 bis 12 Uhr abgestellt. Bitte benutzen Sie in dieser Zeit kein Wasser in Küche und Bad. Vielen Dank für Ihr Verständnis. Die Hausverwaltung',
    questions: [
      {
        q: 'Wann wird das Wasser abgestellt?',
        answer: 'Am Freitag von 9 bis 12 Uhr.',
        answerMode: 'text',
      },
      {
        q: 'Man darf in dieser Zeit Wasser benutzen.',
        answer: 'falsch',
        answerMode: 'trueFalse',
      },
    ],
  },
  {
    id: 'b1-schreiben-001',
    level: 'B1',
    skill: 'schreiben',
    type: 'writing',
    sessionRole: 'filler',
    priority: 8,
    title: 'Kurze E-Mail',
    duration: 5,
    task: 'Schreiben Sie eine kurze E-Mail an Ihren Kursleiter. Sie können morgen nicht zum Kurs kommen. Nennen Sie den Grund und fragen Sie nach den Hausaufgaben.',
    answerMode: 'text',
  },
  {
    id: 'b1-grammatik-002',
    level: 'B1',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 9,
    title: 'Relativsatz',
    duration: 3,
    task: 'Verbinden Sie: Das ist der Mann. Er arbeitet in meiner Firma.',
    solution: 'Das ist der Mann, der in meiner Firma arbeitet.',
    answerMode: 'text',
  },
  {
    id: 'b1-grammatik-003',
    level: 'B1',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 10,
    title: 'Konjunktiv II',
    duration: 3,
    task: 'Formulieren Sie höflich: Ich will einen Termin.',
    solution: 'Ich hätte gern einen Termin.',
    answerMode: 'text',
  },

  // =====================
  // B2 CORE
  // =====================
  {
    id: 'b2-selbst-001',
    level: 'B2',
    skill: 'selbstvorstellung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 1,
    title: 'Ausführliche Selbstvorstellung',
    duration: 5,
    task: 'Stellen Sie sich ausführlich vor. Sprechen Sie über Ausbildung, Beruf, Erfahrungen, Herausforderungen und Ziele.',
    followUps: [
      'Welche berufliche Erfahrung war für Sie besonders wichtig?',
      'Welche Ziele möchten Sie in den nächsten Jahren erreichen?',
    ],
    answerMode: 'audio',
  },
  {
    id: 'b2-diskussion-001',
    level: 'B2',
    skill: 'diskussion',
    type: 'speaking',
    sessionRole: 'core',
    priority: 2,
    title: 'Homeoffice diskutieren',
    duration: 6,
    task: 'Diskutieren Sie das Thema Homeoffice. Nennen Sie Vorteile, Nachteile und Ihre persönliche Meinung.',
    followUps: [
      'Welche Lösung wäre für Firmen und Mitarbeiter fair?',
      'Wie hat sich die Arbeitswelt verändert?',
    ],
    answerMode: 'audio',
  },

  // B2 FILLER
  {
    id: 'b2-grammatik-001',
    level: 'B2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 3,
    title: 'obwohl / während',
    duration: 4,
    task: 'Schreiben Sie zwei anspruchsvollere Sätze: einen mit „obwohl“ und einen mit „während“.',
    answerMode: 'text',
  },
  {
    id: 'b2-lesen-001',
    level: 'B2',
    skill: 'lesen',
    type: 'reading',
    sessionRole: 'filler',
    priority: 4,
    title: 'Digitale Medien',
    duration: 5,
    text: 'Digitale Medien gehören heute zum Alltag. Viele Menschen nutzen sie zum Lernen, Arbeiten und Kommunizieren. Gleichzeitig entstehen neue Probleme: Konzentration sinkt, persönliche Gespräche werden seltener und viele Informationen sind schwer zu überprüfen.',
    questions: [
      {
        q: 'Welche Vorteile digitaler Medien werden genannt?',
        answer: 'Lernen, Arbeiten und Kommunizieren.',
        answerMode: 'text',
      },
      {
        q: 'Welche Probleme werden genannt?',
        answer:
          'Weniger Konzentration, weniger persönliche Gespräche und schwer überprüfbare Informationen.',
        answerMode: 'text',
      },
    ],
  },
  {
    id: 'b2-schreiben-001',
    level: 'B2',
    skill: 'schreiben',
    type: 'writing',
    sessionRole: 'filler',
    priority: 5,
    title: 'Meinung formulieren',
    duration: 6,
    task: 'Schreiben Sie einen kurzen Absatz zum Thema: Sollten Kinder früh ein Smartphone bekommen? Begründen Sie Ihre Meinung.',
    answerMode: 'text',
  },
  {
    id: 'b2-grammatik-002',
    level: 'B2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 6,
    title: 'Passiv',
    duration: 4,
    task: 'Formulieren Sie im Passiv: Die Firma informiert die Kunden.',
    solution: 'Die Kunden werden von der Firma informiert.',
    answerMode: 'text',
  },
  {
    id: 'b2-grammatik-003',
    level: 'B2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 7,
    title: 'Nominalisierung',
    duration: 4,
    task: 'Formulieren Sie nominal: Viele Menschen nutzen digitale Medien täglich.',
    example: 'Die tägliche Nutzung digitaler Medien ist für viele Menschen normal.',
    answerMode: 'text',
  },
];

function cleanLevel(level = 'B1') {
  return String(level).replace('+', '').trim().toUpperCase() || 'B1';
}

function normalizeSkills(skills = []) {
  return skills.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
}

function sortByPriority(list = []) {
  return [...list].sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

export function getWeeklyPlanTasks({
  level = 'B1',
  skills = [],
  limit = 7,
  sessionRole = null,
} = {}) {
  const finalLevel = cleanLevel(level);
  const normalizedSkills = normalizeSkills(skills);

  const filtered = weeklyPlanLibrary.filter((item) => {
    const sameLevel = item.level === finalLevel;

    const skillMatches =
      normalizedSkills.length === 0 ||
      normalizedSkills.includes(String(item.skill).toLowerCase());

    const roleMatches = !sessionRole || item.sessionRole === sessionRole;

    return sameLevel && skillMatches && roleMatches;
  });

  return sortByPriority(filtered).slice(0, limit);
}

export function buildWeeklySession({
  level = 'B1',
  weaknesses = [],
  maxMinutes = 20,
} = {}) {
  const finalLevel = cleanLevel(level);
  const normalizedWeaknesses = normalizeSkills(weaknesses);

  const coreTasks = getWeeklyPlanTasks({
    level: finalLevel,
    skills: normalizedWeaknesses,
    sessionRole: 'core',
    limit: 10,
  });

  const fallbackCoreTasks = getWeeklyPlanTasks({
    level: finalLevel,
    sessionRole: 'core',
    limit: 10,
  });

  const fillerTasks = getWeeklyPlanTasks({
    level: finalLevel,
    skills: normalizedWeaknesses,
    sessionRole: 'filler',
    limit: 20,
  });

  const fallbackFillerTasks = getWeeklyPlanTasks({
    level: finalLevel,
    sessionRole: 'filler',
    limit: 20,
  });

  const selected = [];
  let usedMinutes = 0;

  const addTask = (task) => {
    if (!task) return;
    if (selected.some((item) => item.id === task.id)) return;
    if (usedMinutes + task.duration > maxMinutes) return;

    selected.push(task);
    usedMinutes += task.duration;
  };

  const preferredCore = coreTasks.length ? coreTasks : fallbackCoreTasks;
  preferredCore.forEach(addTask);

  const preferredFillers = fillerTasks.length ? fillerTasks : fallbackFillerTasks;

  let safetyCounter = 0;

  while (usedMinutes < maxMinutes && safetyCounter < 30) {
    safetyCounter += 1;

    const remaining = maxMinutes - usedMinutes;

    const nextTask = preferredFillers.find(
      (task) =>
        !selected.some((item) => item.id === task.id) &&
        task.duration <= remaining
    );

    if (!nextTask) break;

    addTask(nextTask);
  }

  return selected.map((task, index) => ({
    sessionStep: index + 1,
    id: `session-${index + 1}-${task.id}`,
    level: task.level,
    skill: task.skill,
    type: task.type,
    title: task.title,
    duration: task.duration,
    sessionRole: task.sessionRole,
    task,
  }));
}

export function getDailyTrainingMessages({
  level = 'B1',
  weaknesses = [],
} = {}) {
  const sessionTasks = buildWeeklySession({
    level,
    weaknesses,
    maxMinutes: 20,
  });

  if (!sessionTasks.length) return [];

  return Array.from({ length: 7 }).map((_, index) => {
    const task = sessionTasks[index % sessionTasks.length];

    return {
      day: index + 1,
      id: `daily-${index + 1}-${task.task.id}`,
      level: task.level,
      skill: task.skill,
      title: task.title,
      type: task.type,
      duration: task.duration,
      sessionRole: task.sessionRole,
      task: task.task,
    };
  });
}