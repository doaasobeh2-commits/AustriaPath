import React, { useEffect, useState } from "react";
import { fetchMessage, listMessages } from "../../api/repositories/index.js";

export default function MessagesScreen({ setActiveTab }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("Nachrichten werden geladen …");

  useEffect(() => {
    let cancelled = false;
    listMessages()
      .then((data) => {
        if (cancelled) return;
        setItems(data?.items || []);
        setStatus("");
      })
      .catch(() => {
        if (!cancelled) setStatus("Nachrichten konnten nicht geladen werden.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openMessage = async (id) => {
    setStatus("Nachricht wird geladen …");
    try {
      const data = await fetchMessage(id);
      setSelected(data?.message || null);
      setStatus("");
    } catch {
      setStatus("Nachricht konnte nicht geladen werden.");
    }
  };

  if (selected) {
    const snapshot = selected.snapshot || {};
    const report = snapshot.learnerReport || {};
    return (
      <div style={pageStyle}>
        <button style={backStyle} onClick={() => setSelected(null)}>← Nachrichten</button>
        <h2>{selected.title}</h2>
        <div style={cardStyle}>
          <h1>{snapshot.level}</h1>
          <p>{report.levelExplanation}</p>
          <p style={mutedStyle}>Datum: {new Date(snapshot.date).toLocaleDateString("de-AT")}</p>
        </div>
        <div style={cardStyle}>
          <h3>Ihre Bereiche</h3>
          {(report.areas || []).map((area) => (
            <div key={area.skill} style={sectionStyle}>
              <strong>{area.label}: {area.performanceLabel}</strong>
              <p>{area.summary}</p>
              {area.missingTopics?.length ? (
                <p style={mutedStyle}>Übungsschwerpunkte: {area.missingTopics.join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>
        <ReportList title="Stärken" items={report.strengths} />
        <ReportList title="Verbesserungspotenzial" items={report.improvements} />
        <ReportList title="Empfehlungen" items={report.recommendations} />
        {report.transcripts?.length ? (
          <div style={cardStyle}>
            <h3>Ihre gesprochenen Antworten</h3>
            {report.transcripts.map((turn, index) => (
              <div key={`${turn.skill}-${index}`} style={sectionStyle}>
                <strong>{turn.label}</strong>
                {turn.question ? <p style={mutedStyle}>{turn.question}</p> : null}
                <p>{turn.transcript}</p>
              </div>
            ))}
          </div>
        ) : null}
        {report.studyPlan?.length ? (
          <div style={cardStyle}>
            <h3>Persönlicher Lernplan</h3>
            {report.studyPlan.map((item, index) => (
              <p key={`${item.day}-${index}`}><strong>{item.day}:</strong> {item.task}</p>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button style={backStyle} onClick={() => setActiveTab("home")}>← Zurück</button>
      <h2>Nachrichten</h2>
      {status ? <p>{status}</p> : null}
      {!status && items.length === 0 ? <p>Noch keine Nachrichten vorhanden.</p> : null}
      {items.map((item) => (
        <button key={item.id} style={messageStyle} onClick={() => openMessage(item.id)}>
          <strong>{item.title}</strong>
          <span style={mutedStyle}>{item.subtitle}</span>
        </button>
      ))}
    </div>
  );
}

function ReportList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div style={cardStyle}>
      <h3>{title}</h3>
      {items.map((item, index) => <p key={`${item.skill || "item"}-${index}`}>• {item.text || item}</p>)}
    </div>
  );
}

const pageStyle = { padding: 20, maxWidth: 760, margin: "0 auto" };
const cardStyle = { background: "white", borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: "0 2px 10px rgba(15,23,42,.08)" };
const sectionStyle = { borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 12 };
const mutedStyle = { color: "#64748b", fontSize: 14 };
const backStyle = { border: 0, background: "transparent", color: "#2563eb", padding: "8px 0", cursor: "pointer" };
const messageStyle = { ...cardStyle, width: "100%", border: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 6, cursor: "pointer" };
