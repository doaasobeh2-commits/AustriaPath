import React, { useState } from 'react';
import { b2LesenModels } from '../../data/b2LesenModels';

export function B2LesenScreen({ setActiveTab }) {
  const [modelIndex, setModelIndex] = useState(0);
  const [activePart, setActivePart] = useState(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const model = b2LesenModels[modelIndex];

  const parts = [
  {
    key: 'lesenTeil1',
    label: 'Lesen Teil 1',
    type: 'Globalverstehen',
    icon: '📖',
    desc: 'Überschriften zu Texten zuordnen'
  },
  {
    key: 'lesenTeil2',
    label: 'Lesen Teil 2',
    type: 'Detailverstehen',
    icon: '📖',
    desc: 'Text lesen und Multiple Choice lösen'
  },
  {
    key: 'lesenTeil3',
    label: 'Lesen Teil 3',
    type: 'Selektives Verstehen',
    icon: '📖',
    desc: 'Situationen passenden Anzeigen zuordnen'
  },
  {
    key: 'sprachbausteineTeil1',
    label: 'Sprachbausteine Teil 1',
    type: 'Multiple Choice',
    icon: '📝',
    desc: 'Lückentext mit drei Optionen'
  },
  {
    key: 'sprachbausteineTeil2',
    label: 'Sprachbausteine Teil 2',
    type: 'Wortkasten',
    icon: '📝',
    desc: 'Lückentext mit Wortkasten'
  }
];
  const currentPart = activePart ? model[activePart] : null;

  return (
    <div style={pageStyle}>
      <button style={backButton} onClick={() => setActiveTab?.('practice')}>
        ← Zurück
      </button>

      <h2 style={titleStyle}>B2 Lesen</h2>
      <p style={subStyle}>Komplettmodell mit Lesen und Sprachbausteinen</p>

     <div style={cardStyle}>
  <label style={labelStyle}>Modell wählen</label>

  <select
    style={selectStyle}
    value={modelIndex}
    onChange={(e) => {
      setModelIndex(Number(e.target.value));
      setActivePart(null);
      setShowSolutions(false);
    }}
  >
    {b2LesenModels.map((m, i) => (
      <option key={m.id} value={i}>
        {m.title}
      </option>
    ))}
  </select>
</div>

{!activePart && (
  <div
    style={{
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: 16,
      padding: 14,
      marginBottom: 18,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
    <div>
      <strong>B2 Komplettmodell</strong>
      <div style={{ color: '#6b7280', fontSize: 14 }}>
        5 Aufgabenbereiche
      </div>
    </div>

    <div
      style={{
        background: '#2563eb',
        color: 'white',
        borderRadius: 999,
        padding: '6px 14px',
        fontWeight: 700
      }}
    >
      B2
    </div>
  </div>
)}

     {!activePart && (
  <>
    <div style={examIntroCard}>
      <h3 style={{ marginTop: 0 }}>Aufbau des B2-Lesemodells</h3>
      <p>
        Dieses Modell trainiert alle wichtigen Teile: Lesen Teil 1–3 und
        Sprachbausteine Teil 1–2.
      </p>
    </div>

    <div style={sectionTitle}>📖 Lesen</div>

    <div style={gridStyle}>
      {parts.slice(0, 3).map((part) => (
        <button
          key={part.key}
          style={partCardStyle}
          onClick={() => {
            setActivePart(part.key);
            setShowSolutions(false);
          }}
        >
          <div style={partTopRow}>
            <span style={partIcon}>{part.icon}</span>
            <div>
              <strong>{part.label}</strong>
              <span style={partType}>{part.type}</span>
            </div>
          </div>
         <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  }}
>
  <span style={{ color: '#6b7280', fontSize: 14 }}>
    {part.type}
  </span>

  <span
    style={{
      fontSize: 22,
      color: '#2563eb',
      fontWeight: 'bold'
    }}
  >
    ›
  </span>
</div>
        </button>
      ))}
    </div>

    <div style={sectionTitle}>📝 Sprachbausteine</div>

    <div style={gridStyle}>
      {parts.slice(3).map((part) => (
        <button
          key={part.key}
          style={partCardStyle}
          onClick={() => {
            setActivePart(part.key);
            setShowSolutions(false);
          }}
        >
          <div style={partTopRow}>
            <span style={partIcon}>{part.icon}</span>
            <div>
              <strong>{part.label}</strong>
              <span style={partType}>{part.type}</span>
            </div>
          </div>
          <p style={partDesc}>{part.desc}</p>
        </button>
      ))}
    </div>
  </>
)}

      {currentPart && (
        <div style={cardStyle}>
          <button style={smallButton} onClick={() => setActivePart(null)}>
            ← Teile anzeigen
          </button>

          <h2 style={{ marginBottom: 6 }}>
  {activePart?.startsWith('sprachbausteine') ? '📝' : '📖'} {currentPart.title}
</h2>

<div
  style={{
    background: '#eef6ff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    border: '1px solid #bfdbfe'
  }}
>
  <strong>Lernhinweis</strong>

  <p style={{ marginTop: 8, lineHeight: 1.6 }}>
    Lesen Sie zuerst die Anleitung sorgfältig. Bearbeiten Sie anschließend alle Aufgaben.
    Kontrollieren Sie Ihre Antworten erst zum Schluss.
  </p>
</div>
          <p style={instructionStyle}>{currentPart.instruction}</p>

          {renderPart(activePart, currentPart, showSolutions)}

          <button
            style={solutionButton}
            onClick={() => setShowSolutions(!showSolutions)}
          >
            {showSolutions ? 'Lösungen ausblenden' : 'Lösungen anzeigen'}
          </button>
        </div>
      )}

      {model.words && (
        <div style={cardStyle}>
          <h3>Wortschatz</h3>
          <div style={chipWrap}>
            {model.words.map((w) => (
              <span key={w} style={chipStyle}>{w}</span>
            ))}
          </div>
        </div>
      )}

      {model.tips && (
        <div style={cardStyle}>
          <h3>Lerntipps</h3>
          {model.tips.map((tip, i) => (
            <p key={i}>💡 {tip}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function renderPart(key, part, showSolutions) {
  if (key === 'lesenTeil1') {
    return (
      <>
        <h4>Überschriften</h4>
        {part.headings.map((h) => (
          <p key={h.id}><strong>{h.id})</strong> {h.text}</p>
        ))}

        <h4>Texte</h4>
        {part.texts.map((t) => (
          <div key={t.id} style={miniCard}>
            <strong>Text {t.id}</strong>
            <p>{t.text}</p>
          </div>
        ))}

        {showSolutions && <Solutions solutions={part.solutions} />}
      </>
    );
  }

  if (key === 'lesenTeil2') {
    return (
      <>
        <p style={textBox}>{part.text}</p>

        {part.questions.map((q) => (
          <div key={q.id} style={miniCard}>
            <strong>{q.id}. {q.question}</strong>
            <p>a) {q.options.a}</p>
            <p>b) {q.options.b}</p>
            <p>c) {q.options.c}</p>
            {showSolutions && <p style={answerStyle}>Lösung: {q.answer}</p>}
          </div>
        ))}
      </>
    );
  }

  if (key === 'lesenTeil3') {
    return (
      <>
        <h4>Situationen</h4>
        {part.situations.map((s) => (
          <p key={s.id}><strong>{s.id}.</strong> {s.text}</p>
        ))}

        <h4>Anzeigen</h4>
        {part.ads.map((ad) => (
          <div key={ad.id} style={miniCard}>
            <strong>{ad.id})</strong>
            <p>{ad.text}</p>
          </div>
        ))}

        {showSolutions && <Solutions solutions={part.solutions} />}
      </>
    );
  }

  if (key === 'sprachbausteineTeil1') {
    return (
      <>
        <p style={textBox}>{part.text}</p>

        {part.questions.map((q) => (
          <div key={q.id} style={miniCard}>
            <strong>Lücke {q.id}</strong>
            <p>a) {q.options.a}</p>
            <p>b) {q.options.b}</p>
            <p>c) {q.options.c}</p>
            {showSolutions && <p style={answerStyle}>Lösung: {q.answer}</p>}
          </div>
        ))}
      </>
    );
  }

  if (key === 'sprachbausteineTeil2') {
    return (
      <>
        <h4>Wortkasten</h4>
        <div style={chipWrap}>
          {part.wordBox.map((w) => (
            <span key={w} style={chipStyle}>{w}</span>
          ))}
        </div>

        <p style={textBox}>{part.text}</p>

        {showSolutions && <Solutions solutions={part.solutions} />}
      </>
    );
  }

  return null;
}

function Solutions({ solutions }) {
  return (
    <div style={solutionBox}>
      <h4>Lösungen</h4>
      {Object.entries(solutions).map(([nr, sol]) => (
        <p key={nr}>
          <strong>{nr}:</strong> {sol}
        </p>
      ))}
    </div>
  );
}

const pageStyle = {
  padding: 20,
  paddingBottom: 90,
  background: '#f7f7f7',
  minHeight: '100vh'
};

const titleStyle = {
  marginBottom: 4,
  color: '#1f2937'
};

const subStyle = {
  color: '#6b7280',
  marginTop: 0
};

const cardStyle = {
  background: 'white',
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
};

const gridStyle = {
  display: 'grid',
  gap: 12
};

const partCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 18,
  textAlign: 'left',
  cursor: 'pointer',
  transition: '0.2s',
  boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 700
};

const selectStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #d1d5db'
};

const backButton = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: 700,
  marginBottom: 8
};

const smallButton = {
  border: 'none',
  background: '#eef2ff',
  color: '#3730a3',
  borderRadius: 10,
  padding: '8px 12px',
  marginBottom: 12
};

const solutionButton = {
  width: '100%',
  border: 'none',
  background: '#16a34a',
  color: 'white',
  borderRadius: 14,
  padding: 12,
  fontWeight: 700,
  marginTop: 12
};

const instructionStyle = {
  background: '#fef3c7',
  padding: 12,
  borderRadius: 12
};

const miniCard = {
  background: '#f9fafb',
  borderRadius: 14,
  padding: 12,
  marginBottom: 10
};

const textBox = {
  background: '#f9fafb',
  padding: 14,
  borderRadius: 14,
  lineHeight: 1.7
};

const chipWrap = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const chipStyle = {
  background: '#e0f2fe',
  color: '#075985',
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 14
};

const solutionBox = {
  background: '#ecfdf5',
  borderRadius: 14,
  padding: 12,
  marginTop: 12
};

const answerStyle = {
  color: '#047857',
  fontWeight: 700
};
const examIntroCard = {
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: 18,
  padding: 16,
  marginBottom: 16
};

const sectionTitle = {
  fontWeight: 800,
  fontSize: 18,
  margin: '20px 0 10px',
  color: '#111827'
};

const partTopRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12
};

const partIcon = {
  fontSize: 26
};

const partType = {
  display: 'block',
  color: '#6b7280',
  fontSize: 14,
  marginTop: 3
};

const partDesc = {
  margin: '10px 0 0',
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.5
};