import React, { useEffect, useMemo, useState } from 'react';
import { b2Models } from '../../data/modelsB2';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';

const PREMIUM_HINT_COOLDOWN_DAYS = 3;
const PREMIUM_HINT_COOLDOWN_MS =
  PREMIUM_HINT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function splitLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAdminQuestions(solution = '') {
  if (!solution) return [];

  const text = String(solution).trim();
  const blocks = text.split(/Frage\s*\d+\s*:/i).filter(Boolean);

  return blocks
    .map((block) => {
      const parts = block.split(/Antwort\s*:/i);

      return {
        q: (parts[0] || '').trim(),
        a: (parts[1] || '').trim()
      };
    })
    .filter((item) => item.q || item.a);
}

function getAdminHorenModels() {
  try {
    const saved = localStorage.getItem('austriaPathAdminData');
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list
      .filter((item) => {
        const bereich = String(
          item.bereich || item.area || item.type || ''
        ).toLowerCase();
        const status = String(item.status || '').toLowerCase();

        return (
          (
            bereich === 'hoeren' ||
            bereich === 'hören' ||
            bereich === 'horen' ||
            bereich.includes('hoeren') ||
            bereich.includes('hören') ||
            bereich.includes('horen')
          ) &&
          status === 'published'
        );
      })
      .map((item) => ({
        title: item.title || 'Hören Modell aus Admin',
        level: item.level || item.niveau || 'A2',
        text: item.content || item.task || item.text || '',
        questions: parseAdminQuestions(item.solution || ''),
        words: splitLines(item.words || item.vocabulary),
        verbs: splitLines(item.verbs),
        grammar: splitLines(item.grammar),
        mistakes: splitLines(item.mistakes),
        expressions: splitLines(item.expressions),
        tip:
          item.tip ||
          'Hören Sie zuerst den Text und beantworten Sie danach die Fragen.',
        fromAdmin: true
      }));
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Hören-Modelle:', error);
    return [];
  }
}

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

const b2HorenModels = b2Models.map((model) => ({
  title: `B2 Hören: ${model.title}`,
  level: 'B2',
  text:
    model.id === 2
      ? `Immer mehr Unternehmen bieten ihren Mitarbeitern die Möglichkeit, von zu Hause aus zu arbeiten. Besonders seit der Corona-Pandemie hat sich Homeoffice in vielen Branchen etabliert. Viele Arbeitnehmer schätzen die gewonnene Flexibilität. Sie sparen Zeit, weil der tägliche Arbeitsweg entfällt, und können ihre Arbeitszeiten oft besser an ihr Privatleben anpassen.

Allerdings gibt es auch kritische Stimmen. Einige Experten warnen davor, dass die Trennung zwischen Beruf und Privatleben schwieriger wird. Wer ständig erreichbar ist, arbeitet häufig länger als geplant. Außerdem kann der persönliche Kontakt zu Kollegen fehlen, was sich negativ auf die Zusammenarbeit und die Motivation auswirken kann.

Unternehmen stehen daher vor der Herausforderung, die Vorteile des Homeoffice zu nutzen und gleichzeitig mögliche Nachteile zu reduzieren. Viele Firmen setzen deshalb auf hybride Arbeitsmodelle. Dabei arbeiten die Beschäftigten teilweise im Büro und teilweise von zu Hause. So sollen Flexibilität und Teamarbeit miteinander verbunden werden.`
      : model.hoeren?.join('. ') || '',
  questions:
    model.id === 2
      ? [
          {
            q: 'Warum bevorzugen viele Arbeitnehmer das Homeoffice?',
            a: 'Weil sie flexibler arbeiten können und Zeit durch den Wegfall des Arbeitsweges sparen.'
          },
          {
            q: 'Welches Problem nennen Kritiker des Homeoffice?',
            a: 'Die Grenze zwischen Arbeit und Privatleben wird oft unklar.'
          },
          {
            q: 'Welche Folgen kann der fehlende Kontakt zu Kollegen haben?',
            a: 'Die Zusammenarbeit und Motivation können darunter leiden.'
          },
          {
            q: 'Wie reagieren viele Unternehmen auf diese Herausforderungen?',
            a: 'Sie führen hybride Arbeitsmodelle ein.'
          },
          {
            q: 'Was ist das Ziel eines hybriden Arbeitsmodells?',
            a: 'Flexibilität und Teamarbeit miteinander zu verbinden.'
          }
        ]
      : [],
  words: model.words || [],
  verbs: [],
  grammar: [],
  mistakes: [],
  expressions: model.expressions || [],
  tip:
    'Bei B2-Hörtexten achten Sie auf Gründe, Folgen, Meinungen und Lösungsvorschläge.'
}));

const staticA2HorenModels = [
  {
    title: 'Termin beim Arzt',
    level: 'A2',
    text:
      'Guten Tag. Hier spricht Frau Müller. Ihr Termin ist morgen um 10 Uhr. Bitte bringen Sie Ihre Versicherungskarte mit.',
    questions: [
      { q: 'Wann ist der Termin?', a: 'Der Termin ist morgen um 10 Uhr.' },
      {
        q: 'Was soll Frau Müller mitbringen?',
        a: 'Sie soll ihre Versicherungskarte mitbringen.'
      }
    ],
    words: ['der Termin', 'der Arzt', 'morgen', 'die Versicherungskarte'],
    verbs: ['sprechen', 'mitbringen', 'kommen'],
    grammar: ['um 10 Uhr', 'Bitte + Verb'],
    mistakes: ['❌ Der Termin ist in 10 Uhr.', '✅ Der Termin ist um 10 Uhr.'],
    tip: 'Achten Sie auf Uhrzeiten und Namen.'
  }
];

export function HorenScreen({
  setActiveTab,
  userLevel = localStorage.getItem('userLevel') || 'A2'
}) {
  const level = userLevel;
  const [index, setIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPremiumHint, setShowPremiumHint] = useState(false);

  const adminHoren = useMemo(() => getAdminHorenModels(), []);

  const modelsByLevel = useMemo(() => {
    const result = {
      A2: [...staticA2HorenModels],
      B1: [],
      B2: [...b2HorenModels]
    };

    adminHoren.forEach((item) => {
      const itemLevel = item.level || item.niveau || 'A2';
      if (!result[itemLevel]) result[itemLevel] = [];
      result[itemLevel].push(item);
    });

    return result;
  }, [adminHoren]);

  const models = modelsByLevel[level] || [];
  const model = models[index];

  const language =
    localStorage.getItem('austriaPathLanguage') ||
    localStorage.getItem('userLanguage') ||
    'Deutsch';

  const premiumMessage = getSmartPremiumMessage(language, 'hoeren');

  useEffect(() => {
    if (!models.length) return;

    const storageKey = 'hoerenPremiumLastShown';

    if (isPremiumUser()) {
      setShowPremiumHint(false);
      return;
    }

    if (shouldShowPremiumHint(storageKey)) {
      setShowPremiumHint(true);
      markPremiumHintShown(storageKey);
    }
  }, [models.length]);

  const readText = () => {
    if (!model?.text) return;

    const utterance = new SpeechSynthesisUtterance(model.text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopText = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>🎧 Hören Trainer</h1>

      <p style={subtitleStyle}>
        Lernen Sie mit Hörmodellen, Fragen und Lösungen.
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

      <select style={inputStyle} value={level} disabled>
        <option value={level}>{level}</option>
      </select>

      {models.length === 0 ? (
        <div style={boxStyle}>
          <h2>{level} Inhalte kommen bald</h2>
          <p style={{ color: '#64748b' }}>
            Für dieses Niveau sind noch keine Hörmodelle verfügbar.
          </p>
        </div>
      ) : (
        <>
          <select
            style={inputStyle}
            value={index}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setShowTranscript(false);
              window.speechSynthesis.cancel();
            }}
          >
            {models.map((item, i) => (
              <option key={i} value={i}>
                Hören {i + 1}: {item.title}
              </option>
            ))}
          </select>

          <div style={boxStyle}>
            <span style={badgeStyle}>{level}</span>
            {model.fromAdmin && <span style={adminBadgeStyle}>Aus Admin</span>}

            <h2>{model.title}</h2>

            <h3>🎧 Hörthema</h3>

            {!showTranscript && (
              <p style={{ color: '#64748b' }}>
                Klicken Sie auf „Hörtext vorlesen“ und beantworten Sie danach die
                Fragen.
              </p>
            )}

            <div style={audioActionsStyle}>
              <button onClick={readText} style={audioButtonStyle}>
                🔊 Hörtext vorlesen
              </button>

              <button onClick={stopText} style={stopButtonStyle}>
                ⏹ Stoppen
              </button>

              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={transcriptButtonStyle}
              >
                {showTranscript ? 'Text ausblenden' : 'Text anzeigen'}
              </button>
            </div>

            {showTranscript && (
              <div style={transcriptBoxStyle}>
                <h3>📝 Transkript / Thema</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{model.text}</p>
              </div>
            )}
          </div>

          <div style={boxStyle}>
            <h3>❓ Fragen und Antworten</h3>
            {model.questions?.map((item, i) => (
              <div key={i} style={questionStyle}>
                <p>
                  <b>Frage {i + 1}:</b> {item.q}
                </p>
                <p>
                  <b>Antwort:</b> {item.a}
                </p>
              </div>
            ))}
          </div>

          <InfoBox title="📌 Wichtige Wörter" items={model.words} />
          <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
          <InfoBox title="📚 Wichtige Grammatik" items={model.grammar} />
          <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />
          <InfoBox title="⭐ B2 Ausdrücke" items={model.expressions} />

          <div style={boxStyle}>
            <h3>⭐ Prüfungstipp</h3>
            <p>{model.tip}</p>
          </div>
        </>
      )}
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={boxStyle}>
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

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6'
};

const transcriptBoxStyle = {
  marginTop: '12px',
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '12px',
  border: '1px solid #e2e8f0'
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

const audioButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const stopButtonStyle = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const transcriptButtonStyle = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const audioActionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '10px'
};

const badgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 'bold',
  marginBottom: '10px',
  marginRight: '8px'
};

const adminBadgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const questionStyle = {
  padding: '10px',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  marginBottom: '10px'
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