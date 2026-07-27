import React, { useMemo } from 'react';
import {
  countCompletedExercises,
  countCompletedPlans,
  getCurrentPlan,
  getPlanByIndex,
  getPlanExerciseCount,
  getTrainingCta,
  isCoachV1Plan,
  isLegacyWeeklyPlan,
  loadWeeklyPlan,
  remainingPlans,
} from '../../data/utils/weeklyPlanCoachState.js';
import { resolveCoachExerciseTask } from '../../data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import { focusName } from '../../data/utils/weeklyPlanLabels.js';
import { setWeeklyPlanHandoff } from '../../data/utils/weeklyPlanHandoff.js';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyDotsRowStyle,
  weeklyDotStyle,
  weeklyEmphasisCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPlanStripStyle,
  weeklyPrimaryButtonStyle,
  weeklyProgressBarFillStyle,
  weeklyProgressBarTrackStyle,
  weeklySecondaryButtonStyle,
  weeklySectionTitleStyle,
  weeklyTipStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';

function PlanChip({ plan, isCurrent, onSelect }) {
  const done = plan.status === 'completed';
  const locked = plan.status === 'locked';
  const active = isCurrent && !done && !locked;

  const bg = done ? '#dcfce7' : active ? '#2563eb' : locked ? '#e2e8f0' : '#eff6ff';
  const color = done ? '#166534' : active ? '#ffffff' : locked ? '#94a3b8' : '#1d4ed8';
  const border = active ? '2px solid #1d4ed8' : done ? '1px solid #86efac' : '1px solid #e2e8f0';

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect?.(plan.planIndex)}
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        border,
        backgroundColor: bg,
        color,
        fontWeight: '800',
        fontSize: '15px',
        cursor: locked ? 'default' : 'pointer',
        flexShrink: 0,
      }}
      aria-label={`Trainingsplan ${plan.planIndex}`}
    >
      {plan.planIndex}
    </button>
  );
}

function buildCoachFocusMessage(planEntry, plan) {
  const skills = planEntry.exercises
    .map((ex) => resolveCoachExerciseTask(ex, plan)?.skill)
    .filter(Boolean)
    .map((s) => focusName(s));
  const unique = [...new Set(skills)].slice(0, 3);
  if (unique.length === 0) {
    return 'In diesem Trainingsplan übst du vier kurze Aufgaben mit deinem Coach.';
  }
  if (unique.length === 1) {
    return `In diesem Trainingsplan konzentrieren wir uns auf ${unique[0]}.`;
  }
  if (unique.length === 2) {
    return `In diesem Trainingsplan konzentrieren wir uns auf ${unique[0]} und ${unique[1]}.`;
  }
  return `In diesem Trainingsplan konzentrieren wir uns auf ${unique[0]}, ${unique[1]} und ${unique[2]}.`;
}

export default function WeeklyPlanHomeScreen({ setActiveTab }) {
  const plan = useMemo(() => loadWeeklyPlan(), []);

  if (!plan) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <h1 style={{ marginTop: 0 }}>KI-Wochenplan</h1>
          <p style={weeklyMutedStyle}>Du hast noch keinen Wochenplan.</p>
          <button
            type="button"
            style={weeklyPrimaryButtonStyle}
            onClick={() => setActiveTab('weeklyPlanSetup')}
          >
            Wochenplan aktivieren
          </button>
        </div>
      </div>
    );
  }

  if (isLegacyWeeklyPlan(plan)) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <h1 style={{ marginTop: 0 }}>KI-Wochenplan</h1>
          <p style={weeklyMutedStyle}>
            Dein gespeicherter Wochenplan verwendet ein älteres Format mit Terminen. Bitte
            aktiviere einen neuen Wochenplan, um mit dem neuen Trainingsmodell fortzufahren.
          </p>
          <button
            type="button"
            style={weeklyPrimaryButtonStyle}
            onClick={() => setActiveTab('weeklyPlanSetup')}
          >
            Neuen Wochenplan aktivieren
          </button>
        </div>
      </div>
    );
  }

  if (!isCoachV1Plan(plan)) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <p style={weeklyMutedStyle}>Dein Wochenplan konnte nicht geladen werden.</p>
          <button
            type="button"
            style={weeklyPrimaryButtonStyle}
            onClick={() => setActiveTab('weeklyPlanSetup')}
          >
            Wochenplan aktivieren
          </button>
        </div>
      </div>
    );
  }

  const completed = countCompletedPlans(plan);
  const allDone = completed >= plan.totalPlans;
  const currentPlan = getCurrentPlan(plan);
  const currentIndex = currentPlan?.planIndex || plan.currentPlanIndex || 1;
  const currentPlanEntry = getPlanByIndex(plan, currentIndex);
  const doneInCurrent = currentPlanEntry ? countCompletedExercises(currentPlanEntry) : 0;
  const exerciseTotal = getPlanExerciseCount(currentPlanEntry);

  const trainingCta = getTrainingCta(currentPlanEntry, plan);

  const openDashboard = (planIndex) => {
    setWeeklyPlanHandoff({ planIndex, view: 'dashboard' });
    setActiveTab('trainingPlanDashboard');
  };

  const ctaAction = () => {
    if (trainingCta.tab === 'weeklyCompletion') {
      setActiveTab('weeklyCompletion');
      return;
    }
    openDashboard(trainingCta.planIndex || currentIndex);
  };

  const completedPlansList = plan.plans.filter((p) => p.status === 'completed');

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('profile')}>
        ← Zurück
      </button>

      <div style={weeklyHeroStyle}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>KI-Wochenplan</h1>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
          {allDone
            ? 'Alle 7 Trainingspläne abgeschlossen'
            : `${completed} von 7 Trainingsplänen abgeschlossen`}
        </p>
        {!allDone && remainingPlans(plan) > 0 && (
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
            {remainingPlans(plan) === 1
              ? 'Noch 1 Trainingsplan'
              : `Noch ${remainingPlans(plan)} Trainingspläne`}
          </p>
        )}
        <div style={{ ...weeklyProgressBarTrackStyle, backgroundColor: 'rgba(255,255,255,0.35)' }}>
          <div
            style={{
              ...weeklyProgressBarFillStyle,
              backgroundColor: '#ffffff',
              width: `${Math.round((completed / plan.totalPlans) * 100)}%`,
            }}
          />
        </div>
      </div>

      <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginBottom: '8px' }}>Deine Trainingspläne</p>
      <div style={weeklyPlanStripStyle}>
        {plan.plans.map((p) => (
          <PlanChip
            key={p.planIndex}
            plan={p}
            isCurrent={p.planIndex === currentIndex && !allDone}
            onSelect={(idx) => {
              const entry = getPlanByIndex(plan, idx);
              if (entry?.status !== 'locked') openDashboard(idx);
            }}
          />
        ))}
      </div>

      {!allDone && currentPlanEntry && (
        <div style={weeklyEmphasisCardStyle}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#ede9fe',
              color: '#7c3aed',
              padding: '4px 10px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '12px',
              marginBottom: '8px',
            }}
          >
            AKTUELLER PLAN
          </span>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>
            Trainingsplan {currentPlanEntry.planIndex}
          </h2>
          <p style={{ ...weeklyMutedStyle, margin: 0 }}>
            {currentPlanEntry.status === 'completed'
              ? `Alle ${exerciseTotal} Übungen erledigt`
              : `${doneInCurrent} von ${exerciseTotal} Übungen erledigt`}
          </p>
          <div style={weeklyDotsRowStyle}>
            {currentPlanEntry.exercises
              .slice()
              .sort((a, b) => a.slot - b.slot)
              .map((exercise) => (
                <span
                  key={exercise.slot}
                  style={weeklyDotStyle(exercise.status === 'completed')}
                />
              ))}
          </div>
          <p style={{ ...weeklyMutedStyle, marginTop: '12px' }}>
            {buildCoachFocusMessage(currentPlanEntry, plan)}
          </p>
          <button type="button" style={{ ...weeklyPrimaryButtonStyle, marginTop: '12px' }} onClick={ctaAction}>
            {trainingCta.label}
          </button>
        </div>
      )}

      {allDone && (
        <div style={weeklyEmphasisCardStyle}>
          <h2 style={{ marginTop: 0 }}>Wochenplan abgeschlossen</h2>
          <p style={weeklyMutedStyle}>Alle 7 Trainingspläne · 28 Übungen</p>
          <button
            type="button"
            style={weeklyPrimaryButtonStyle}
            onClick={() => setActiveTab('weeklyCompletion')}
          >
            Wochenbericht ansehen
          </button>
        </div>
      )}

      {completedPlansList.length > 0 && (
        <div style={weeklyCardStyle}>
          <h3 style={weeklySectionTitleStyle}>Abgeschlossene Trainingspläne</h3>
          {completedPlansList.map((p) => (
            <button
              key={p.planIndex}
              type="button"
              style={{
                ...weeklySecondaryButtonStyle,
                textAlign: 'left',
                marginTop: p.planIndex === completedPlansList[0].planIndex ? 0 : 8,
              }}
              onClick={() => openDashboard(p.planIndex)}
            >
              ✓ Trainingsplan {p.planIndex} · Korrekturen ansehen
            </button>
          ))}
        </div>
      )}

      <div style={weeklyTipStyle}>Kein Zeitdruck. Du kannst jederzeit weitermachen.</div>
    </div>
  );
}
