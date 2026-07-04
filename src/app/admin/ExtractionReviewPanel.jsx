import React, { useState } from "react";
import {
  EXTRACTION_FIELDS,
  normalizeSuggestions,
  countPending,
} from "../../content/extractionState.js";

const FIELD_LABELS = {
  grammar: "Grammatik",
  satzbau: "Satzbau",
  konnektoren: "Konnektoren",
  words: "Wortschatz",
  verbs: "Verben",
  expressions: "Ausdrücke",
  mistakes: "Häufige Fehler",
  sentences: "Prüfungssätze",
  topicTags: "Themen-Tags",
};

export default function ExtractionReviewPanel({
  extraction,
  akademieEntries = [],
  onApproveSuggestion,
  onRejectSuggestion,
  onEditSuggestion,
  onApproveAll,
  onApproveAkademie,
  onRejectAkademie,
  onEditAkademie,
}) {
  if (!extraction) {
    return (
      <p style={hintStyle}>
        Schreiben Sie zuerst Aufgabe und Musterlösung, dann „Aus Inhalt extrahieren“.
        Prüfen Sie jeden Vorschlag einzeln: bearbeiten, übernehmen oder ablehnen.
      </p>
    );
  }

  const pendingCount = countPending(extraction);
  const unapprovedAkademie = akademieEntries.filter((e) => e.approved !== true && !e.rejected);

  return (
    <div>
      {extraction.generatedAt && (
        <p style={metaStyle}>
          Extrahiert: {new Date(extraction.generatedAt).toLocaleString("de-AT")} ·{" "}
          {pendingCount} offene Vorschläge · {unapprovedAkademie.length} Akademie-Einträge offen
        </p>
      )}

      {pendingCount > 0 && (
        <button type="button" onClick={onApproveAll} style={approveAllStyle}>
          ✓ Alle offenen Vorschläge übernehmen
        </button>
      )}

      {EXTRACTION_FIELDS.map((field) => {
        const items = normalizeSuggestions(extraction.pending?.[field], field);
        if (!items.length) return null;
        return (
          <div key={field} style={fieldBlockStyle}>
            <strong>{FIELD_LABELS[field] || field}</strong>
            {items.map((item) => (
              <SuggestionRow
                key={item.id}
                text={item.text}
                onApprove={() => onApproveSuggestion(field, item.id)}
                onReject={() => onRejectSuggestion(field, item.id)}
                onSaveEdit={(text) => onEditSuggestion(field, item.id, text)}
              />
            ))}
          </div>
        );
      })}

      {unapprovedAkademie.length > 0 && (
        <div style={fieldBlockStyle}>
          <strong>Akademie-Einträge</strong>
          {unapprovedAkademie.map((entry) => (
            <AkademieRow
              key={entry.id}
              entry={entry}
              onApprove={() => onApproveAkademie([entry.id])}
              onReject={() => onRejectAkademie(entry.id)}
              onSaveEdit={(patch) => onEditAkademie(entry.id, patch)}
            />
          ))}
        </div>
      )}

      {pendingCount === 0 && unapprovedAkademie.length === 0 && (
        <p style={hintStyle}>
          Keine offenen Vorschläge. Bei Textänderung erneut extrahieren (merge behält Freigaben).
        </p>
      )}
    </div>
  );
}

function SuggestionRow({ text, onApprove, onReject, onSaveEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  if (editing) {
    return (
      <div style={rowStyle}>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={editAreaStyle} />
        <div style={btnRowStyle}>
          <button type="button" onClick={() => { onSaveEdit(draft); setEditing(false); }} style={saveEditStyle}>Speichern</button>
          <button type="button" onClick={() => { setDraft(text); setEditing(false); }} style={cancelEditStyle}>Abbrechen</button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <span style={textStyle}>{text}</span>
      <div style={btnRowStyle}>
        <button type="button" onClick={onApprove} style={okBtnStyle}>✓</button>
        <button type="button" onClick={() => setEditing(true)} style={editBtnStyle}>✎</button>
        <button type="button" onClick={onReject} style={noBtnStyle}>✕</button>
      </div>
    </div>
  );
}

function AkademieRow({ entry, onApprove, onReject, onSaveEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.explanation || "");

  return (
    <div style={akCardStyle}>
      <span style={akCatStyle}>{entry.category}</span>
      <strong>{entry.title}</strong>
      {entry.rule && <p style={akLineStyle}><em>Regel:</em> {entry.rule}</p>}
      {editing ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} style={editAreaStyle} />
          <div style={btnRowStyle}>
            <button type="button" onClick={() => { onSaveEdit({ explanation: draft }); setEditing(false); }} style={saveEditStyle}>Speichern</button>
            <button type="button" onClick={() => setEditing(false)} style={cancelEditStyle}>Abbrechen</button>
          </div>
        </>
      ) : (
        <>
          {entry.explanation && <p style={akLineStyle}>{entry.explanation}</p>}
          {entry.tip && <p style={akTipStyle}>💡 {entry.tip}</p>}
          <div style={btnRowStyle}>
            <button type="button" onClick={onApprove} style={okBtnStyle}>✓ Freigeben</button>
            <button type="button" onClick={() => setEditing(true)} style={editBtnStyle}>✎</button>
            <button type="button" onClick={onReject} style={noBtnStyle}>✕ Ablehnen</button>
          </div>
        </>
      )}
    </div>
  );
}

const hintStyle = { color: "#64748b", lineHeight: 1.5, margin: 0 };
const metaStyle = { color: "#475569", fontSize: "13px", fontWeight: 700, marginBottom: "12px" };
const approveAllStyle = {
  width: "100%", border: "none", background: "#16a34a", color: "#fff",
  padding: "12px", borderRadius: "12px", fontWeight: 800, cursor: "pointer", marginBottom: "14px",
};
const fieldBlockStyle = {
  background: "#f8fafc", borderRadius: "14px", padding: "12px", marginBottom: "12px", border: "1px solid #e2e8f0",
};
const rowStyle = {
  display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start",
  padding: "8px 0", borderBottom: "1px solid #e2e8f0",
};
const textStyle = { flex: 1, color: "#334155", fontSize: "14px", lineHeight: 1.45 };
const btnRowStyle = { display: "flex", gap: "4px", flexShrink: 0 };
const okBtnStyle = { border: "none", background: "#16a34a", color: "#fff", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontWeight: 800 };
const editBtnStyle = { border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "4px 8px", cursor: "pointer" };
const noBtnStyle = { border: "none", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontWeight: 800 };
const editAreaStyle = { width: "100%", minHeight: "60px", marginTop: "6px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "8px", boxSizing: "border-box" };
const saveEditStyle = { border: "none", background: "#2563eb", color: "#fff", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontWeight: 700 };
const cancelEditStyle = { border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" };
const akCardStyle = { background: "#fff", borderRadius: "12px", padding: "12px", marginTop: "10px", border: "1px solid #e2e8f0" };
const akCatStyle = { fontSize: "11px", fontWeight: 800, color: "#0369a1", textTransform: "uppercase" };
const akLineStyle = { margin: "4px 0", fontSize: "13px", color: "#475569", lineHeight: 1.45 };
const akTipStyle = { margin: "6px 0 0", fontSize: "13px", color: "#166534", fontWeight: 600 };
