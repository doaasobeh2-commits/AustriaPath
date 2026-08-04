import React, { useEffect, useState } from "react";
import {
  closeCommunityQuestion,
  createCommunityAnswer,
  fetchCommunityQuestion,
  fetchMyCommunityQuestion,
} from "../../api/repositories/index.js";
import { ApiError } from "../../api/httpClient.js";

export default function CommunityQuestionDetailScreen({
  setActiveTab,
  navigationContext,
}) {
  const questionId = navigationContext?.communityQuestionId;
  const fromMyQuestions = Boolean(navigationContext?.fromMyQuestions);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerBody, setAnswerBody] = useState("");
  const [status, setStatus] = useState("Frage wird geladen …");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!questionId) {
      setStatus("Frage nicht gefunden.");
      return;
    }
    setStatus("Frage wird geladen …");
    const loadQuestion = fromMyQuestions
      ? fetchMyCommunityQuestion(questionId)
      : fetchCommunityQuestion(questionId);
    loadQuestion
      .then((data) => {
        setQuestion(data?.question || null);
        setAnswers(data?.answers || []);
        setStatus("");
      })
      .catch(() => setStatus("Frage konnte nicht geladen werden."));
  };

  useEffect(() => {
    load();
  }, [questionId, fromMyQuestions]);

  const submitAnswer = async () => {
    setError("");
    setSubmitting(true);
    try {
      await createCommunityAnswer(questionId, answerBody);
      setAnswerBody("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Antwort konnte nicht gesendet werden.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    try {
      await closeCommunityQuestion(questionId);
      load();
    } catch {
      setError("Frage konnte nicht geschlossen werden.");
    }
  };

  if (!questionId) {
    return (
      <div style={pageStyle}>
        <button type="button" style={backStyle} onClick={() => setActiveTab("communityQuestions")}>
          ← Fragen &amp; Antworten
        </button>
        <p>Frage nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button type="button" style={backStyle} onClick={() => setActiveTab("communityQuestions")}>
        ← Fragen &amp; Antworten
      </button>

      {status ? <p style={mutedStyle}>{status}</p> : null}

      {question ? (
        <>
          <div style={cardStyle}>
            {question.moderationMessage ? (
              <p style={moderationNoticeStyle}>{question.moderationMessage}</p>
            ) : null}
            <span style={badgeStyle}>{question.status}</span>
            <h2 style={titleStyle}>{question.title}</h2>
            <p style={bodyStyle}>{question.body}</p>
            <p style={mutedStyle}>{question.authorLabel}</p>
          </div>

          <h3 style={sectionTitleStyle}>Antworten ({answers.length}/3)</h3>
          {answers.map((answer) => (
            <div key={answer.id} style={answerCardStyle}>
              <p style={bodyStyle}>{answer.body}</p>
              <p style={mutedStyle}>{answer.authorLabel}</p>
            </div>
          ))}

          {question.status !== "closed" && answers.length < 3 && !question.moderationState ? (
            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Antwort schreiben</h3>
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                rows={5}
                style={textareaStyle}
                placeholder="Teilen Sie Ihre Erfahrung oder einen hilfreichen Tipp (ohne Kontaktdaten)."
              />
              {error ? <p style={errorStyle}>{error}</p> : null}
              <button
                type="button"
                style={primaryBtnStyle}
                disabled={submitting || answerBody.trim().length < 10}
                onClick={submitAnswer}
              >
                {submitting ? "Wird gesendet …" : "Antwort senden"}
              </button>
            </div>
          ) : null}

          {question.status !== "closed" && !question.moderationState ? (
            <button type="button" style={secondaryBtnStyle} onClick={handleClose}>
              Frage schließen
            </button>
          ) : null}
        </>
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

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "16px",
};

const answerCardStyle = {
  ...cardStyle,
  borderLeft: "4px solid #2563eb",
};

const titleStyle = { margin: "8px 0", color: "#0f172a" };
const sectionTitleStyle = { margin: "0 0 10px", color: "#0f172a" };
const bodyStyle = { color: "#334155", lineHeight: 1.55, whiteSpace: "pre-wrap" };
const mutedStyle = { color: "#64748b", fontSize: "13px" };
const errorStyle = { color: "#b91c1c", fontSize: "14px" };

const moderationNoticeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "10px",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.45,
};

const badgeStyle = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "capitalize",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "12px",
  marginBottom: "10px",
  fontFamily: "inherit",
};

const primaryBtnStyle = {
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "12px",
  fontWeight: 800,
  cursor: "pointer",
  width: "100%",
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
