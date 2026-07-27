import React, { useMemo, useState } from 'react';
import { buildB1CoachWeeklyPlan, generateB1WeeklyPlanSchedule } from '../../data/weekly-plan/b1/planGeneration.js';
import { B1_CATEGORY_LABELS } from '../../data/weekly-plan/b1/metadata.js';
import { loadB1SetupDraft, clearB1SetupDraft } from '../../data/utils/b1WeeklyPlanSetupState.js';
import {
  isB1SetupSelectionComplete,
} from '../../data/utils/b1WeeklyPlanSetupState.js';
import {
  isCoachV1Plan,
  loadWeeklyPlan,
  saveWeeklyPlan,
} from '../../data/utils/weeklyPlanCoachState.js';
import { setWeeklyPlanHandoff } from '../../data/utils/weeklyPlanHandoff.js';
import {
  recordWeeklyPlanAnalyticsEvent,
  WeeklyPlanAnalyticsEvents,
} from '../../data/utils/weeklyPlanAnalytics.js';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklySecondaryButtonStyle,
  weeklySectionTitleStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';

export default function B1WeeklyPlanPreviewScreen({ setActiveTab }) {
  const draft = useMemo(() => loadB1SetupDraft(), []);
  const existingPlan = useMemo(() => loadWeeklyPlan(), []);
  const hasActivePlan = isCoachV1Plan(existingPlan);
  const [confirmed, setConfirmed] = useState(false);

  if (!draft || !isB1SetupSelectionComplete(draft)) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <p style={weeklyMutedStyle}>Keine vollständige B1-Auswahl gefunden.</p>
        <button type="button" style={weeklyPrimaryButtonStyle} onClick={() => setActiveTab('b1WeeklyPlanSetup')}>
          Zurück zur Auswahl
        </button>
      </div>
    );
  }

  const schedule = generateB1WeeklyPlanSchedule(
    {
      schreiben: draft.schreiben,
      hoeren: draft.hoeren,
      bildbeschreibung: draft.bildbeschreibung,
      planung: draft.planung,
    },
    { placementFocus: draft.placementFocus || [] }
  );

  const handleConfirm = () => {
    if (hasActivePlan) {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_PLAN_REPLACEMENT_CONFIRMED, {
        selectedTrainingLevel: 'B1',
        previousLevel: existingPlan?.level || null,
        placementLevel: draft.placementLevel,
      });
    }

    const plan = buildB1CoachWeeklyPlan(
      {
        schreiben: draft.schreiben,
        hoeren: draft.hoeren,
        bildbeschreibung: draft.bildbeschreibung,
        planung: draft.planung,
      },
      { focusSkills: draft.placementFocus || [], placementFocus: draft.placementFocus || [] }
    );

    saveWeeklyPlan(plan);
    clearB1SetupDraft();
    setWeeklyPlanHandoff({ planIndex: 1, view: 'dashboard' });

    recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_PLAN_CONFIRMED, {
      selectedTrainingLevel: 'B1',
      placementLevel: draft.placementLevel,
      modelCounts: {
        schreiben: draft.schreiben.length,
        hoeren: draft.hoeren.length,
        bildbeschreibung: draft.bildbeschreibung.length,
        planung: draft.planung.length,
      },
    });

    setConfirmed(true);
    setActiveTab('trainingPlanDashboard');
  };

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button
        type="button"
        style={weeklyBackButtonStyle}
        onClick={() => setActiveTab('b1WeeklyPlanSetup')}
      >
        ← Auswahl bearbeiten
      </button>

      <div style={weeklyHeroStyle}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>B1 Wochenplan — Vorschau</h1>
        <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
          Trainingsniveau: <strong>B1</strong> · 7 Tage · 4 Übungen pro Tag
        </p>
      </div>

      {hasActivePlan && (
        <div style={{ ...weeklyCardStyle, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>
            Achtung: Die Bestätigung ersetzt deinen aktuellen Wochenplan (
            {existingPlan.level || 'unbekannt'}).
          </p>
        </div>
      )}

      {draft.placementFocus?.length > 0 && (
        <div style={weeklyCardStyle}>
          <h2 style={weeklySectionTitleStyle}>Schwerpunkte aus Einstufung</h2>
          <p style={weeklyMutedStyle}>{draft.placementFocus.join(', ')}</p>
        </div>
      )}

      {schedule.days.map((day) => (
        <div key={day.dayIndex} style={weeklyCardStyle}>
          <h2 style={weeklySectionTitleStyle}>Tag {day.dayIndex}</h2>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            {day.activities.map((activity, index) => (
              <li key={`${day.dayIndex}-${index}`}>
                <strong>{B1_CATEGORY_LABELS[activity.category] || activity.category}:</strong>{' '}
                {activity.title}
                {activity.repeatedSession ? ' (Pflicht)' : ''}
              </li>
            ))}
          </ol>
        </div>
      ))}

      {confirmed && (
        <div style={{ ...weeklyCardStyle, backgroundColor: '#ecfdf5' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>B1-Wochenplan wurde gespeichert.</p>
        </div>
      )}

      <button type="button" style={weeklySecondaryButtonStyle} onClick={() => setActiveTab('b1WeeklyPlanSetup')}>
        Auswahl bearbeiten
      </button>
      <button type="button" style={weeklyPrimaryButtonStyle} onClick={handleConfirm}>
        Wochenplan bestätigen
      </button>
    </div>
  );
}
