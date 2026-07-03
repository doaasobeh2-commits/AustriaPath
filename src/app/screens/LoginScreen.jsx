import React, { useState } from "react";
import { getUsers, saveCurrentUser } from "../userAccess";

const ADMIN_EMAIL = "fadisobehau@gmail.com";

export default function LoginScreen({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const users = getUsers();
    const user = users.find(
      (item) => item.email?.toLowerCase() === cleanEmail
    );

    if (!user) {
      alert("Dieses Konto existiert nicht. Bitte zuerst registrieren.");
      return;
    }

    if (user.password !== password) {
      alert("E-Mail oder Passwort ist falsch.");
      return;
    }

    if (user.status !== "approved" && cleanEmail !== ADMIN_EMAIL) {
      alert("Ihr Konto wartet noch auf Freigabe durch den Administrator.");
      return;
    }

    const safeUser = {
      ...user,
      email: cleanEmail,
      role:
        cleanEmail === ADMIN_EMAIL && user.role === "admin"
          ? "admin"
          : "student",
      status: cleanEmail === ADMIN_EMAIL ? "approved" : user.status,
      aiCredits: typeof user.aiCredits === "number" ? user.aiCredits : 0,
      usedAiCredits:
        typeof user.usedAiCredits === "number" ? user.usedAiCredits : 0,
    };

    saveCurrentUser(safeUser);

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(safeUser));
    localStorage.setItem("userName", safeUser.name || cleanEmail.split("@")[0]);
    localStorage.setItem("userEmail", safeUser.email);
    localStorage.setItem("userLevel", safeUser.level || "B1");
    localStorage.setItem("userRole", safeUser.role);
    localStorage.removeItem("isAdminPreview");

    localStorage.setItem(
      "userLanguage",
      safeUser.language || localStorage.getItem("userLanguage") || "Deutsch"
    );

    onLogin(safeUser);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "450px", margin: "50px auto" }}>
      <h1>Willkommen zurück</h1>

      <p style={{ color: "#64748b" }}>
        Melden Sie sich an, um Ihren Fortschritt zu speichern.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
        style={inputStyle}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Passwort"
        style={inputStyle}
      />

      <button onClick={handleLogin} style={primaryButtonStyle}>
        Anmelden
      </button>

      <button onClick={onRegister} style={secondaryButtonStyle}>
        Neues Konto erstellen
      </button>
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

const primaryButtonStyle = {
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

const secondaryButtonStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "12px",
  border: "1px solid #2563eb",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#2563eb",
  fontWeight: "bold",
  cursor: "pointer",
};