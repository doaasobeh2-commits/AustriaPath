import React from "react";
import { getUserLanguage } from "../../utils/userPreferences";
import { getScreenLabels } from "../../i18n/screenLabels";

export function DailyLearningHomeCard({ sessionComplete, onStart }) {
  const labels = getScreenLabels(getUserLanguage());
  const done = sessionComplete;

  return (
    <button
      type="button"
      onClick={done ? undefined : onStart}
      disabled={done}
      style={{
        ...cardStyle,
        opacity: done ? 0.65 : 1,
        cursor: done ? "default" : "pointer",
      }}
    >
      <h2 style={titleStyle}>{labels.dailyLearningTitle}</h2>
      <p style={subtitleStyle}>
        {done ? labels.dailyLearningDone : labels.dailyLearningSubtitle}
      </p>
    </button>
  );
}

const cardStyle = {
  width: "100%",
  marginBottom: "18px",
  padding: "18px 20px",
  border: "none",
  borderRadius: "18px",
  background: "#f0f9ff",
  textAlign: "left",
  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
  boxSizing: "border-box",
};

const titleStyle = {
  margin: "0 0 8px",
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a",
};

const subtitleStyle = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.45,
  color: "#475569",
};
