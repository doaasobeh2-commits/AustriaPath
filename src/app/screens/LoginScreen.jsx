import React, { useState } from "react";
import { authenticateUser } from "../userAccess";
import {
  authCardStyle,
  authInputStyle,
  authPageStyle,
  authPrimaryButtonStyle,
  authSubtitleStyle,
  authTextButtonStyle,
  authTitleStyle,
} from "../auth/authStyles";

export default function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
  onBack,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const result = await authenticateUser(email, password);

    if (!result.ok) {
      alert(result.message);
      return;
    }

    onLogin();
  };

  return (
    <div style={authPageStyle}>
      <div style={authCardStyle}>
        <h1 style={authTitleStyle}>Anmelden</h1>
        <p style={authSubtitleStyle}>
          Melden Sie sich mit Ihrer E-Mail und Ihrem Passwort an.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail"
          style={authInputStyle}
          autoComplete="email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          style={authInputStyle}
          autoComplete="current-password"
        />

        <button type="button" onClick={handleLogin} style={authPrimaryButtonStyle}>
          Anmelden
        </button>

        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            style={authTextButtonStyle}
          >
            Passwort vergessen?
          </button>
        )}

        {onRegister && (
          <button type="button" onClick={onRegister} style={authTextButtonStyle}>
            Noch kein Konto? Jetzt registrieren
          </button>
        )}

        {onBack && (
          <button type="button" onClick={onBack} style={authTextButtonStyle}>
            ← Zurück
          </button>
        )}
      </div>
    </div>
  );
}
