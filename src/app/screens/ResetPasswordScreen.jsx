import React, { useState } from 'react';
import { resetPassword } from '../../api/repositories/index.js';

export default function ResetPasswordScreen({ token, onBack, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      setError('Passwort mindestens 8 Zeichen.');
      return;
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    setError('');
    try {
      await resetPassword(token, password);
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Token ungültig oder abgelaufen.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Neues Passwort</h1>

        {!done ? (
          <>
            <p style={subtitleStyle}>Bitte wählen Sie ein neues Passwort.</p>

            {error && <div style={errorBoxStyle}>{error}</div>}

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Neues Passwort"
              type="password"
              style={inputStyle}
            />

            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Passwort bestätigen"
              type="password"
              style={inputStyle}
            />

            <button onClick={handleSubmit} style={mainButtonStyle}>
              Passwort speichern
            </button>
          </>
        ) : (
          <>
            <div style={successBoxStyle}>
              Ihr Passwort wurde aktualisiert. Sie können sich jetzt anmelden.
            </div>
            <button onClick={onBack} style={mainButtonStyle}>
              Zum Login
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
  boxSizing: 'border-box',
};

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const titleStyle = { margin: '0 0 8px', color: '#0f172a' };

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.6,
  marginBottom: '18px',
};

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  marginBottom: '12px',
  boxSizing: 'border-box',
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
  marginTop: '8px',
};

const textButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#64748b',
  padding: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
};

const successBoxStyle = {
  backgroundColor: '#ecfdf5',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '16px',
  padding: '14px',
  lineHeight: 1.6,
  marginBottom: '12px',
};

const errorBoxStyle = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: '16px',
  padding: '14px',
  lineHeight: 1.6,
  marginBottom: '12px',
};
