import React, { useEffect, useState } from "react";
import { listCommunityQuestions } from "../../api/repositories/index.js";

const STATUS_LABELS = {
  open: "Offen",
  answered: "Beantwortet",
  closed: "Geschlossen",
};

export default function CommunityQuestionsScreen({ setActiveTab, setNavigationContext }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Fragen werden geladen …");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setStatus("Fragen werden geladen …");
    listCommunityQuestions({ page, limit })
      .then((data) => {
        if (cancelled) return;
        setItems(data?.items || []);
        setTotal(data?.total || 0);
        setStatus("");
      })
      .catch(() => {
        if (!cancelled) setStatus("Fragen konnten nicht geladen werden.");
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const openQuestion = (id) => {
    setNavigationContext?.({ communityQuestionId: id });
    setActiveTab("communityQuestionDetail");
  };

  return (
    <div style={pageStyle}>
      <button type="button" style={backStyle} onClick={() => setActiveTab("home")}>
        ← Zurück
      </button>

      <div style={headerRowStyle}>
        <div>
          <h2 style={titleStyle}>Fragen &amp; Antworten</h2>
          <p style={subtitleStyle}>
            Stellen Sie eine Frage oder helfen Sie anderen Lernenden — anonym und ohne Chat.
          </p>
        </div>
        <button
          type="button"
          style={primaryBtnStyle}
          onClick={() => setActiveTab("communityAskQuestion")}
        >
          Frage stellen
        </button>
      </div>

      <button
        type="button"
        style={secondaryBtnStyle}
        onClick={() => setActiveTab("communityMyQuestions")}
      >
        Meine Fragen
      </button>

      {status ? <p style={mutedStyle}>{status}</p> : null}
      {!status && items.length === 0 ? (
        <p style={mutedStyle}>Noch keine Fragen vorhanden. Seien Sie die erste Person!</p>
      ) : null}

      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          style={cardBtnStyle}
          onClick={() => openQuestion(item.id)}
        >
          <div style={cardTopStyle}>
            <span style={badgeStyle(item.status)}>{STATUS_LABELS[item.status] || item.status}</span>
            <span style={mutedStyle}>{item.answerCount}/3 Antworten</span>
          </div>
          <strong style={cardTitleStyle}>{item.title}</strong>
          <span style={mutedStyle}>{item.authorLabel}</span>
        </button>
      ))}

      {total > page * limit ? (
        <button type="button" style={secondaryBtnStyle} onClick={() => setPage((p) => p + 1)}>
          Mehr laden
        </button>
      ) : null}
    </div>
  );
}

const pageStyle = {
  padding: "20px",
  paddingBottom: "100px",
  fontFamily: "system-ui, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
};

const backStyle = {
  border: "none",
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "16px",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "12px",
};

const titleStyle = { margin: "0 0 6px", color: "#0f172a" };
const subtitleStyle = { margin: 0, color: "#64748b", lineHeight: 1.45, fontSize: "14px" };
const mutedStyle = { color: "#64748b", fontSize: "13px" };

const primaryBtnStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "12px",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryBtnStyle = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: "14px",
  width: "100%",
};

const cardBtnStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "1px solid #e2e8f0",
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const cardTitleStyle = {
  display: "block",
  color: "#0f172a",
  marginBottom: "6px",
  fontSize: "16px",
};

const badgeStyle = (status) => ({
  background:
    status === "open" ? "#dcfce7" : status === "answered" ? "#dbeafe" : "#f1f5f9",
  color: status === "open" ? "#166534" : status === "answered" ? "#1d4ed8" : "#475569",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
});
