import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUserLanguage, getUserLevel } from "../../utils/userPreferences";
import { getScreenLabels } from "../../i18n/screenLabels";
import {
  getDailyLearningSession,
  markDailyLearningSessionComplete,
} from "../../data/dailyLearningRotation.js";
import {
  applyDailyLearningNavigation,
  resolveDailyLearningNavigation,
} from "../../data/dailyLearningNavigation.js";

export default function DailyLearningScreen({
  setActiveTab,
  setSelectedWritingModel,
  setNavigationContext,
  setSelectedLevel,
  clearNavigationContext,
}) {
  const level = getUserLevel();
  const labels = getScreenLabels(getUserLanguage());
  const session = useMemo(() => getDailyLearningSession(level), [level]);
  const cards = session.cards;

  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState("choose");
  const navigatedAwayRef = useRef(false);

  const card = cards[cardIndex];
  const isLastCard = cardIndex >= cards.length - 1;

  useEffect(() => {
    if (!cards.length) {
      setActiveTab("home");
    }
  }, [cards.length, setActiveTab]);

  useEffect(() => {
    if (phase === "result" && isLastCard) {
      markDailyLearningSessionComplete(level);
      const timer = setTimeout(() => {
        if (!navigatedAwayRef.current) setActiveTab("home");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, isLastCard, level, setActiveTab]);

  if (!card) {
    return null;
  }

  const handleChoice = () => {
    setPhase("result");
  };

  const handleNext = () => {
    if (isLastCard) {
      setActiveTab("home");
      return;
    }
    setCardIndex((i) => i + 1);
    setPhase("choose");
  };

  const handleBack = () => {
    if (phase === "result" && isLastCard) {
      markDailyLearningSessionComplete(level);
    }
    clearNavigationContext?.();
    setActiveTab("home");
  };

  const handleSource = () => {
    navigatedAwayRef.current = true;
    const target = resolveDailyLearningNavigation(card);
    markDailyLearningSessionComplete(level);
    applyDailyLearningNavigation(target, {
      setActiveTab,
      setSelectedWritingModel,
      setNavigationContext,
      setSelectedLevel,
    });
  };

  const nav = resolveDailyLearningNavigation(card);
  const showSource = Boolean(nav?.tab);

  return (
    <div style={pageStyle}>
      <button type="button" onClick={handleBack} style={backButtonStyle}>
        {labels.back}
      </button>

      <div style={situationBoxStyle}>
        <p style={situationStyle}>{card.situation}</p>
      </div>

      {phase === "choose" ? (
        <>
          <p style={questionStyle}>{card.question}</p>
          <button type="button" style={answerStyle} onClick={handleChoice}>
            A) {card.optionA}
          </button>
          <button type="button" style={answerStyle} onClick={handleChoice}>
            B) {card.optionB}
          </button>
        </>
      ) : (
        <>
          <p style={recommendsLabelStyle}>{labels.dailyLearningRecommends}</p>
          <p style={recommendedStyle}>{card.recommended}</p>
          <p style={reasonStyle}>{card.reason}</p>

          {showSource && (
            <button type="button" style={sourceButtonStyle} onClick={handleSource}>
              {nav.buttonLabel}
            </button>
          )}

          {!isLastCard && (
            <button type="button" style={nextLinkStyle} onClick={handleNext}>
              {labels.dailyLearningNext}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "22px",
  paddingBottom: "90px",
  background: "#f8fafc",
  fontFamily: "system-ui, sans-serif",
  boxSizing: "border-box",
  maxWidth: "430px",
  margin: "0 auto",
};

const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#334155",
  fontSize: "15px",
  cursor: "pointer",
  padding: "0 0 16px",
};

const situationBoxStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "20px",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
};

const situationStyle = {
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#1e293b",
};

const questionStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#334155",
  marginBottom: "14px",
};

const answerStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "14px 16px",
  marginBottom: "12px",
  background: "#ffffff",
  fontSize: "15px",
  lineHeight: 1.5,
  color: "#1e293b",
  cursor: "pointer",
};

const recommendsLabelStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#64748b",
  margin: "0 0 8px",
};

const recommendedStyle = {
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#0f172a",
  margin: "0 0 12px",
  fontWeight: 500,
};

const reasonStyle = {
  fontSize: "14px",
  lineHeight: 1.5,
  color: "#475569",
  margin: "0 0 20px",
};

const sourceButtonStyle = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "14px 16px",
  background: "#0ea5e9",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "12px",
};

const nextLinkStyle = {
  display: "block",
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#0369a1",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  padding: "8px 0",
  textAlign: "center",
};
