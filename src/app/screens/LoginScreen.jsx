import React, { useState } from 'react';
import { getUsers, saveUsers, saveCurrentUser } from '../userAccess';

export default function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    const users = getUsers();

    let user = users.find(
      (item) => item.email?.toLowerCase() === cleanEmail
    );

    if (!user) {
      user = {
        id: Date.now(),
        name:
          cleanEmail === 'fadisobehau@gmail.com'
            ? 'Fadi Sobeh'
            : cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        level: localStorage.getItem('userLevel') || 'B1',
        allowedLevels: ['A2'],
        plan: 'free',
        levelSource: 'login_created',
        role: cleanEmail === 'fadisobehau@gmail.com' ? 'admin' : 'student',
        status: cleanEmail === 'fadisobehau@gmail.com' ? 'approved' : 'pending',
        aiCredits: 5,
        createdAt: new Date().toISOString(),
      };

      saveUsers([...users, user]);
    }

    if (user.password !== password) {
      alert('E-Mail oder Passwort ist falsch.');
      return;
    }

    if (user.status === 'blocked') {
      alert('Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Administrator.');
      return;
    }

    if (user.role !== 'admin' && user.status !== 'approved') {
      alert('Ihr Konto wartet noch auf die Freigabe durch den Administrator.');
      return;
    }

    const safeUser = {
      ...user,
      status: user.status || (user.role === 'admin' ? 'approved' : 'pending'),
      aiCredits: typeof user.aiCredits === 'number' ? user.aiCredits : 5,
    };

    saveCurrentUser(safeUser);

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
    localStorage.setItem('userName', safeUser.name || cleanEmail.split('@')[0]);
    localStorage.setItem('userEmail', safeUser.email || cleanEmail);
    localStorage.setItem('userLevel', safeUser.level || 'B1');
    localStorage.setItem(
      'userLanguage',
      safeUser.language || localStorage.getItem('userLanguage') || 'Deutsch'
    );

    onLogin(cleanEmail);
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '450px',
        margin: '50px auto'
      }}
    >
      <h1>Willkommen zurück</h1>

      <p style={{ color: '#64748b' }}>
        Melden Sie sich an, um Ihren Fortschritt zu speichern.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d5db'
        }}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '12px',
          borderRadius: '10px',
          border: '1px solid #d1d5db'
        }}
      />

      <button
        onClick={handleLogin}
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
        Anmelden
      </button>

      <button
        onClick={onRegister}
        style={{
          width: '100%',
          padding: '14px',
          marginTop: '12px',
          border: '1px solid #2563eb',
          borderRadius: '10px',
          background: '#ffffff',
          color: '#2563eb',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Neues Konto erstellen
      </button>
    </div>
  );
}