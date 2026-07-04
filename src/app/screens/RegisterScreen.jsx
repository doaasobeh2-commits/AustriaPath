import React, { useState } from "react";
import { isAdminEmail } from "../../config/authConfig";
import { registerStudentUser } from "../userAccess";
import {
  authCardStyle,
  authCheckboxStyle,
  authInputStyle,
  authLabelStyle,
  authNoticeStyle,
  authPageStyle,
  authPrimaryButtonStyle,
  authSubtitleStyle,
  authTextButtonStyle,
  authTitleStyle,
} from "../auth/authStyles";

export default function RegisterScreen({
  onRegisterSuccess,
  onBack,
  onLogin,
  onOpenLegal,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("B1");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim() || !cleanEmail || !password) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    if (isAdminEmail(cleanEmail)) {
      alert(
        "Diese E-Mail ist für den Administrator reserviert. Bitte melden Sie sich über Anmelden an."
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!notRobot) {
      alert("Bitte bestätigen Sie, dass Sie kein Roboter sind.");
      return;
    }

    if (!acceptedTerms) {
      alert("Bitte akzeptieren Sie Datenschutz und AGB.");
      return;
    }

    const result = await registerStudentUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      level,
    });

    if (!result.ok) {
      alert(result.message);
      return;
    }

    if (onRegisterSuccess) {
      onRegisterSuccess(result.user);
    }
  };

  return (
    <div style={authPageStyle}>
      <div style={authCardStyle}>
        <h1 style={authTitleStyle}>Konto erstellen</h1>
        <p style={authSubtitleStyle}>
          Erstellen Sie Ihr kostenloses Schülerkonto und starten Sie sofort.
        </p>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={authInputStyle}
          autoComplete="name"
        />

        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={authInputStyle}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={authInputStyle}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Passwort bestätigen"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={authInputStyle}
          autoComplete="new-password"
        />

        <label style={authLabelStyle}>Trainingsniveau</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {["A2", "B1", "B2"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "14px",
                padding: "12px",
                fontWeight: 900,
                background: level === item ? "#2563eb" : "#e5e7eb",
                color: level === item ? "white" : "#111827",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <label style={authLabelStyle}>E-Mail-Bestätigung</label>
        <input
          type="text"
          value="Ausstehend — wird per Backend aktiviert"
          disabled
          style={{
            ...authInputStyle,
            marginTop: 0,
            backgroundColor: "#f8fafc",
            color: "#64748b",
          }}
        />
        <div style={authNoticeStyle}>
          Die E-Mail-Bestätigung wird später im Backend implementiert (z. B.
          POST /auth/register + Bestätigungslink). Sie blockiert die Anmeldung
          vorerst nicht.
        </div>

        <label style={authCheckboxStyle}>
          <input
            type="checkbox"
            checked={notRobot}
            onChange={(e) => setNotRobot(e.target.checked)}
          />
          Ich bin kein Roboter
        </label>

        <label style={authCheckboxStyle}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            Ich akzeptiere die{" "}
            {onOpenLegal ? (
              <>
                <button
                  type="button"
                  style={inlineLinkStyle}
                  onClick={() => onOpenLegal("datenschutz")}
                >
                  Datenschutzerklärung
                </button>{" "}
                und die{" "}
                <button
                  type="button"
                  style={inlineLinkStyle}
                  onClick={() => onOpenLegal("agb")}
                >
                  AGB
                </button>
                .
              </>
            ) : (
              "Datenschutzerklärung und AGB."
            )}
          </span>
        </label>

        <button
          type="button"
          onClick={handleRegister}
          style={authPrimaryButtonStyle}
        >
          Konto erstellen
        </button>

        {onLogin && (
          <button type="button" onClick={onLogin} style={authTextButtonStyle}>
            Bereits ein Konto? Anmelden
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

const inlineLinkStyle = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontWeight: "700",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  fontSize: "inherit",
};
