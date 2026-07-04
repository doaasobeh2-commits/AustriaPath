import React, { useEffect, useState } from 'react';
import { b1LesenModels } from '../../../data/b1LesenModels';
import BrochureViewer from '../BrochureViewer';
import { getSmartPremiumMessage } from '../../../data/smartPremiumMessages';
import { isPremiumUser, trackSectionVisit } from '../../../data/utils/premiumHint';
import { getUserLanguage } from '../../../utils/userPreferences';
export function B1LesenScreen({ setActiveTab }) {
  const [index, setIndex] = useState(0);
  const [activeTeil, setActiveTeil] = useState('teil1');

  const [showAnswers, setShowAnswers] = useState(false);
const [showBrochure, setShowBrochure] = useState(false);
const [showTeil2Questions, setShowTeil2Questions] = useState(false);
const [showPremiumHint, setShowPremiumHint] = useState(false);

const language = getUserLanguage();

const premiumMessage = getSmartPremiumMessage(language, 'lesen');

useEffect(() => {
  if (isPremiumUser()) {
    setShowPremiumHint(false);
    return;
  }

  if (trackSectionVisit('lesen')) {
    setShowPremiumHint(true);
  }
}, []);
  const model = b1LesenModels[index];
if (showBrochure) {
  return (
    <BrochureViewer
      image={model.teil2.image}
      title={model.teil2.title}
      onBack={() => setShowBrochure(false)}
      onFinish={() => {
        setShowBrochure(false);
        setShowTeil2Questions(true);
      }}
    />
  );
}
  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>📖 B1 Lesen</h1>
      <p style={subtitleStyle}>Komplette B1-Lesemodelle mit drei Teilen.</p>
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
          setActiveTeil('teil1');
          setShowAnswers(false);
        }}
      >
        {b1LesenModels.map((item, i) => (
          <option key={item.id} value={i}>
            Modell {i + 1}: {item.title}
          </option>
        ))}
      </select>

      <div style={tabsStyle}>
        <button onClick={() => setActiveTeil('teil1')} style={tabStyle(activeTeil === 'teil1')}>
          Teil 1
        </button>
        <button onClick={() => setActiveTeil('teil2')} style={tabStyle(activeTeil === 'teil2')}>
          Teil 2
        </button>
        <button onClick={() => setActiveTeil('teil3')} style={tabStyle(activeTeil === 'teil3')}>
          Teil 3
        </button>
      </div>

      {activeTeil === 'teil1' && (
        <div style={boxStyle}>
          <h2>{model.teil1.title}</h2>
          <p style={textStyle}>{model.teil1.text}</p>

          <h3>Optionen</h3>
          {Object.entries(model.teil1.options).map(([num, options]) => (
            <div key={num} style={questionStyle}>
              <b>{num}:</b> {options.join(' / ')}
            </div>
          ))}

          <button style={answerButtonStyle} onClick={() => setShowAnswers(!showAnswers)}>
            {showAnswers ? 'Lösungen ausblenden' : 'Lösungen anzeigen'}
          </button>

          {showAnswers && (
            <div style={answerBoxStyle}>
              {Object.entries(model.teil1.answers).map(([num, answer]) => (
                <p key={num}>
                  <b>{num}:</b> {answer}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTeil === 'teil2' && (
  <div style={boxStyle}>
    <h2>{model.teil2.title}</h2>
    <p style={subtitleStyle}>{model.teil2.intro}</p>

    <button
      onClick={() => setShowBrochure(true)}
      style={openBrochureButtonStyle}
    >
      📖 Anzeigen öffnen
    </button>

    {!showTeil2Questions ? (
      <p style={subtitleStyle}>
        Öffnen Sie zuerst die Anzeigen und lesen Sie genau.
      </p>
    ) : (
      <>
        <h3>Fragen 41–45</h3>

        {model.teil2.questions.map((item, i) => (
          <div key={i} style={questionStyle}>
            <p>
              <b>{item.q}</b>
            </p>

            {showAnswers && (
              <p>
                <b>Antwort:</b> {item.a}
              </p>
            )}
          </div>
        ))}

        <button
          style={answerButtonStyle}
          onClick={() => setShowAnswers(!showAnswers)}
        >
          {showAnswers ? 'Lösungen ausblenden' : 'Lösungen anzeigen'}
        </button>
      </>
    )}
  </div>
)}

      {activeTeil === 'teil3' && (
        <div style={boxStyle}>
          <h2>{model.teil3.title}</h2>
          <p style={textStyle}>{model.teil3.text}</p>

          <h3>Fragen 46–50</h3>
          {model.teil3.questions.map((item, i) => (
            <div key={i} style={questionStyle}>
              <p>
                <b>{item.q}</b>
              </p>
              {item.options.map((option, optionIndex) => (
                <p key={optionIndex}>○ {option}</p>
              ))}
              {showAnswers && (
                <p>
                  <b>Antwort:</b> {item.a}
                </p>
              )}
            </div>
          ))}

          <button style={answerButtonStyle} onClick={() => setShowAnswers(!showAnswers)}>
            {showAnswers ? 'Lösungen ausblenden' : 'Lösungen anzeigen'}
          </button>
        </div>
      )}

      <InfoBox title="📌 Wichtige Wörter" items={model.words} />
      <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
      <InfoBox title="📚 Grammatik" items={model.grammar} />
      <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />

      <div style={boxStyle}>
        <h3>⭐ Prüfungstipp</h3>
        <p>{model.tip}</p>
      </div>
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  if (!items.length) return null;

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
  lineHeight: 1.6
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box'
};

const tabsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '8px',
  marginBottom: '14px'
};

const tabStyle = (active) => ({
  border: 'none',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  backgroundColor: active ? '#2563eb' : '#e0f2fe',
  color: active ? '#ffffff' : '#0369a1'
});

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: 1.6
};

const textStyle = {
  whiteSpace: 'pre-line',
  lineHeight: 1.8,
  color: '#0f172a'
};

const questionStyle = {
  padding: '12px',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  marginBottom: '10px',
  border: '1px solid #e2e8f0'
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '16px'
};

const answerButtonStyle = {
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  marginTop: '8px'
};

const answerBoxStyle = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #bbf7d0',
  borderRadius: '12px',
  padding: '12px',
  marginTop: '12px'
};

const brochurePreviewStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '10px',
  border: '1px solid #cbd5e1',
  marginBottom: '14px',
  cursor: 'pointer'
};

const brochureImageStyle = {
  width: '100%',
  maxHeight: '260px',
  objectFit: 'cover',
  objectPosition: 'top',
  borderRadius: '12px',
  display: 'block'
};

const tapHintStyle = {
  textAlign: 'center',
  marginTop: '8px',
  color: '#2563eb',
  fontWeight: '800',
  fontSize: '14px'
};

const fullscreenOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.96)',
  zIndex: 9999,
  padding: '16px',
  overflow: 'auto',
  boxSizing: 'border-box'
};

const closeButtonStyle = {
  position: 'sticky',
  top: '10px',
  zIndex: 10000,
  width: '100%',
  padding: '12px',
  borderRadius: '14px',
  border: 'none',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontWeight: '800',
  marginBottom: '14px'
};

const fullscreenImageStyle = {
  width: '100%',
  maxWidth: '900px',
  margin: '0 auto',
  display: 'block',
  borderRadius: '16px'
};

const openBrochureButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '900',
  fontSize: '16px',
  cursor: 'pointer',
  marginBottom: '14px'
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