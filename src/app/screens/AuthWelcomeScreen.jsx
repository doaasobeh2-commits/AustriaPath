import React from "react";
import {
  authCardStyle,
  authPageStyle,
  authPrimaryButtonStyle,
  authSecondaryButtonStyle,
  authSubtitleStyle,
  authTitleStyle,
} from "../auth/authStyles";

export default function AuthWelcomeScreen({ onLogin, onRegister }) {
  return (
    <div style={authPageStyle}>
      <div style={authCardStyle}>
        <h1 style={authTitleStyle}>AustriaPath</h1>
        <p style={authSubtitleStyle}>
          Lernen Sie Deutsch für ÖIF-Prüfungen. Melden Sie sich an oder
          erstellen Sie ein kostenloses Konto.
        </p>

        <button type="button" onClick={onLogin} style={authPrimaryButtonStyle}>
          Anmelden
        </button>

        <button
          type="button"
          onClick={onRegister}
          style={authSecondaryButtonStyle}
        >
          Konto erstellen
        </button>
      </div>
    </div>
  );
}
