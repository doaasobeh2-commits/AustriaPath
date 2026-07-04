import React, { useEffect, useMemo, useState } from 'react';
import { b2Models } from '../../data/modelsB2';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
import { b1LesenModels } from '../../data/b1LesenModels';
import { isPremiumUser } from '../../data/utils/premiumHint';
import { B2LesenScreen } from './B2LesenScreen';
import { B1LesenScreen } from './lesen/B1LesenScreen';
import { getUserLanguage, getUserLevel } from '../../utils/userPreferences';
import { getScreenLabels } from '../../i18n/screenLabels';
const PREMIUM_HINT_COOLDOWN_DAYS = 3;
const PREMIUM_HINT_COOLDOWN_MS =
  PREMIUM_HINT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function shouldShowPremiumHint(storageKey) {
  const lastShown = Number(localStorage.getItem(storageKey) || 0);
  const now = Date.now();

  return !lastShown || now - lastShown >= PREMIUM_HINT_COOLDOWN_MS;
}

function markPremiumHintShown(storageKey) {
  localStorage.setItem(storageKey, String(Date.now()));
}

function splitLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdminLesenModels() {
  try {
    const saved = localStorage.getItem('austriaPathAdminData');
    if (!saved) return [];

    const data = JSON.parse(saved);
    const items = Array.isArray(data) ? data : data.items || data.models || [];

    return items
      .filter((item) => {
        const type = String(item.type || item.bereich || item.area || '')
          .toLowerCase();
        const status = String(item.status || '').toLowerCase();

        return (
          status === 'published' &&
          (type === 'lesen' || type.includes('lesen'))
        );
      })
      .map((item) => ({
        title: item.title || 'Lesemodell',
        level: item.level || item.niveau || 'B1',
        text: item.content || item.text || '',
        questions: parseAdminLesenQuestions(item.solution || ''),
        words: splitLines(item.words || item.vocabulary),
        verbs: splitLines(item.verbs),
        grammar: splitLines(item.grammar),
        mistakes: splitLines(item.mistakes),
        tip:
          item.tip ||
          'Achte auf Schlüsselwörter und genaue Informationen im Text.',
        fromAdmin: true
      }));
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Lesen-Modelle:', error);
    return [];
  }
}

function parseAdminLesenQuestions(solution = '') {
  if (!solution) return [];

  return solution
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

      const questionLine =
        lines.find((l) => l.toLowerCase().startsWith('frage')) ||
        lines[0] ||
        '';

      const answerLine =
        lines.find((l) => l.toLowerCase().startsWith('antwort')) || '';

      return {
        q: questionLine.replace(/^Frage\s*\d*\s*:/i, '').trim(),
        a: answerLine.replace(/^Antwort\s*:/i, '').trim()
      };
    })
    .filter((item) => item.q);
}

const b2LesenModels = b2Models.map((model) => ({
  title: `B2 Lesen: ${model.title}`,
  level: 'B2',
  text: `Teil 1:
${model.lesen?.[0] || ''}

Teil 2:
${model.lesen?.[1] || ''}

Teil 3:
${model.lesen?.[2] || ''}`,
  questions: [
    {
      q: '1. Was ist ein Thema im Lesen Teil 1?',
      a: model.lesen?.[0] || 'Wohnformen für Studierende.'
    },
    {
      q: '2. Was ist ein Thema im Lesen Teil 2?',
      a: model.lesen?.[1] || 'Wohnen im Alter.'
    },
    {
      q: '3. Was ist ein Thema im Lesen Teil 3?',
      a: model.lesen?.[2] || 'Studium und Weiterbildung.'
    },
    {
      q: '4. Was beeinflusst laut Text das Kaufverhalten?',
      a:
        'Temperatur, Werbung, Verpackungsgröße und die Reihenfolge von Informationen.'
    },
    {
      q: '5. Welche Information nutzt das Gehirn unter Zeitdruck oft zuerst?',
      a: 'Das Gehirn nutzt unter Zeitdruck oft die erste Information.'
    }
  ],
  words: model.words || [],
  verbs: model.verbs || [],
  grammar: model.grammar || [],
  mistakes: [
    '❌ Die Werbung beeinflussen die Kunden.',
    '✅ Die Werbung beeinflusst die Kunden.',
    '❌ Unter Zeitdruck nutzt das Gehirn die Information erste.',
    '✅ Unter Zeitdruck nutzt das Gehirn die erste Information.'
  ],
  tip:
    'Bei B2-Lesetexten musst du nicht jedes Wort verstehen. Achte auf Schlüsselwörter, Gegensätze und Reihenfolge.'
}));

const lesenModels = {
  A2: [
    {
      title: 'Maria arbeitet im Supermarkt',
      text:
        'Maria wohnt in Wien. Sie arbeitet in einem Supermarkt. Jeden Morgen fährt sie mit dem Bus zur Arbeit. Ihre Arbeit beginnt um 8 Uhr. Am Nachmittag kauft sie Brot und Gemüse ein.',
      questions: [
        { q: 'Wo arbeitet Maria?', a: 'Maria arbeitet in einem Supermarkt.' },
        {
          q: 'Womit fährt Maria zur Arbeit?',
          a: 'Sie fährt mit dem Bus zur Arbeit.'
        },
        { q: 'Wann beginnt ihre Arbeit?', a: 'Ihre Arbeit beginnt um 8 Uhr.' }
      ],
      words: ['der Supermarkt', 'der Bus', 'die Arbeit', 'das Gemüse'],
      verbs: ['wohnen', 'arbeiten', 'fahren', 'einkaufen'],
      grammar: ['in Wien', 'mit dem Bus', 'um 8 Uhr'],
      mistakes: ['❌ Sie fährt mit Bus.', '✅ Sie fährt mit dem Bus.'],
      tip: 'Achte auf Orte, Verkehrsmittel und Uhrzeiten.'
    }
  ],

  B1: b1LesenModels,

  B2: b2LesenModels
};

export function LesenScreen({
  setActiveTab,
  userLevel = getUserLevel()
}) {
  const level = userLevel;
  const labels = getScreenLabels(getUserLanguage());
  if (level === 'B2') {
  return <B2LesenScreen setActiveTab={setActiveTab} />;
}
if (level === 'B1') {
  return <B1LesenScreen setActiveTab={setActiveTab} />;
}
  const [index, setIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showPremiumHint, setShowPremiumHint] = useState(false);

  const models = useMemo(() => {
    const adminItems = getAdminLesenModels();
    const staticItems = lesenModels[level] || [];

    const adminForLevel = adminItems.filter(
      (item) => (item.level || 'B1').toUpperCase() === level.toUpperCase()
    );

    return [...staticItems, ...adminForLevel];
  }, [level]);

  const model = models[index];

  const language = getUserLanguage();

  const premiumMessage = getSmartPremiumMessage(language, 'lesen');

  useEffect(() => {
    if (!models.length) return;

    const storageKey = 'lesenPremiumLastShown';

    if (isPremiumUser()) {
      setShowPremiumHint(false);
      return;
    }

    if (shouldShowPremiumHint(storageKey)) {
      setShowPremiumHint(true);
      markPremiumHintShown(storageKey);
    }
  }, [models.length]);

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        {labels.back}
      </button>

      <h1>📖 Lesen Trainer</h1>

      <p style={subtitleStyle}>
        Lernen Sie mit Lesethemen, Fragen und Lösungen.
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
            Für dieses Niveau sind noch keine Lesemodelle verfügbar.
          </p>
        </div>
      ) : (
        <>
          <select
            style={inputStyle}
            value={index}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setShowQuestions(false);
            }}
          >
            {models.map((item, i) => (
              <option key={i} value={i}>
                Lesen {i + 1}: {item.title}
              </option>
            ))}
          </select>

          {!showQuestions ? (
            <div style={highlightBoxStyle}>
              <span style={badgeStyle}>{level}</span>
              {model.fromAdmin && (
                <span style={adminBadgeStyle}>Aus Admin</span>
              )}

              <h2>{model.title}</h2>

              <h3>📄 Anzeige / Broschüre</h3>

              <p style={{ whiteSpace: 'pre-line' }}>{model.text}</p>

              <button
                style={backButtonStyle}
                onClick={() => setShowQuestions(true)}
              >
                ➡ Fragen anzeigen
              </button>
            </div>
          ) : (
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

              <button
                style={backButtonStyle}
                onClick={() => setShowQuestions(false)}
              >
                ← Zurück zur Anzeige
              </button>
            </div>
          )}

          <InfoBox title="📌 Wichtige Wörter" items={model.words} />
          <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
          <InfoBox title="📚 Wichtige Grammatik" items={model.grammar} />
          <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />

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

const highlightBoxStyle = {
  ...boxStyle,
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe'
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