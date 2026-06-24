import React, { useState } from 'react';
import { registerUser } from '../userAccess';

export default function RegisterScreen({
  onBack,
  onRegisterSuccess
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('B1');

  const handleRegister = () => {
    if (!name || !email || !password) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    const newUser = registerUser({
      name,
      email,
      password,
      level,
    });

    if (onRegisterSuccess) {
      onRegisterSuccess(newUser);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '450px',
        margin: '50px auto'
      }}
    >
      <h1>Neues Konto erstellen</h1>

      <p style={{ color: '#64748b' }}>
        Erstellen Sie ein Konto, um Ihren Fortschritt und Ihre Prüfungen zu speichern.
      </p>

      <input
        type="text"
        placeholder="Vollständiger Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <div style={{ marginTop: '18px' }}>
        <label style={{ fontWeight: 800 }}>
          Welches Niveau möchten Sie trainieren?
        </label>

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {['A2', 'B1', 'B2'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 900,
                background: level === item ? '#16a34a' : '#dcfce7',
                color: level === item ? 'white' : '#166534',
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRegister}
        style={{
          width: '100%',
          padding: '14px',
          marginTop: '20px',
          border: 'none',
          borderRadius: '10px',
          background: '#2563eb',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Konto erstellen
      </button>

      <button
        onClick={onBack}
        style={{
          width: '100%',
          padding: '14px',
          marginTop: '12px',
          border: '1px solid #64748b',
          borderRadius: '10px',
          background: '#ffffff',
          color: '#64748b',
          cursor: 'pointer'
        }}
      >
        Zurück zum Login
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '12px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
};