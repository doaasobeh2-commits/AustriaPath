import React, { useEffect, useState } from "react";
import {
  archiveCommunityQuestion,
  listMyCommunityQuestions,
  restoreCommunityQuestion,
} from "../../api/repositories/index.js";

export default function MyQuestionsArchiveScreen({ setActiveTab, setNavigationContext }) {
  const [activeView, setActiveView] = useState("active");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  const load = () => {
    setStatus("Wird geladen …");
    listMyCommunityQuestions({ archived: activeView === "archived" })
      .then((data) => {
        setItems(data?.items || []);
        setStatus("");
      })
      .catch(() => setStatus("Fragen konnten nicht geladen werden."));
  };

  useEffect(() => {
    load();
  }, [activeView]);

  const openQuestion = (id) => {
    setNavigationContext?.({ communityQuestionId: id, fromMyQuestions: true });
    setActiveTab("communityQuestionDetail");
  };

  const toggleArchive = async (id, archived) => {
    try {
      if (archived) {
        await restoreCommunityQuestion(id);
      } else {
        await archiveCommunityQuestion(id);
      }
      load();
    } catch {
      setStatus("Aktion fehlgeschlagen.");
    }
  };

  return (
    <div style={pageStyle}>
      <button type="button" style={backStyle} onClick={() => setActiveTab("profile")}>
        ← Profil
      </button>

      <h2 style={titleStyle}>Meine Fragen</h2>
      <p style={subtitleStyle}>
        Archivieren verschiebt Fragen nur in Ihrer persönlichen Liste — andere Nutzer sehen
        sie weiterhin im öffentlichen Feed.
      </p>

      <div style={tabsStyle}>
        <button
          type="button"
          style={tabBtnStyle(activeView === "active")}
          onClick={() => setActiveView("active")}
        >
          Aktiv
        </button>
        <button
          type="button"
          style={tabBtnStyle(activeView === "archived")}
          onClick={() => setActiveView("archived")}
        >
          Archiv
        </button>
      </div>

      {status ? <p style={mutedStyle}>{status}</p> : null}
      {!status && items.length === 0 ? (
        <p style={mutedStyle}>
          {activeView === "archived"
            ? "Keine archivierten Fragen."
            : "Sie haben noch keine Fragen gestellt."}
        </p>
      ) : null}

      {items.map((item) => (
        <div key={item.id} style={cardStyle}>
          <button type="button" style={cardBtnStyle} onClick={() => openQuestion(item.id)}>
            {item.moderationMessage ? (
              <span style={moderationNoticeStyle}>{item.moderationMessage}</span>
            ) : null}
            <strong>{item.title}</strong>
            <span style={mutedStyle}>
              {item.answerCount} Antworten · {item.status}
            </span>
          </button>
          <button
            type="button"
            style={archiveBtnStyle}
            onClick={() => toggleArchive(item.id, activeView === "archived")}
          >
            {activeView === "archived" ? "Wiederherstellen" : "Archivieren"}
          </button>
        </div>
      ))}

      <button type="button" style={secondaryBtnStyle} onClick={() => setActiveTab("communityAskQuestion")}>
        Neue Frage stellen
      </button>
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

const titleStyle = { margin: "0 0 8px", color: "#0f172a" };
const subtitleStyle = { color: "#64748b", lineHeight: 1.5, marginBottom: "16px", fontSize: "14px" };
const mutedStyle = { color: "#64748b", fontSize: "13px", display: "block", marginTop: "4px" };
const moderationNoticeStyle = {
  display: "block",
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: "10px",
  padding: "8px 10px",
  marginBottom: "8px",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.4,
};

const tabsStyle = { display: "flex", gap: "8px", marginBottom: "14px" };
const tabBtnStyle = (active) => ({
  flex: 1,
  border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
  background: active ? "#eff6ff" : "#fff",
  color: "#0f172a",
  padding: "10px",
  borderRadius: "12px",
  fontWeight: 800,
  cursor: "pointer",
});

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  marginBottom: "12px",
  overflow: "hidden",
};

const cardBtnStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  padding: "14px 16px",
  cursor: "pointer",
};

const archiveBtnStyle = {
  width: "100%",
  border: "none",
  borderTop: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#475569",
  padding: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtnStyle = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
  marginTop: "8px",
};
