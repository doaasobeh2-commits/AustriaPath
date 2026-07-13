import React, { useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const loginInFlight = useRef(false);

  const handleLogin = async () => {
    if (loginInFlight.current || isLoading) return;

    loginInFlight.current = true;
    setIsLoading(true);
    try {
      const result = await authenticateUser(email, password);

      if (!result.ok) {
        alert(result.message);
        return;
      }

      onLogin(result.user);
    } finally {
      loginInFlight.current = false;
      setIsLoading(false);
    }
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
          disabled={isLoading}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          style={authInputStyle}
          autoComplete="current-password"
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={handleLogin}
          style={{
            ...authPrimaryButtonStyle,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "wait" : "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Anmeldung läuft…" : "Anmelden"}
        </button>

        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            style={authTextButtonStyle}
            disabled={isLoading}
          >
            Passwort vergessen?
          </button>
        )}

        {onRegister && (
          <button type="button" onClick={onRegister} style={authTextButtonStyle} disabled={isLoading}>
            Noch kein Konto? Jetzt registrieren
          </button>
        )}

        {onBack && (
          <button type="button" onClick={onBack} style={authTextButtonStyle} disabled={isLoading}>
            ← Zurück
          </button>
        )}
      </div>
    </div>
  );
}
