import { weeklyPlanA2ImageTasks } from './a2ImageTaskCatalog.js';
import { weeklyPlanA2AufgabeLoesenTasks } from './weeklyPlanA2AufgabeLoesenTasks.js';
import { weeklyPlanA2HorenTasks } from './weeklyPlanA2HorenTasks.js';
import { weeklyPlanA2LesenTasks } from './weeklyPlanA2LesenTasks.js';
import { weeklyPlanA2EmailTasks } from './weeklyPlanA2EmailTasks.js';
import { isA2WeeklyPlanEmailTask } from './utils/a2WeeklyPlanEmailRuntime.js';
import { weeklyPlanLibraryCatalogTasks } from './weeklyPlanLibraryCatalogTasks.js';

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
  A2: weeklyPlanA2ImageTasks,
  B1: ['Arbeitssuche', 'Familie beim Backen', 'Werkstatt'],
  B2: ['Grafik Arbeitsmarkt', 'Grafik Digitalisierung'],
};

export const planningTasks = {
  A2: ['Zahnarzttermin absagen', 'Termin beim Hausarzt vereinbaren', 'Friseurtermin buchen'],
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

const weeklyPlanCoreTasks = [
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
    activityName: 'Über sich sprechen',
    duration: 4,
    task: 'Bitte stellen Sie sich kurz vor.',
    followUps: ['Wo wohnen Sie?', 'Was machen Sie gern in der Freizeit?'],
    answerMode: 'audio',
  },
  {
    id: 'a2-bild-001',
    level: 'A2',
    skill: 'bildbeschreibung',
    type: 'speaking',
    sessionRole: 'core',
    priority: 3,
    title: 'Bild beschreiben',
    activityName: 'Bild beschreiben',
    duration: 4,
    task: 'Beschreiben Sie das Bild einfach: Wer ist da? Wo sind die Personen? Was machen sie?',
    followUps: ['Gefällt Ihnen die Situation?', 'Haben Sie so etwas schon erlebt?'],
    answerMode: 'audio',
    imageAssetRef: { source: 'a2Images', canonicalId: 'A2-IMG-10', id: 10 },
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
    activityName: 'Satz richtig bilden',
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
    activityName: 'Sätze verbinden',
    duration: 2,
    task: 'Verbinden Sie: Ich bin müde. Ich gehe trotzdem einkaufen.',
    solution: 'Ich bin müde, aber ich gehe trotzdem einkaufen.',
    answerMode: 'text',
  },
  {
    id: 'a2-grammatik-002',
    level: 'A2',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 8,
    title: 'Akkusativ oder Dativ',
    activityName: 'Lückentext',
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
    activityName: 'Satz richtig bilden',
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
    activityName: 'Gespräch führen',
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
    activityName: 'Alltagsgespräch verstehen',
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
    activityName: 'Situation beschreiben',
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
    activityName: 'Gemeinsam planen',
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
    activityName: 'Satz umformen',
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
    activityName: 'Satz umformen',
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
    activityName: 'Text verstehen',
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
    activityName: 'E-Mail schreiben',
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
    activityName: 'Lückentext',
    duration: 3,
    task: 'Ergänzen Sie: Das ist der Mann, ___ in meiner Firma arbeitet.',
    solution: 'der',
    answerMode: 'text',
  },
  {
    id: 'b1-grammatik-003',
    level: 'B1',
    skill: 'grammatik',
    type: 'writing',
    sessionRole: 'filler',
    priority: 10,
    title: 'Höfliche Formulierung',
    activityName: 'Fehler korrigieren',
    duration: 3,
    task: 'Korrigieren Sie den Satz: Ich will sofort einen Termin.',
    solution: 'Ich hätte gern einen Termin.',
    answerMode: 'text',
  },

  // =====================
  // B2 CORE
  // =====================
  {
    id: 'b2-selbst-001',
    level: 'B2',
    skill: 'diskussion',
    type: 'speaking',
    sessionRole: 'core',
    priority: 1,
    title: 'Homeoffice-Politik analysieren',
    activityName: 'Situation analysieren',
    duration: 5,
    task: 'Analysieren Sie folgende Situation: In einer Firma dürfen Mitarbeitende zwei Tage pro Woche von zu Hause arbeiten. Nennen Sie Vorteile, Risiken und eine faire Lösung für Team und Führung.',
    followUps: [
      'Welche Folgen hat das für die Zusammenarbeit im Team?',
      'Wie würden Sie die Regelung verbessern?',
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
    activityName: 'Diskussion führen',
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
    activityName: 'Komplexe Strukturen',
    duration: 4,
    task: 'Schreiben Sie zwei anspruchsvollere Sätze: einen mit „obwohl“ und einen mit „während“.',
    solution:
      'Obwohl ich wenig Zeit hatte, habe ich die Aufgabe sorgfältig bearbeitet. Während der Besprechung wurden neue Ideen diskutiert.',
    answerMode: 'text',  },
  {
    id: 'b2-lesen-001',
    level: 'B2',
    skill: 'lesen',
    type: 'reading',
    sessionRole: 'filler',
    priority: 4,
    title: 'Digitale Medien',
    activityName: 'Artikel analysieren',
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
    activityName: 'Argumentation schreiben',
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
    activityName: 'Satz umformulieren',
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
    title: 'Nominalisierung korrigieren',
    activityName: 'Fehler korrigieren',
    duration: 4,
    task: 'Korrigieren Sie: Viele Menschen nutzen täglich digitaler Medien.',
    solution: 'Viele Menschen nutzen täglich digitale Medien.',
    answerMode: 'text',
  },
];

export const weeklyPlanLibrary = [
  ...weeklyPlanCoreTasks,
  ...weeklyPlanA2HorenTasks,
  ...weeklyPlanA2LesenTasks,
  ...weeklyPlanA2AufgabeLoesenTasks,
  ...weeklyPlanA2EmailTasks,
  ...weeklyPlanLibraryCatalogTasks,
];

function cleanLevel(level = 'B1') {
  const raw = String(level).trim().toUpperCase() || 'B1';
  if (raw.startsWith('A2')) return 'A2';
  if (raw.startsWith('B1')) return 'B1';
  if (raw.startsWith('B2')) return 'B2';
  return raw.replace(/[+-]$/, '') || 'B1';
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

/**
 * Map library task to coach type for Weekly Plan coach-v1.
 * @param {{ type?: string, skill?: string }} task
 * @returns {'speaking'|'listening'|'reading'|'email'|'grammar'}
 */
export function resolveCoachType(task) {
  const type = String(task?.type || '').toLowerCase();
  const skill = String(task?.skill || '').toLowerCase();

  if (type === 'speaking') return 'speaking';
  if (type === 'listening') return 'listening';
  if (type === 'reading') return 'reading';
  if (type === 'writing') {
    if (skill === 'schreiben') return 'email';
    if (skill === 'grammatik' || skill === 'satzbau') return 'grammar';
    return 'grammar';
  }
  return 'grammar';
}

/**
 * @param {string} taskId
 * @returns {object|undefined}
 */
export function getWeeklyPlanTaskById(taskId) {
  return weeklyPlanLibrary.find((item) => item.id === taskId);
}

const A2_BALANCED_DAY_SKILLS = ['lesen', 'hoeren', 'bildbeschreibung', 'aufgabe_loesen'];

/**
 * Even plan days include Schreiben from weeklyPlanA2EmailLibrary instead of Aufgabe lösen.
 * @param {number} planIndex
 */
function skillsForA2PlanDay(planIndex) {
  if (planIndex % 2 === 0) {
    return ['lesen', 'hoeren', 'bildbeschreibung', 'schreiben'];
  }
  return A2_BALANCED_DAY_SKILLS;
}

/**
 * Build balanced A2 daily plans: one Lesen, Hören, Bildbeschreibung, Aufgabe lösen per day.
 * @param {{ weaknesses?: string[], totalPlans?: number }} params
 */
function planBalancedA2Week({ totalPlans = 7 } = {}) {
  const levelTasks = sortByPriority(weeklyPlanLibrary.filter((item) => item.level === 'A2'));

  const plans = [];
  for (let planIndex = 1; planIndex <= totalPlans; planIndex += 1) {
    const daySkills = skillsForA2PlanDay(planIndex);
    const skillPools = Object.fromEntries(
      daySkills.map((skill) => {
        const pool = sortByPriority(
          levelTasks.filter((item) => {
            if (item.skill !== skill) return false;
            if (skill === 'schreiben') return isA2WeeklyPlanEmailTask(item);
            return true;
          })
        );
        return [skill, pool];
      })
    );

    const planTasks = daySkills
      .map((skill) => {
        const pool = skillPools[skill];
        if (!pool.length) return null;
        const pickIndex = (planIndex - 1) % pool.length;
        const task = pool[pickIndex];
        return {
          ...task,
          coachType: resolveCoachType(task),
        };
      })
      .filter(Boolean);

    plans.push(planTasks);
  }

  return plans;
}

/**
 * Build 7 sequential training plans with exactly 4 exercises each.
 * @param {{ level?: string, weaknesses?: string[], totalPlans?: number, exercisesPerPlan?: number }} [params]
 * @returns {Array<Array<object & { coachType: string }>>}
 */
export function planWeek({
  level = 'B1',
  weaknesses = [],
  totalPlans = 7,
  exercisesPerPlan = 4,
} = {}) {
  const finalLevel = cleanLevel(level);
  if (finalLevel === 'A2') {
    return planBalancedA2Week({ totalPlans });
  }

  const normalizedWeaknesses = normalizeSkills(weaknesses);
  const totalSlots = totalPlans * exercisesPerPlan;

  const levelTasks = sortByPriority(
    weeklyPlanLibrary.filter((item) => item.level === finalLevel)
  );

  const focusTasks = normalizedWeaknesses.length
    ? sortByPriority(
        levelTasks.filter((item) =>
          normalizedWeaknesses.includes(String(item.skill).toLowerCase())
        )
      )
    : [];

  const generalPool = levelTasks.length ? levelTasks : sortByPriority([...weeklyPlanLibrary]);

  const orderedPool = [];
  const seen = new Set();

  const pushUnique = (task) => {
    if (!task || seen.has(task.id)) return;
    seen.add(task.id);
    orderedPool.push(task);
  };

  focusTasks.forEach(pushUnique);
  generalPool.forEach(pushUnique);

  if (!orderedPool.length) {
    generalPool.forEach((task) => pushUnique(task));
  }

  const pool = orderedPool.length ? orderedPool : generalPool;
  const slots = [];
  let poolIndex = 0;
  const lastPlanTaskIds = [];

  const pickTaskForSlot = (planIndex, slotIndex) => {
    const attempts = pool.length * 2 || 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const candidate = pool[poolIndex % pool.length];
      poolIndex += 1;
      if (!candidate) continue;

      const prevPlanLast = lastPlanTaskIds[planIndex - 2];
      const sameAsPrevPlan = prevPlanLast === candidate.id;
      const duplicateInPlan = slots
        .filter((s) => s.planIndex === planIndex)
        .some((s) => s.task.id === candidate.id);

      if (planIndex > 1 && sameAsPrevPlan && pool.length > 1) continue;
      if (duplicateInPlan && pool.length > exercisesPerPlan) continue;

      return candidate;
    }
    return pool[(planIndex + slotIndex) % pool.length];
  };

  for (let planIndex = 1; planIndex <= totalPlans; planIndex += 1) {
    const planTasks = [];
    for (let slot = 1; slot <= exercisesPerPlan; slot += 1) {
      const task = pickTaskForSlot(planIndex, slot);
      const enriched = {
        ...task,
        coachType: resolveCoachType(task),
      };
      planTasks.push(enriched);
      slots.push({ planIndex, slot, task: enriched });
    }
    lastPlanTaskIds[planIndex - 1] = planTasks[planTasks.length - 1]?.id;
  }

  const plans = [];
  for (let planIndex = 1; planIndex <= totalPlans; planIndex += 1) {
    plans.push(
      slots
        .filter((s) => s.planIndex === planIndex)
        .sort((a, b) => a.slot - b.slot)
        .map((s) => s.task)
    );
  }

  return plans;
}