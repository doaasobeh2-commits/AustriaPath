import React, { useState } from 'react';

export default function AccountSettingsScreen({ setActiveTab, onLogout }) {
  const [name, setName] = useState(localStorage.getItem('userName') || '');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [language, setLanguage] = useState(
    localStorage.getItem('austriaPathLanguage') ||
      localStorage.getItem('userLanguage') ||
      'Deutsch'
  );
  const [level, setLevel] = useState(localStorage.getItem('userLevel') || 'B1');

  const saveSettings = () => {
    localStorage.setItem('userName', name.trim());
    localStorage.setItem('userEmail', email.trim());
    localStorage.setItem('austriaPathLanguage', language);
    localStorage.setItem('userLanguage', language);
    localStorage.setItem('userLevel', level);

    alert('Kontoeinstellungen gespeichert.');
    setActiveTab('profile');
  };

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('profile')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1 style={titleStyle}>⚙️ Kontoeinstellungen</h1>

      <p style={subtitleStyle}>
        Verwalten Sie Ihre persönlichen Daten. Diese Version speichert die Daten
        lokal im Browser.
      </p>

      <div style={cardStyle}>
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          placeholder="Ihr Name"
        />

        <label style={labelStyle}>E-Mail</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="E-Mail"
          type="email"
        />

        <label style={labelStyle}>Sprache</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={inputStyle}
        >
          <option value="Deutsch">Deutsch</option>
          <option value="العربية">العربية</option>
          <option value="Türkçe">Türkçe</option>
          <option value="فارسی">فارسی</option>
          <option value="Українська">Українська</option>
        </select>

        <label style={labelStyle}>Aktuelles Niveau</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={inputStyle}
        >
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>

        <button onClick={saveSettings} style={saveButtonStyle}>
          Speichern
        </button>
      </div>

      <div style={dangerCardStyle}>
        <h3 style={{ marginTop: 0 }}>Sitzung</h3>

        <button onClick={onLogout} style={logoutButtonStyle}>
          🚪 Abmelden
        </button>

        <p style={smallTextStyle}>
          Passwort ändern und Konto löschen werden später mit Backend aktiviert.
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  paddingBottom: '90px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box'
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

const titleStyle = {
  color: '#0f172a',
  marginBottom: '8px'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.6
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '18px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  marginTop: '14px'
};

const labelStyle = {
  display: 'block',
  fontWeight: '800',
  color: '#334155',
  margin: '12px 0 6px'
};

const inputStyle = {
  width: '100%',
  padding: '13px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};

const saveButtonStyle = {
  width: '100%',
  marginTop: '18px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '800',
  cursor: 'pointer'
};

const dangerCardStyle = {
  backgroundColor: '#fff1f2',
  borderRadius: '20px',
  padding: '18px',
  border: '1px solid #fecaca',
  marginTop: '14px'
};

const logoutButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: '13px',
  borderRadius: '16px',
  fontWeight: '800',
  cursor: 'pointer'
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: 1.5
};