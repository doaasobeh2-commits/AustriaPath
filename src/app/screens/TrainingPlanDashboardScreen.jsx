import React, { useMemo, useRef, useState } from 'react';
import {
  adminQaUnlockNextTrainingPlan,
  collectTrainingMemoriesForDay,
  countCompletedExercises,
  finishTrainingDay,
  getInProgressExercise,
  getNextTrainingPlanAccess,
  getPlanByIndex,
  getPlanExerciseCount,
  isCoachV1Plan,
  loadWeeklyPlan,
  saveWeeklyPlan,
  startExercise,
  switchExercise,
  syncTrainingPlanDayUnlocks,
} from '../../data/utils/weeklyPlanCoachState.js';
import { buildA2DailyReport, isB1CoachWeeklyPlan } from '../../data/utils/a2CoachDailyReport.js';
import { fetchB1DailyReport } from '../../data/utils/b1SchreibenAiCorrection.js';
import { B1_DAILY_REPORT_COMPLETE_TIMEOUT_MS } from '../../api/b1WeeklyTrainingAiClient.js';
import { isAdminQaMode } from '../../utils/adminQaMode.js';
import { resolveCoachExerciseTask } from '../../data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import {
  exerciseStatusLabel,
  focusName,
  getExerciseCardSubtitle,
  getExerciseCardTitle,
  getExerciseIcon,
} from '../../data/utils/weeklyPlanLabels.js';
import { readWeeklyPlanHandoff, setWeeklyPlanHandoff } from '../../data/utils/weeklyPlanHandoff.js';
import {
  weeklyBackButtonStyle,
  weeklyBadgeDoneStyle,
  weeklyBadgeOpenStyle,
  weeklyBadgeRunningStyle,
  weeklyCardStyle,
  weeklyClickableCardStyle,
  weeklyDotsRowStyle,
  weeklyDotStyle,
  weeklyGhostButtonStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklyProgressBarFillStyle,
  weeklyProgressBarTrackStyle,
  weeklySecondaryButtonStyle,
  weeklySuccessPanelStyle,
  weeklyTipStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';

function ExerciseCard({ exercise, task, onAction, disabled }) {
  const status = exercise.status;
  const badgeStyle =
    status === 'completed'
      ? weeklyBadgeDoneStyle
      : status === 'in_progress'
        ? weeklyBadgeRunningStyle
        : weeklyBadgeOpenStyle;

  let cta = 'Starten';
  let buttonStyle = weeklyPrimaryButtonStyle;
  if (status === 'in_progress') {
    cta = 'Fortsetzen';
  } else if (status === 'completed') {
    cta = 'Übung ansehen';
    buttonStyle = weeklyGhostButtonStyle;
  }

  const title = getExerciseCardTitle(task, exercise);
  const subtitle = getExerciseCardSubtitle(task);
  const icon = getExerciseIcon(task || { coachType: exercise.coachType });

  const handleCardClick = (event) => {
    if (disabled) return;
    if (event.target.closest('button')) return;
    onAction(exercise);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onAction(exercise);
        }
      }}
      style={weeklyClickableCardStyle(disabled)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }} aria-hidden="true">
            {icon}
          </span>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800 }}>{title}</h3>
            <p style={{ ...weeklyMutedStyle, margin: 0, fontSize: '14px' }}>{subtitle}</p>
          </div>
        </div>
        <span style={badgeStyle}>{exerciseStatusLabel(status)}</span>
      </div>
      <button
        type="button"
        style={{ ...buttonStyle, marginTop: '12px' }}
        disabled={disabled}
        onClick={() => onAction(exercise)}
      >
        {cta}
      </button>
    </div>
  );
}

export default function TrainingPlanDashboardScreen({ setActiveTab }) {
  const [conflict, setConflict] = useState(null);
  const [finishError, setFinishError] = useState('');
  const [finishLoading, setFinishLoading] = useState(false);
  const finishInFlightRef = useRef(false);
  const finishSafetyTimerRef = useRef(null);
  const [planState, setPlanState] = useState(() => {
    const loaded = loadWeeklyPlan();
    return loaded ? syncTrainingPlanDayUnlocks(loaded) : null;
  });

  const { planIndex, planEntry } = useMemo(() => {
    const handoff = readWeeklyPlanHandoff();
    const idx =
      handoff?.view === 'dashboard' && handoff?.planIndex
        ? handoff.planIndex
        : planState?.currentPlanIndex || 1;
    return {
      planIndex: idx,
      planEntry: planState ? getPlanByIndex(planState, idx) : null,
    };
  }, [planState]);

  const plan = planState;

  if (!plan || !isCoachV1Plan(plan) || !planEntry) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <p style={weeklyMutedStyle}>Dieser Trainingsplan konnte nicht geladen werden.</p>
          <button type="button" style={weeklyPrimaryButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
            Zum Wochenplan
          </button>
        </div>
      </div>
    );
  }

  if (planEntry.status === 'locked') {
    const waitingMessage =
      planEntry.availableFrom && Date.now() < new Date(planEntry.availableFrom).getTime()
        ? 'Der nächste Trainingsplan ist morgen verfügbar.'
        : `Trainingsplan ${planIndex} wird freigeschaltet, sobald der vorherige Plan abgeschlossen ist.`;
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <p style={weeklyMutedStyle}>{waitingMessage}</p>
        </div>
      </div>
    );
  }

  const doneCount = countCompletedExercises(planEntry);
  const exerciseTotal = getPlanExerciseCount(planEntry);
  const allDone = doneCount >= exerciseTotal;
  const hasDailyReport = Boolean(
    planEntry.dailyReport &&
      (planEntry.dailyReport.summary ||
        planEntry.dailyReport.overallPerformance ||
        planEntry.dailyReport.exercises?.length)
  );
  const readyToFinish = planEntry.status === 'ready_to_finish' && !hasDailyReport;
  const inProgress = getInProgressExercise(planEntry);
  const isReview = planEntry.status === 'completed' || hasDailyReport;
  const isLastPlan = planIndex >= plan.totalPlans;
  const nextPlanAccess = isReview && !isLastPlan ? getNextTrainingPlanAccess(plan, planIndex) : null;
  const canOpenNextPlan = Boolean(nextPlanAccess?.canOpen);
  const nextPlanMessage = nextPlanAccess?.message || '';

  const focusSkills = planEntry.exercises
    .map((ex) => resolveCoachExerciseTask(ex, plan)?.skill)
    .filter(Boolean)
    .map((s) => focusName(s));
  const focusUnique = [...new Set(focusSkills)].slice(0, 3);
  const focusLine =
    focusUnique.length >= 2
      ? `In diesem Trainingsplan konzentrieren wir uns auf ${focusUnique.slice(0, -1).join(', ')} und ${focusUnique[focusUnique.length - 1]}.`
      : focusUnique.length === 1
        ? `In diesem Trainingsplan konzentrieren wir uns auf ${focusUnique[0]}.`
        : null;

  const navigateToExercise = (exercise, review = false) => {
    setWeeklyPlanHandoff({ planIndex, slot: exercise.slot, review });
    setActiveTab('coachExercise');
  };

  const openExercise = (exercise, review = false) => {
    if (review || exercise.status === 'completed') {
      navigateToExercise(exercise, true);
      return;
    }

    if (
      inProgress &&
      inProgress.slot !== exercise.slot &&
      exercise.status !== 'in_progress'
    ) {
      setConflict({
        currentSlot: inProgress.slot,
        target: exercise,
      });
      return;
    }

    let nextPlan = plan;
    if (exercise.status === 'not_started') {
      const result = startExercise(plan, planIndex, exercise.slot);
      nextPlan = result.plan;
      saveWeeklyPlan(nextPlan);
      setPlanState(nextPlan);
    }

    navigateToExercise(exercise, false);
  };

  const resolveConflictGoBack = () => {
    if (!conflict) return;
    setConflict(null);
    openExercise({ slot: conflict.currentSlot, status: 'in_progress' }, false);
  };

  const resolveConflictSwitch = () => {
    if (!conflict) return;
    const target = conflict.target;
    setConflict(null);
    const result = switchExercise(plan, planIndex, conflict.currentSlot, target.slot);
    saveWeeklyPlan(result.plan);
    setPlanState(result.plan);
    navigateToExercise(target, false);
  };

  const clearFinishSafetyTimer = () => {
    if (finishSafetyTimerRef.current) {
      clearTimeout(finishSafetyTimerRef.current);
      finishSafetyTimerRef.current = null;
    }
  };

  const handleFinishTrainingDay = async () => {
    if (finishInFlightRef.current || finishLoading) return;

    finishInFlightRef.current = true;
    setFinishError('');
    setFinishLoading(true);
    clearFinishSafetyTimer();
    finishSafetyTimerRef.current = setTimeout(() => {
      finishInFlightRef.current = false;
      setFinishLoading(false);
      setFinishError('Der Tagesbericht hat zu lange gedauert. Bitte erneut versuchen.');
    }, B1_DAILY_REPORT_COMPLETE_TIMEOUT_MS + 5_000);

    try {
      const trainingMemories = collectTrainingMemoriesForDay(plan, planIndex);
      if (!trainingMemories.length) {
        setFinishError(
          'Es fehlen Trainingsdaten für den Tagesbericht. Bitte schließe alle Übungen erneut ab.'
        );
        return;
      }

      const dailyReport = isB1CoachWeeklyPlan(plan)
        ? await fetchB1DailyReport(plan, planIndex, trainingMemories)
        : buildA2DailyReport(plan, planIndex, trainingMemories);
      const result = finishTrainingDay(plan, planIndex, dailyReport);
      if (!result.changed) {
        setFinishError(result.error || 'Das Training konnte nicht abgeschlossen werden.');
        return;
      }
      setPlanState(result.plan);
      saveWeeklyPlan(result.plan);
    } catch (error) {
      setFinishError(
        error?.message?.includes('KI-Antwort')
          ? 'Der Tagesbericht konnte gerade nicht erstellt werden. Bitte erneut versuchen.'
          : error?.message || 'Der Tagesbericht konnte nicht erstellt werden. Bitte erneut versuchen.'
      );
    } finally {
      clearFinishSafetyTimer();
      finishInFlightRef.current = false;
      setFinishLoading(false);
    }
  };

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
        ← Zurück zum Wochenplan
      </button>

      <div style={weeklyHeroStyle}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, opacity: 0.9, letterSpacing: '0.02em' }}>
          KI-Wochenplan
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800 }}>
          Trainingsplan {planIndex} von 7
        </h1>
        <p style={{ margin: '8px 0 0' }}>
          {doneCount} von {exerciseTotal} Übungen erledigt
        </p>
        <div style={{ ...weeklyProgressBarTrackStyle, backgroundColor: 'rgba(255,255,255,0.35)' }}>
          <div
            style={{
              ...weeklyProgressBarFillStyle,
              backgroundColor: '#ffffff',
              width: `${Math.round((doneCount / exerciseTotal) * 100)}%`,
            }}
          />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '14px', opacity: 0.95 }}>
          {exerciseTotal} Übungen · freie Reihenfolge
        </p>
        <div style={weeklyDotsRowStyle}>
          {planEntry.exercises
            .slice()
            .sort((a, b) => a.slot - b.slot)
            .map((exercise) => (
              <span
                key={exercise.slot}
                style={weeklyDotStyle(exercise.status === 'completed')}
              />
            ))}
        </div>
      </div>

      {focusLine && <p style={weeklyMutedStyle}>{focusLine}</p>}

      {conflict && (
        <div style={weeklyTipStyle}>
          Du hast bereits eine begonnene Übung.
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="button" style={weeklyPrimaryButtonStyle} onClick={resolveConflictGoBack}>
              Zur aktuellen Übung
            </button>
            <button type="button" style={weeklySecondaryButtonStyle} onClick={resolveConflictSwitch}>
              Diese Übung beginnen
            </button>
          </div>
        </div>
      )}

      {readyToFinish && (
        <div style={weeklySuccessPanelStyle}>
          <h2 style={{ marginTop: 0, fontSize: '20px' }}>Alle Übungen erledigt</h2>
          <p style={{ margin: '0 0 12px' }}>
            Sehr gut. Du hast alle {exerciseTotal} Übungen abgeschlossen. Schließe jetzt dein
            heutiges Training ab, um deinen Tagesbericht zu erhalten.
          </p>
          {finishError && (
            <p style={{ ...weeklyMutedStyle, color: '#b91c1c', marginBottom: '12px' }}>{finishError}</p>
          )}
          <button
            type="button"
            style={{
              ...weeklyPrimaryButtonStyle,
              opacity: finishLoading ? 0.7 : 1,
              cursor: finishLoading ? 'wait' : 'pointer',
            }}
            disabled={finishLoading}
            onClick={handleFinishTrainingDay}
          >
            {finishLoading ? 'Tagesbericht wird erstellt …' : 'Gesamtes Training senden'}
          </button>
        </div>
      )}

      {isReview && (
        <div style={weeklySuccessPanelStyle}>
          <h2 style={{ marginTop: 0, fontSize: '20px' }}>Trainingsplan abgeschlossen</h2>
          <p style={{ margin: '0 0 12px' }}>
            Dein Tagesbericht für Trainingsplan {planIndex} ist bereit.
          </p>
          {planEntry.dailyReport?.summary && (
            <p style={{ ...weeklyMutedStyle, marginBottom: '12px' }}>{planEntry.dailyReport.summary}</p>
          )}
          {planEntry.dailyReport?.overallPerformance && (
            <p style={{ ...weeklyMutedStyle, marginBottom: '12px' }}>
              <strong>Gesamtleistung:</strong> {planEntry.dailyReport.overallPerformance}
            </p>
          )}
          {(planEntry.dailyReport?.strongestSkill || planEntry.dailyReport?.weakestSkill) && (
            <p style={{ ...weeklyMutedStyle, marginBottom: '12px' }}>
              <strong>Stärkste Fähigkeit:</strong> {planEntry.dailyReport.strongestSkill || '—'}
              <br />
              <strong>Schwächste Fähigkeit:</strong> {planEntry.dailyReport.weakestSkill || '—'}
            </p>
          )}
          {Array.isArray(planEntry.dailyReport?.tomorrowPriorities) &&
            planEntry.dailyReport.tomorrowPriorities.length > 0 && (
              <>
                <strong>Prioritäten für morgen:</strong>
                <ul style={{ margin: '8px 0 12px', paddingLeft: '18px' }}>
                  {planEntry.dailyReport.tomorrowPriorities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          {planEntry.dailyReport?.writing?.originalText && (
            <>
              <strong>Dein Original (E-Mail)</strong>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: '8px 0 12px',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                {planEntry.dailyReport.writing.originalText}
              </pre>
            </>
          )}
          {planEntry.dailyReport?.writing?.correctedText && (
            <>
              <strong>Korrigierte Version (E-Mail)</strong>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  margin: '8px 0 12px',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                {planEntry.dailyReport.writing.correctedText}
              </pre>
            </>
          )}
          {Array.isArray(planEntry.dailyReport?.exercises) &&
            planEntry.dailyReport.exercises.map((entry) => (
              <div key={`${entry.category}-${entry.title}`} style={{ marginBottom: '16px' }}>
                <strong>{entry.title || entry.category}</strong>
                {entry.originalText && (
                  <>
                    <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '8px 0 4px' }}>
                      Ihr Original
                    </p>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        margin: '0 0 8px',
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {entry.originalText}
                    </pre>
                  </>
                )}
                {entry.correctedText && (
                  <>
                    <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 4px' }}>
                      Korrigierte Version (nur Grammatik/Rechtschreibung)
                    </p>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        margin: '0 0 8px',
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {entry.correctedText}
                    </pre>
                  </>
                )}
                {entry.coveredPoints?.length > 0 && (
                  <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>
                    {entry.coveredPoints.map((point) => (
                      <li key={point.id || point.text} style={{ color: '#166534' }}>
                        ✅ {point.text || point}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.missingPoints?.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                    {entry.missingPoints.map((point) => (
                      <li key={point.id || point.text} style={{ color: '#9a3412' }}>
                        ❌ {point.text || point}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.feedback && (
                  <p style={{ ...weeklyMutedStyle, margin: '8px 0 0' }}>
                    <strong>Kurzfeedback:</strong> {entry.feedback}
                  </p>
                )}
                {entry.cefrPerformance && (
                  <p style={{ ...weeklyMutedStyle, margin: '4px 0 0' }}>
                    <strong>Geschätzte Leistung:</strong> {entry.cefrPerformance}
                  </p>
                )}
              </div>
            ))}
          {planEntry.dailyReport?.repeatedGrammarPatterns?.encouragement && (
            <div style={{ marginTop: '16px' }}>
              <strong>Repeated Grammar Patterns</strong>
              {Array.isArray(planEntry.dailyReport.repeatedGrammarPatterns.items) &&
                planEntry.dailyReport.repeatedGrammarPatterns.items.length > 0 && (
                  <ul style={{ margin: '8px 0', paddingLeft: '18px' }}>
                    {planEntry.dailyReport.repeatedGrammarPatterns.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              <p style={{ ...weeklyMutedStyle, margin: '8px 0 0' }}>
                {planEntry.dailyReport.repeatedGrammarPatterns.encouragement}
              </p>
            </div>
          )}
          {planEntry.planSummary?.improved?.length > 0 && (
            <>
              <strong>Das ist dir gut gelungen:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '18px' }}>
                {planEntry.planSummary.improved.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          )}
          {planEntry.planSummary?.practice?.length > 0 && (
            <>
              <strong>Daran arbeiten wir weiter:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
                {planEntry.planSummary.practice.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          )}
          {!isLastPlan ? (
            <>
              {nextPlanMessage && (
                <p style={{ ...weeklyMutedStyle, margin: '0 0 10px', color: '#0f172a' }}>
                  {nextPlanMessage}
                </p>
              )}
              <button
                type="button"
                style={{
                  ...weeklyPrimaryButtonStyle,
                  marginTop: '14px',
                  opacity: canOpenNextPlan ? 1 : 0.55,
                  cursor: canOpenNextPlan ? 'pointer' : 'not-allowed',
                }}
                disabled={!canOpenNextPlan}
                onClick={() => {
                  if (!canOpenNextPlan || !nextPlanAccess) return;
                  setWeeklyPlanHandoff({
                    planIndex: nextPlanAccess.nextIndex,
                    view: 'dashboard',
                  });
                  setActiveTab('trainingPlanDashboard');
                }}
              >
                Zum nächsten Trainingsplan
              </button>
              {isAdminQaMode() && !canOpenNextPlan && (
                <button
                  type="button"
                  style={{ ...weeklySecondaryButtonStyle, marginTop: '10px' }}
                  onClick={() => {
                    const result = adminQaUnlockNextTrainingPlan(plan, planIndex);
                    if (result.changed) {
                      saveWeeklyPlan(result.plan);
                      setPlanState(result.plan);
                      setWeeklyPlanHandoff({
                        planIndex: planIndex + 1,
                        view: 'dashboard',
                      });
                      setActiveTab('trainingPlanDashboard');
                    }
                  }}
                >
                  Admin QA: Nächsten Plan sofort öffnen
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              style={{ ...weeklyPrimaryButtonStyle, marginTop: '14px' }}
              onClick={() => setActiveTab('weeklyCompletion')}
            >
              Wochenbericht ansehen
            </button>
          )}
        </div>
      )}

      {isReview && !allDone && (
        <div style={weeklyTipStyle}>
          Dieser Trainingsplan ist abgeschlossen. Du kannst deine Korrekturen jederzeit ansehen.
        </div>
      )}

      {planEntry.exercises
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((exercise) => (
          <ExerciseCard
            key={exercise.slot}
            exercise={exercise}
            task={resolveCoachExerciseTask(exercise, plan)}
            disabled={false}
            onAction={(ex) => openExercise(ex, ex.status === 'completed')}
          />
        ))}

      {!allDone && (
        <div style={weeklyTipStyle}>Du kannst die Übungen in beliebiger Reihenfolge machen.</div>
      )}
    </div>
  );
}
