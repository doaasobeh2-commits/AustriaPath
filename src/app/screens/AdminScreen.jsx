import React, { useState } from "react";
import { getAdminUserRecord } from "../userAccess";
import AdminShell from "../admin/AdminShell.jsx";

export function AdminScreen({ setActiveTab }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  const login = () => {
    const adminUser = getAdminUserRecord();
    if (adminUser && password === adminUser.password) {
      setUnlocked(true);
      setPassword("");
    } else {
      alert("Falsches Passwort");
    }
  };

  if (!unlocked) {
    return (
      <div style={pageStyle}>
        <button type="button" onClick={() => setActiveTab("home")} style={backButtonStyle}>
          ← Zurück
        </button>
        <div style={lockCardStyle}>
          <h1 style={titleStyle}>🔒 Admin Login</h1>
          <p style={subtitleStyle}>Dieser Bereich ist nur für AustriaPath.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />
          <button type="button" onClick={login} style={saveButtonStyle}>
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell setActiveTab={setActiveTab} />;
}

const pageStyle = {
  padding: "22px",
  paddingBottom: "100px",
  fontFamily: "system-ui, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
};

const backButtonStyle = {
  border: "none",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: "700",
  cursor: "pointer",
  marginBottom: "18px",
};

const lockCardStyle = {
  background: "#ffffff",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
};

const titleStyle = { margin: "0 0 8px", color: "#0f172a" };
const subtitleStyle = { color: "#64748b", lineHeight: "1.5", marginBottom: "18px" };

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  fontSize: "15px",
  boxSizing: "border-box",
  marginBottom: "12px",
};

const saveButtonStyle = {
  width: "100%",
  border: "none",
  backgroundColor: "#16a34a",
  color: "#ffffff",
  padding: "14px",
  borderRadius: "16px",
  fontWeight: "800",
  fontSize: "16px",
  cursor: "pointer",
};
