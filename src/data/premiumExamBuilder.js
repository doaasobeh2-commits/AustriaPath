import { a2Models } from './modelsA2';
import { b1Models, b1PlanningModels } from './modelsb1';
import { b2Models } from './modelsB2';
import { b1HorenModels } from './b1HorenModels';
import { b2HorenModels } from './b2HorenModels';
import { b2LesenModels } from './b2LesenModels';
import { b2Grafiken } from './b2Grafiken';
import { b1LesenModels } from './b1LesenModels';

import { a2Images } from './a2Images';
import { b1Images } from './b1Images';

import { examBank } from './examBank';
import { buildPlatformPremiumPackage } from '../exam-platform/adapters/examEngineBridge.js';

function cleanLevel(level = 'B1') {
  return String(level).replace('+', '').trim().toUpperCase() || 'B1';
}
function withExaminerMeta(part, level, sectionIndex) {
  return {
    ...part,
    examiner: {
      examType: 'OEIF',
      level,
      sectionIndex,
    },
  };
}
function pickOne(list = []) {
  const clean = list.filter(Boolean);
  if (!clean.length) return null;
  return clean[Math.floor(Math.random() * clean.length)];
}

function pickMany(list = [], count = 1) {
  const clean = list.filter(Boolean);
  return [...clean].sort(() => Math.random() - 0.5).slice(0, count);
}

function getText(item) {
  if (!item) return '';
  if (typeof item.task === 'string') return item.task;
  if (Array.isArray(item.task)) return item.task.join('\n');
  if (Array.isArray(item.description)) return item.description.join('\n');
  return item.text || item.content || item.aufgabe || item.shortText || '';
}

function normalizeQuestions(questions = []) {
  return questions.map((q) => ({
    q: q.q || q.frage || q.question || '',
    options: q.options || ['Antwort schreiben'],
    answer: q.a || q.answer || q.correct || '',
  }));
}

function getAdminItems() {
  try {
    return JSON.parse(localStorage.getItem('austriaPathAdminData') || '[]');
  } catch {
    return [];
  }
}

function getAdminByType(level, type) {
  return getAdminItems().filter((item) => {
    const itemLevel = cleanLevel(item.level || item.niveau || 'B1');
    const itemType = String(item.type || item.bereich || '').toLowerCase();
    const status = String(item.status || '').toLowerCase();

    return itemLevel === level && itemType === type && status === 'published';
  });
}

function getWritingModel(level) {
  const banks = {
    A2: a2Models,
    B1: b1Models,
    B2: b2Models,
  };

  return pickOne(banks[level] || b1Models);
}

function getReadingModel(level) {
  const admin = getAdminByType(level, 'lesen');
  if (admin.length) return pickOne(admin);

  if (level === 'B1') return pickOne(b1LesenModels);
  if (level === 'B2') return pickOne(b2LesenModels);

  const bank =
    examBank?.reading?.filter((item) => cleanLevel(item.level) === level) || [];

  return pickOne(bank);
}

function getListeningModels(level) {
  const admin = getAdminByType(level, 'hoeren');
  if (admin.length) return pickMany(admin, 2);

  const banks = {
    B1: b1HorenModels,
    B2: b2HorenModels,
  };

  const directBank = banks[level] || [];

  if (directBank.length) return pickMany(directBank, 2);

  const bank =
    examBank?.listening?.filter((item) => cleanLevel(item.level) === level) || [];

  return pickMany(bank, 2);
}

function getImageModel(level) {
  const admin = getAdminByType(level, 'bildbeschreibung');
  if (admin.length) return pickOne(admin);

  const banks = {
    A2: a2Images,
    B1: b1Images,
    B2: b2Grafiken,
  };

  return pickOne(banks[level] || []);
}

function getPlanningModel(level) {
  const type =
    level === 'A2' ? 'aufgabe_loesen' : level === 'B2' ? 'diskussion' : 'planung';

  const admin = getAdminByType(level, type);
  if (admin.length) return pickOne(admin);

  if (level === 'B1') return pickOne(b1PlanningModels);

  const bank =
    examBank?.planning?.filter((item) => cleanLevel(item.level) === level) || [];

  return pickOne(bank);
}

function buildWritingPart(level) {
  const model = getWritingModel(level);
  const selectedEmail = model?.emails?.length ? pickOne(model.emails) : null;

  return {
    type: 'writing',
    label: 'Schreiben',
    title: selectedEmail?.title || model?.title || 'E-Mail schreiben',
    source: 'modelle',
    modelId: model?.id || null,
    modelTitle: model?.title || '',
    instruction: 'Schreiben Sie eine E-Mail. Bearbeiten Sie alle Punkte.',
    taskPoints: selectedEmail?.task || model?.task || [],
    text: '',
    studentAnswer: '',
  };
}

function buildReadingParts(level) {
  const reading = getReadingModel(level);

  if (level === 'B1' && reading?.teil1 && reading?.teil2) {
    return [
      {
        type: 'reading_cloze',
        label: 'Lesen',
        title: `${reading.title} · Teil 1`,
        source: 'b1LesenModels',
        modelId: reading.id,
        instruction: reading.teil1.title,
        text: reading.teil1.text,
        options: reading.teil1.options || {},
        answers: reading.teil1.answers || {},
        studentAnswers: {},
      },
      {
        type: 'reading_ads',
        label: 'Lesen',
        title: `${reading.title} · Teil 2`,
        source: 'b1LesenModels',
        modelId: reading.id,
        instruction: reading.teil2.intro,
        imageUrl: reading.teil2.image,
        questions: normalizeQuestions(reading.teil2.questions || []),
        studentAnswers: {},
      },
    ];
  }

  return [
    {
      type: 'reading',
      label: 'Lesen',
      title: reading?.title || 'Lesen',
      source: 'lesen',
      instruction: 'Lesen Sie den Text und beantworten Sie die Fragen.',
      text: getText(reading),
      questions: normalizeQuestions(reading?.questions || reading?.fragen || []),
      studentAnswers: {},
    },
  ];
}

function buildListeningParts(level) {
  const listeningModels = getListeningModels(level);

  return listeningModels.map((item, index) => ({
    type: 'listening',
    label: 'Hören',
    title: item?.title || `Hören ${index + 1}`,
    source: 'hoeren',
    modelId: item?.id || null,
    instruction: 'Hören Sie den Text und beantworten Sie die Fragen.',
    audioUrl: item?.audioUrl || item?.audio || '',
    audioText: item?.audioText || item?.text || item?.content || '',
    questions: normalizeQuestions(item?.questions || item?.fragen || []),
    studentAnswers: {},
  }));
}

function buildSelfIntroPart(level) {
  return {
    type: 'self_intro',
    label: 'Sprechen',
    title: 'Selbstvorstellung',
    source: 'muendliche_pruefung',
    instruction:
      level === 'B2'
        ? 'Stellen Sie sich ausführlich vor. Sprechen Sie über Ausbildung, Beruf, Erfahrungen und Ziele.'
        : 'Bitte stellen Sie sich kurz vor. Sprechen Sie über Name, Herkunft, Wohnort, Arbeit oder Kurs, Familie und Freizeit.',
    points:
      level === 'B2'
        ? ['Ausbildung', 'Beruf', 'Erfahrungen', 'Ziele', 'Meinung']
        : ['Name', 'Herkunft', 'Wohnort', 'Arbeit oder Kurs', 'Familie', 'Freizeit'],
    studentAnswer: '',
  };
}

function buildImagePart(level) {
  const image = getImageModel(level);

  return {
    type: 'image',
    label: level === 'B2' ? 'Grafikbeschreibung' : 'Bildbeschreibung',
    title: image?.title || (level === 'B2' ? 'Grafikbeschreibung' : 'Bildbeschreibung'),
    source: 'bildbeschreibung',
    instruction:
      level === 'B2'
        ? 'Beschreiben Sie die Grafik. Vergleichen Sie die Informationen und sagen Sie Ihre Meinung.'
        : 'Beschreiben Sie das Bild. Sprechen Sie über Personen, Ort, Handlung, Meinung und eigene Erfahrung.',
    imageUrl: image?.imageUrl || image?.src || image?.url || image?.image || '',
    points:
      level === 'B2'
        ? ['Thema', 'Zahlen / Entwicklung', 'Vergleich', 'Gründe', 'Meinung']
        : ['Personen', 'Ort', 'Handlung', 'Meinung', 'Eigene Erfahrung'],
    studentAnswer: '',
  };
}

function buildPlanningPart(level) {
  const oral = getPlanningModel(level);

  return {
    type: level === 'A2' ? 'roleplay' : 'planning',
    label:
      level === 'A2'
        ? 'Aufgabe lösen'
        : level === 'B2'
        ? 'Diskussion / Präsentation'
        : 'Etwas planen',
    title:
      oral?.title ||
      (level === 'A2'
        ? 'Aufgabe lösen'
        : level === 'B2'
        ? 'Diskussion / Präsentation'
        : 'Etwas gemeinsam planen'),
    source: 'muendliche_pruefung',
    instruction:
      oral?.situation ||
      getText(oral) ||
      (level === 'A2'
        ? 'Lösen Sie die Situation. Fragen Sie nach Informationen und reagieren Sie passend.'
        : level === 'B2'
        ? 'Diskutieren Sie das Thema. Nennen Sie Vorteile, Nachteile und Ihre Meinung.'
        : 'Planen Sie gemeinsam eine Aktivität.'),
    points:
      oral?.points ||
      oral?.followUps ||
      (level === 'A2'
        ? ['Grund nennen', 'Information fragen', 'Vorschlag machen', 'Reagieren']
        : level === 'B2'
        ? ['Meinung', 'Vorteile', 'Nachteile', 'Beispiele', 'Schlussfolgerung']
        : ['Wann?', 'Wo?', 'Wer kommt?', 'Was brauchen Sie?', 'Wer macht was?']),
    studentAnswer: '',
  };
}

export function buildPremiumExamParts(level = 'B1') {
  const examLevel = cleanLevel(level);

  const parts = [
  buildWritingPart(examLevel),
  ...buildReadingParts(examLevel),
  ...buildListeningParts(examLevel),
  buildSelfIntroPart(examLevel),
  buildImagePart(examLevel),
  buildPlanningPart(examLevel),
];

return parts.map((part) => {
  let sectionIndex = 0;

  if (part.type?.startsWith("reading")) {
    sectionIndex = 1;
  } else if (part.type === "listening") {
    sectionIndex = 2;
  } else if (
    part.type === "self_intro" ||
    part.type === "image" ||
    part.type === "planning" ||
    part.type === "roleplay"
  ) {
    sectionIndex = 3;
  }

  return withExaminerMeta(part, examLevel, sectionIndex);
});
}

export function buildPremiumExamPackage({
  level = 'B1',
  packageType = 'ai_exam',
  userProfile = null,
} = {}) {
  return {
    ...buildPlatformPremiumPackage({ level, packageType }),
    userProfile,
  };
}

/** @deprecated Legacy random builder — kept for reference; use buildPremiumExamPackage. */
export function buildPremiumExamPackageLegacy({
  level = 'B1',
  packageType = 'ai_exam',
  userProfile = null,
} = {}) {
  const examLevel = cleanLevel(level);

  const examCount =
    packageType === 'premium_month'
      ? 5
      : packageType === 'intensive_week'
      ? 3
      : 1;

  const exams = Array.from({ length: examCount }).map((_, index) => {
    const parts = buildPremiumExamParts(examLevel);

    return {
      id: `${packageType}-${examLevel}-${index + 1}`,
      title:
        packageType === 'premium_month'
          ? `Premium Monat · Prüfung ${index + 1}`
          : packageType === 'intensive_week'
          ? `Intensive Woche · Prüfung ${index + 1}`
          : `AI Probeprüfung ${examLevel}`,
      level: examLevel,
      packageType,
      examNumber: index + 1,
      parts,
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
  });

  return {
    level: examLevel,
    packageType,
    userProfile,
    title:
      packageType === 'premium_month'
        ? `Premium Monat ${examLevel}`
        : packageType === 'intensive_week'
        ? `Intensive Woche ${examLevel}`
        : `AI Probeprüfung ${examLevel}`,
    durationMinutes:
      examLevel === 'A2' ? 12 : examLevel === 'B1' ? 20 : 25,
    totalExams: examCount,
    exams,
    createdAt: new Date().toISOString(),
  };
}

export function savePremiumExamPackage(examPackage) {
  try {
    localStorage.setItem(
      'austriaPathPremiumExamPackage',
      JSON.stringify(examPackage)
    );
  } catch (error) {
    console.warn('Could not save premium exam package', error);
  }

  return examPackage;
}