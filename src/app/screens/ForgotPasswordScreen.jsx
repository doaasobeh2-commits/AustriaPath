import React, { useState } from 'react';

export default function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) {
      alert('Bitte E-Mail eingeben.');
      return;
    }

    setSent(true);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Passwort vergessen?</h1>

        {!sent ? (
          <>
            <p style={subtitleStyle}>
              Passwort-Zurücksetzen per E-Mail ist in der Beta noch nicht verfügbar.
              Bitte wenden Sie sich an den Support oder den Administrator.
            </p>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              type="email"
              style={inputStyle}
            />

            <button onClick={handleSubmit} style={mainButtonStyle}>
              Link anfordern
            </button>
          </>
        ) : (
          <>
            <div style={successBoxStyle}>
              In der Beta ist kein E-Mail-Versand aktiv. Bitte kontaktieren Sie den Support, wenn Sie Ihr Passwort zurücksetzen müssen.
            </div>

            <button onClick={onBack} style={mainButtonStyle}>
              Zurück zum Login
            </button>
          </>
        )}

        <button onClick={onBack} style={textButtonStyle}>
          ← Zurück
        </button>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box'
};

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
};

const titleStyle = {
  margin: '0 0 8px',
  color: '#0f172a'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.6,
  marginBottom: '18px'
};

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  marginBottom: '12px',
  boxSizing: 'border-box'
};

const mainButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '800',
  cursor: 'pointer',
  marginTop: '8px'
};

const textButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#64748b',
  padding: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px'
};

const successBoxStyle = {
  backgroundColor: '#ecfdf5',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '16px',
  padding: '14px',
  lineHeight: 1.6,
  marginBottom: '12px'
};