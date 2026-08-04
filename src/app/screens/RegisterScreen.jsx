import React, { useEffect, useState } from "react";
import { isAdminEmail } from "../../config/authConfig";
import { registerStudentUser } from "../userAccess";
import { getUserLanguage } from "../../utils/userPreferences";
import {
  fetchRegistrationStatus,
  joinRegistrationWaitlist,
} from "../../api/repositories/index.js";
import { ApiError } from "../../api/httpClient.js";
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

const COPY = {
  Deutsch: {
    fullTitle: "Testphase voll",
    fullMessage:
      "Die aktuelle Testphase ist vollständig belegt. Sie können sich in die Warteliste eintragen. Wir informieren Sie, sobald neue Plätze verfügbar sind.",
    closedMessage:
      "Die Registrierung ist derzeit geschlossen. Sie können sich in die Warteliste eintragen.",
    waitlistSuccess: "Sie wurden zur Warteliste hinzugefügt.",
    waitlistEmail: "E-Mail",
    waitlistName: "Vorname oder Anzeigename (optional)",
    waitlistSubmit: "Zur Warteliste hinzufügen",
  },
  العربية: {
    fullTitle: "اكتمل العدد",
    fullMessage:
      "اكتمل العدد المتاح للنسخة التجريبية حاليًا. يمكنك الانضمام إلى قائمة الانتظار، وسنبلغك عند توفر أماكن جديدة.",
    closedMessage:
      "التسجيل مغلق حاليًا. يمكنك الانضمام إلى قائمة الانتظار.",
    waitlistSuccess: "تمت إضافتك إلى قائمة الانتظار.",
    waitlistEmail: "البريد الإلكتروني",
    waitlistName: "الاسم أو الاسم المعروض (اختياري)",
    waitlistSubmit: "الانضمام إلى قائمة الانتظار",
  },
};

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
  const [registrationState, setRegistrationState] = useState("open");
  const [statusLoading, setStatusLoading] = useState(true);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  const language = getUserLanguage();
  const copy = COPY[language] || COPY.Deutsch;
  const registrationBlocked = registrationState !== "open";

  useEffect(() => {
    let cancelled = false;
    fetchRegistrationStatus()
      .then((data) => {
        if (!cancelled) setRegistrationState(data?.registrationState || "open");
      })
      .catch(() => {
        if (!cancelled) setRegistrationState("open");
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (result.code === "REGISTRATION_FULL" || result.code === "REGISTRATION_CLOSED") {
        setRegistrationState(
          result.code === "REGISTRATION_CLOSED" ? "manually_closed" : "capacity_full"
        );
      }
      alert(result.message);
      return;
    }

    if (onRegisterSuccess) {
      onRegisterSuccess(result.user);
    }
  };

  const handleWaitlist = async () => {
    setWaitlistError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setWaitlistError(copy.waitlistEmail);
      return;
    }
    try {
      await joinRegistrationWaitlist({
        email: cleanEmail,
        displayName: name.trim() || undefined,
        preferredLanguage: language,
      });
      setWaitlistDone(true);
    } catch (err) {
      setWaitlistError(err instanceof ApiError ? err.message : "Aktion fehlgeschlagen.");
    }
  };

  if (statusLoading) {
    return (
      <div style={authPageStyle}>
        <div style={authCardStyle}>
          <p style={authSubtitleStyle}>Wird geladen …</p>
        </div>
      </div>
    );
  }

  if (registrationBlocked) {
    return (
      <div style={authPageStyle}>
        <div style={authCardStyle}>
          <h1 style={authTitleStyle}>{copy.fullTitle}</h1>
          <p style={authSubtitleStyle}>
            {registrationState === "manually_closed" ? copy.closedMessage : copy.fullMessage}
          </p>

          {waitlistDone ? (
            <div style={successBoxStyle}>{copy.waitlistSuccess}</div>
          ) : (
            <>
              <label style={authLabelStyle}>{copy.waitlistEmail}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={authInputStyle}
                autoComplete="email"
              />
              <label style={authLabelStyle}>{copy.waitlistName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={authInputStyle}
                autoComplete="name"
              />
              {waitlistError ? <p style={errorStyle}>{waitlistError}</p> : null}
              <button type="button" onClick={handleWaitlist} style={authPrimaryButtonStyle}>
                {copy.waitlistSubmit}
              </button>
            </>
          )}

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

        <button type="button" onClick={handleRegister} style={authPrimaryButtonStyle}>
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

const successBoxStyle = {
  background: "#ecfdf5",
  color: "#166534",
  borderRadius: "14px",
  padding: "14px 16px",
  fontWeight: 700,
  marginBottom: "12px",
};

const errorStyle = { color: "#b91c1c", fontSize: "14px" };
