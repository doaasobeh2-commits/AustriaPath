import React from 'react';

export function SprachakademieScreen({ setActiveTab }) {
  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <button onClick={() => setActiveTab('home')} style={backButton}>
          ← Zurück
        </button>

        <h1 style={titleStyle}>🎓 Sprachakademie</h1>

        <p style={subtitleStyle}>
          Grammatik, Satzbau, Konnektoren und Wortschatz mit Beispielen aus den Modellen lernen.
        </p>

        <div style={gridStyle}>
          <AcademyCard
            icon="📖"
            title="Grammatik"
            text="Regeln mit Beispielen aus A2-Modellen."
            onClick={() => setActiveTab('grammatik')}
          />

          <AcademyCard
            icon="🔗"
            title="Satzbau"
            text="Satzbank für eigene A2-E-Mails."
            onClick={() => setActiveTab('satzbau')}
          />

          <AcademyCard
            icon="🌉"
            title="Konnektoren"
            text="weil, und, aber, oder, deshalb mit Beispielen."
            onClick={() => setActiveTab('konnektoren')}
          />

          <AcademyCard
            icon="🚀"
            title="Wortschatz Booster"
            text="Wörter und Verben aus 34 A2-Modellen."
            onClick={() => setActiveTab('wortschatz')}
          />

          <AcademyCard
            icon="✍️"
            title="Schreiben Trainer"
            text="Bausteine für E-Mails. Bald verfügbar."
            disabled
          />

          <AcademyCard
  icon="🖼️"
  title="Bildbeschreibung Trainer"
  text="Struktur für Beschreibung, Meinung und Erfahrung."
  onClick={() => setActiveTab('images')}
/>
        </div>
      </div>
    </div>
  );
}

function AcademyCard({ icon, title, text, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...cardStyle,
        opacity: disabled ? 0.65 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={iconStyle}>{icon}</div>
      <h3 style={cardTitle}>{title}</h3>
      <p style={cardText}>{text}</p>
    </button>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
};

const contentStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '100px',
};

const backButton = {
  border: 'none',
  background: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '18px',
};

const titleStyle = {
  margin: '0 0 8px',
  color: '#0f172a',
  fontSize: '28px',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
  marginBottom: '22px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '14px',
};

const cardStyle = {
  width: '100%',
  textAlign: 'left',
  background: '#ffffff',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

const iconStyle = {
  fontSize: '30px',
  marginBottom: '8px',
};

const cardTitle = {
  margin: '0 0 6px',
  color: '#0f172a',
  fontSize: '18px',
};

const cardText = {
  margin: 0,
  color: '#64748b',
  lineHeight: '1.45',
  fontSize: '14px',
};