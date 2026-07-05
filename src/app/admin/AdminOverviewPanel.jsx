import React from "react";

export default function AdminOverviewPanel({ stats, onExport, onClearAll }) {
  return (
    <div>
      <div style={statsGridStyle}>
        <Stat label="Gesamt" value={stats.total} />
        <Stat label="Draft" value={stats.draft} />
        <Stat label="Review" value={stats.review} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Archiv" value={stats.archived} />
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Content-Workflow</h3>
        <ol style={listStyle}>
          <li>Titel, Aufgabe/Text und Musterlösung im Content Manager eingeben</li>
          <li>„Aus Inhalt extrahieren“ — Vorschläge prüfen und freigeben</li>
          <li>Status auf Review → Published setzen</li>
          <li>Ein Modell speist automatisch Prüfung, Akademie und Database</li>
        </ol>
        <p style={hintStyle}>
          Originaltexte only — keine Kopien fremder Prüfungsmaterialien. Themen: AMS, MA35,
          Arzt, Wohnen, ÖBB, Gemeinde, Familie, digitale Services.
        </p>
      </div>

      <button type="button" onClick={onExport} style={exportBtnStyle}>Export JSON kopieren</button>
      <button type="button" onClick={onClearAll} style={clearBtnStyle}>Testdaten komplett löschen</button>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statStyle}>
      <span style={statLabelStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
    </div>
  );
}

const statsGridStyle = { display: "grid", gap: 8, marginBottom: 16 };
const statStyle = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", display: "flex", justifyContent: "space-between" };
const statLabelStyle = { color: "#64748b", fontWeight: 700 };
const statValueStyle = { color: "#0f172a", fontSize: 18 };
const cardStyle = { background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e2e8f0", marginBottom: 16 };
const listStyle = { color: "#334155", lineHeight: 1.6, paddingLeft: 20 };
const hintStyle = { color: "#64748b", fontSize: 13, lineHeight: 1.5 };
const exportBtnStyle = { width: "100%", border: "none", background: "#2563eb", color: "#fff", padding: 14, borderRadius: 16, fontWeight: 800, cursor: "pointer", marginBottom: 10 };
const clearBtnStyle = { width: "100%", border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b", padding: 12, borderRadius: 16, fontWeight: 800, cursor: "pointer" };
