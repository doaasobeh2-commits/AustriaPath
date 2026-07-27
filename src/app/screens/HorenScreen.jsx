import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { b2Models } from '../../data/modelsB2';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
import { B1HorenScreen } from "./lesen/B1HorenScreen";
import { b2HorenModels } from '../../data/b2HorenModels';
import { isPremiumUser, trackSectionVisit } from '../../data/utils/premiumHint';
import { getUserLanguage } from '../../utils/userPreferences';
import { useAdminLearningLevel } from '../hooks/useAdminLearningLevel.js';
import { LearningLevelSelector } from '../components/LearningLevelSelector.jsx';
import {
  a2HorenModels,
  getA2HorenModel,
} from '../../data/a2HorenCatalog.js';
import { A2HorenGuidedPanel } from './horen/A2HorenGuidedPanel.jsx';
import { submitGuidedCatalogWeeklyPlanExercise } from '../../data/utils/weeklyPlanGuidedCompletion.js';
import { readWeeklyPlanHandoff } from '../../data/utils/weeklyPlanHandoff.js';


function splitLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAdminQuestions(solution = '') {
  if (!solution) return [];

  const text = String(solution).trim();
  const blocks = text.split(/Frage\s*\d+\s*:/i).filter(Boolean);

  return blocks
    .map((block) => {
      const parts = block.split(/Antwort\s*:/i);

      return {
        q: (parts[0] || '').trim(),
        a: (parts[1] || '').trim()
      };
    })
    .filter((item) => item.q || item.a);
}

function getAdminHorenModels() {
  try {
    const saved = localStorage.getItem('austriaPathAdminData');
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list
      .filter((item) => {
        const bereich = String(
          item.bereich || item.area || item.type || ''
        ).toLowerCase();
        const status = String(item.status || '').toLowerCase();

        return (
          (
            bereich === 'hoeren' ||
            bereich === 'hören' ||
            bereich === 'horen' ||
            bereich.includes('hoeren') ||
            bereich.includes('hören') ||
            bereich.includes('horen')
          ) &&
          status === 'published'
        );
      })
      .map((item) => ({
        title: item.title || 'Hören Modell aus Admin',
        level: item.level || item.niveau || 'A2',
        text: item.content || item.task || item.text || '',
        questions: parseAdminQuestions(item.solution || ''),
        words: splitLines(item.words || item.vocabulary),
        verbs: splitLines(item.verbs),
        grammar: splitLines(item.grammar),
        mistakes: splitLines(item.mistakes),
        expressions: splitLines(item.expressions),
        tip:
          item.tip ||
          'Hören Sie zuerst den Text und beantworten Sie danach die Fragen.',
        fromAdmin: true
      }));
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Hören-Modelle:', error);
    return [];
  }
}




const staticA2HorenModels = [];

export function HorenScreen({
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

  const [index, setIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPremiumHint, setShowPremiumHint] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(
    () => a2HorenModels[0]?.model_id || null
  );
  const [modelSessions, setModelSessions] = useState({});
  const [weeklyPlanModelId, setWeeklyPlanModelId] = useState(null);

  
  

  const adminHoren = useMemo(() => getAdminHorenModels(), []);

  const modelsByLevel = useMemo(() => {
    const result = {
      A2: [...staticA2HorenModels],
      B1: [],
      B2: [...b2HorenModels]
    };

    adminHoren.forEach((item) => {
      const itemLevel = item.level || item.niveau || 'A2';
      if (!result[itemLevel]) result[itemLevel] = [];
      result[itemLevel].push(item);
    });

    return result;
  }, [adminHoren]);

  const models = modelsByLevel[level] || [];
  const model = models[index];

  const activeA2Model = useMemo(
    () => (selectedModelId ? getA2HorenModel(selectedModelId) : null),
    [selectedModelId]
  );

  const persistA2ModelSession = useCallback((modelId, sessionState) => {
    if (!modelId || !sessionState) return;
    setModelSessions((prev) => ({
      ...prev,
      [modelId]: sessionState,
    }));
  }, []);

  const clearA2ModelSession = useCallback((modelId) => {
    if (!modelId) return;
    setModelSessions((prev) => {
      if (!prev[modelId]) return prev;
      const next = { ...prev };
      delete next[modelId];
      return next;
    });
  }, []);

  const language = getUserLanguage();

  const premiumMessage = getSmartPremiumMessage(language, 'hoeren');

  useEffect(() => {
    if (level !== 'A2') return;
    const handoff = readWeeklyPlanHandoff();
    if (handoff?.canonicalModelId) {
      setWeeklyPlanModelId(handoff.canonicalModelId);
    } else {
      setWeeklyPlanModelId(null);
    }
    if (navigationContext?.canonicalModelId) {
      const linked = getA2HorenModel(navigationContext.canonicalModelId);
      if (linked) setSelectedModelId(linked.model_id);
      clearNavigationContext?.();
      return;
    }
    if (handoff?.canonicalModelId) {
      const linked = getA2HorenModel(handoff.canonicalModelId);
      if (linked) setSelectedModelId(linked.model_id);
      return;
    }
    setSelectedModelId(a2HorenModels[0]?.model_id || null);
  }, [level, navigationContext, clearNavigationContext]);

  const handleA2GuidedComplete = ({ score, total }) => {
    if (!activeA2Model?.model_id) return;
    submitGuidedCatalogWeeklyPlanExercise({
      setActiveTab,
      modelId: activeA2Model.model_id,
      correctCount: score,
      totalQuestions: total,
      audioPlayed: true,
    });
  };

  const handleA2Restart = () => {
    if (selectedModelId) {
      clearA2ModelSession(selectedModelId);
    }
  };

 useEffect(() => {
  if (!models.length) return;

  if (isPremiumUser()) {
    setShowPremiumHint(false);
    return;
  }

  if (trackSectionVisit('hoeren')) {
    setShowPremiumHint(true);
  }
}, [models.length]);
  const readText = () => {
    if (!model?.text) return;

    const utterance = new SpeechSynthesisUtterance(model.text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopText = () => {
    window.speechSynthesis.cancel();
  };
if (level === 'B1') {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>
        <LearningLevelSelector
          level={level}
          onChange={(nextLevel) => {
            setLevel(nextLevel);
            setIndex(0);
          }}
          inputStyle={inputStyle}
        />
        <B1HorenScreen setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (level === 'A2') {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1>🎧 Hören Trainer</h1>

        <p style={subtitleStyle}>
          Lernen Sie mit Hörmodellen, Fragen und Lösungen.
        </p>

        {showPremiumHint && (
          <div style={premiumHintStyle}>
            <div style={{ fontSize: '30px' }}>{premiumMessage.icon}</div>
            <h3 style={{ margin: '8px 0', color: '#0f172a' }}>{premiumMessage.title}</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>{premiumMessage.text}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('premium')} style={premiumButtonStyle}>
                {premiumMessage.button}
              </button>
              <button onClick={() => setShowPremiumHint(false)} style={laterButtonStyle}>
                {premiumMessage.later}
              </button>
            </div>
          </div>
        )}

        <LearningLevelSelector
          level={level}
          onChange={(nextLevel) => {
            setLevel(nextLevel);
            setSelectedModelId(a2HorenModels[0]?.model_id || null);
            setModelSessions({});
          }}
          inputStyle={inputStyle}
        />

        {a2HorenModels.length > 0 && (
          <div>
            <label
              htmlFor="a2-horen-model-select"
              style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}
            >
              Hörmodell auswählen
            </label>
            <select
              id="a2-horen-model-select"
              style={selectStyle}
              value={selectedModelId || ''}
              onChange={(event) => {
                setSelectedModelId(event.target.value);
              }}
            >
              {a2HorenModels.map((item, modelIndex) => (
                <option key={item.model_id} value={item.model_id}>
                  Modell {modelIndex + 1} — {item.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeA2Model ? (
          <A2HorenGuidedPanel
            key={selectedModelId}
            model={activeA2Model}
            persistedState={modelSessions[selectedModelId]}
            onPersistState={(sessionState) =>
              persistA2ModelSession(activeA2Model.model_id, sessionState)
            }
            onComplete={handleA2GuidedComplete}
            onRestart={handleA2Restart}
          />
        ) : (
          <div style={boxStyle}>
            <h2>A2 Inhalte nicht verfügbar</h2>
            <p style={{ color: '#64748b' }}>Die Hörmodelle konnten nicht geladen werden.</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>🎧 Hören Trainer</h1>

      <p style={subtitleStyle}>
        Lernen Sie mit Hörmodellen, Fragen und Lösungen.
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
              onClick={() => {
                setShowPremiumHint(false);
              }}
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
          setIndex(0);
        }}
        inputStyle={inputStyle}
      />

      {models.length === 0 ? (
        <div style={boxStyle}>
          <h2>{level} Inhalte kommen bald</h2>
          <p style={{ color: '#64748b' }}>
            Für dieses Niveau sind noch keine Hörmodelle verfügbar.
          </p>
        </div>
      ) : (
        <>
          <select
            style={inputStyle}
            value={index}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setShowTranscript(false);
              window.speechSynthesis.cancel();
            }}
          >
            {models.map((item, i) => (
              <option key={i} value={i}>
                Hören {i + 1}: {item.title}
              </option>
            ))}
          </select>

          <div style={boxStyle}>
            <span style={badgeStyle}>{level}</span>
            {model.fromAdmin && <span style={adminBadgeStyle}>Aus Admin</span>}

            <h2>{model.title}</h2>

            <h3>🎧 Hörthema</h3>

            {!showTranscript && (
              <p style={{ color: '#64748b' }}>
                Klicken Sie auf „Hörtext vorlesen“ und beantworten Sie danach die
                Fragen.
              </p>
            )}

            <div style={audioActionsStyle}>
              <button onClick={readText} style={audioButtonStyle}>
                🔊 Hörtext vorlesen
              </button>

              <button onClick={stopText} style={stopButtonStyle}>
                ⏹ Stoppen
              </button>

              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={transcriptButtonStyle}
              >
                {showTranscript ? 'Text ausblenden' : 'Text anzeigen'}
              </button>
            </div>

            {showTranscript && (
              <div style={transcriptBoxStyle}>
                <h3>📝 Transkript / Thema</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{model.text}</p>
              </div>
            )}
          </div>

          <div style={boxStyle}>
            <h3>❓ Fragen und Antworten</h3>
            {model.questions?.map((item, i) => (
              <div key={i} style={questionStyle}>
                <p>
                  <b>Frage {i + 1}:</b> {item.q}
                </p>
                <p>
                  <b>Antwort:</b> {item.a}
                </p>
              </div>
            ))}
          </div>

          <InfoBox title="📌 Wichtige Wörter" items={model.words} />
          <InfoBox title="💪 Wichtige Verben" items={model.verbs} />
          <InfoBox title="📚 Wichtige Grammatik" items={model.grammar} />
          <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />
          <InfoBox title="⭐ B2 Ausdrücke" items={model.expressions} />

          <div style={boxStyle}>
            <h3>⭐ Lerntipp</h3>
            <p>{model.tip}</p>
          </div>
        </>
      )}
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={boxStyle}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};

const selectStyle = {
  ...inputStyle,
  appearance: 'auto',
  WebkitAppearance: 'menulist',
  cursor: 'pointer',
};

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6'
};

const transcriptBoxStyle = {
  marginTop: '12px',
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '12px',
  border: '1px solid #e2e8f0'
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px'
};

const audioButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const stopButtonStyle = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const transcriptButtonStyle = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '700'
};

const audioActionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '10px'
};

const badgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 'bold',
  marginBottom: '10px',
  marginRight: '8px'
};

const adminBadgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const questionStyle = {
  padding: '10px',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  marginBottom: '10px'
};

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
};

const premiumButtonStyle = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const laterButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};