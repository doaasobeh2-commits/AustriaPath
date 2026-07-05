import React, { useEffect, useState } from 'react';
import { b1HorenModels } from "../../../data/b1HorenModels";
import { getSmartPremiumMessage } from "../../../data/smartPremiumMessages";
import { isPremiumUser, trackSectionVisit } from "../../../data/utils/premiumHint";
import { getUserLanguage } from "../../../utils/userPreferences";
export function B1HorenScreen({ setActiveTab }) {
  const [index, setIndex] = useState(0);
  const [openTexts, setOpenTexts] = useState({});
const [showPremiumHint, setShowPremiumHint] = useState(false);

const language = getUserLanguage();

const premiumMessage = getSmartPremiumMessage(language, 'hoeren');

useEffect(() => {
  if (isPremiumUser()) {
    setShowPremiumHint(false);
    return;
  }

  if (trackSectionVisit('hoeren')) {
    setShowPremiumHint(true);
  }
}, []);
  const model = b1HorenModels[index];

  const readText = (text) => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopText = () => {
    window.speechSynthesis.cancel();
  };

  const toggleText = (partIndex) => {
    setOpenTexts((prev) => ({
      ...prev,
      [partIndex]: !prev[partIndex]
    }));
  };

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>🎧 B1 Hören</h1>

      <p style={subtitleStyle}>
        B1-Hörmodelle mit drei Teilen: Nachrichten, Durchsagen und Meinungen.
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
        onClick={() => setShowPremiumHint(false)}
        style={laterButtonStyle}
      >
        {premiumMessage.later}
      </button>
    </div>
  </div>
)}
      <select
        style={inputStyle}
        value={index}
        onChange={(e) => {
          setIndex(Number(e.target.value));
          setOpenTexts({});
          window.speechSynthesis.cancel();
        }}
      >
        {b1HorenModels.map((item, i) => (
          <option key={item.id || i} value={i}>
            Modell {i + 1}: {item.title}
          </option>
        ))}
      </select>

      <div style={boxStyle}>
        <span style={badgeStyle}>B1</span>
        <h2>{model.title}</h2>
        <p style={{ color: '#64748b' }}>
          Hören Sie jeden Teil genau. Achten Sie besonders auf Uhrzeiten,
          Gründe, Zahlen und Meinungen.
        </p>
      </div>

      {model.parts?.map((part, partIndex) => (
        <div key={partIndex} style={boxStyle}>
          <h3>{part.title}</h3>

          <p style={{ color: '#64748b' }}>
            Hören Sie den Text und beantworten Sie danach die Fragen.
          </p>

          <div style={audioActionsStyle}>
            <button
              onClick={() => readText(part.text)}
              style={audioButtonStyle}
            >
              🔊 Teil vorlesen
            </button>

            <button onClick={stopText} style={stopButtonStyle}>
              ⏹ Stoppen
            </button>

            <button
              onClick={() => toggleText(partIndex)}
              style={transcriptButtonStyle}
            >
              {openTexts[partIndex] ? 'Text ausblenden' : 'Text anzeigen'}
            </button>
          </div>

          {openTexts[partIndex] && (
            <div style={transcriptBoxStyle}>
              <h4>📝 Transkript</h4>
              <p style={{ whiteSpace: 'pre-line' }}>{part.text}</p>
            </div>
          )}

          <div style={{ marginTop: '14px' }}>
            <h4>❓ Fragen und Antworten</h4>

            {part.questions?.map((item, i) => (
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
        </div>
      ))}

      <InfoBox title="📌 Wichtige Wörter" items={model.words} />
      <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
      <InfoBox title="📚 Wichtige Grammatik" items={model.grammar} />
      <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />

      <div style={boxStyle}>
        <h3>⭐ Lerntipp</h3>
        <p>{model.tip}</p>
      </div>
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

const audioActionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '10px'
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

const badgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
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