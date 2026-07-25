import React, { useEffect, useState } from "react";
import {
  exportPlacementDiagnosticSession,
  fetchPlacementDiagnosticConfig,
  fetchPlacementDiagnosticSessions,
  updatePlacementDiagnosticConfig,
} from "../../api/repositories/index.js";

const FILTERS = [
  { id: "all", label: "Alle Sessions" },
  { id: "issues", label: "Sessions mit Issues" },
  { id: "errors", label: "Nur Errors" },
];

export default function PlacementDiagnosticsPanel() {
  const [config, setConfig] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextFilter = filter) => {
    setLoading(true);
    try {
      const [cfg, data] = await Promise.all([
        fetchPlacementDiagnosticConfig(),
        fetchPlacementDiagnosticSessions(nextFilter),
      ]);
      setConfig(cfg);
      setSessions(data?.sessions || []);
    } catch (error) {
      setMessage(error?.message || "Diagnostics konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(filter);
  }, [filter]);

  const handleToggleCapture = async () => {
    try {
      const next = await updatePlacementDiagnosticConfig({
        autoCaptureEnabled: !config?.autoCaptureEnabled,
      });
      setConfig(next);
      setMessage(
        next.autoCaptureEnabled
          ? "Automatische Aufzeichnung wieder aktiviert."
          : "Automatische Aufzeichnung pausiert."
      );
    } catch (error) {
      setMessage(error?.message || "Einstellung konnte nicht gespeichert werden.");
    }
  };

  const handleExport = async (attemptId) => {
    try {
      const payload = await exportPlacementDiagnosticSession(attemptId);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `placement-diagnostic-${attemptId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`Export für ${attemptId} gestartet.`);
    } catch (error) {
      setMessage(error?.message || "Export fehlgeschlagen.");
    }
  };

  const completed = Number(config?.completedCaptureCount || 0);
  const limit = Number(config?.captureLimit || 20);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Placement Diagnostics (hidden)</h2>
      <p style={hintStyle}>
        Erste {limit} erfolgreich abgeschlossene Production-Placement-Tests. Nur Admin.
        Lerner sehen nichts davon.
      </p>

      {message ? <p style={messageStyle}>{message}</p> : null}

      <div style={statsRowStyle}>
        <div style={statCardStyle}>
          <strong>{completed}</strong>
          <span>abgeschlossen erfasst</span>
        </div>
        <div style={statCardStyle}>
          <strong>{limit}</strong>
          <span>Capture-Limit</span>
        </div>
        <div style={statCardStyle}>
          <strong>{sessions.length}</strong>
          <span>in aktueller Ansicht</span>
        </div>
        <div style={statCardStyle}>
          <strong>{config?.autoCaptureEnabled ? "AN" : "AUS"}</strong>
          <span>Auto-Capture</span>
        </div>
      </div>

      <div style={actionsRowStyle}>
        <button type="button" onClick={handleToggleCapture} style={primaryBtnStyle}>
          {config?.autoCaptureEnabled ? "Auto-Capture pausieren" : "Auto-Capture aktivieren"}
        </button>
        <button type="button" onClick={() => load(filter)} style={secondaryBtnStyle}>
          Aktualisieren
        </button>
      </div>

      <div style={filterRowStyle}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            style={filterBtnStyle(filter === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <p>Lade…</p> : null}

      <div style={listStyle}>
        {sessions.map((session) => (
          <article key={session.attemptId} style={sessionCardStyle}>
            <div style={sessionHeaderStyle}>
              <div>
                <strong>{session.attemptId}</strong>
                <div style={metaStyle}>
                  {session.completedAt || session.startedAt || "—"}
                </div>
              </div>
              <div style={badgeRowStyle}>
                {session.issueSummary?.hasIssues ? (
                  <span style={warningBadgeStyle}>
                    ⚠ {session.issueSummary.count} Issues
                    {session.issueSummary.highestSeverity
                      ? ` · ${session.issueSummary.highestSeverity}`
                      : ""}
                  </span>
                ) : (
                  <span style={okBadgeStyle}>OK</span>
                )}
              </div>
            </div>
            <button
              type="button"
              style={exportBtnStyle}
              onClick={() => handleExport(session.attemptId)}
            >
              JSON exportieren (Examiner Lab replay-ready)
            </button>
          </article>
        ))}
        {!loading && !sessions.length ? (
          <p style={hintStyle}>Noch keine erfassten Sessions in dieser Ansicht.</p>
        ) : null}
      </div>
    </section>
  );
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
};

const titleStyle = { margin: "0 0 8px", color: "#0f172a" };
const hintStyle = { color: "#64748b", fontSize: "13px", lineHeight: 1.5 };
const messageStyle = {
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "10px 12px",
  borderRadius: "10px",
  fontSize: "13px",
};
const statsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "10px",
  margin: "16px 0",
};
const statCardStyle = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "12px",
  display: "grid",
  gap: "4px",
  fontSize: "12px",
  color: "#64748b",
};
const actionsRowStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" };
const primaryBtnStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};
const secondaryBtnStyle = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};
const filterRowStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" };
const filterBtnStyle = (active) => ({
  border: active ? "2px solid #7c3aed" : "1px solid #e2e8f0",
  background: active ? "#f5f3ff" : "#fff",
  color: "#0f172a",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
});
const listStyle = { display: "grid", gap: "10px" };
const sessionCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
};
const sessionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};
const metaStyle = { fontSize: "12px", color: "#64748b", marginTop: "4px" };
const badgeRowStyle = { display: "flex", gap: "6px", flexWrap: "wrap" };
const warningBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};
const okBadgeStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};
const exportBtnStyle = {
  marginTop: "10px",
  border: "none",
  background: "#7c3aed",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
};
