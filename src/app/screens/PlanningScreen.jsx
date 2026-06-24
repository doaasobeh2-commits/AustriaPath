import React, { useState } from 'react';
import { b1PlanningModels } from '../../data/modelsB1';

const planningModels = {
  A2: [
    {
      title: 'Geburtstag planen',
      situation: 'Sie möchten mit einem Freund einen Geburtstag planen.',
      task: [
        'Wann ist die Feier?',
        'Wo ist die Feier?',
        'Was bringen Sie mit?',
        'Wen laden Sie ein?'
      ],
      dialog: [
        'A: Wollen wir den Geburtstag am Samstag feiern?',
        'B: Ja, gute Idee. Um wie viel Uhr?',
        'A: Um 16 Uhr. Passt das?',
        'B: Ja. Ich bringe Kuchen mit.',
        'A: Super. Ich kaufe Getränke.',
        'B: Dann laden wir unsere Freunde ein.'
      ],
      words: ['der Geburtstag', 'die Feier', 'der Kuchen', 'die Getränke'],
      verbs: ['planen', 'feiern', 'mitbringen', 'einladen', 'kaufen'],
      sentences: ['Wollen wir ...?', 'Gute Idee.', 'Ich bringe ... mit.', 'Das passt gut.'],
      mistakes: ['❌ In Samstag feiern wir.', '✅ Am Samstag feiern wir.'],
      tip: 'Fragen Sie nach Zeit, Ort und Aufgaben.'
    }
  ],

  B1: b1PlanningModels,

  B2: []
};

export function PlanningScreen({ setActiveTab }) {
  const [level, setLevel] = useState('B1');
  const [index, setIndex] = useState(0);

  const models = planningModels[level] || [];
  const model = models[index];

  const changeLevel = (newLevel) => {
    setLevel(newLevel);
    setIndex(0);
  };

  const taskItems = model?.task || model?.points || [];

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1 style={titleStyle}>
        {level === 'A2' && '🗣️ A2 – Gemeinsam Aufgaben lösen'}
        {level === 'B1' && '🗣️ B1 – Gemeinsam etwas planen'}
        {level === 'B2' && '🗣️ B2 – Diskussion & Präsentation'}
      </h1>

      <p style={subtitleStyle}>
        {level === 'A2' && 'Übe einfache Aufgaben gemeinsam zu lösen.'}
        {level === 'B1' && 'Übe gemeinsam etwas zu planen, Vorschläge zu machen und zu reagieren.'}
        {level === 'B2' && 'Übe Diskussion, Meinung und Präsentation.'}
      </p>

     <select
  style={inputStyle}
  value={userLevel}
  disabled
>
  <option value={userLevel}>
    {userLevel}
  </option>
</select>

      {models.length === 0 ? (
        <div style={boxStyle}>
          <span style={badgeStyle}>{level}</span>
          <h2>{level} Inhalte kommen bald</h2>
          <p style={{ color: '#64748b', lineHeight: '1.5' }}>
            Für dieses Niveau sind noch keine Modelle verfügbar.
          </p>
        </div>
      ) : (
        <>
          <select
            style={inputStyle}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          >
            {models.map((item, i) => (
              <option key={item.id || i} value={i}>
                Etwas planen {i + 1}: {item.title}
              </option>
            ))}
          </select>

          <div style={highlightBoxStyle}>
            <span style={badgeStyle}>{level}</span>
            <h2>{model.title}</h2>

            <h3>📌 Situation</h3>
            <p>{model.situation}</p>

            <h3>🎯 Aufgabe</h3>
            <ul>
              {taskItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <InfoBox title="🗣️ Beispiel Dialog" items={model.dialog} />
          <InfoBox title="📌 Wichtige Wörter" items={model.words} />
          <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
          <InfoBox title="🧩 Nützliche Sätze" items={model.sentences} />
          <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />

          <div style={boxStyle}>
            <h3>⭐ Prüfungstipp</h3>
            <p>{model.tip || 'Machen Sie Vorschläge, stellen Sie Fragen und reagieren Sie auf Ihren Partner.'}</p>
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

const titleStyle = {
  color: '#0f172a',
  marginBottom: '14px',
  lineHeight: '1.2'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
  marginBottom: '16px'
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