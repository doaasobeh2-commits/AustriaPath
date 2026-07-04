import React, { useEffect, useMemo, useState } from 'react';
import { a2Models } from '../../data/modelsA2';
import {
  getAkademieLevelData,
  mergeAkademieLists,
} from '../../data/akademieContent';
import { getAdminAkademieFeed } from '../../utils/adminContent';

const splitItems = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitItems(item))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

function getAdminAkademieItems(level) {
  const feed = getAdminAkademieFeed(level);
  return [
    {
      grammar: feed.grammar,
      satzbau: feed.satzbau,
      konnektoren: feed.konnektoren,
      words: feed.words,
      verbs: feed.verbs,
      mistakes: feed.mistakes,
      akademieEntries: feed.akademieEntries,
    },
  ];
}

function extractAkademieData(items = []) {
  const grammar = [];
  const words = [];
  const verbs = [];
  const satzbau = [];
  const konnektoren = [];
  const mistakes = [];

  items.forEach((item) => {
    grammar.push(...splitItems(item.grammar));
    grammar.push(...splitItems(item.grammatik));

    satzbau.push(...splitItems(item.satzbau));
    satzbau.push(...splitItems(item.sentences));

    konnektoren.push(...splitItems(item.konnektoren));
    konnektoren.push(...splitItems(item.connectors));

    words.push(...splitItems(item.words));
    words.push(...splitItems(item.wortschatz));
    words.push(...splitItems(item.vocabulary));

    verbs.push(...splitItems(item.verbs));
    verbs.push(...splitItems(item.verben));

    mistakes.push(...splitItems(item.mistakes));
    mistakes.push(...splitItems(item.fehler));

    (item.akademieEntries || []).forEach((entry) => {
      if (entry.approved === false) return;
      const label = entry.title + (entry.rule ? ` — ${entry.rule}` : '');
      if (entry.category === 'grammar') grammar.push(label);
      else if (entry.category === 'connector') konnektoren.push(label);
      else if (entry.category === 'vocabulary') words.push(label);
      else if (entry.category === 'verb') verbs.push(label);
      else if (entry.category === 'mistake') mistakes.push(entry.explanation || label);
      else if (entry.category === 'sentence') satzbau.push(...(entry.examSentences || [label]));
      (entry.mistakes || []).forEach((m) => mistakes.push(m));
      (entry.examSentences || []).forEach((s) => satzbau.push(s));
    });
  });

  return {
    grammar,
    words,
    verbs,
    satzbau,
    konnektoren,
    mistakes,
  };
}

const SECTIONS = [
  { id: 'grammatik', label: 'Grammatik' },
  { id: 'satzbau', label: 'Satzbau' },
  { id: 'konnektoren', label: 'Konnektoren' },
  { id: 'wortschatz', label: 'Wortschatz' },
  { id: 'verben', label: 'Verben' },
  { id: 'fehler', label: 'Fehler' },
];

export function AkademieScreen({ setActiveTab, selectedLevel = 'A2' }) {
  const level = selectedLevel || 'A2';
  const [section, setSection] = useState('grammatik');
  const [contentVersion, setContentVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setContentVersion((v) => v + 1);
    window.addEventListener('austriaPathContentUpdated', refresh);
    return () => window.removeEventListener('austriaPathContentUpdated', refresh);
  }, []);

  const staticItems = useMemo(() => {
    if (level === 'A2') return a2Models;
    return [];
  }, [level]);

  const adminItems = useMemo(() => getAdminAkademieItems(level), [level, contentVersion]);
  const levelData = useMemo(() => getAkademieLevelData(level), [level]);

  const data = useMemo(() => {
    const extracted = extractAkademieData([...staticItems, ...adminItems]);
    return {
      grammar: mergeAkademieLists(levelData.grammar, extracted.grammar),
      satzbau: mergeAkademieLists(levelData.satzbau, extracted.satzbau),
      konnektoren: mergeAkademieLists(levelData.konnektoren, extracted.konnektoren),
      words: mergeAkademieLists(levelData.words, extracted.words),
      verbs: mergeAkademieLists(levelData.verbs, extracted.verbs),
      mistakes: mergeAkademieLists(levelData.mistakes, extracted.mistakes),
      expressCards: levelData.expressCards || [],
    };
  }, [staticItems, adminItems, levelData]);

  const subtitle =
    level === 'B2'
      ? 'Grammatik, Argumentation, Redemittel und häufige Prüfungsfehler für Diskussion und gemeinsame Lösung.'
      : level === 'B1'
        ? 'Grammatik, Planungs-Redemittel, Konnektoren und typische ÖIF-Fehler auf B1.'
        : `Grammatik, Satzbau, Konnektoren, Wortschatz und wichtige Verben für ${level}.`;

  return (
    <div style={pageStyle}>
      <div style={mobileStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1 style={titleStyle}>Akademie {level}</h1>
        <p style={subtitleStyle}>{subtitle}</p>

        <div style={tabsStyle}>
          {SECTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              style={tabStyle(section === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={levelInfoStyle}>
          Aktuelles Niveau: <strong>{level}</strong>
        </div>

        <div style={cardStyle}>
          {section === 'grammatik' && (
            <ContentList
              title={`Grammatik ${level}`}
              items={data.grammar}
              emptyText={`Für ${level} sind noch keine Grammatikpunkte verfügbar.`}
            />
          )}

          {section === 'satzbau' && (
            <ContentList
              title={`Satzbau ${level}`}
              items={data.satzbau}
              emptyText={`Für ${level} sind noch keine Satzbau-Beispiele verfügbar.`}
            />
          )}

          {section === 'konnektoren' && (
            <ContentList
              title={`Konnektoren ${level}`}
              items={data.konnektoren}
              emptyText={`Für ${level} sind noch keine Konnektoren verfügbar.`}
            />
          )}

          {section === 'wortschatz' && (
            <ContentList
              title={`Wortschatz ${level}`}
              items={data.words}
              emptyText={`Für ${level} ist noch kein Wortschatz verfügbar.`}
            />
          )}

          {section === 'verben' && (
            <ContentList
              title={`Wichtige Verben ${level}`}
              items={data.verbs}
              emptyText={`Für ${level} sind noch keine Verben verfügbar.`}
            />
          )}

          {section === 'fehler' && (
            <ContentList
              title={`Häufige Prüfungsfehler ${level}`}
              items={data.mistakes}
              emptyText={`Für ${level} sind noch keine Fehlerbeispiele hinterlegt.`}
            />
          )}
        </div>

        {data.expressCards.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <h2 style={expressSectionTitleStyle}>Redemittel für die mündliche Prüfung</h2>
            {data.expressCards.map((card, index) => (
              <ExpressCard key={index} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentList({ title, items, emptyText }) {
  return (
    <>
      <h2>{title}</h2>

      {items.length > 0 ? (
        <ul style={listStyle}>
          {items.map((item, index) => (
            <li key={index} style={listItemStyle}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#64748b' }}>{emptyText}</p>
      )}
    </>
  );
}

function ExpressCard({ card }) {
  return (
    <div style={expressCardStyle}>
      <h3 style={expressCardTitleStyle}>🔹 {card.title}</h3>
      <p style={ruleStyle}>{card.rule}</p>
      <div style={chipWrapStyle}>
        {card.words.map((word, index) => (
          <span key={index} style={chipStyle}>
            {word}
          </span>
        ))}
      </div>
      <p style={exampleStyle}>📝 {card.example}</p>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
};

const mobileStyle = {
  width: '390px',
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '22px',
  paddingBottom: '90px',
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};

const backButtonStyle = {
  marginBottom: '18px',
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 16px',
  borderRadius: '999px',
  fontWeight: '700',
  cursor: 'pointer',
};

const titleStyle = {
  margin: '0 0 8px',
  color: '#0f172a',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.5,
};

const tabsStyle = {
  display: 'flex',
  gap: '8px',
  overflowX: 'auto',
  margin: '20px 0 12px',
};

const tabStyle = (active) => ({
  border: 'none',
  padding: '10px 14px',
  borderRadius: '999px',
  background: active ? '#2563eb' : '#e2e8f0',
  color: active ? 'white' : '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const levelInfoStyle = {
  background: '#dcfce7',
  color: '#166534',
  padding: '10px 14px',
  borderRadius: '14px',
  marginBottom: '18px',
  fontWeight: 700,
};

const cardStyle = {
  background: 'white',
  borderRadius: '18px',
  padding: '18px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
  lineHeight: 1.6,
};

const expressSectionTitleStyle = {
  margin: '0 0 12px',
  fontSize: '18px',
  color: '#1e3a8a',
};

const expressCardStyle = {
  background: 'white',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
  lineHeight: 1.6,
  border: '1px solid #e2e8f0',
};

const expressCardTitleStyle = {
  margin: '0 0 8px',
  fontSize: '18px',
  color: '#1e3a8a',
};

const ruleStyle = {
  margin: '0 0 10px',
  fontWeight: 700,
  color: '#334155',
};

const chipWrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '12px',
};

const chipStyle = {
  background: '#e0f2fe',
  color: '#0369a1',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 700,
};

const exampleStyle = {
  margin: 0,
  color: '#475569',
  fontWeight: 600,
};

const listStyle = {
  paddingLeft: '20px',
  marginBottom: 0,
};

const listItemStyle = {
  marginBottom: '10px',
  color: '#334155',
};
