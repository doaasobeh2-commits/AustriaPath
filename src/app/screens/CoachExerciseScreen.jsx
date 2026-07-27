import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  exerciseHasSubmission,
  shouldShowSolution,
} from '../../data/utils/weeklyPlanExerciseEvaluation.js';
import {
  getPlanByIndex,
  isCoachV1Plan,
  loadWeeklyPlan,
  saveB1SchreibenSessionBinding,
  saveB1InteractiveSessionBinding,
  saveExerciseDraft,
  saveSchreibenAiCorrection,
  saveWeeklyPlan,
  startExercise,
  submitExerciseResponse,
  updateSchreibenAiCorrectionStatus,
} from '../../data/utils/weeklyPlanCoachState.js';
import {
  fetchSchreibenAiCorrection,
  shouldRequestSchreibenAiCorrection,
} from '../../data/utils/a2SchreibenAiCorrection.js';
import {
  ensureB1SchreibenTrainingSession,
  saveB1SchreibenTrainingMemory,
  shouldRequestB1SchreibenSession,
} from '../../data/utils/b1SchreibenAiCorrection.js';
import {
  beginB1PlanungConversation,
  compileLearnerTranscript,
  buildB1InteractiveTaskSnapshot,
  getB1RecordingLimitMs,
  saveB1InteractiveTrainingMemory,
  shouldRequestB1InteractiveSession,
  startB1InteractiveSession,
} from '../../data/utils/b1InteractiveCoach.js';
import { sendB1InteractiveTurnWithRetry } from '../../data/utils/b1InteractiveTurnRetry.js';
import { formatSchreibenAiError } from '../../data/utils/schreibenAiErrorMessages.js';
import { resolveB1WeeklyPlanModel } from '../../data/weekly-plan/b1/planGeneration.js';
import {
  isB1WeeklyPlanHoerenTask,
  isB1WeeklyPlanSchreibenTask,
  isB1WeeklyPlanBildbeschreibungTask,
  isB1WeeklyPlanInteractiveSpeakingTask,
  isB1WeeklyPlanPlanungTask,
  isB1WeeklyPlanSelbstvorstellungTask,
  resolveCoachExerciseTask,
} from '../../data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import { isB1SchreibenResponseReady } from '../../data/utils/b1SchreibenTaskParser.js';
import { isAufgabeLoesenWeeklyTask } from '../../data/utils/a2AufgabeLoesenRuntime.js';
import { isA2HorenWeeklyTask } from '../../data/utils/a2HorenRuntime.js';
import { isA2LesenWeeklyTask } from '../../data/utils/a2LesenRuntime.js';
import { getExerciseCardSubtitle, getExerciseCardTitle, getExerciseIcon } from '../../data/utils/weeklyPlanLabels.js';
import {
  clearWeeklyPlanHandoff,
  readWeeklyPlanHandoff,
  setWeeklyPlanHandoff,
} from '../../data/utils/weeklyPlanHandoff.js';
import {
  B1ListeningExercisePanel,
  B1SchreibenExercisePanel,
  B1InteractiveSpeakingExercisePanel,
  BildbeschreibungExercisePanel,
  A2SchreibenCoachFeedbackPanel,
  CoachFeedbackPanel,
  ListeningExercisePanel,
  playListeningAudio,
  ReadingExercisePanel,
  SpeakingExercisePanel,
  WritingExercisePanel,
} from './weeklyPlan/CoachExercisePanels.jsx';
import {
  isWeeklyPlanBildbeschreibungTask,
  resolveWeeklyPlanTaskImage,
} from '../../data/utils/weeklyPlanImageAsset.js';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklySecondaryButtonStyle,
  weeklyTipStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';

function buildDraftFromExercise(exercise) {
  return {
    learnerResponse: exercise?.learnerResponse || '',
    selectedAnswers: exercise?.selectedAnswers || {},
    speakingSubmitted: Boolean(exercise?.speakingSubmitted),
    audioPlayed: Boolean(exercise?.audioPlayed),
    b1HoerenClipProgress: exercise?.b1HoerenClipProgress || {
      clip1Played: false,
      clip2Played: false,
    },
    b1InteractiveState: exercise?.b1InteractiveState || {
      dialogue: [],
      coveredPoints: [],
      missingPoints: [],
      turnLoading: false,
      turnRetrying: false,
      pendingCoachResponse: false,
      coachError: '',
      conversationComplete: false,
      planungConversationStarted: false,
    },
    recording: false,
  };
}

export default function CoachExerciseScreen({ setActiveTab, setNavigationContext, setSelectedLevel }) {
  const handoff = useMemo(() => readWeeklyPlanHandoff(), []);
  const planIndex = handoff?.planIndex || 1;
  const slot = handoff?.slot || 1;
  const review = Boolean(handoff?.review);

  const [plan, setPlan] = useState(() => loadWeeklyPlan());
  const [draft, setDraft] = useState(() => {
    const loaded = loadWeeklyPlan();
    const entry = loaded ? getPlanByIndex(loaded, planIndex) : null;
    const exercise = entry?.exercises.find((e) => e.slot === slot);
    return buildDraftFromExercise(exercise);
  });
  const [submitError, setSubmitError] = useState('');
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiError, setAiError] = useState('');

  const planEntry = plan ? getPlanByIndex(plan, planIndex) : null;
  const exercise = planEntry?.exercises.find((e) => e.slot === slot);
  const exercisesInPlan = planEntry?.exercises?.length || 4;
  const task = exercise
    ? resolveCoachExerciseTask(exercise, plan, { planIndex, exerciseSlot: slot })
    : null;
  const isB1HoerenTask = isB1WeeklyPlanHoerenTask(task);
  const isB1SchreibenTask = isB1WeeklyPlanSchreibenTask(task);
  const isB1SchreibenSessionTask = shouldRequestB1SchreibenSession(task);
  const isB1BildbeschreibungTask = isB1WeeklyPlanBildbeschreibungTask(task);
  const isB1InteractiveSpeakingTask = isB1WeeklyPlanInteractiveSpeakingTask(task);
  const isB1InteractiveSessionTask = shouldRequestB1InteractiveSession(task);
  const isBildbeschreibungTask = isWeeklyPlanBildbeschreibungTask(task);
  const taskImage = isBildbeschreibungTask ? resolveWeeklyPlanTaskImage(task) : null;
  const isA2SchreibenTask = shouldRequestSchreibenAiCorrection(task);

  useEffect(() => {
    if (!task || !isAufgabeLoesenWeeklyTask(task)) return;
    setWeeklyPlanHandoff({
      planIndex,
      slot,
      review,
      canonicalTaskId: task.canonicalTaskId,
    });
    setNavigationContext?.({
      canonicalTaskId: task.canonicalTaskId,
      level: 'A2',
    });
    setSelectedLevel?.('A2');
    setActiveTab('speaking');
  }, [task, review, planIndex, slot, setActiveTab, setNavigationContext, setSelectedLevel]);

  useEffect(() => {
    if (!task || !isA2HorenWeeklyTask(task)) return;
    setWeeklyPlanHandoff({
      planIndex,
      slot,
      review,
      canonicalModelId: task.canonicalModelId,
    });
    setNavigationContext?.({
      canonicalModelId: task.canonicalModelId,
      level: 'A2',
    });
    setSelectedLevel?.('A2');
    setActiveTab('horen');
  }, [task, review, planIndex, slot, setActiveTab, setNavigationContext, setSelectedLevel]);

  useEffect(() => {
    if (!task || !isA2LesenWeeklyTask(task)) return;
    setWeeklyPlanHandoff({
      planIndex,
      slot,
      review,
      canonicalModelId: task.canonicalModelId,
    });
    setNavigationContext?.({
      canonicalModelId: task.canonicalModelId,
      level: 'A2',
    });
    setSelectedLevel?.('A2');
    setActiveTab('lesen');
  }, [task, review, planIndex, slot, setActiveTab, setNavigationContext, setSelectedLevel]);

  useEffect(() => {
    if (!plan || !isCoachV1Plan(plan) || !exercise || review || exercise.status === 'completed') {
      return;
    }
    if (exercise.status === 'not_started') {
      const started = startExercise(plan, planIndex, slot);
      if (started.changed) {
        setPlan(started.plan);
        saveWeeklyPlan(started.plan);
      }
    }
  }, [plan, planIndex, slot, exercise, review]);

  const persistDraft = useCallback(
    (nextDraft) => {
      if (!plan || review || exercise?.status === 'completed') return;
      const result = saveExerciseDraft(plan, planIndex, slot, {
        learnerResponse: nextDraft.learnerResponse,
        selectedAnswers: nextDraft.selectedAnswers,
        speakingSubmitted: nextDraft.speakingSubmitted,
        audioPlayed: nextDraft.audioPlayed,
        b1HoerenClipProgress: nextDraft.b1HoerenClipProgress,
        b1InteractiveState: nextDraft.b1InteractiveState,
      });
      if (result.changed) {
        setPlan(result.plan);
        saveWeeklyPlan(result.plan);
      }
    },
    [plan, planIndex, slot, exercise?.status, review]
  );

  useEffect(() => {
    if (review || exercise?.status === 'completed') return undefined;
    const timer = window.setTimeout(() => persistDraft(draft), 400);
    return () => window.clearTimeout(timer);
  }, [draft, persistDraft, review, exercise?.status]);

  useEffect(() => {
    if (!isB1SchreibenSessionTask || review || !exercise || !plan) return undefined;

    let cancelled = false;

    async function bindTrainingSession() {
      if (exercise.b1AiSessionId && exercise.b1WritingSnapshot) return;

      try {
        const model = resolveB1WeeklyPlanModel('schreiben', exercise.taskId);
        const sessionResult = await ensureB1SchreibenTrainingSession({
          exercise,
          plan,
          planIndex,
          slot,
          modelEmails: model?.emails || [],
        });
        if (cancelled) return;

        const writingTask = sessionResult.writingTask || {};
        const binding = saveB1SchreibenSessionBinding(plan, planIndex, slot, {
          sessionId: sessionResult.sessionId,
          selectedEmailIndex: sessionResult.selectedEmailIndex,
          writingSnapshot: {
            selectedEmailIndex: sessionResult.selectedEmailIndex,
            emailTitle: writingTask.emailTitle,
            scenario: writingTask.scenario,
            recipient: writingTask.recipient,
            taskPoints: writingTask.taskPoints || [],
            requiredPoints: writingTask.requiredPoints || [],
            minimumLength: writingTask.minimumLength,
          },
        });
        if (binding.changed) {
          setPlan(binding.plan);
          saveWeeklyPlan(binding.plan);
        }
      } catch {
        // Session start failure must not block local writing/autosave.
      }
    }

    bindTrainingSession();
    return () => {
      cancelled = true;
    };
  }, [
    isB1SchreibenSessionTask,
    exercise?.b1AiSessionId,
    exercise?.b1WritingSnapshot,
    exercise?.taskId,
    plan,
    planIndex,
    slot,
    review,
  ]);

  useEffect(() => {
    if (!isB1InteractiveSessionTask || review || !exercise || !plan) return undefined;

    let cancelled = false;

    async function bindInteractiveSession() {
      if (exercise.b1AiSessionId && exercise.b1TaskSnapshot) return;

      try {
        const sessionResult = await startB1InteractiveSession({
          exercise,
          plan,
          planIndex,
          slot,
          category: exercise.b1Category || 'bildbeschreibung',
        });
        if (cancelled) return;

        const resolvedTask = resolveCoachExerciseTask(exercise, plan, { planIndex, exerciseSlot: slot });
        const taskSnapshot = buildB1InteractiveTaskSnapshot(resolvedTask, sessionResult);
        const binding = saveB1InteractiveSessionBinding(plan, planIndex, slot, {
          sessionId: sessionResult.sessionId,
          taskSnapshot,
        });
        if (binding.changed) {
          setPlan(binding.plan);
          saveWeeklyPlan(binding.plan);
        }
      } catch {
        // Session start failure must not block local exercise UI.
      }
    }

    bindInteractiveSession();
    return () => {
      cancelled = true;
    };
  }, [
    isB1InteractiveSessionTask,
    exercise?.b1AiSessionId,
    exercise?.b1TaskSnapshot,
    exercise?.taskId,
    exercise?.b1Category,
    plan,
    planIndex,
    slot,
    review,
  ]);

  const updateInteractiveState = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      b1InteractiveState: {
        ...prev.b1InteractiveState,
        ...patch,
      },
    }));
    setSubmitError('');
  }, []);

  const handleB1InteractiveTurn = useCallback(
    async (learnerMessage) => {
      const currentExercise = getPlanByIndex(plan, planIndex)?.exercises.find((e) => e.slot === slot);
      const sessionId = currentExercise?.b1AiSessionId;
      if (!sessionId) {
        updateInteractiveState({
          coachError: 'Trainingssitzung nicht verfügbar. Bitte Seite neu laden.',
        });
        return;
      }

      const trimmedMessage = String(learnerMessage || '').trim();
      if (!trimmedMessage) return;

      const priorDialogue = draft.b1InteractiveState?.dialogue || [];
      const hasPendingLearner =
        priorDialogue[priorDialogue.length - 1]?.role === 'learner' &&
        Boolean(draft.b1InteractiveState?.pendingCoachResponse);
      const nextDialogue = hasPendingLearner
        ? priorDialogue
        : [...priorDialogue, { role: 'learner', text: trimmedMessage }];
      const compiledTranscript = compileLearnerTranscript(nextDialogue);

      updateInteractiveState({
        dialogue: nextDialogue,
        turnLoading: true,
        turnRetrying: false,
        pendingCoachResponse: true,
        coachError: '',
      });
      setDraft((prev) => ({
        ...prev,
        learnerResponse: compiledTranscript,
        speakingSubmitted: true,
      }));

      try {
        const turn = await sendB1InteractiveTurnWithRetry(sessionId, trimmedMessage, {
          onRetry: () => {
            updateInteractiveState({
              turnRetrying: true,
              coachError: '',
            });
          },
        });
        const withAssistant = [
          ...nextDialogue,
          { role: 'assistant', text: turn.assistantMessage },
        ];

        updateInteractiveState({
          dialogue: withAssistant,
          coveredPoints: turn.coveredPoints || [],
          missingPoints: turn.missingPoints || [],
          turnLoading: false,
          turnRetrying: false,
          pendingCoachResponse: false,
          coachError: '',
          conversationComplete: Boolean(turn.conversationComplete),
        });
        setDraft((prev) => ({
          ...prev,
          learnerResponse: compileLearnerTranscript(withAssistant),
          speakingSubmitted: true,
        }));
      } catch {
        updateInteractiveState({
          dialogue: nextDialogue,
          turnLoading: false,
          turnRetrying: false,
          pendingCoachResponse: true,
          coachError:
            'Coach-Antwort vorübergehend nicht verfügbar. Ihre Aufnahme ist gespeichert — bitte erneut senden.',
        });
        setDraft((prev) => ({
          ...prev,
          learnerResponse: compiledTranscript,
          speakingSubmitted: true,
        }));
      }
    },
    [plan, planIndex, slot, draft.b1InteractiveState?.dialogue, updateInteractiveState]
  );

  const handleBeginPlanung = useCallback(async () => {
    const currentExercise = getPlanByIndex(plan, planIndex)?.exercises.find((e) => e.slot === slot);
    const sessionId = currentExercise?.b1AiSessionId;
    if (!sessionId) {
      updateInteractiveState({
        coachError: 'Trainingssitzung nicht verfügbar. Bitte Seite neu laden.',
      });
      return;
    }

    try {
      const result = await beginB1PlanungConversation(sessionId);
      updateInteractiveState({
        dialogue: [{ role: 'assistant', text: result.openingMessage }],
        planungConversationStarted: true,
        coachError: '',
      });
    } catch {
      updateInteractiveState({
        coachError: 'Gespräch konnte nicht gestartet werden. Bitte erneut versuchen.',
      });
    }
  }, [plan, planIndex, slot, updateInteractiveState]);

  const runSchreibenAiCorrection = useCallback(
    async (sourcePlan) => {
      if (!task || !isA2SchreibenTask || !exercise) return;
      const currentEntry = getPlanByIndex(sourcePlan, planIndex);
      const currentExercise = currentEntry?.exercises.find((e) => e.slot === slot);
      if (!currentExercise?.submittedAt) return;
      if (currentExercise.aiCorrection?.status === 'ready') {
        setAiStatus('ready');
        return;
      }

      setAiStatus('loading');
      setAiError('');
      const loadingResult = updateSchreibenAiCorrectionStatus(sourcePlan, planIndex, slot, {
        status: 'loading',
      });
      if (loadingResult.changed) {
        setPlan(loadingResult.plan);
        saveWeeklyPlan(loadingResult.plan);
      }

      try {
        const aiCorrection = await fetchSchreibenAiCorrection(
          task,
          currentExercise,
          planIndex,
          slot
        );
        const saved = saveSchreibenAiCorrection(loadingResult.plan, planIndex, slot, aiCorrection);
        if (saved.changed) {
          setPlan(saved.plan);
          saveWeeklyPlan(saved.plan);
        }
        setAiStatus('ready');
      } catch (error) {
        const failed = updateSchreibenAiCorrectionStatus(loadingResult.plan, planIndex, slot, {
          status: 'failed',
          errorMessage: formatSchreibenAiError(error),
        });
        if (failed.changed) {
          setPlan(failed.plan);
          saveWeeklyPlan(failed.plan);
        }
        setAiStatus('failed');
        setAiError(formatSchreibenAiError(error));
      }
    },
    [task, isA2SchreibenTask, exercise, planIndex, slot]
  );

  useEffect(() => {
    if (!isA2SchreibenTask || !exercise?.submittedAt) return;
    const status = exercise.aiCorrection?.status;
    if (status === 'ready') {
      setAiStatus('ready');
      return;
    }
    if (status === 'failed') {
      setAiStatus('failed');
      setAiError(formatSchreibenAiError({ message: exercise.aiCorrection.errorMessage }));
      return;
    }
    if (status === 'loading') {
      setAiStatus('loading');
      return;
    }
    if (!status) {
      runSchreibenAiCorrection(plan);
    }
  }, [
    isA2SchreibenTask,
    exercise?.submittedAt,
    exercise?.aiCorrection?.status,
    exercise?.aiCorrection?.errorMessage,
    plan,
    runSchreibenAiCorrection,
  ]);

  if (!plan || !isCoachV1Plan(plan) || !planEntry || !exercise) {
    return (
      <div style={weeklyPageStyle}>
        <AdminQaBadge />
        <button type="button" style={weeklyBackButtonStyle} onClick={() => setActiveTab('weeklyPlanHome')}>
          ← Zurück
        </button>
        <div style={weeklyCardStyle}>
          <p style={weeklyMutedStyle}>Diese Übung konnte nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  const title = getExerciseCardTitle(task, exercise);
  const icon = getExerciseIcon(task || { coachType: exercise.coachType });
  const isCompleted = exercise.status === 'completed';
  const isReviewMode = review || isCompleted;
  const showSolution = shouldShowSolution(task, exercise.coachType, exercise);
  const coachType = exercise.coachType;

  const remainingOpen = planEntry.exercises.filter((e) => e.status !== 'completed').length;
  const completesPlan = remainingOpen === 1 && !isCompleted;

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSubmitError('');
  };

  const handleAnswerChange = (indexOrId, value) => {
    setDraft((prev) => ({
      ...prev,
      selectedAnswers: { ...prev.selectedAnswers, [String(indexOrId)]: value },
    }));
    setSubmitError('');
  };

  const handleClipProgressChange = (nextProgress) => {
    updateDraft({
      b1HoerenClipProgress: nextProgress,
      audioPlayed: Boolean(nextProgress?.clip1Played && nextProgress?.clip2Played),
    });
  };

  const handlePlayAudio = () => {
    if (!task?.audioText) return;
    playListeningAudio(task.audioText);
    updateDraft({ audioPlayed: true });
  };

  const returnToDashboard = () => {
    clearWeeklyPlanHandoff();
    setWeeklyPlanHandoff({ planIndex, view: 'dashboard' });
    setActiveTab('trainingPlanDashboard');
  };

  const handleBack = () => {
    persistDraft(draft);
    returnToDashboard();
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const result = submitExerciseResponse(plan, planIndex, slot, {
      learnerResponse: draft.learnerResponse,
      selectedAnswers: draft.selectedAnswers,
      speakingSubmitted: draft.speakingSubmitted,
      audioPlayed: draft.audioPlayed,
      b1HoerenClipProgress: draft.b1HoerenClipProgress,
      b1InteractiveState: draft.b1InteractiveState,
    });

    if (!result.changed) {
      setSubmitError(result.error || 'Die Übung konnte nicht abgeschlossen werden.');
      return;
    }

    let nextPlan = result.plan;
    saveWeeklyPlan(nextPlan);
    setPlan(nextPlan);

    if (isB1SchreibenSessionTask) {
      const currentExercise = getPlanByIndex(nextPlan, planIndex)?.exercises.find(
        (e) => e.slot === slot
      );
      try {
        await saveB1SchreibenTrainingMemory(currentExercise, task);
      } catch {
        // Local training memory remains saved even if server sync fails.
      }
      returnToDashboard();
      return;
    }

    if (isB1InteractiveSessionTask) {
      const currentExercise = getPlanByIndex(nextPlan, planIndex)?.exercises.find(
        (e) => e.slot === slot
      );
      try {
        await saveB1InteractiveTrainingMemory(currentExercise, task);
      } catch {
        // Local training memory remains saved even if server sync fails.
      }
      returnToDashboard();
      return;
    }

    if (isA2SchreibenTask) {
      return;
    }

    returnToDashboard();
  };

  const handleRetryAiCorrection = () => {
    setAiError('');
    runSchreibenAiCorrection(plan);
  };

  const renderExerciseBody = () => {
    if (!task) {
      return <p style={weeklyMutedStyle}>Dein Coach erklärt dir gleich die Übung.</p>;
    }

    if (coachType === 'listening' && isB1HoerenTask) {
      return (
        <B1ListeningExercisePanel
          task={task}
          selectedAnswers={isReviewMode ? exercise.selectedAnswers || {} : draft.selectedAnswers}
          onAnswerChange={handleAnswerChange}
          clipProgress={
            isReviewMode
              ? exercise.b1HoerenClipProgress || { clip1Played: true, clip2Played: true }
              : draft.b1HoerenClipProgress
          }
          onClipProgressChange={handleClipProgressChange}
          readOnly={isReviewMode}
        />
      );
    }

    if (coachType === 'listening') {
      return (
        <ListeningExercisePanel
          task={task}
          selectedAnswers={isReviewMode ? exercise.selectedAnswers || {} : draft.selectedAnswers}
          onAnswerChange={handleAnswerChange}
          onPlayAudio={handlePlayAudio}
          audioPlayed={isReviewMode ? exercise.audioPlayed : draft.audioPlayed}
          readOnly={isReviewMode}
        />
      );
    }

    if (coachType === 'reading') {
      return (
        <ReadingExercisePanel
          task={task}
          selectedAnswers={isReviewMode ? exercise.selectedAnswers || {} : draft.selectedAnswers}
          onAnswerChange={handleAnswerChange}
          readOnly={isReviewMode}
        />
      );
    }

    if (coachType === 'grammar' || coachType === 'email') {
      if (isB1SchreibenTask) {
        return (
          <B1SchreibenExercisePanel
            task={task}
            learnerResponse={isReviewMode ? exercise.learnerResponse || '' : draft.learnerResponse}
            onResponseChange={(value) => updateDraft({ learnerResponse: value })}
            readOnly={isReviewMode}
          />
        );
      }

      return (
        <WritingExercisePanel
          task={task}
          learnerResponse={isReviewMode ? exercise.learnerResponse || '' : draft.learnerResponse}
          onResponseChange={(value) => updateDraft({ learnerResponse: value })}
          showExample={!isReviewMode || !exerciseHasSubmission(exercise)}
          readOnly={isReviewMode}
        />
      );
    }

    if (coachType === 'speaking') {
      if (isB1InteractiveSpeakingTask) {
        return (
          <B1InteractiveSpeakingExercisePanel
            task={task}
            image={isB1BildbeschreibungTask ? taskImage : null}
            interactiveState={
              isReviewMode
                ? exercise.b1InteractiveState || { dialogue: [] }
                : draft.b1InteractiveState
            }
            onSendTurn={handleB1InteractiveTurn}
            onBeginPlanung={isB1WeeklyPlanPlanungTask(task) ? handleBeginPlanung : undefined}
            maxRecordingMs={getB1RecordingLimitMs(task)}
            learnerResponse={isReviewMode ? exercise.learnerResponse || '' : draft.learnerResponse}
            onSpeakingSubmitted={(value) => updateDraft({ speakingSubmitted: Boolean(value) })}
            readOnly={isReviewMode}
          />
        );
      }

      if (isBildbeschreibungTask) {
        return (
          <BildbeschreibungExercisePanel
            task={task}
            image={taskImage}
            learnerResponse={isReviewMode ? exercise.learnerResponse || '' : draft.learnerResponse}
            onResponseChange={(value) => updateDraft({ learnerResponse: value })}
            onSpeakingSubmitted={(value) => updateDraft({ speakingSubmitted: Boolean(value) })}
            readOnly={isReviewMode}
          />
        );
      }

      return (
        <SpeakingExercisePanel
          task={task}
          learnerResponse={isReviewMode ? exercise.learnerResponse || '' : draft.learnerResponse}
          onResponseChange={(value) => updateDraft({ learnerResponse: value })}
          recording={draft.recording}
          onStartRecording={() => updateDraft({ recording: true })}
          onStopRecording={() => updateDraft({ recording: false, speakingSubmitted: true })}
          readOnly={isReviewMode}
        />
      );
    }

    return <p style={weeklyMutedStyle}>{getExerciseCardSubtitle(task)}</p>;
  };

  const submitReady =
    isB1SchreibenTask && !isReviewMode
      ? isB1SchreibenResponseReady(draft.learnerResponse, task?.minimumLength)
      : isB1InteractiveSpeakingTask && !isReviewMode
        ? Boolean(
            draft.b1InteractiveState?.conversationComplete &&
              String(draft.learnerResponse || '').trim() &&
              (draft.b1InteractiveState?.dialogue || []).some(
                (entry) => entry.role === 'learner' && String(entry.text || '').trim()
              ) &&
              !draft.b1InteractiveState?.turnLoading &&
              !draft.b1InteractiveState?.turnRetrying
          )
        : true;

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button type="button" style={weeklyBackButtonStyle} onClick={handleBack}>
        ← Zurück
      </button>

      <div style={weeklyHeroStyle}>
        <p style={{ margin: 0, fontSize: '32px' }} aria-hidden="true">
          {icon}
        </p>
        <h1 style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: 800 }}>{title}</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.95 }}>
          Trainingsplan {planIndex} von 7 · Übung {slot} von {exercisesInPlan}
        </p>
      </div>

      <div style={weeklyCardStyle}>
        <h2 style={{ marginTop: 0, fontSize: '18px' }}>Aufgabe</h2>
        {renderExerciseBody()}
      </div>

      <div
        style={{
          ...weeklyCardStyle,
          borderLeft: '3px solid #7c3aed',
          backgroundColor: '#faf5ff',
        }}
      >
        <strong>Dein Coach</strong>
        {isReviewMode && exercise.feedback && isA2SchreibenTask ? (
          <A2SchreibenCoachFeedbackPanel
            feedback={exercise.feedback}
            aiCorrection={exercise.aiCorrection}
            aiStatus={aiStatus}
            aiError={aiError}
            onRetryAi={handleRetryAiCorrection}
            showStaticModelAnswer={aiStatus === 'failed'}
            staticModelAnswer={exercise.feedback?.solution || task?.solution}
          />
        ) : isReviewMode && exercise.feedback && isB1InteractiveSpeakingTask ? (
          <div>
            <p style={weeklyMutedStyle}>{exercise.feedback.summary}</p>
            {exercise.learnerResponse && (
              <>
                <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginBottom: '6px' }}>
                  {isB1WeeklyPlanPlanungTask(task)
                    ? 'Ihre Antworten'
                    : isB1WeeklyPlanSelbstvorstellungTask(task)
                      ? 'Ihre Selbstvorstellung'
                      : 'Ihre Bildbeschreibung'}
                </p>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    margin: 0,
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {exercise.learnerResponse}
                </pre>
                <p style={{ ...weeklyMutedStyle, marginTop: '10px' }}>
                  Feedback erscheint im Tagesbericht nach „Heutiges Training abschließen“.
                </p>
              </>
            )}
          </div>
        ) : isReviewMode && exercise.feedback && isB1SchreibenTask ? (
          <div>
            <p style={weeklyMutedStyle}>{exercise.feedback.summary}</p>
            {exercise.learnerResponse && (
              <>
                <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginBottom: '6px' }}>
                  Dein Original
                </p>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    margin: 0,
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {exercise.learnerResponse}
                </pre>
                <p style={{ ...weeklyMutedStyle, marginTop: '10px' }}>
                  Korrektur und Stichpunkte erscheinen im Tagesbericht nach „Heutiges Training
                  abschließen“.
                </p>
              </>
            )}
          </div>
        ) : isReviewMode && exercise.feedback ? (
          <CoachFeedbackPanel
            feedback={exercise.feedback}
            showSolution={showSolution}
            solution={exercise.feedback?.solution || task?.solution}
          />
        ) : isB1InteractiveSpeakingTask ? (
          <p style={weeklyMutedStyle}>
            Sprechen Sie mit Ihrem Coach. Nach jeder Coach-Frage erscheint eine neue Aufnahme —
            keine Grammatikkorrektur während der Übung.
          </p>
        ) : (
          <p style={weeklyMutedStyle}>
            Bearbeite die Aufgabe in deinem Tempo. Wenn du fertig bist, reiche deine Antwort ein.
          </p>
        )}
      </div>

      {submitError && (
        <div style={{ ...weeklyTipStyle, backgroundColor: '#fef2f2', color: '#b91c1c' }}>{submitError}</div>
      )}

      {!isReviewMode && (!isB1InteractiveSpeakingTask || draft.b1InteractiveState?.conversationComplete) && (
        <button
          type="button"
          style={{
            ...weeklyPrimaryButtonStyle,
            opacity: submitReady ? 1 : 0.55,
            cursor: submitReady ? 'pointer' : 'not-allowed',
          }}
          onClick={handleSubmit}
          disabled={!submitReady}
        >
          {isBildbeschreibungTask || isB1InteractiveSpeakingTask
            ? 'Übung abschließen'
            : completesPlan
              ? 'Antwort einreichen'
              : 'Antwort einreichen'}
        </button>
      )}

      {isReviewMode && (
        <button type="button" style={weeklySecondaryButtonStyle} onClick={handleBack}>
          Zurück zum Trainingsplan
        </button>
      )}

      <div style={weeklyTipStyle}>
        Dein Fortschritt wird automatisch gespeichert, auch wenn du die Übung wechselst.
      </div>
    </div>
  );
}
