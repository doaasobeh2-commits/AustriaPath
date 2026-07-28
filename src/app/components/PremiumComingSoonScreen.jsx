import React from 'react';

export function PremiumComingSoonScreen({ setActiveTab }) {
  return (
    <div style={pageStyle}>
      <button type="button" onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <div style={cardStyle}>
        <span style={badgeStyle}>Coming Soon</span>
        <h1 style={titleStyle}>Premium-Funktionen</h1>
        <p style={textStyle}>
          Diese Funktion ist vorübergehend nicht verfügbar. Alle kostenlosen Trainer und
          Übungen funktionieren weiterhin wie gewohnt.
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  border: '1px solid #fde68a',
  borderRadius: '999px',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: '700',
  marginBottom: '14px',
};

const titleStyle = {
  margin: '0 0 12px',
  color: '#0f172a',
};

const textStyle = {
  margin: 0,
  color: '#64748b',
  lineHeight: 1.6,
};
