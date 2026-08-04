import React, { useState } from "react";
import { createCommunityQuestion } from "../../api/repositories/index.js";
import { ApiError } from "../../api/httpClient.js";
import { getUserLevel } from "../../utils/userPreferences.js";

export default function CommunityAskQuestionScreen({ setActiveTab }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await createCommunityQuestion({
        title: title.trim(),
        body: body.trim(),
        level: getUserLevel(),
      });
      setActiveTab("communityQuestions");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Frage konnte nicht veröffentlicht werden."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <button type="button" style={backStyle} onClick={() => setActiveTab("communityQuestions")}>
        ← Fragen &amp; Antworten
      </button>

      <h2 style={titleStyle}>Frage stellen</h2>
      <p style={subtitleStyle}>
        Ihre Frage wird anonym als „AustriaPath Member“ veröffentlicht. Bitte keine
        Kontaktdaten oder externe Links angeben.
      </p>

      <label style={labelStyle}>
        Titel
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          maxLength={200}
          placeholder="Kurzer Titel (mindestens 10 Zeichen)"
        />
      </label>

      <label style={labelStyle}>
        Beschreibung
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          style={textareaStyle}
          maxLength={1500}
          placeholder="Beschreiben Sie Ihre Frage ausführlich (mindestens 20 Zeichen)."
        />
      </label>

      {error ? <p style={errorStyle}>{error}</p> : null}

      <button
        type="button"
        style={primaryBtnStyle}
        disabled={submitting || title.trim().length < 10 || body.trim().length < 20}
        onClick={submit}
      >
        {submitting ? "Wird veröffentlicht …" : "Frage veröffentlichen"}
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
const subtitleStyle = { color: "#64748b", lineHeight: 1.5, marginBottom: "18px" };
const labelStyle = { display: "block", marginBottom: "14px", fontWeight: 700, color: "#0f172a" };
const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: "6px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "12px",
  fontFamily: "inherit",
};
const textareaStyle = { ...inputStyle, resize: "vertical" };
const errorStyle = { color: "#b91c1c" };
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
