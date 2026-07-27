import React, { useMemo } from 'react';
import {
  isCoachV1Plan,
  loadWeeklyPlan,
} from '../../data/utils/weeklyPlanCoachState.js';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklySecondaryButtonStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';

export default function WeeklyCompletionScreen({ setActiveTab }) {
  const plan = useMemo(() => loadWeeklyPlan(), []);

  if (!plan || !isCoachV1Plan(plan)) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <p style={weeklyMutedStyle}>Kein abgeschlossener Wochenplan gefunden.</p>
          <button
            type="button"
            style={weeklyPrimaryButtonStyle}
            onClick={() => setActiveTab('weeklyPlanSetup')}
          >
            Neuen Wochenplan starten
          </button>
        </div>
      </div>
    );
  }

  const report = plan.weeklyReport || {
    improved: [
      'Du hast alle 7 Trainingspläne abgeschlossen.',
      'Du hast regelmäßig an deinen Übungen gearbeitet.',
    ],
    practice: [
      'Wiederhole gelegentlich die Korrekturen aus deinen abgeschlossenen Plänen.',
      'Achte weiter auf Verbposition und vollständige Sätze.',
    ],
    recommendation:
      'Starte einen neuen Wochenplan mit mehr Sprechübungen, wenn du das möchtest.',
  };

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
        ← Zurück
      </button>

      <div style={weeklyHeroStyle}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>
          Dein Wochenplan ist abgeschlossen
        </h1>
        <p style={{ margin: '10px 0 0' }}>Alle 7 Trainingspläne · 28 Übungen</p>
      </div>

      <div style={weeklyCardStyle}>
        <h2 style={{ marginTop: 0 }}>Was du verbessert hast</h2>
        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
          {report.improved.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div style={weeklyCardStyle}>
        <h2 style={{ marginTop: 0 }}>Was du weiter üben solltest</h2>
        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
          {report.practice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div style={weeklyCardStyle}>
        <h2 style={{ marginTop: 0 }}>Empfehlung für deinen nächsten Wochenplan</h2>
        <p style={weeklyMutedStyle}>{report.recommendation}</p>
      </div>

      <button
        type="button"
        style={weeklyPrimaryButtonStyle}
        onClick={() => setActiveTab('weeklyPlanSetup')}
      >
        Neuen Wochenplan starten
      </button>
      <button
        type="button"
        style={weeklySecondaryButtonStyle}
        onClick={() => setActiveTab('weeklyPlanHome')}
      >
        Wochenbericht ansehen
      </button>
    </div>
  );
}
