import { a2Models } from './modelsA2';
import { b1Models } from './modelsb1';
import { b2Models } from './modelsB2';

import { a2Images } from './a2Images';
import { b1Images } from './b1Images';

import { examBank } from './examBank';

function cleanLevel(level = 'B1') {
  return String(level).replace('+', '').trim().toUpperCase() || 'B1';
}

function pickOne(list = []) {
  const clean = list.filter(Boolean);
  if (!clean.length) return null;
  return clean[Math.floor(Math.random() * clean.length)];
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
  const banks = { A2: a2Models, B1: b1Models, B2: b2Models };
  return pickOne(banks[level] || b1Models);
}

function getReadingModel(level) {
  const admin = getAdminByType(level, 'lesen');
  if (admin.length) return pickOne(admin);

  const bank = examBank?.reading?.filter((item) => cleanLevel(item.level) === level) || [];
  return pickOne(bank);
}

function getListeningModel(level) {
  const admin = getAdminByType(level, 'hoeren');
  if (admin.length) return pickOne(admin);

  const bank = examBank?.listening?.filter((item) => cleanLevel(item.level) === level) || [];
  return pickOne(bank);
}

function getImageModel(level) {
  const admin = getAdminByType(level, 'bildbeschreibung');
  if (admin.length) return pickOne(admin);

  const banks = { A2: a2Images, B1: b1Images, B2: [] };
  return pickOne(banks[level] || []);
}

function getOralModel(level) {
  const type =
    level === 'A2' ? 'aufgabe_loesen' : level === 'B2' ? 'diskussion' : 'planung';

  const admin = getAdminByType(level, type);
  if (admin.length) return pickOne(admin);

  const bank = examBank?.planning?.filter((item) => cleanLevel(item.level) === level) || [];
  return pickOne(bank);
}

function normalizeQuestions(questions = []) {
  return questions.map((q) => {
    if (q.answerMode === 'trueFalse') return { q: q.q, options: ['richtig', 'falsch'] };
    if (q.answerMode === 'text') return { q: q.q, options: ['Antwort schreiben'] };
    return { q: q.q || q.frage || q.question, options: q.options || ['Antwort schreiben'] };
  });
}

function getText(item) {
  return item?.text || item?.content || item?.task || item?.aufgabe || item?.description || '';
}

export function buildPremiumExamParts(level = 'B1') {
  const examLevel = cleanLevel(level);

  const writing = getWritingModel(examLevel);
  const reading = getReadingModel(examLevel);
  const listening = getListeningModel(examLevel);
  const image = getImageModel(examLevel);
  const oral = getOralModel(examLevel);

  return [
    {
      type: 'writing',
      label: 'Schreiben',
      title: writing?.title || 'E-Mail schreiben',
      source: 'ueben',
      instruction: getText(writing) || `Schreiben Sie eine E-Mail auf Niveau ${examLevel}.`,
      points: ['Anrede', 'Grund', 'Bitte/Vorschlag', 'Grußformel'],
    },

    {
      type: 'reading',
      label: 'Lesen',
      title: reading?.title || 'Lesen',
      source: 'lesen',
      instruction: 'Lesen Sie den Text und beantworten Sie die Fragen.',
      text: getText(reading),
      questions: normalizeQuestions(reading?.questions || reading?.fragen || []),
    },

    {
      type: 'listening',
      label: 'Hören',
      title: listening?.title || 'Hören',
      source: 'hoeren',
      instruction: 'Hören Sie den Text und beantworten Sie die Fragen.',
      audioText: listening?.audioText || listening?.text || listening?.content || '',
      questions: normalizeQuestions(listening?.questions || listening?.fragen || []),
    },

    {
      type: 'self_intro',
      label: 'Sprechen',
      title: 'Selbstvorstellung',
      source: 'muendliche_pruefung',
      instruction:
        examLevel === 'B2'
          ? 'Stellen Sie sich ausführlich vor.'
          : 'Bitte stellen Sie sich kurz vor.',
      points:
        examLevel === 'B2'
          ? ['Ausbildung', 'Beruf', 'Erfahrungen', 'Ziele']
          : ['Name', 'Herkunft', 'Wohnort', 'Arbeit oder Kurs', 'Familie', 'Freizeit'],
    },

    {
      type: 'image',
      label: examLevel === 'B2' ? 'Grafikbeschreibung' : 'Bildbeschreibung',
      title: image?.title || (examLevel === 'B2' ? 'Grafikbeschreibung' : 'Bildbeschreibung'),
      source: 'bildbeschreibung',
      instruction:
        getText(image) ||
        'Beschreiben Sie das Bild. Sagen Sie auch Ihre Meinung und eigene Erfahrung.',
      imageUrl: image?.imageUrl || image?.src || image?.url || image?.image || '',
      points:
        image?.points ||
        ['Personen / Thema', 'Ort / Situation', 'Handlung', 'Meinung', 'Eigene Erfahrung'],
    },

    {
      type: examLevel === 'A2' ? 'roleplay' : 'planning',
      label:
        examLevel === 'A2'
          ? 'Aufgabe lösen'
          : examLevel === 'B2'
          ? 'Diskussion / Präsentation'
          : 'Etwas planen',
      title:
        oral?.title ||
        (examLevel === 'A2'
          ? 'Aufgabe lösen'
          : examLevel === 'B2'
          ? 'Diskussion / Präsentation'
          : 'Etwas gemeinsam planen'),
      source: 'muendliche_pruefung',
      instruction:
        getText(oral) ||
        (examLevel === 'A2'
          ? 'Lösen Sie die Situation. Fragen Sie nach Informationen und reagieren Sie passend.'
          : examLevel === 'B2'
          ? 'Diskutieren Sie das Thema. Nennen Sie Vorteile, Nachteile und Ihre Meinung.'
          : 'Planen Sie gemeinsam eine Aktivität.'),
      points:
        oral?.followUps ||
        oral?.points ||
        (examLevel === 'A2'
          ? ['Grund nennen', 'Information fragen', 'Vorschlag machen', 'Reagieren']
          : examLevel === 'B2'
          ? ['Meinung', 'Vorteile', 'Nachteile', 'Beispiele', 'Schlussfolgerung']
          : ['Wann?', 'Wo?', 'Wer kommt?', 'Was brauchen Sie?', 'Wer macht was?']),
      preparationSeconds: examLevel === 'A2' ? 0 : 10,
    },
  ];
}

export function buildPremiumExamPackage({
  level = 'B1',
  packageType = 'single_exam',
}) {
  const examLevel = cleanLevel(level);

  const settings = {
    single_exam: {
      title: 'AI Probeprüfung',
      price: '9,99 €',
      examCount: 1,
      validDays: 1,
    },
    intensive_week: {
      title: 'Intensive Woche',
      price: '24,99 €',
      examCount: 3,
      validDays: 7,
    },
    premium_month: {
      title: 'Premium Monat',
      price: '39,99 €',
      examCount: 5,
      validDays: 30,
    },
  };

  const plan = settings[packageType] || settings.single_exam;

  const exams = Array.from({ length: plan.examCount }).map((_, index) => ({
    id: `${packageType}_${examLevel}_${Date.now()}_${index + 1}`,
    number: index + 1,
    level: examLevel,
    title: `${plan.title} ${index + 1}`,
    status: index === 0 ? 'available' : 'locked',
    parts: buildPremiumExamParts(examLevel),
    createdAt: new Date().toISOString(),
  }));

  return {
    id: `${packageType}_${Date.now()}`,
    type: packageType,
    title: plan.title,
    price: plan.price,
    level: examLevel,
    examCount: plan.examCount,
    validDays: plan.validDays,
    status: 'pending-payment',
    createdAt: new Date().toISOString(),
    exams,
    reports: [],
  };
}

export function savePremiumExamPackage(packageData) {
  localStorage.setItem(
    'austriaPathPremiumExamPackage',
    JSON.stringify(packageData)
  );
}

export function getPremiumExamPackage() {
  try {
    return JSON.parse(localStorage.getItem('austriaPathPremiumExamPackage'));
  } catch {
    return null;
  }
}