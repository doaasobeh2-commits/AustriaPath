import React, { useMemo, useState } from 'react';
import { a2Models } from '../../data/modelsA2';
import { b2Models } from '../../data/modelsB2';

const STORAGE_KEY = 'austriaPathAdminData';

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
  const [section, setSection] = useState(level === 'B2' ? 'expressions' : 'grammatik');

  const staticItems = useMemo(() => {
    if (level === 'A2') return a2Models;
    if (level === 'B1') return [];
    if (level === 'B2') return b2Models;
    return [];
  }, [level]);

  const adminItems = useMemo(() => getAdminAkademieItems(level), [level]);

  const data = useMemo(() => {
    return extractAkademieData([...staticItems, ...adminItems], level);
  }, [staticItems, adminItems, level]);

  return (
    <div style={pageStyle}>
      <div style={mobileStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1 style={titleStyle}>Akademie {level}</h1>

        <p style={subtitleStyle}>
          {level === 'B2'
            ? 'B2 Ausdrücke aus Diskussionen und Prüfungsthemen.'
            : `Grammatik, Satzbau, Konnektoren, Wortschatz und wichtige Verben für ${level}.`}
        </p>

        <div style={tabsStyle}>
          {level === 'B2' ? (
            <button
              onClick={() => setSection('expressions')}
              style={tabStyle(section === 'expressions')}
            >
              B2 Ausdrücke
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div style={levelInfoStyle}>
          Aktuelles Niveau: <strong>{level}</strong>
        </div>

        <div style={cardStyle}>
          {level === 'B2' && (
            <ContentList
              title="B2 Ausdrücke"
              items={data.expressions}
              emptyText="Für B2 sind noch keine Ausdrücke verfügbar."
            />
          )}

          {level !== 'B2' && section === 'grammatik' && (
            <ContentList
              title={`Grammatik ${level}`}
              items={data.grammar}
              emptyText={`Für ${level} sind noch keine Grammatikpunkte verfügbar.`}
            />
          )}

          {level !== 'B2' && section === 'satzbau' && (
            <ContentList
              title={`Satzbau ${level}`}
              items={data.satzbau}
              emptyText={`Für ${level} sind noch keine Satzbau-Beispiele verfügbar.`}
            />
          )}

          {level !== 'B2' && section === 'konnektoren' && (
            <ContentList
              title={`Konnektoren ${level}`}
              items={data.konnektoren}
              emptyText={`Für ${level} sind noch keine Konnektoren verfügbar.`}
            />
          )}

          {level !== 'B2' && section === 'wortschatz' && (
            <ContentList
              title={`Wortschatz ${level}`}
              items={data.words}
              emptyText={`Für ${level} ist noch kein Wortschatz verfügbar.`}
            />
          )}

          {level !== 'B2' && section === 'verben' && (
            <ContentList
              title={`Wichtige Verben ${level}`}
              items={data.verbs}
              emptyText={`Für ${level} sind noch keine Verben verfügbar.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function extractAkademieData(items = [], level = 'A2') {
  const grammar = [];
  const words = [];
  const verbs = [];
  const satzbau = [];
  const konnektoren = [];
  const expressions = [];

  items.forEach((item) => {
    if (level === 'B2') {
      expressions.push(...splitItems(item.expressions));
      expressions.push(...splitItems(item.ausdruecke));
      expressions.push(...splitItems(item.ausdrücke));

      if (item.diskussion) {
        expressions.push(item.diskussion);
      }

      return;
    }

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
    expressions: uniqueItems(expressions),
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

const pageStyle = {
  minHeight: '100vh',
  background: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
};

const mobileStyle = {
  width: '100%',
  maxWidth: '1100px',
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

const listStyle = {
  paddingLeft: '20px',
  marginBottom: 0,
};

const listItemStyle = {
  marginBottom: '10px',
  color: '#334155',
};