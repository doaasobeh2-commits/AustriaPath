// src/data/aiExamEngine.js

const LEVELS = ['A2', 'B1', 'B2'];

function normalizeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, words = []) {
  const clean = normalizeText(text);
  return words.some((word) => clean.includes(normalizeText(word)));
}

function pickFirstAvailable(list = []) {
  return list.find(Boolean) || null;
}

const REQUIRED_TOPICS = {
  A2: {
    self_intro: [
      'name',
      'herkunft',
      'wohnort',
      'arbeit_kurs',
      'familie',
      'freizeit',
    ],
    image: ['personen', 'ort', 'handlung'],
    planning: ['vorschlag', 'zeit', 'ort', 'reaktion', 'entscheidung'],
  },

  B1: {
    self_intro: [
      'name',
      'herkunft',
      'wohnort',
      'arbeit_kurs',
      'familie',
      'freizeit',
      'grund',
      'erfahrung',
      'zukunft',
    ],
    image: [
      'personen',
      'ort',
      'handlung',
      'details',
      'meinung',
      'eigene_erfahrung',
      'begruendung',
    ],
    planning: [
      'vorschlag',
      'grund',
      'zeit',
      'ort',
      'aufgaben',
      'nachfrage',
      'reaktion',
      'entscheidung',
    ],
  },

  B2: {
    self_intro: [
      'ausbildung',
      'beruf',
      'erfahrung',
      'ziele',
      'meinung',
      'begruendung',
      'vergleich',
    ],
    image: [
      'beschreibung',
      'details',
      'interpretation',
      'vergleich',
      'meinung',
      'begruendung',
      'gesellschaftlicher_bezug',
    ],
    planning: [
      'position',
      'argument',
      'gegenargument',
      'beispiel',
      'reaktion',
      'kompromiss',
      'entscheidung',
    ],
  },
};

const TOPIC_KEYWORDS = {
  name: ['ich heiße', 'mein name ist', 'ich bin'],
  herkunft: ['ich komme aus', 'aus syrien', 'aus der türkei', 'aus der ukraine', 'aus afghanistan'],
  wohnort: ['ich wohne', 'ich lebe', 'in wien', 'in österreich', 'in st pölten'],
  arbeit_kurs: ['ich arbeite', 'ich mache einen kurs', 'deutschkurs', 'kurs', 'beruf'],
  familie: ['familie', 'frau', 'mann', 'ehefrau', 'ehemann', 'kind', 'kinder', 'sohn', 'tochter'],
  freizeit: ['freizeit', 'hobby', 'gern', 'ich spiele', 'ich lese', 'sport', 'fußball'],
  grund: ['weil', 'deshalb', 'darum', 'aus diesem grund', 'ich lerne deutsch, weil'],
  erfahrung: ['früher', 'erfahrung', 'ich habe gelernt', 'ich habe gearbeitet', 'seit'],
  zukunft: ['zukunft', 'später', 'ich möchte', 'ich will', 'mein ziel'],

  ausbildung: ['ausbildung', 'studium', 'universität', 'schule', 'abschluss'],
  beruf: ['beruf', 'arbeit', 'firma', 'job', 'ich bin von beruf'],
  ziele: ['ziel', 'ziele', 'ich möchte', 'ich plane', 'in zukunft'],
  meinung: ['ich denke', 'ich finde', 'meiner meinung nach', 'ich glaube'],
  begruendung: ['weil', 'denn', 'deshalb', 'aus diesem grund'],
  vergleich: ['im vergleich', 'anders als', 'mehr als', 'weniger als', 'ähnlich'],

  personen: ['mann', 'frau', 'kind', 'kinder', 'person', 'personen', 'familie'],
  ort: ['park', 'schule', 'haus', 'wohnung', 'straße', 'geschäft', 'bahnhof', 'bus', 'küche', 'arzt'],
  handlung: ['machen', 'spielt', 'arbeiten', 'lernen', 'kaufen', 'sprechen', 'helfen', 'sitzen'],
  details: ['links', 'rechts', 'vorne', 'hinten', 'im hintergrund', 'farbe', 'kleidung'],
  eigene_erfahrung: ['bei mir', 'in meinem land', 'ich habe auch', 'das kenne ich', 'meine erfahrung'],
  beschreibung: ['man sieht', 'ich sehe', 'auf dem bild', 'auf der grafik'],
  interpretation: ['das bedeutet', 'wahrscheinlich', 'vielleicht', 'es sieht so aus'],
  gesellschaftlicher_bezug: ['gesellschaft', 'menschen', 'problem', 'heute', 'in österreich'],

  vorschlag: ['wir können', 'ich schlage vor', 'lass uns', 'vielleicht können wir'],
  zeit: ['uhr', 'samstag', 'sonntag', 'morgen', 'heute', 'woche', 'monat'],
  aufgaben: ['ich mache', 'du machst', 'wer macht', 'aufgabe', 'organisieren'],
  nachfrage: ['wann', 'wo', 'wie', 'was', 'warum', 'wer'],
  reaktion: ['ja', 'okay', 'gute idee', 'das passt', 'einverstanden', 'leider'],
  entscheidung: ['also', 'dann machen wir', 'wir entscheiden', 'am ende', 'abgemacht'],
  position: ['ich bin dafür', 'ich bin dagegen', 'meiner meinung nach'],
  argument: ['ein vorteil', 'dafür spricht', 'wichtig ist', 'weil'],
  gegenargument: ['andererseits', 'ein nachteil', 'dagegen spricht', 'trotzdem'],
  beispiel: ['zum beispiel', 'beispielsweise', 'bei mir', 'in meinem land'],
  kompromiss: ['kompromiss', 'vielleicht', 'wir könnten', 'einverstanden'],
};

const FOLLOW_UP_QUESTIONS = {
  A2: {
    self_intro: {
      name: 'Wie heißen Sie?',
      herkunft: 'Woher kommen Sie?',
      wohnort: 'Wo wohnen Sie jetzt?',
      arbeit_kurs: 'Arbeiten Sie oder besuchen Sie einen Deutschkurs?',
      familie: 'Haben Sie Familie in Österreich?',
      freizeit: 'Was machen Sie gern in Ihrer Freizeit?',
    },
    image: {
      personen: 'Welche Personen sehen Sie auf dem Bild?',
      ort: 'Wo sind die Personen?',
      handlung: 'Was machen die Personen?',
    },
    planning: {
      vorschlag: 'Was schlagen Sie vor?',
      zeit: 'Wann möchten wir das machen?',
      ort: 'Wo treffen wir uns?',
      reaktion: 'Passt das für Sie?',
      entscheidung: 'Was machen wir am Ende genau?',
    },
  },

  B1: {
    self_intro: {
      familie: 'Können Sie etwas mehr über Ihre Familie erzählen?',
      freizeit: 'Was machen Sie gern in Ihrer Freizeit und warum?',
      grund: 'Warum lernen Sie Deutsch?',
      erfahrung: 'Welche Erfahrungen haben Sie mit Deutsch gemacht?',
      zukunft: 'Was möchten Sie in Zukunft machen?',
    },
    image: {
      details: 'Welche Details sehen Sie noch auf dem Bild?',
      meinung: 'Was denken Sie über diese Situation?',
      eigene_erfahrung: 'Haben Sie so etwas schon einmal erlebt?',
      begruendung: 'Warum finden Sie das wichtig oder nicht wichtig?',
    },
    planning: {
      grund: 'Warum finden Sie diesen Vorschlag gut?',
      aufgaben: 'Wer übernimmt welche Aufgabe?',
      nachfrage: 'Welche Frage möchten Sie Ihrem Partner stellen?',
      reaktion: 'Was sagen Sie zu diesem Vorschlag?',
      entscheidung: 'Wofür entscheiden wir uns jetzt?',
    },
  },

  B2: {
    self_intro: {
      ausbildung: 'Welche Rolle spielt Ihre Ausbildung für Ihre Zukunft?',
      beruf: 'Welche beruflichen Ziele haben Sie?',
      erfahrung: 'Welche Erfahrung war für Sie besonders wichtig?',
      meinung: 'Was ist Ihnen beim Leben in Österreich besonders wichtig?',
      begruendung: 'Können Sie Ihre Meinung genauer begründen?',
      vergleich: 'Wie vergleichen Sie Ihre Situation früher und heute?',
    },
    image: {
      interpretation: 'Wie interpretieren Sie diese Situation?',
      vergleich: 'Welche Unterschiede oder Gegensätze erkennen Sie?',
      meinung: 'Welche Meinung haben Sie zu diesem Thema?',
      begruendung: 'Warum vertreten Sie diese Meinung?',
      gesellschaftlicher_bezug: 'Welche Bedeutung hat dieses Thema für die Gesellschaft?',
    },
    planning: {
      position: 'Welche Position vertreten Sie?',
      argument: 'Welches Argument spricht dafür?',
      gegenargument: 'Welche Gegenargumente gibt es?',
      beispiel: 'Können Sie ein konkretes Beispiel nennen?',
      kompromiss: 'Welchen Kompromiss könnten wir finden?',
      entscheidung: 'Wie lautet unsere gemeinsame Entscheidung?',
    },
  },
};

export function getRequiredTopics(level = 'B1', skill = 'self_intro') {
  const safeLevel = LEVELS.includes(level) ? level : 'B1';
  return REQUIRED_TOPICS[safeLevel]?.[skill] || [];
}

export function getMissingTopics({ level = 'B1', skill = 'self_intro', transcript = '' }) {
  const required = getRequiredTopics(level, skill);
  return required.filter((topic) => {
    const keywords = TOPIC_KEYWORDS[topic] || [topic];
    return !includesAny(transcript, keywords);
  });
}

export function extractStudentKeywords(transcript = '') {
  const text = normalizeText(transcript);

  const importantWords = [
    'arbeit',
    'kurs',
    'familie',
    'kinder',
    'beruf',
    'schule',
    'deutsch',
    'österreich',
    'wien',
    'gesundheit',
    'feuerwehr',
    'supermarkt',
    'zug',
    'bus',
    'bahnhof',
    'wohnung',
    'arzt',
    'reise',
    'problem',
    'termin',
    'zukunft',
  ];

  return importantWords.filter((word) => text.includes(word));
}

export function getKeywordBasedQuestion({ level = 'B1', skill = 'self_intro', transcript = '' }) {
  const found = extractStudentKeywords(transcript);

  if (!found.length) return null;

  const word = found[0];

  if (skill === 'self_intro') {
    if (word === 'arbeit' || word === 'beruf') return 'Was gefällt Ihnen an Ihrer Arbeit?';
    if (word === 'kurs' || word === 'deutsch') return 'Warum ist Deutsch für Sie wichtig?';
    if (word === 'familie' || word === 'kinder') return 'Können Sie etwas mehr über Ihre Familie erzählen?';
    if (word === 'österreich' || word === 'wien') return 'Was gefällt Ihnen am Leben in Österreich?';
  }

  if (skill === 'image') {
    if (word === 'feuerwehr') return 'Warum ist die Feuerwehr in dieser Situation wichtig?';
    if (word === 'supermarkt') return 'Was kaufen die Personen vielleicht ein?';
    if (word === 'zug' || word === 'bahnhof') return 'Warum benutzen die Personen vielleicht den Zug?';
    if (word === 'arzt' || word === 'gesundheit') return 'Warum ist Gesundheit in dieser Situation wichtig?';
  }

  if (skill === 'planning') {
    if (word === 'reise') return 'Wohin möchten wir reisen und warum?';
    if (word === 'termin') return 'Welcher Termin passt am besten?';
    if (word === 'problem') return 'Wie können wir dieses Problem lösen?';
    if (word === 'zug' || word === 'bus') return 'Wie fahren wir dorthin?';
  }

  return level === 'B2'
    ? 'Können Sie diesen Punkt genauer erklären und begründen?'
    : 'Können Sie dazu noch etwas mehr sagen?';
}

export function getFollowUpQuestion({
  level = 'B1',
  skill = 'self_intro',
  transcript = '',
  previousQuestions = [],
}) {
  const asked = previousQuestions.map(normalizeText);

  const missing = getMissingTopics({ level, skill, transcript });
  const levelQuestions = FOLLOW_UP_QUESTIONS[level]?.[skill] || {};

  const missingQuestion = pickFirstAvailable(
    missing.map((topic) => levelQuestions[topic]).filter((q) => !asked.includes(normalizeText(q)))
  );

  if (missingQuestion) return missingQuestion;

  const keywordQuestion = getKeywordBasedQuestion({ level, skill, transcript });
  if (keywordQuestion && !asked.includes(normalizeText(keywordQuestion))) {
    return keywordQuestion;
  }

  return level === 'A2'
    ? 'Können Sie bitte noch einen Satz sagen?'
    : level === 'B1'
    ? 'Können Sie das bitte genauer erklären?'
    : 'Können Sie Ihre Aussage etwas differenzierter begründen?';
}

export function shouldAskFollowUp({
  level = 'B1',
  skill = 'self_intro',
  transcript = '',
  followUpCount = 0,
}) {
  const maxFollowUps =
    skill === 'planning' ? 5 :
    level === 'A2' ? 1 :
    2;

  if (followUpCount >= maxFollowUps) return false;

  const missing = getMissingTopics({ level, skill, transcript });

  if (missing.length > 0) return true;

  const text = normalizeText(transcript);
  if (level === 'A2') return text.split(' ').length < 18;
  if (level === 'B1') return text.split(' ').length < 35;
  return text.split(' ').length < 55;
}

export function getPlanningPartnerReply({
  level = 'B1',
  task = '',
  transcript = '',
  conversation = [],
}) {
  const text = normalizeText(transcript);
  const previousAiTexts = conversation
    .filter((msg) => msg.role === 'ai')
    .map((msg) => normalizeText(msg.text));

  const alreadyAsked = (question) => previousAiTexts.includes(normalizeText(question));

  const replyOptions = [];

  if (includesAny(text, ['samstag', 'sonntag', 'morgen', 'heute', 'uhr', 'woche'])) {
    replyOptions.push('Das passt. Um wie viel Uhr treffen wir uns genau?');
  }

  if (includesAny(text, ['zug', 'bus', 'auto', 'bahn', 'fahren'])) {
    replyOptions.push('Gute Idee. Von wo fahren wir los?');
  }

  if (includesAny(text, ['restaurant', 'café', 'park', 'bahnhof', 'geschäft', 'schule'])) {
    replyOptions.push('Okay. Sollen wir uns direkt dort treffen oder vorher an einem anderen Ort?');
  }

  if (includesAny(text, ['ich mache', 'du machst', 'bringen', 'kaufen', 'organisieren'])) {
    replyOptions.push('Gut. Und welche Aufgabe übernehme ich?');
  }

  if (includesAny(text, ['teuer', 'geld', 'kosten', 'bezahlen', 'preis'])) {
    replyOptions.push('Stimmt. Wie viel Geld brauchen wir ungefähr?');
  }

  if (includesAny(text, ['problem', 'kaputt', 'funktioniert nicht', 'hilfe'])) {
    replyOptions.push('Verstanden. Was sollen wir zuerst machen, um das Problem zu lösen?');
  }

  const missing = getMissingTopics({
    level,
    skill: 'planning',
    transcript: conversation.map((m) => m.text).join(' ') + ' ' + transcript,
  });

  if (missing.includes('zeit')) replyOptions.push('Wann möchten wir das machen?');
  if (missing.includes('ort')) replyOptions.push('Wo treffen wir uns?');
  if (missing.includes('aufgaben')) replyOptions.push('Wer übernimmt welche Aufgabe?');
  if (missing.includes('entscheidung')) replyOptions.push('Wofür entscheiden wir uns am Ende?');

  const selected =
    replyOptions.find((q) => !alreadyAsked(q)) ||
    (level === 'A2'
      ? 'Okay. Was machen wir dann?'
      : level === 'B1'
      ? 'Das klingt gut. Können Sie Ihren Vorschlag kurz begründen?'
      : 'Das ist ein interessanter Punkt. Welchen Kompromiss schlagen Sie vor?');

  return selected;
}

export function createInitialExamSession({ exam, level = 'B1' }) {
  return {
    id: `session-${Date.now()}`,
    level,
    examTitle: exam?.title || `AI Probeprüfung ${level}`,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    answers: {},
    oral: {
      self_intro: {
        transcript: '',
        followUps: [],
      },
      image: {
        transcript: '',
        followUps: [],
      },
      planning: {
        conversation: [],
      },
    },
    status: 'running',
  };
}

export function saveExamAnswer(session, partIndex, value) {
  return {
    ...session,
    answers: {
      ...session.answers,
      [partIndex]: value,
    },
  };
}

export function saveOralTranscript(session, skill, transcript) {
  return {
    ...session,
    oral: {
      ...session.oral,
      [skill]: {
        ...(session.oral?.[skill] || {}),
        transcript,
      },
    },
  };
}

export function addFollowUp(session, skill, question, studentTranscript = '') {
  const current = session.oral?.[skill] || { transcript: '', followUps: [] };

  return {
    ...session,
    oral: {
      ...session.oral,
      [skill]: {
        ...current,
        transcript: `${current.transcript || ''}\n${studentTranscript || ''}`.trim(),
        followUps: [
          ...(current.followUps || []),
          {
            question,
            answer: studentTranscript,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
  };
}

export function addPlanningTurn(session, role, text) {
  const planning = session.oral?.planning || { conversation: [] };

  return {
    ...session,
    oral: {
      ...session.oral,
      planning: {
        conversation: [
          ...(planning.conversation || []),
          {
            role,
            text,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
  };
}

export function finishExamSession(session) {
  return {
    ...session,
    status: 'finished',
    finishedAt: new Date().toISOString(),
  };
}

export function buildAiEvaluationPayload({ exam, session }) {
  return {
    instruction:
      'Du bist ein strenger, aber fairer ÖIF-orientierter Deutschprüfer. Während der Prüfung gibst du keine Lösungen. Nach der Prüfung bewertest du die Leistung nach Niveau A2/B1/B2 und erstellst einen klaren Bericht.',
    level: session.level,
    examTitle: session.examTitle,
    parts: exam?.parts || [],
    answers: session.answers,
    oral: session.oral,
    expectedOutput: {
      overallLevel: 'A2 / A2+ / B1- / B1 / B1+ / B2- / B2',
      strengths: [],
      weaknesses: [],
      skillScores: {
        schreiben: '',
        lesen: '',
        hoeren: '',
        sprechen: '',
        planung_diskussion: '',
      },
      repeatedMistakes: [],
      examples: [],
      studyPlan: [],
      recommendation: '',
    },
  };
}

export function createDemoReport({ level = 'B1', session }) {
  const selfIntroText = session?.oral?.self_intro?.transcript || '';
  const imageText = session?.oral?.image?.transcript || '';
  const planningText = (session?.oral?.planning?.conversation || [])
    .map((m) => m.text)
    .join(' ');

  const allText = `${selfIntroText} ${imageText} ${planningText}`;
  const missingSelf = getMissingTopics({ level, skill: 'self_intro', transcript: selfIntroText });
  const missingImage = getMissingTopics({ level, skill: 'image', transcript: imageText });
  const missingPlanning = getMissingTopics({ level, skill: 'planning', transcript: planningText });

  return {
    title: `AI Probeprüfung · ${level}`,
    date: new Date().toLocaleDateString('de-DE'),
    type: 'premium-exam',
    level,
    summary: 'Demo-Bericht: Die echte Bewertung erfolgt später über OpenAI.',
    strengths: [
      allText.length > 80 ? 'Der Schüler kann mehrere Informationen geben.' : 'Der Schüler hat die Prüfung abgeschlossen.',
      'Die Antworten können später durch AI detailliert analysiert werden.',
    ],
    weaknesses: [
      ...missingSelf.map((x) => `Selbstvorstellung: ${x} fehlt oder ist zu kurz.`),
      ...missingImage.map((x) => `Bildbeschreibung/Grafik: ${x} fehlt oder ist zu kurz.`),
      ...missingPlanning.map((x) => `Planung/Diskussion: ${x} fehlt oder ist zu kurz.`),
    ],
    studyPlan: [
      'Selbstvorstellung mit vollständigen Punkten üben.',
      'Bildbeschreibung mit Ort, Personen, Handlung, Meinung und Erfahrung trainieren.',
      'Planungsgespräche mit Vorschlag, Reaktion und Entscheidung üben.',
    ],
  };
}