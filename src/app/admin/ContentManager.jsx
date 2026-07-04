import React, { useMemo, useState } from "react";
import { a2Models } from "../../data/modelsA2";
import { b1Models } from "../../data/modelsb1";
import { b2Models } from "../../data/modelsB2";
import { extractFromContent } from "../../content/contentExtractor.js";
import { countPending } from "../../content/extractionState.js";
import { TOPIC_SUGGESTIONS } from "../../content/contentModelSchema.js";
import { getCalculatedStatus, getImportanceScore } from "../../utils/adminContent.js";
import AdminActionBar from "../components/AdminActionBar";
import CollapsibleSection from "./CollapsibleSection.jsx";
import ExtractionReviewPanel from "./ExtractionReviewPanel.jsx";

export default function ContentManager({
  items,
  form,
  updateForm,
  resetForm,
  loadItem,
  saveItem,
  setItemStatus,
  deleteItem,
  applyExtractionToForm,
  approveSuggestionItem,
  rejectSuggestionItem,
  editSuggestionItem,
  approveAllFields,
  approveAkademie,
  rejectAkademie,
  updateAkademieEntry,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingAction, setProcessingAction] = useState(null);

  const staticModelsForAdmin = useMemo(
    () => [
      ...a2Models.map((m) => ({ id: `A2-${m.id}`, title: m.title, level: "A2" })),
      ...b1Models.map((m) => ({ id: `B1-${m.id}`, title: m.title, level: "B1" })),
      ...b2Models.map((m) => ({ id: `B2-${m.id}`, title: m.title, level: "B2" })),
    ],
    []
  );

  const adminMainModels = useMemo(
    () =>
      items
        .filter((item) => item.type === "schreiben")
        .map((item) => ({ id: `admin-${item.id}`, title: item.title, level: item.level })),
    [items]
  );

  const allParentModels = [...staticModelsForAdmin, ...adminMainModels];
  const selectedParent = allParentModels.find((m) => m.id === form.parentModelId);

  const runExtract = (mode = "merge") => {
    const result = extractFromContent({
      content: form.content,
      solution: form.solution,
      title: form.title,
      level: form.level,
      type: form.type,
    });
    applyExtractionToForm(result, mode);
  };

  const publishAndSave = () => {
    saveItem({ parentModel: selectedParent, keepEditing: true, forceStatus: "published" });
  };

  const filteredItems = useMemo(
    () =>
      items
        .map((item) => ({
          ...item,
          calculatedStatus: getCalculatedStatus(item),
          score: getImportanceScore(item),
        }))
        .filter((item) => filterType === "all" || item.type === filterType)
        .filter((item) => filterLevel === "all" || item.level === filterLevel)
        .filter((item) => filterStatus === "all" || item.status === filterStatus)
        .filter((item) => {
          const hay = `${item.title} ${item.content} ${item.city} ${item.state}`.toLowerCase();
          return hay.includes(search.toLowerCase());
        })
        .sort((a, b) => b.score - a.score),
    [items, filterType, filterLevel, filterStatus, search]
  );

  const pendingBadge = form.extraction ? countPending(form.extraction) : 0;

  return (
    <div>
      <p style={introStyle}>
        <strong>Content First:</strong> Titel, Aufgabe/Text und Musterlösung schreiben — Grammatik,
        Akademie und Metadaten werden vorgeschlagen. Ein Modell speist Prüfung, Akademie und künftige AI.
      </p>

      <CollapsibleSection title="Allgemeine Informationen" defaultOpen>
        <Field label="Modell-Modus">
          <select value={form.modelMode} onChange={(e) => updateForm({ modelMode: e.target.value })} style={inputStyle}>
            <option value="new">Neues Modell erstellen</option>
            <option value="existing">Zu bestehendem Modell hinzufügen</option>
          </select>
        </Field>

        {form.modelMode === "existing" && (
          <Field label="Bestehendes Modell">
            <select
              value={form.parentModelId}
              onChange={(e) => {
                const selected = allParentModels.find((m) => m.id === e.target.value);
                updateForm({ parentModelId: e.target.value, level: selected?.level || form.level });
              }}
              style={inputStyle}
            >
              <option value="">Modell wählen</option>
              {allParentModels.map((m) => (
                <option key={m.id} value={m.id}>{m.level} — {m.title}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Bereich">
          <select value={form.type} onChange={(e) => updateForm({ type: e.target.value })} style={inputStyle}>
            <option value="schreiben">Schreiben</option>
            <option value="bildbeschreibung">Bildbeschreibung</option>
            <option value="planung">Planung</option>
            <option value="lesen">Lesen</option>
            <option value="hoeren">Hören</option>
            <option value="sprechen">Sprechen</option>
            <option value="erfahrung">Prüfungserfahrung</option>
          </select>
        </Field>

        <Field label="Niveau">
          <select value={form.level} onChange={(e) => updateForm({ level: e.target.value })} style={inputStyle}>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
        </Field>

        <Field label="Titel">
          <input value={form.title} onChange={(e) => updateForm({ title: e.target.value })} style={inputStyle} placeholder="z.B. Termin bei der MA35 verschieben" />
        </Field>

        <Field label="Schwierigkeit">
          <select value={form.difficulty} onChange={(e) => updateForm({ difficulty: e.target.value })} style={inputStyle}>
            <option value="medium">Mittel (Standard)</option>
            <option value="strong">Stark (Placement / Premium)</option>
          </select>
        </Field>

        <Field label="Themen-Tags (eine pro Zeile)">
          <textarea value={form.topicTags} onChange={(e) => updateForm({ topicTags: e.target.value })} style={smallAreaStyle} placeholder={TOPIC_SUGGESTIONS.slice(0, 3).join("\n")} />
          <p style={hintStyle}>Vorschläge: {TOPIC_SUGGESTIONS.join(" · ")}</p>
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Prüfungsinhalt" subtitle="Aufgabe, Text, Transkript oder Situation" defaultOpen>
        <Field label="Inhalt / Aufgabe / Text">
          <textarea
            value={form.content}
            onChange={(e) => updateForm({ content: e.target.value })}
            style={textareaStyle}
            placeholder="Aufgabenstellung, Lesetext, Hörtranskript, Planungssituation …"
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Musterlösung" subtitle="Vollständige Referenzantwort" defaultOpen>
        <Field label="Musterlösung">
          <textarea
            value={form.solution}
            onChange={(e) => updateForm({ solution: e.target.value })}
            style={textareaStyle}
            placeholder="Fertige Musterlösung — Basis für Extraktion und Schüler-Feedback"
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection
        title="AI / Akademie Extraktion"
        subtitle="Automatische Vorschläge aus Inhalt"
        badge={pendingBadge || null}
        defaultOpen
      >
        <div style={extractRowStyle}>
          <button type="button" onClick={() => runExtract("merge")} style={extractBtnStyle}>
            ✨ Extrahieren (neue Vorschläge)
          </button>
          <button type="button" onClick={() => runExtract("replace")} style={extractReplaceStyle}>
            ↻ Neu extrahieren (ersetzt offene Vorschläge)
          </button>
        </div>
        <ExtractionReviewPanel
          extraction={form.extraction}
          akademieEntries={form.akademieEntries}
          onApproveSuggestion={approveSuggestionItem}
          onRejectSuggestion={rejectSuggestionItem}
          onEditSuggestion={editSuggestionItem}
          onApproveAll={approveAllFields}
          onApproveAkademie={approveAkademie}
          onRejectAkademie={rejectAkademie}
          onEditAkademie={updateAkademieEntry}
        />

        <Field label="Grammatik (manuell / übernommen)">
          <textarea value={form.grammar} onChange={(e) => updateForm({ grammar: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Satzbau">
          <textarea value={form.satzbau} onChange={(e) => updateForm({ satzbau: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Konnektoren">
          <textarea value={form.konnektoren} onChange={(e) => updateForm({ konnektoren: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Wortschatz">
          <textarea value={form.words} onChange={(e) => updateForm({ words: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Verben">
          <textarea value={form.verbs} onChange={(e) => updateForm({ verbs: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Ausdrücke / Redemittel">
          <textarea value={form.expressions} onChange={(e) => updateForm({ expressions: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Häufige Fehler">
          <textarea value={form.mistakes} onChange={(e) => updateForm({ mistakes: e.target.value })} style={smallAreaStyle} />
        </Field>
        <Field label="Prüfungssätze">
          <textarea value={form.sentences} onChange={(e) => updateForm({ sentences: e.target.value })} style={smallAreaStyle} />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Medien">
        <Field label="Bild">
          <input type="file" accept="image/*" style={inputStyle} onChange={(e) => readFile(e, (v) => updateForm({ imageUrl: v }))} />
          {form.imageUrl && <img src={form.imageUrl} alt="" style={previewImgStyle} />}
        </Field>
        <Field label="Audio">
          <input type="file" accept="audio/*" style={inputStyle} onChange={(e) => readFile(e, (v) => updateForm({ audioUrl: v }))} />
          {form.audioUrl && <audio controls style={{ width: "100%", marginTop: 8 }}><source src={form.audioUrl} /></audio>}
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Veröffentlichung">
        <Field label="Status">
          <select value={form.status} onChange={(e) => updateForm({ status: e.target.value })} style={inputStyle}>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Bestätigungen">
          <input type="number" min="1" value={form.confirmations} onChange={(e) => updateForm({ confirmations: e.target.value })} style={inputStyle} />
        </Field>
        <button type="button" onClick={() => saveItem({ parentModel: selectedParent, keepEditing: true })} style={saveBtnStyle}>
          {form.editingId ? "Speichern" : "Modell speichern"}
        </button>
        <button type="button" onClick={publishAndSave} style={publishBtnStyle}>
          ✅ Speichern & veröffentlichen
        </button>
        {form.editingId && (
          <button type="button" onClick={resetForm} style={cancelBtnStyle}>Bearbeitung abbrechen</button>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Erweiterte Informationen">
        <Field label="Exam ID"><input value={form.examId} onChange={(e) => updateForm({ examId: e.target.value })} style={inputStyle} /></Field>
        <Field label="Exam Type">
          <select value={form.examType} onChange={(e) => updateForm({ examType: e.target.value })} style={inputStyle}>
            <option value="ÖIF-orientiert">ÖIF-orientiert</option>
            <option value="ÖSD-orientiert">ÖSD-orientiert</option>
            <option value="Goethe-orientiert">Goethe-orientiert</option>
            <option value="Telc-orientiert">Telc-orientiert</option>
            <option value="Allgemein">Allgemein</option>
          </select>
        </Field>
        <Field label="Prüfungszentrum"><input value={form.examCenter} onChange={(e) => updateForm({ examCenter: e.target.value })} style={inputStyle} /></Field>
        <Field label="Prüfungsdatum"><input type="date" value={form.examDate} onChange={(e) => updateForm({ examDate: e.target.value })} style={inputStyle} /></Field>
        <Field label="Bundesland"><input value={form.state} onChange={(e) => updateForm({ state: e.target.value })} style={inputStyle} /></Field>
        <Field label="Stadt"><input value={form.city} onChange={(e) => updateForm({ city: e.target.value })} style={inputStyle} /></Field>
      </CollapsibleSection>

      <h2 style={listTitleStyle}>Gespeicherte Modelle ({filteredItems.length})</h2>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} placeholder="🔍 Suche…" />
      <div style={filterRowStyle}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={inputStyle}>
          <option value="all">Alle Bereiche</option>
          <option value="schreiben">Schreiben</option>
          <option value="bildbeschreibung">Bild</option>
          <option value="planung">Planung</option>
          <option value="lesen">Lesen</option>
          <option value="hoeren">Hören</option>
          <option value="sprechen">Sprechen</option>
        </select>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={inputStyle}>
          <option value="all">Alle Niveaus</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="all">Alle Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <p style={hintStyle}>Noch keine Modelle — beginnen Sie oben mit Titel, Inhalt und Musterlösung.</p>
      ) : (
        filteredItems.map((item) => (
          <div key={item.id} style={itemCardStyle}>
            <strong>{item.title}</strong>
            <p style={hintStyle}>{item.level} · {item.type} · {item.status} · Score {item.score}</p>
            {item.topicTags?.length > 0 && <p style={hintStyle}>Tags: {item.topicTags.join(", ")}</p>}
            <AdminActionBar
              wide
              processingAction={processingAction}
              actions={[
                { id: `e-${item.id}`, icon: "✏️", label: "Bearbeiten", variant: "outline-blue", onClick: () => loadItem(item) },
                item.status === "published"
                  ? { id: `u-${item.id}`, icon: "⏸️", label: "Stoppen", variant: "outline-orange", onClick: () => setItemStatus(item.id, "draft") }
                  : { id: `p-${item.id}`, icon: "✅", label: "Veröffentlichen", variant: "green", onClick: () => setItemStatus(item.id, "published") },
                { id: `d-${item.id}`, icon: "🗑", label: "Löschen", variant: "red", onClick: () => deleteItem(item.id) },
              ]}
            />
          </div>
        ))
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function readFile(e, cb) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

const introStyle = { color: "#475569", lineHeight: 1.55, marginBottom: "16px" };
const hintStyle = { color: "#64748b", fontSize: "13px", margin: "6px 0" };
const labelStyle = { display: "block", marginBottom: "6px", fontWeight: 700, color: "#334155" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #cbd5e1", boxSizing: "border-box", background: "#fff" };
const textareaStyle = { ...inputStyle, minHeight: "140px", resize: "vertical" };
const smallAreaStyle = { ...inputStyle, minHeight: "72px", resize: "vertical" };
const extractRowStyle = { display: "grid", gap: "8px", marginBottom: "14px" };
const extractBtnStyle = { width: "100%", border: "none", background: "#7c3aed", color: "#fff", padding: "14px", borderRadius: "14px", fontWeight: 800, cursor: "pointer" };
const extractReplaceStyle = { width: "100%", border: "1px solid #7c3aed", background: "#f5f3ff", color: "#5b21b6", padding: "12px", borderRadius: "14px", fontWeight: 800, cursor: "pointer" };
const saveBtnStyle = { width: "100%", border: "none", background: "#16a34a", color: "#fff", padding: "14px", borderRadius: "14px", fontWeight: 800, cursor: "pointer", marginTop: "8px" };
const publishBtnStyle = { width: "100%", border: "none", background: "#2563eb", color: "#fff", padding: "14px", borderRadius: "14px", fontWeight: 800, cursor: "pointer", marginTop: "8px" };
const cancelBtnStyle = { width: "100%", border: "1px solid #cbd5e1", background: "#fff", padding: "12px", borderRadius: "14px", fontWeight: 800, cursor: "pointer", marginTop: "8px" };
const previewImgStyle = { width: "100%", marginTop: 10, borderRadius: 14, border: "1px solid #e2e8f0" };
const listTitleStyle = { marginTop: 28, color: "#0f172a" };
const filterRowStyle = { display: "grid", gap: 8, margin: "12px 0" };
const itemCardStyle = { background: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, border: "1px solid #e2e8f0" };
