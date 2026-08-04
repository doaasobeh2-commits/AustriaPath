import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../api/apiConfig.js";
import {
  fetchAdminRegistrationOverview,
  fetchAdminWaitlist,
  patchAdminRegistrationSettings,
  patchAdminWaitlistEntry,
} from "../../api/repositories/index.js";

const STATE_LABELS = {
  open: "Offen",
  capacity_full: "Voll",
  manually_closed: "Geschlossen durch Admin",
};

export default function RegistrationWaitlistPanel() {
  const [overview, setOverview] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wird geladen …");
  const [capacityInput, setCapacityInput] = useState("70");
  const [notesDraft, setNotesDraft] = useState({});

  const load = async () => {
    setStatus("Wird geladen …");
    try {
      const data = await fetchAdminRegistrationOverview();
      setOverview(data);
      setCapacityInput(String(data?.overview?.capacity ?? 70));
      const entries = await fetchAdminWaitlist(search.trim());
      setWaitlist(Array.isArray(entries) ? entries : []);
      setStatus("");
    } catch {
      setStatus("Daten konnten nicht geladen werden.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applySearch = async () => {
    try {
      const entries = await fetchAdminWaitlist(search.trim());
      setWaitlist(Array.isArray(entries) ? entries : []);
    } catch {
      setStatus("Suche fehlgeschlagen.");
    }
  };

  const saveSettings = async (patch) => {
    try {
      await patchAdminRegistrationSettings(patch);
      await load();
    } catch {
      setStatus("Einstellungen konnten nicht gespeichert werden.");
    }
  };

  const updateEntry = async (entryId, body) => {
    try {
      await patchAdminWaitlistEntry(entryId, body);
      await load();
    } catch {
      setStatus("Eintrag konnte nicht aktualisiert werden.");
    }
  };

  const exportCsv = () => {
    window.open(buildApiUrl("/admin/registration/waitlist/export.csv"), "_blank");
  };

  return (
    <div>
      <h2 style={titleStyle}>Registrierung &amp; Warteliste</h2>
      {status ? <p style={mutedStyle}>{status}</p> : null}

      {overview ? (
        <div style={statsGridStyle}>
          <StatCard
            label="Aktuelle Registrierungen"
            value={`${overview.overview.counted} / ${overview.overview.capacity}`}
          />
          <StatCard
            label="Registrierungsstatus"
            value={STATE_LABELS[overview.overview.registrationState] || overview.overview.registrationState}
          />
          <StatCard label="Warteliste gesamt" value={overview.waitlist.total} />
          <StatCard label="Wartend" value={overview.waitlist.waiting} />
          <StatCard label="Registriert" value={overview.waitlist.registered} />
        </div>
      ) : null}

      <div style={controlsStyle}>
        <input
          value={capacityInput}
          onChange={(e) => setCapacityInput(e.target.value)}
          style={inputStyle}
          placeholder="Kapazität"
        />
        <button type="button" style={btnStyle} onClick={() => saveSettings({ capacity: Number(capacityInput) })}>
          Kapazität speichern
        </button>
        <button type="button" style={btnStyle} onClick={() => saveSettings({ manualState: "open" })}>
          Registrierung öffnen
        </button>
        <button type="button" style={btnDangerStyle} onClick={() => saveSettings({ manualState: "closed" })}>
          Registrierung schließen
        </button>
        <button type="button" style={btnStyle} onClick={exportCsv}>
          CSV exportieren
        </button>
      </div>

      <div style={controlsStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
          placeholder="Suche nach E-Mail oder Name"
        />
        <button type="button" style={btnStyle} onClick={applySearch}>
          Suchen
        </button>
      </div>

      {waitlist.map((entry) => (
        <div key={entry.id} style={cardStyle}>
          <div style={rowStyle}>
            <strong>{entry.email}</strong>
            <span style={badgeStyle}>{entry.status}</span>
          </div>
          {entry.displayName ? <p style={mutedStyle}>{entry.displayName}</p> : null}
          <p style={mutedStyle}>
            Erstellt: {new Date(entry.createdAt).toLocaleString("de-DE")}
          </p>
          <textarea
            rows={2}
            style={textareaStyle}
            placeholder="Private Admin-Notiz"
            value={notesDraft[entry.id] ?? entry.adminNotes ?? ""}
            onChange={(e) =>
              setNotesDraft((prev) => ({ ...prev, [entry.id]: e.target.value }))
            }
          />
          <div style={actionsStyle}>
            <button
              type="button"
              style={btnStyle}
              onClick={() =>
                updateEntry(entry.id, {
                  status: "registered",
                  adminNotes: notesDraft[entry.id] ?? entry.adminNotes ?? "",
                })
              }
            >
              Als registriert markieren
            </button>
            <button
              type="button"
              style={btnDangerStyle}
              onClick={() => updateEntry(entry.id, { status: "removed" })}
            >
              Entfernen
            </button>
            <button
              type="button"
              style={btnStyle}
              onClick={() =>
                updateEntry(entry.id, {
                  adminNotes: notesDraft[entry.id] ?? entry.adminNotes ?? "",
                })
              }
            >
              Notiz speichern
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <span style={mutedStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
    </div>
  );
}

const titleStyle = { margin: "0 0 12px", color: "#0f172a" };
const mutedStyle = { color: "#64748b", fontSize: "13px", margin: "4px 0" };
const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};
const statCardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "12px",
};
const statValueStyle = { display: "block", fontSize: "20px", marginTop: "6px", color: "#0f172a" };
const controlsStyle = { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" };
const inputStyle = {
  flex: "1 1 180px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
};
const btnStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};
const btnDangerStyle = { ...btnStyle, background: "#b91c1c" };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "12px",
};
const rowStyle = { display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" };
const badgeStyle = {
  background: "#f1f5f9",
  color: "#334155",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};
const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  padding: "10px",
  marginTop: "8px",
  fontFamily: "inherit",
};
const actionsStyle = { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" };
