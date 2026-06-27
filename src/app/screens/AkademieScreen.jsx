import React, { useMemo, useState } from 'react';
import { a2Models } from '../../data/modelsA2';

const STORAGE_KEY = 'austriaPathAdminData';

const b2ExpressCards = [
  {
    title: 'berücksichtigen',
    rule: 'berücksichtigen + Akkusativ',
    words: ['die Kosten', 'die Umwelt', 'die Meinung', 'die Situation'],
    example: 'Wir müssen auch die Kosten berücksichtigen.'
  },
  {
    title: 'beitragen zu',
    rule: 'beitragen zu + Dativ',
    words: ['zur Integration', 'zur Gesundheit', 'zum Umweltschutz'],
    example: 'Sport trägt zur Gesundheit bei.'
  },
  {
    title: 'abhängen von',
    rule: 'abhängen von + Dativ',
    words: ['von der Situation', 'von den Kosten', 'von der Entscheidung'],
    example: 'Das hängt von der persönlichen Situation ab.'
  },
  {
    title: 'sich engagieren für',
    rule: 'sich engagieren für + Akkusativ',
    words: ['für die Umwelt', 'für Kinder', 'für den Verein'],
    example: 'Ich engagiere mich freiwillig für den Umweltschutz.'
  },
  {
    title: 'sich einigen auf',
    rule: 'sich einigen auf + Akkusativ',
    words: ['auf einen Termin', 'auf einen Ort', 'auf eine Lösung'],
    example: 'Am Ende einigen wir uns auf einen passenden Termin.'
  },
  {
    title: 'vorschlagen',
    rule: 'vorschlagen, dass ...',
    words: ['einen Termin', 'eine Lösung', 'ein Programm'],
    example: 'Ich schlage vor, dass wir zuerst den Ort festlegen.'
  },
  {
    title: 'fördern',
    rule: 'fördern + Akkusativ',
    words: ['die Integration', 'die Gesundheit', 'die Motivation'],
    example: 'Sport kann die Gesundheit und Motivation fördern.'
  },
  {
    title: 'unterstützen',
    rule: 'unterstützen + Akkusativ',
    words: ['Menschen in Not', 'Familien', 'Teilnehmer'],
    example: 'Der Staat sollte Menschen in schwierigen Situationen unterstützen.'
  },
  {
    title: 'Einerseits ... andererseits ...',
    rule: 'Gegensatz ausdrücken',
    words: ['Vorteile', 'Nachteile', 'Risiken', 'Chancen'],
    example:
      'Einerseits erleichtert KI den Alltag, andererseits gibt es Risiken beim Datenschutz.'
  },
  {
    title: 'Es kommt darauf an, ...',
    rule: 'abhängige Entscheidung ausdrücken',
    words: ['welche Ziele man hat', 'wie viel Zeit bleibt', 'was die Gruppe möchte'],
    example: 'Es kommt darauf an, welche Ziele man beruflich hat.'
  },
  {
    title: 'Ich bin der Ansicht, dass ...',
    rule: 'Meinung auf B2-Niveau formulieren',
    words: ['wichtig', 'sinnvoll', 'problematisch', 'notwendig'],
    example: 'Ich bin der Ansicht, dass man beide Seiten betrachten sollte.'
  },
  {
    title: 'Zusammenfassend lässt sich sagen, dass ...',
    rule: 'Schluss formulieren',
    words: ['eine gute Balance wichtig ist', 'das Thema komplex ist'],
    example:
      'Zusammenfassend lässt sich sagen, dass eine gute Balance wichtig ist.'
  }
];

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

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

function getAdminAkademieItems(level) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list.filter((item) => {
      const itemLevel = item.level || item.niveau || 'A2';
      return itemLevel === level && normalizeStatus(item.status) === 'published';
    });
  } catch (error) {
    console.error('Fehler beim Laden der Akademie-Daten:', error);
    return [];
  }
}

export function AkademieScreen({ setActiveTab, selectedLevel = 'A2' }) {
  const level = selectedLevel || 'A2';
  const [section, setSection] = useState('grammatik');

  const staticItems = useMemo(() => {
    if (level === 'A2') return a2Models;
    if (level === 'B1') return [];
    return [];
  }, [level]);

  const adminItems = useMemo(() => getAdminAkademieItems(level), [level]);

  const data = useMemo(() => {
    return extractAkademieData([...staticItems, ...adminItems]);
  }, [staticItems, adminItems]);

  return (
    <div style={pageStyle}>
      <div style={mobileStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1 style={titleStyle}>Akademie {level}</h1>

        <p style={subtitleStyle}>
          {level === 'B2'
            ? 'B2 Express: wichtige Verben, Strukturen und Prüfungssätze für Diskussion und gemeinsame Lösung.'
            : `Grammatik, Satzbau, Konnektoren, Wortschatz und wichtige Verben für ${level}.`}
        </p>

        {level !== 'B2' && (
          <div style={tabsStyle}>
            <button onClick={() => setSection('grammatik')} style={tabStyle(section === 'grammatik')}>
              Grammatik
            </button>
            <button onClick={() => setSection('satzbau')} style={tabStyle(section === 'satzbau')}>
              Satzbau
            </button>
            <button onClick={() => setSection('konnektoren')} style={tabStyle(section === 'konnektoren')}>
              Konnektoren
            </button>
            <button onClick={() => setSection('wortschatz')} style={tabStyle(section === 'wortschatz')}>
              Wortschatz
            </button>
            <button onClick={() => setSection('verben')} style={tabStyle(section === 'verben')}>
              Verben
            </button>
          </div>
        )}

        <div style={levelInfoStyle}>
          Aktuelles Niveau: <strong>{level}</strong>
        </div>

        {level === 'B2' ? (
          <div>
            {b2ExpressCards.map((card, index) => (
              <B2ExpressCard key={index} card={card} />
            ))}
          </div>
        ) : (
          <div style={cardStyle}>
            {section === 'grammatik' && (
              <ContentList title={`Grammatik ${level}`} items={data.grammar} emptyText={`Für ${level} sind noch keine Grammatikpunkte verfügbar.`} />
            )}

            {section === 'satzbau' && (
              <ContentList title={`Satzbau ${level}`} items={data.satzbau} emptyText={`Für ${level} sind noch keine Satzbau-Beispiele verfügbar.`} />
            )}

            {section === 'konnektoren' && (
              <ContentList title={`Konnektoren ${level}`} items={data.konnektoren} emptyText={`Für ${level} sind noch keine Konnektoren verfügbar.`} />
            )}

            {section === 'wortschatz' && (
              <ContentList title={`Wortschatz ${level}`} items={data.words} emptyText={`Für ${level} ist noch kein Wortschatz verfügbar.`} />
            )}

            {section === 'verben' && (
              <ContentList title={`Wichtige Verben ${level}`} items={data.verbs} emptyText={`Für ${level} sind noch keine Verben verfügbar.`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function extractAkademieData(items = []) {
  const grammar = [];
  const words = [];
  const verbs = [];
  const satzbau = [];
  const konnektoren = [];

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
  });

  return {
    grammar: uniqueItems(grammar),
    words: uniqueItems(words),
    verbs: uniqueItems(verbs),
    satzbau: uniqueItems(satzbau),
    konnektoren: uniqueItems(konnektoren),
  };
}

function uniqueItems(items) {
  const map = new Map();

  items.forEach((item) => {
    const value = String(item || '').trim();
    if (!value) return;

    const key = value.toLowerCase();

    if (!map.has(key)) {
      map.set(key, value);
    }
  });

  return [...map.values()];
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

function B2ExpressCard({ card }) {
  return (
    <div style={b2CardStyle}>
      <h2 style={b2CardTitleStyle}>🔹 {card.title}</h2>

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

const b2CardStyle = {
  background: 'white',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
  lineHeight: 1.6,
  border: '1px solid #e2e8f0',
};

const b2CardTitleStyle = {
  margin: '0 0 8px',
  fontSize: '20px',
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