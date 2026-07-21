import React from "react";
import { enableAdminQaMode } from "../../utils/adminQaMode.js";

const TABS = [
  { id: "content", label: "📋 Content Manager", description: "Inhalte erstellen & extrahieren" },
  { id: "overview", label: "📊 Übersicht", description: "Statistik & Export" },
  { id: "users", label: "👥 Benutzer", description: "Konten & Niveaus" },
];

export default function AdminNav({ activeTab, onTabChange, setActiveTab }) {
  return (
    <nav style={navStyle} aria-label="Admin Navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          style={tabButtonStyle(activeTab === tab.id)}
        >
          <span style={tabLabelStyle}>{tab.label}</span>
          <span style={tabDescStyle}>{tab.description}</span>
        </button>
      ))}

      <div style={toolsRowStyle}>
        <button type="button" onClick={() => setActiveTab("aiPruefer")} style={toolButtonStyle("#2563eb")}>
          🤖 AI Prüfer
        </button>
        <button type="button" onClick={() => setActiveTab("examinerLab")} style={toolButtonStyle("#7c3aed")}>
          🧠 Examiner Lab
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          enableAdminQaMode();
          setActiveTab("home");
        }}
        style={qaButtonStyle}
      >
        🧪 Learner QA — echte Prüfungen als Schüler
      </button>
      <p style={qaHintStyle}>
        Normale Lerner-UI. Über Home → AI-Training die Pläne öffnen (Einstufung / Training /
        Wochenplan). Zahlung bleibt Coming Soon für normale User; in QA öffnen die Buttons die
        echten Flows. Fehlende KI = „not evaluated / QA only“ — kein erfundenes Ergebnis.
      </p>
    </nav>
  );
}

const navStyle = {
  display: "grid",
  gap: "10px",
  marginBottom: "20px",
};

const tabButtonStyle = (active) => ({
  textAlign: "left",
  border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
  background: active ? "#eff6ff" : "#ffffff",
  borderRadius: "16px",
  padding: "14px 16px",
  cursor: "pointer",
  boxShadow: active ? "0 8px 20px rgba(37, 99, 235, 0.12)" : "0 4px 12px rgba(15, 23, 42, 0.04)",
});

const tabLabelStyle = {
  display: "block",
  fontWeight: 800,
  color: "#0f172a",
  fontSize: "15px",
};

const tabDescStyle = {
  display: "block",
  fontSize: "12px",
  color: "#64748b",
  marginTop: "4px",
  fontWeight: 600,
};

const toolsRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  marginTop: "4px",
};

const toolButtonStyle = (bg) => ({
  border: "none",
  background: bg,
  color: "#fff",
  padding: "12px",
  borderRadius: "12px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "13px",
});

const qaButtonStyle = {
  border: "2px solid #ca8a04",
  background: "#fef9c3",
  color: "#713f12",
  padding: "14px 16px",
  borderRadius: "14px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "14px",
  textAlign: "left",
  marginTop: "4px",
};

const qaHintStyle = {
  margin: "0",
  fontSize: "12px",
  color: "#64748b",
  lineHeight: 1.45,
  fontWeight: 600,
};
