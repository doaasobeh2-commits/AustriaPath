import React, { useState } from "react";
import { registerUser } from "../userAccess";

export default function RegisterScreen({ onRegisterSuccess, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [level, setLevel] = useState("B1");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notRobot, setNotRobot] = useState(false);

  const handleRegister = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim() || !cleanEmail || !password) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
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
      alert("Bitte akzeptieren Sie die Datenschutzbestimmungen.");
      return;
    }

    const newUser = registerUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      level,
      status: "approved",
      aiCredits: 5,
      createdAt: new Date().toISOString(),
    });

    if (onRegisterSuccess) {
      onRegisterSuccess(newUser);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "450px", margin: "50px auto" }}>
      <h1>Konto erstellen</h1>

      <input
        type="text"
        placeholder="Name"
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

      <input
        type="password"
        placeholder="Passwort bestätigen"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={inputStyle}
      />

      <div style={{ marginTop: "18px" }}>
        <label style={{ fontWeight: 800 }}>
          Welches Niveau möchten Sie trainieren?
        </label>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
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
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <label style={checkboxStyle}>
        <input
          type="checkbox"
          checked={notRobot}
          onChange={(e) => setNotRobot(e.target.checked)}
        />
        Ich bin kein Roboter
      </label>

      <label style={checkboxStyle}>
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
        />
        Ich akzeptiere die Datenschutzbestimmungen.
      </label>

      <button onClick={handleRegister} style={buttonStyle}>
        Konto erstellen
      </button>

      {onBack && (
        <button onClick={onBack} style={backButtonStyle}>
          Zurück zum Login
        </button>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const checkboxStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
  fontSize: "14px",
  color: "#334155",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "20px",
  border: "none",
  borderRadius: "10px",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const backButtonStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#64748b",
  fontWeight: "bold",
  cursor: "pointer",
};
