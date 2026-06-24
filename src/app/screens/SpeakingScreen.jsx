import React, { useEffect, useMemo, useState } from 'react';
import { b1PlanningModels } from '../../data/modelsB1';
import { b2Models } from '../../data/modelsB2';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';

const STORAGE_KEY = 'austriaPathAdminData';

const PREMIUM_HINT_COOLDOWN_DAYS = 3;
const PREMIUM_HINT_COOLDOWN_MS =
  PREMIUM_HINT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function isPremiumUser() {
  return (
    localStorage.getItem('isPremiumUser') === 'true' ||
    localStorage.getItem('placementPaid') === 'true' ||
    Boolean(localStorage.getItem('premiumPlan'))
  );
}

function shouldShowPremiumHint(storageKey) {
  const lastShown = Number(localStorage.getItem(storageKey) || 0);
  const now = Date.now();

  return !lastShown || now - lastShown >= PREMIUM_HINT_COOLDOWN_MS;
}

function markPremiumHintShown(storageKey) {
  localStorage.setItem(storageKey, String(Date.now()));
}

const b2SpeakingModels = b2Models.flatMap((model) => [
  {
    title: model.diskussion || 'Diskussion B2',
    type: 'Diskussion',
    level: 'B2',
    situation: `Diskutieren Sie über das Thema: ${
      model.diskussion || 'Diskussion'
    }`,
    task:
      'Nennen Sie Vorteile und Nachteile. Begründen Sie Ihre Meinung mit Beispielen.',
    example: '',
    words: model.words || [],
    verbs: model.verbs || [],
    sentences: [
      'Meiner Meinung nach ...',
      'Ein wichtiger Vorteil ist ...',
      'Ein möglicher Nachteil besteht darin, dass ...',
      'Andererseits muss man sagen, dass ...',
      'Aus meiner Sicht ...'
    ],
    grammar: model.grammar || [],
    mistakes: [],
    tip: 'Bei B2: Begründen Sie Ihre Meinung klar und nennen Sie Beispiele.'
  },
  {
    title: model.planung || 'Planung B2',
    type: 'Planung',
    level: 'B2',
    situation: `Planen Sie gemeinsam: ${model.planung || 'Planung'}`,
    task: 'Besprechen Sie Ort, Zeit, Aufgaben, Kosten und Organisation.',
    example: '',
    words: model.words || [],
    verbs: model.verbs || [],
    sentences: [
      'Was hältst du davon, wenn wir ...?',
      'Wir könnten zuerst ...',
      'Ich würde vorschlagen, dass ...',
      'Wer übernimmt diese Aufgabe?',
      'Dann einigen wir uns auf ...'
    ],
    grammar: model.grammar || [],
    mistakes: [],
    tip:
      'Bei der Planung: Fragen stellen, Vorschläge machen und sich einigen.'
  }
]);

const speakingModels = {
  A2: [
    {
      title: 'Aufgabe lösen: Termin beim Arzt',
      type: 'Aufgabe lösen',
      level: 'A2',
      situation:
        'Sie können morgen nicht zum Arzt kommen. Rufen Sie in der Praxis an.',
      task: 'Sagen Sie warum. Bitten Sie um einen neuen Termin.',
      example: `Person A: Guten Tag. Ich habe morgen einen Termin beim Arzt.

Person B: Um wie viel Uhr haben Sie den Termin?

Person A: Um 10 Uhr. Leider kann ich nicht kommen, weil ich arbeiten muss.

Person B: Kein Problem. Möchten Sie einen neuen Termin?

Person A: Ja bitte.

Person B: Nächsten Dienstag um 14 Uhr.

Person A: Das passt gut. Vielen Dank.

Person B: Gern geschehen. Auf Wiederhören.`,
      words: ['der Termin', 'die Praxis', 'der Arzt', 'nächste Woche'],
      verbs: ['anrufen', 'verschieben', 'kommen', 'arbeiten'],
      sentences: [
        'Leider kann ich nicht kommen.',
        'Können wir den Termin verschieben?',
        'Das passt gut.',
        'Vielen Dank.'
      ],
      grammar: ['Modalverb können', 'weil + Verb am Ende', 'höfliche Fragen'],
      mistakes: [
        '❌ Ich muss arbeiten weil.',
        '✅ Ich muss arbeiten, weil ich arbeiten muss.'
      ],
      tip: 'Antworten Sie kurz und höflich.'
    }
  ],

  B1: b1PlanningModels.map((item) => ({
    title: `Etwas planen: ${item.title}`,
    type: 'Etwas planen',
    level: 'B1',
    situation: item.situation || '',
    task: Array.isArray(item.points)
      ? item.points.join('\n')
      : Array.isArray(item.task)
        ? item.task.join('\n')
        : item.task || '',
    example: Array.isArray(item.dialog)
      ? item.dialog.join('\n')
      : item.example || '',
    words: item.words || [],
    verbs: item.verbs || [],
    sentences: item.sentences || [
      'Was meinst du?',
      'Ich finde, wir könnten ...',
      'Das ist eine gute Idee.',
      'Ich bin einverstanden.',
      'Dann machen wir das so.'
    ],
    grammar: item.grammar || [
      'Konjunktiv II: könnten',
      'Fragen stellen',
      'Vorschläge machen'
    ],
    mistakes: item.mistakes || [],
    tip:
      item.tip ||
      'Machen Sie Vorschläge, stellen Sie Fragen und einigen Sie sich.'
  })),

  B2: b2SpeakingModels
};

const splitLines = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getTypeByLevel = (level) => {
  if (level === 'A2') return 'Aufgabe lösen';
  if (level === 'B1') return 'Etwas planen';
  return 'Diskussion & Planung';
};

const getDefaultTask = (level) => {
  if (level === 'A2') {
    return 'Lesen Sie die Situation und lösen Sie die Aufgabe kurz und höflich.';
  }

  if (level === 'B1') {
    return 'Planen Sie gemeinsam. Sprechen Sie über Ort, Zeit, Aufgaben und Entscheidung.';
  }

  return 'Diskutieren oder planen Sie das Thema. Begründen Sie Ihre Meinung mit Beispielen.';
};

const getDefaultTip = (level) => {
  if (level === 'A2') return 'Antworten Sie kurz, klar und höflich.';
  if (level === 'B1') {
    return 'Machen Sie Vorschläge, reagieren Sie und einigen Sie sich.';
  }
  return 'Sprechen Sie strukturiert, begründen Sie Ihre Meinung und nennen Sie Beispiele.';
};

function getAdminSpeakingModels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list
      .filter((item) => {
        const bereich = normalizeText(item.bereich || item.area || item.type);
        const status = normalizeText(item.status);

        return (
          (bereich === 'sprechen' ||
            bereich === 'mündlich' ||
            bereich === 'muendlich' ||
            bereich === 'mündliche prüfung' ||
            bereich === 'planung' ||
            bereich === 'diskussion') &&
          status === 'published'
        );
      })
      .map((item) => {
        const itemLevel = item.level || item.niveau || 'A2';
        const rawType = normalizeText(item.bereich || item.area || item.type);

        return {
          title: item.title || 'Mündliche Prüfung aus Admin',
          type:
            rawType === 'planung'
              ? 'Etwas planen'
              : rawType === 'diskussion'
                ? 'Diskussion'
                : getTypeByLevel(itemLevel),
          level: itemLevel,
          situation:
            item.situation || item.content || item.text || item.notes || '',
          task: item.task || item.aufgabe || getDefaultTask(itemLevel),
          example:
            item.example ||
            item.solution ||
            item.musterloesung ||
            item.musterlösung ||
            '',
          words: Array.isArray(item.words)
            ? item.words
            : splitLines(item.words || item.wortschatz || item.vocabulary),
          verbs: Array.isArray(item.verbs)
            ? item.verbs
            : splitLines(item.verbs || item.verben),
          sentences: Array.isArray(item.sentences)
            ? item.sentences
            : splitLines(item.sentences || item.satzbau),
          grammar: Array.isArray(item.grammar)
            ? item.grammar
            : splitLines(item.grammar || item.grammatik),
          mistakes: Array.isArray(item.mistakes)
            ? item.mistakes
            : splitLines(item.mistakes),
          tip: item.tip || getDefaultTip(itemLevel),
          fromAdmin: true
        };
      });
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Sprechen-Modelle:', error);
    return [];
  }
}

export function SpeakingScreen({
  setActiveTab,
  userLevel = localStorage.getItem('userLevel') || 'A2'
}) {
  const level = userLevel;
  const [index, setIndex] = useState(0);
  const [showPremiumHint, setShowPremiumHint] = useState(false);

  const adminModels = useMemo(() => getAdminSpeakingModels(), []);

  const modelsByLevel = useMemo(() => {
    const result = {
      A2: [...(speakingModels.A2 || [])],
      B1: [...(speakingModels.B1 || [])],
      B2: [...(speakingModels.B2 || [])]
    };

    adminModels.forEach((item) => {
      const itemLevel = item.level || 'A2';
      if (!result[itemLevel]) result[itemLevel] = [];
      result[itemLevel].push(item);
    });

    return result;
  }, [adminModels]);

  const models = modelsByLevel[level] || [];
  const current = models[index];
  const sectionTitle = getTypeByLevel(level);

  const language =
    localStorage.getItem('austriaPathLanguage') ||
    localStorage.getItem('userLanguage') ||
    'Deutsch';

 const premiumMessage = getSmartPremiumMessage(language, 'speaking');

  useEffect(() => {
    if (!models.length) return;

    const storageKey = 'sprechenPremiumLastShown';

    if (isPremiumUser()) {
      setShowPremiumHint(false);
      return;
    }

    if (shouldShowPremiumHint(storageKey)) {
      setShowPremiumHint(true);
      markPremiumHintShown(storageKey);
    }
  }, [models.length]);

  if (!current) {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1>🗣️ Mündliche Prüfung</h1>

        <select style={inputStyle} value={userLevel} disabled>
          <option value={userLevel}>{userLevel}</option>
        </select>

        <div style={cardStyle}>
          Für {level} sind noch keine Inhalte verfügbar.
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>🗣️ Mündliche Prüfung</h1>

      <p style={subtitleStyle}>
        Wählen Sie ein Niveau und trainieren Sie den passenden mündlichen
        Prüfungsteil.
      </p>

      {showPremiumHint && (
        <div style={premiumHintStyle}>
          <div style={{ fontSize: '30px' }}>{premiumMessage.icon}</div>

          <h3 style={{ margin: '8px 0', color: '#0f172a' }}>
            {premiumMessage.title}
          </h3>

          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            {premiumMessage.text}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('premium')}
              style={premiumButtonStyle}
            >
              {premiumMessage.button}
            </button>

            <button
              onClick={() => {
                setShowPremiumHint(false);
              }}
              style={laterButtonStyle}
            >
              {premiumMessage.later}
            </button>
          </div>
        </div>
      )}

      <select style={inputStyle} value={userLevel} disabled>
        <option value={userLevel}>{userLevel}</option>
      </select>

      <div style={levelInfoStyle}>
        <b>{level}:</b> {sectionTitle}
      </div>

      <select
        style={inputStyle}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
      >
        {models.map((item, i) => (
          <option key={i} value={i}>
            {item.type} {i + 1}: {item.title}
          </option>
        ))}
      </select>

      <div style={mainCardStyle}>
        <span style={badgeStyle}>{level}</span>
        <span style={typeBadgeStyle}>{current.type}</span>
        {current.fromAdmin && <span style={adminBadgeStyle}>Aus Admin</span>}

        <h2>
          {current.type}: {current.title}
        </h2>

        <h3>📌 Situation</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{current.situation}</p>

        <h3>🎯 Aufgabe</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{current.task}</p>

        <h3>✅ Beispiel</h3>
        <p style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
          {current.example || 'Beispiel wird bald ergänzt.'}
        </p>
      </div>

      <InfoBox title="📌 Wichtige Wörter" items={current.words} />
      <InfoBox title="💪 Wichtige Verben" items={current.verbs} />
      <InfoBox title="🗣️ Nützliche Sätze" items={current.sentences} />
      <InfoBox title="📚 Wichtige Grammatik" items={current.grammar} />
      <InfoBox title="⚠️ Häufige Fehler" items={current.mistakes} />

      <div style={cardStyle}>
        <h3>⭐ Prüfungstipp</h3>
        <p>{current.tip}</p>
      </div>
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={cardStyle}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};

const levelInfoStyle = {
  backgroundColor: '#ecfdf5',
  color: '#166534',
  padding: '12px',
  borderRadius: '14px',
  marginBottom: '12px',
  border: '1px solid #bbf7d0'
};

const mainCardStyle = {
  backgroundColor: '#eff6ff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #bfdbfe',
  lineHeight: '1.6'
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6'
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#2563eb',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginRight: '8px',
  marginBottom: '10px'
};

const typeBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginRight: '8px',
  marginBottom: '10px'
};

const adminBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px'
};

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
};

const premiumButtonStyle = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const laterButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};