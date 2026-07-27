import React, { useEffect, useMemo, useState } from 'react';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
import { isPremiumUser } from '../../data/utils/premiumHint';
import { B2LesenScreen } from './B2LesenScreen';
import { B1LesenScreen } from './lesen/B1LesenScreen';
import { getUserLanguage } from '../../utils/userPreferences';
import { getScreenLabels } from '../../i18n/screenLabels';
import { useAdminLearningLevel } from '../hooks/useAdminLearningLevel.js';
import { LearningLevelSelector } from '../components/LearningLevelSelector.jsx';
import {
  getA2LesenModel,
  pickRandomA2LesenModel,
} from '../../data/a2LesenCatalog.js';
import { A2LesenGuidedPanel } from './lesen/A2LesenGuidedPanel.jsx';
import { submitGuidedCatalogWeeklyPlanExercise } from '../../data/utils/weeklyPlanGuidedCompletion.js';
import {
  isActiveWeeklyPlanExerciseHandoff,
  readWeeklyPlanHandoff,
} from '../../data/utils/weeklyPlanHandoff.js';

const PREMIUM_HINT_COOLDOWN_DAYS = 3;
const PREMIUM_HINT_COOLDOWN_MS =
  PREMIUM_HINT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function shouldShowPremiumHint(storageKey) {
  const lastShown = Number(localStorage.getItem(storageKey) || 0);
  const now = Date.now();

  return !lastShown || now - lastShown >= PREMIUM_HINT_COOLDOWN_MS;
}

function markPremiumHintShown(storageKey) {
  localStorage.setItem(storageKey, String(Date.now()));
}

export function LesenScreen({
  setActiveTab,
  selectedLevel,
  setSelectedLevel,
  navigationContext,
  clearNavigationContext,
}) {
  const { level, setLevel } = useAdminLearningLevel({
    selectedLevel,
    setSelectedLevel,
    navigationLevel: navigationContext?.level,
  });
  const labels = getScreenLabels(getUserLanguage());

  const [showPremiumHint, setShowPremiumHint] = useState(false);
  const [activeA2Model, setActiveA2Model] = useState(() => pickRandomA2LesenModel());
  const [weeklyPlanModelId, setWeeklyPlanModelId] = useState(null);

  const language = getUserLanguage();
  const premiumMessage = getSmartPremiumMessage(language, 'lesen');

  const hasA2Catalog = useMemo(() => Boolean(activeA2Model), [activeA2Model]);
  const isWeeklyPlanCoachMode = useMemo(() => {
    const handoff = readWeeklyPlanHandoff();
    return isActiveWeeklyPlanExerciseHandoff(handoff);
  }, [level, weeklyPlanModelId]);

  useEffect(() => {
    if (level !== 'A2') return;

    const handoff = readWeeklyPlanHandoff();
    if (handoff?.canonicalModelId) {
      setWeeklyPlanModelId(handoff.canonicalModelId);
    } else {
      setWeeklyPlanModelId(null);
    }

    if (navigationContext?.canonicalModelId) {
      const linked = getA2LesenModel(navigationContext.canonicalModelId);
      if (linked) setActiveA2Model(linked);
      clearNavigationContext?.();
      return;
    }

    if (handoff?.canonicalModelId) {
      const linked = getA2LesenModel(handoff.canonicalModelId);
      if (linked) setActiveA2Model(linked);
      return;
    }

    setActiveA2Model(pickRandomA2LesenModel());
  }, [level, navigationContext, clearNavigationContext]);

  useEffect(() => {
    if (level !== 'A2' || !hasA2Catalog) return;

    const storageKey = 'lesenPremiumLastShown';

    if (isPremiumUser()) {
      setShowPremiumHint(false);
      return;
    }

    if (shouldShowPremiumHint(storageKey)) {
      setShowPremiumHint(true);
      markPremiumHintShown(storageKey);
    }
  }, [level, hasA2Catalog]);

  const handleA2GuidedComplete = ({ score, total, practiceOnly }) => {
    if (practiceOnly) return;
    if (!activeA2Model?.model_id) return;
    submitGuidedCatalogWeeklyPlanExercise({
      setActiveTab,
      modelId: activeA2Model.model_id,
      correctCount: score,
      totalQuestions: total,
    });
  };

  const handleA2Restart = () => {
    if (weeklyPlanModelId) {
      const linked = getA2LesenModel(weeklyPlanModelId);
      if (linked) {
        setActiveA2Model(linked);
        return;
      }
    }
    setActiveA2Model(pickRandomA2LesenModel());
  };

  if (level === 'B2') {
    return (
      <B2LesenScreen
        setActiveTab={setActiveTab}
        navigationContext={navigationContext}
        clearNavigationContext={clearNavigationContext}
      />
    );
  }

  if (level === 'B1') {
    return <B1LesenScreen setActiveTab={setActiveTab} />;
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        {labels.back}
      </button>

      <h1>📖 Lesen Trainer</h1>

      <p style={subtitleStyle}>
        Lernen Sie mit Lesethemen, Fragen und Lösungen.
      </p>

      {showPremiumHint && (
        <div style={premiumHintStyle}>
          <div style={{ fontSize: '30px' }}>{premiumMessage.icon}</div>

          <h3 style={{ margin: '8px 0', color: '#0f172a' }}>
            {premiumMessage.title}
          </h3>

          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            {premiumMessage.text}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('premium')}
              style={premiumButtonStyle}
            >
              {premiumMessage.button}
            </button>

            <button
              onClick={() => setShowPremiumHint(false)}
              style={laterButtonStyle}
            >
              {premiumMessage.later}
            </button>
          </div>
        </div>
      )}

      <LearningLevelSelector
        level={level}
        onChange={(nextLevel) => {
          setLevel(nextLevel);
          setActiveA2Model(pickRandomA2LesenModel());
        }}
        inputStyle={inputStyle}
      />

      {activeA2Model ? (
        <A2LesenGuidedPanel
          model={activeA2Model}
          mode={isWeeklyPlanCoachMode ? 'coach' : 'practice'}
          onComplete={handleA2GuidedComplete}
          onRestart={handleA2Restart}
        />
      ) : (
        <div style={boxStyle}>
          <h2>A2 Inhalte nicht verfügbar</h2>
          <p style={{ color: '#64748b' }}>
            Die Lesemodelle konnten nicht geladen werden.
          </p>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px',
};

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
};

const premiumButtonStyle = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const laterButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
};
