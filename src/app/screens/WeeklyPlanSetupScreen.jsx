import React, { useEffect, useMemo, useState } from 'react';
import { mapFocusListForWeeklyPlan } from '../../data/utils/placementReport';
import {
  createCoachWeeklyPlan,
  isCoachV1Plan,
  isLegacyWeeklyPlan,
  loadWeeklyPlan,
  saveWeeklyPlan,
} from '../../data/utils/weeklyPlanCoachState.js';
import { getCurrentUser } from '../userAccess.js';
import { getAccessibleLearningLevels } from '../../utils/learningLevelAccess.js';
import { getWeeklyPlanAdminQaAccessibleLevels } from '../../utils/adminQaMode.js';
import { getUserLevel } from '../../utils/userPreferences.js';
import { setWeeklyPlanHandoff } from '../../data/utils/weeklyPlanHandoff.js';
import {
  didAcceptPlacementRecommendation,
  resolveWeeklyPlanLevelChoices,
} from '../../data/utils/weeklyPlanLevelSelection.js';
import {
  createEmptyB1SetupDraft,
  saveB1SetupDraft,
} from '../../data/utils/b1WeeklyPlanSetupState.js';
import {
  recordWeeklyPlanAnalyticsEvent,
  WeeklyPlanAnalyticsEvents,
} from '../../data/utils/weeklyPlanAnalytics.js';
import { WeeklyPlanLevelSelector } from './weeklyPlan/WeeklyPlanLevelSelector.jsx';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklySectionTitleStyle,
} from './weeklyPlan/weeklyPlanStyles.js';

/** Informational A2 training domains — not selectable; matches the A2 planner. */
const A2_TRAINING_DOMAINS = [
  { label: 'Hören' },
  { label: 'Lesen' },
  { label: 'Bildbeschreibung' },
  { label: 'Schreiben / E-Mail' },
  { label: 'Aufgabe lösen' },
];

const DEFAULT_B1_PLACEMENT_FOCUS = ['hoeren', 'grammatik'];

export default function WeeklyPlanSetupScreen({ setActiveTab }) {
  const placementProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('austriaPathPlacementProfile'));
    } catch {
      return null;
    }
  }, []);

  const existingPlan = useMemo(() => loadWeeklyPlan(), []);
  const hasActiveCoachPlan = isCoachV1Plan(existingPlan);
  const hasPlacement = Boolean(placementProfile);

  const importedFocus = useMemo(
    () =>
      mapFocusListForWeeklyPlan(
        placementProfile?.recommendedFocus || placementProfile?.focusAreas || []
      ),
    [placementProfile]
  );

  const accessibleLevels = useMemo(() => {
    const qaLevels = getWeeklyPlanAdminQaAccessibleLevels(getCurrentUser());
    if (qaLevels) return qaLevels;
    return getAccessibleLearningLevels(getCurrentUser());
  }, []);

  const levelChoices = useMemo(
    () =>
      resolveWeeklyPlanLevelChoices({
        placementProfile,
        accessibleLevels,
        storedLevel: getUserLevel(),
      }),
    [placementProfile, accessibleLevels]
  );

  const [level, setLevel] = useState(levelChoices.defaultLevel);

  const b1PlacementFocus = hasPlacement
    ? importedFocus
    : importedFocus.length
      ? importedFocus.slice(0, 3)
      : DEFAULT_B1_PLACEMENT_FOCUS;

  useEffect(() => {
    recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.OPENED, {
      placementLevel: placementProfile?.level || null,
    });
    if (hasPlacement) {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.PLACEMENT_RECOMMENDATION_SHOWN, {
        placementLevel: placementProfile?.level || null,
        recommendedLevel: levelChoices.recommended,
      });
    }
  }, [hasPlacement, placementProfile, levelChoices.recommended]);

  const handleLevelSelect = (nextLevel) => {
    setLevel(nextLevel);
    if (didAcceptPlacementRecommendation(nextLevel, levelChoices.recommended)) {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.RECOMMENDED_LEVEL_ACCEPTED, {
        selectedTrainingLevel: nextLevel,
        placementLevel: placementProfile?.level || null,
      });
    } else if (levelChoices.recommended && nextLevel !== levelChoices.recommended) {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.DIFFERENT_LEVEL_SELECTED, {
        selectedTrainingLevel: nextLevel,
        placementLevel: placementProfile?.level || null,
        recommendedLevel: levelChoices.recommended,
      });
    }
    if (nextLevel === 'A2') {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.A2_SELECTED, {
        selectedTrainingLevel: 'A2',
      });
    }
    if (nextLevel === 'B1') {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_SELECTED, {
        selectedTrainingLevel: 'B1',
      });
    }
  };

  const handleActivate = () => {
    if (level === 'B1') {
      const draft = createEmptyB1SetupDraft({
        placementLevel: placementProfile?.level || null,
        placementFocus: b1PlacementFocus,
      });
      saveB1SetupDraft(draft);
      setActiveTab('b1WeeklyPlanSetup');
      return;
    }

    if (level !== 'A2') return;

    const plan = createCoachWeeklyPlan({ level: 'A2', focusSkills: [] });
    saveWeeklyPlan(plan);
    setWeeklyPlanHandoff({ planIndex: 1, view: 'dashboard' });
    setActiveTab('trainingPlanDashboard');
  };

  const isA2Flow = level === 'A2';
  const isB1Flow = level === 'B1';

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('premium')}>
        ← Zurück
      </button>

      {isLegacyWeeklyPlan(existingPlan) && (
        <div style={{ ...weeklyCardStyle, backgroundColor: '#eff6ff' }}>
          <p style={weeklyMutedStyle}>
            Ein älterer Wochenplan mit Terminen wurde gefunden. Die Aktivierung ersetzt ihn durch
            das neue Trainingsmodell.
          </p>
        </div>
      )}

      {hasActiveCoachPlan && isA2Flow && (
        <div style={{ ...weeklyCardStyle, backgroundColor: '#eff6ff' }}>
          <p style={weeklyMutedStyle}>
            Du hast bereits einen aktiven Wochenplan. Die Aktivierung startet einen neuen Plan.
          </p>
          <button
            type="button"
            style={{ ...weeklyPrimaryButtonStyle, marginTop: '10px' }}
            onClick={() => setActiveTab('weeklyPlanHome')}
          >
            Zum aktuellen Wochenplan
          </button>
        </div>
      )}

      <div style={weeklyHeroStyle}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>
          Dein persönlicher KI-Wochenplan
        </h1>
        <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
          7 Trainingspläne · jeweils 4 kurze Übungen · flexibel in deinem eigenen Tempo
        </p>
      </div>

      <WeeklyPlanLevelSelector
        choices={levelChoices.choices}
        selectedLevel={level}
        onSelect={handleLevelSelect}
        onComingSoonClick={() => {
          recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B2_COMING_SOON_CLICKED, {
            placementLevel: placementProfile?.level || null,
          });
          alert('B2 — Coming Soon');
        }}
        placementRaw={placementProfile?.level || null}
        importedFocus={isB1Flow ? importedFocus : []}
      />

      {isA2Flow && (
        <>
          <div style={weeklyCardStyle}>
            <h2 style={weeklySectionTitleStyle}>2. So ist dein A2-Wochenplan aufgebaut</h2>
            <p style={{ ...weeklyMutedStyle, lineHeight: 1.7, marginBottom: '16px' }}>
              Jeder Trainingsplan enthält vier Übungen. Du trainierst regelmäßig Hören, Lesen und
              Bildbeschreibung. Die vierte Übung wechselt zwischen E-Mail schreiben und Aufgabe
              lösen.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {A2_TRAINING_DOMAINS.map((domain) => (
                <span
                  key={domain.label}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '8px 12px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {domain.label}
                </span>
              ))}
            </div>
          </div>

          <div style={weeklyCardStyle}>
            <h2 style={weeklySectionTitleStyle}>3. So funktioniert dein Wochenplan</h2>
            <p style={weeklyMutedStyle}>
              Jeder Trainingsplan enthält vier Übungen. Sobald du alle vier abgeschlossen hast, wird
              der nächste Plan freigeschaltet.
            </p>
            <ul style={{ lineHeight: 1.9, paddingLeft: '18px', color: '#334155', marginBottom: 0 }}>
              <li>7 Trainingspläne</li>
              <li>4 Übungen pro Trainingsplan</li>
              <li>Kein Zeitdruck – du bestimmst das Tempo</li>
              <li>Nach jeder Übung bekommst du Korrekturen und Erklärungen</li>
            </ul>
          </div>
        </>
      )}

      {isB1Flow && (
        <div style={weeklyCardStyle}>
          <h2 style={weeklySectionTitleStyle}>2. B1 Modellauswahl</h2>
          <p style={weeklyMutedStyle}>
            Für B1 wählst du im nächsten Schritt konkrete Prüfungsmodelle je Kategorie (je 7) und
            bestätigst den Plan in einer Vorschau.
          </p>
        </div>
      )}

      <button
        type="button"
        style={weeklyPrimaryButtonStyle}
        onClick={handleActivate}
        disabled={level === 'B2'}
      >
        {isB1Flow ? 'Weiter zur B1-Modellauswahl' : 'Wochenplan aktivieren'}
      </button>
    </div>
  );
}
