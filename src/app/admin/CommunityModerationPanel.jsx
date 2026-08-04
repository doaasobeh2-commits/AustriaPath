import React, { useEffect, useState } from "react";
import {
  adminAnswerCommunityQuestion,
  adminListCommunityQuestions,
  adminSetCommunityAnswerVisibility,
  adminSetCommunityQuestionStatus,
  adminSetCommunityQuestionVisibility,
} from "../../api/repositories/index.js";

export default function CommunityModerationPanel() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Wird geladen …");
  const [answerDrafts, setAnswerDrafts] = useState({});

  const load = () => {
    setStatus("Wird geladen …");
    adminListCommunityQuestions()
      .then((data) => {
        setItems(data?.items || []);
        setStatus("");
      })
      .catch(() => setStatus("Moderation konnte nicht geladen werden."));
  };

  useEffect(() => {
    load();
  }, []);

  const updateQuestion = async (id, action, payload) => {
    try {
      if (action === "visibility") {
        await adminSetCommunityQuestionVisibility(id, payload.visibility);
      } else if (action === "status") {
        await adminSetCommunityQuestionStatus(id, payload.status);
      } else if (action === "answer") {
        await adminAnswerCommunityQuestion(id, answerDrafts[id] || "");
        setAnswerDrafts((prev) => ({ ...prev, [id]: "" }));
      }
      load();
    } catch {
      setStatus("Aktion fehlgeschlagen.");
    }
  };

  const updateAnswerVisibility = async (answerId, visibility) => {
    try {
      await adminSetCommunityAnswerVisibility(answerId, visibility);
      load();
    } catch {
      setStatus("Antwort konnte nicht aktualisiert werden.");
    }
  };

  const attentionItems = items.filter((q) => q.needsAdminAttention);
  const otherItems = items.filter((q) => !q.needsAdminAttention);

  return (
    <div>
      <h2 style={titleStyle}>Fragen &amp; Antworten — Moderation</h2>
      <p style={subtitleStyle}>
        Antworten erscheinen als „AustriaPath Team“. Versteckte oder entfernte Inhalte sind nicht
        öffentlich sichtbar.
      </p>

      {status ? <p style={mutedStyle}>{status}</p> : null}

      {attentionItems.length > 0 ? (
        <section style={attentionSectionStyle}>
          <h3 style={attentionTitleStyle}>Fragen, die auf Moderator-Antwort warten</h3>
          <p style={mutedStyle}>
            Öffentliche Fragen ohne Antwort seit mindestens 40 Stunden — bitte prüfen oder
            beantworten.
          </p>
          {attentionItems.map((q) => (
            <QuestionCard
              key={`attention-${q.id}`}
              q={q}
              answerDrafts={answerDrafts}
              setAnswerDrafts={setAnswerDrafts}
              updateQuestion={updateQuestion}
              updateAnswerVisibility={updateAnswerVisibility}
              highlight
            />
          ))}
        </section>
      ) : null}

      {otherItems.map((q) => (
        <QuestionCard
          key={q.id}
          q={q}
          answerDrafts={answerDrafts}
          setAnswerDrafts={setAnswerDrafts}
          updateQuestion={updateQuestion}
          updateAnswerVisibility={updateAnswerVisibility}
        />
      ))}
    </div>
  );
}

function QuestionCard({
  q,
  answerDrafts,
  setAnswerDrafts,
  updateQuestion,
  updateAnswerVisibility,
  highlight = false,
}) {
  return (
    <div style={highlight ? attentionCardStyle : cardStyle}>
          <div style={metaRowStyle}>
            <span style={badgeStyle}>{q.visibility}</span>
            <span style={badgeStyle}>{q.status}</span>
            <span style={mutedStyle}>{q.authorEmail}</span>
          </div>
          <h3 style={questionTitleStyle}>{q.title}</h3>
          <p style={bodyStyle}>{q.body}</p>

          <div style={actionsStyle}>
            <button type="button" style={btnStyle("#0f766e")} onClick={() => updateQuestion(q.id, "visibility", { visibility: "public" })}>
              Öffentlich
            </button>
            <button type="button" style={btnStyle("#ca8a04")} onClick={() => updateQuestion(q.id, "visibility", { visibility: "hidden" })}>
              Verbergen
            </button>
            <button type="button" style={btnStyle("#b91c1c")} onClick={() => updateQuestion(q.id, "visibility", { visibility: "removed" })}>
              Entfernen
            </button>
            <button type="button" style={btnStyle("#2563eb")} onClick={() => updateQuestion(q.id, "status", { status: "closed" })}>
              Schließen
            </button>
            <button type="button" style={btnStyle("#475569")} onClick={() => updateQuestion(q.id, "status", { status: "open" })}>
              Öffnen
            </button>
          </div>

          {q.answers?.map((a) => (
            <div key={a.id} style={answerStyle}>
              <p style={bodyStyle}>{a.body}</p>
              <p style={mutedStyle}>
                {a.authorType === "admin" ? "AustriaPath Team" : "Member"} · {a.authorEmail} ·{" "}
                {a.visibility}
              </p>
              <div style={actionsStyle}>
                <button type="button" style={smallBtnStyle} onClick={() => updateAnswerVisibility(a.id, "public")}>
                  Antwort öffentlich
                </button>
                <button type="button" style={smallBtnStyle} onClick={() => updateAnswerVisibility(a.id, "hidden")}>
                  Antwort verbergen
                </button>
                <button type="button" style={smallBtnStyle} onClick={() => updateAnswerVisibility(a.id, "removed")}>
                  Antwort entfernen
                </button>
              </div>
            </div>
          ))}

          <textarea
            rows={3}
            style={textareaStyle}
            placeholder="Als AustriaPath Team antworten …"
            value={answerDrafts[q.id] || ""}
            onChange={(e) =>
              setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
          />
          <button
            type="button"
            style={btnStyle("#2563eb")}
            onClick={() => updateQuestion(q.id, "answer")}
          >
            Team-Antwort senden
          </button>
    </div>
  );
}

const titleStyle = { margin: "0 0 8px", color: "#0f172a" };
const subtitleStyle = { color: "#64748b", lineHeight: 1.5, marginBottom: "16px" };
const mutedStyle = { color: "#64748b", fontSize: "12px" };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "16px",
};
const attentionSectionStyle = {
  background: "#fffbeb",
  border: "1px solid #fcd34d",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "20px",
};
const attentionTitleStyle = { margin: "0 0 8px", color: "#92400e" };
const attentionCardStyle = {
  background: "#fff",
  border: "1px solid #f59e0b",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "16px",
};
const metaRowStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" };
const badgeStyle = {
  background: "#f1f5f9",
  color: "#334155",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};
const questionTitleStyle = { margin: "0 0 8px", color: "#0f172a" };
const bodyStyle = { color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" };
const actionsStyle = { display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0" };
const btnStyle = (bg) => ({
  border: "none",
  background: bg,
  color: "#fff",
  padding: "8px 12px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
});
const smallBtnStyle = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  padding: "6px 10px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
};
const answerStyle = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "12px",
  marginTop: "10px",
};
const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "10px",
  marginBottom: "8px",
  fontFamily: "inherit",
};
