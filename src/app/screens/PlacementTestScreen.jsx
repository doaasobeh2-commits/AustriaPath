import React, { useEffect, useRef, useState } from 'react';
import {
  buildHistoricalPlacementResult,
  bandToPlacementScore,
  getFinalBandFromTurnEvidence,
  getImageStepAfterSelfIntro,
  getPlanningStep,
  getPlacementStartModel,
  getReadingListeningStep,
  resolvePlacementModelFromStep,
  scorePlacementListeningAnswers,
  scoreKeyForModelSkill,
  placementTurnIdempotencyKey,
  isPlacementAnswerTooShortValidationError,
  PLACEMENT_ANSWER_TOO_SHORT_MESSAGE,
  isPlanningEvaluationComplete,
  claimPlacementReportFinalization,
  releasePlacementReportFinalization,
} from '../../data/placementLogic';
import {
  assemblePlacementLearnerProfile,
  applyPolishedLearnerReport,
  buildPlacementReportAiInput,
} from '../../data/utils/placementReport';
import { savePlacementProfile } from '../../data/utils/placementEngine';
import {
  beginPlacementAttempt,
  completePlacementAttempt,
  completePlacementDiagnostic,
  evaluatePlacementTurn,
  getPlacementEntitlement,
  polishPlacementReport,
  syncPlacementDiagnostic,
} from '../../api/repositories/index.js';
import { getPlacementModel } from '../../data/aiPlacementLibrary.js';
import { ApiError } from '../../api/httpClient.js';
import { selectPlacementBildImageSafe } from '../../data/utils/placementImagePool.js';
import { selectPlacementListeningModel } from '../../data/utils/placementListeningPool.js';
import {
  getPlacementPlanningMove,
  getPlacementPlanningPack,
  isPlanningRecordingAllowed,
  selectPlacementPlanningPack,
} from '../../data/placementPlanningPacks.js';
import {
  ADMIN_QA_NOT_EVALUATED,
  isAdminQaMode,
} from '../../utils/adminQaMode.js';
import {
  clearPlacementSession,
  loadPlacementSession,
  recentPlacementContentIds,
  recordCompletedPlacementContent,
  savePlacementSession,
} from '../../utils/placementSession.js';
import { createPlacementDiagnosticRecorder } from '../../data/utils/placementDiagnosticRecorder.js';
import {
  createPlacementRuntimeMonitor,
  PLACEMENT_RUNTIME_CALM_MESSAGE,
} from '../../data/utils/placementRuntimeMonitor.js';

const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const STAGE_SELF = 0;
const STAGE_IMAGE = 1;
const STAGE_LISTEN = 2;
const STAGE_PLAN = 3;
const STAGE_COUNT = 4;

/**
 * Every new Placement attempt always starts from the weak/A2 path. The
 * learner-facing level picker is context only (see UI copy below) — it must
 * never bias the starting model or the routing that runs before any real
 * evidence has been collected. Movement upward happens only through
 * demonstrated performance via the existing adaptive routing functions.
 */
const CONSERVATIVE_START_LEVEL = 'A2';

export default function PlacementTestScreen({ setActiveTab }) {
  const [selectedLevel, setSelectedLevel] = useState('A2');
  const [started, setStarted] = useState(false);
  const [stageIndex, setStageIndex] = useState(STAGE_SELF);
  const [currentModel, setCurrentModel] = useState(null);
  const [result, setResult] = useState(null);
  const [isBuildingReport, setIsBuildingReport] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [resumeChecked, setResumeChecked] = useState(false);

  /** Performance bands per weighted skill key (selbstvorstellung, bildbeschreibung, lesenHoeren, planung) */
  const [skillBands, setSkillBands] = useState({});
  /** Numeric 0–100 from approved band map — scoring only, never shown */
  const [numericScores, setNumericScores] = useState({});
  const [modelsUsed, setModelsUsed] = useState([]);

  const [answerText, setAnswerText] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [controlMessage, setControlMessage] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  const [recognizedDraft, setRecognizedDraft] = useState('');
  const [finalizedTranscript, setFinalizedTranscript] = useState('');
  const [typedFallbackAllowed, setTypedFallbackAllowed] = useState(!SpeechRecognitionCtor);
  const [listeningAnswers, setListeningAnswers] = useState({});
  /** Internal AI evidence per library skill — never shown to learner */
  const [turnEvidence, setTurnEvidence] = useState({});
  /** Session-sticky Bild image — fixed for entire Bildbeschreibung stage */
  const [selectedBildImage, setSelectedBildImage] = useState(null);
  const [bildImageBroken, setBildImageBroken] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState(null);
  /** Adaptive routing evidence: bridge probe status, B1 listening stability, etc. */
  const [routingContext, setRoutingContext] = useState({
    bridgeProbeStatus: null,
    b1ListeningStable: false,
  });
  /** True while the learner must revise a locally rejected too-short answer. */
  const [answerTooShortBlocked, setAnswerTooShortBlocked] = useState(false);
  const [planningMoveId, setPlanningMoveId] = useState(null);
  const [planningPhase, setPlanningPhase] = useState('idle');
  const [planningCountdown, setPlanningCountdown] = useState(15);
  const [planningResponseSeconds, setPlanningResponseSeconds] = useState(0);
  const [runtimeNotice, setRuntimeNotice] = useState(null);
  const recognitionRef = useRef(null);
  const finalReportInFlightRef = useRef(null);
  const listeningAudioRef = useRef(null);
  const transcriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const submitAfterStopRef = useRef(false);
  /** True while the learner wants the mic session open (until explicit stop). */
  const listenIntentRef = useRef(false);
  const hydratingRef = useRef(false);
  /** Planung: defer examiner audio until evaluation UI has cleared. */
  const pendingPlanningMoveRef = useRef(null);
  const diagnosticRecorderRef = useRef(null);
  const runtimeMonitorRef = useRef(null);
  const stageIndexRef = useRef(stageIndex);
  const skillRef = useRef(null);
  const turnEvidenceRef = useRef(turnEvidence);

  useEffect(() => {
    stageIndexRef.current = stageIndex;
  }, [stageIndex]);
  useEffect(() => {
    turnEvidenceRef.current = turnEvidence;
  }, [turnEvidence]);

  const syncDiagnosticSession = (session) => {
    if (!attemptId || isAdminQaMode() || !session) return;
    void syncPlacementDiagnostic({
      attemptId,
      qaMode: false,
      session,
    }).catch(() => {});
  };

  const ensureDiagnosticCapture = (nextAttemptId, startModel) => {
    if (!nextAttemptId || diagnosticRecorderRef.current) return;
    const qaMode = isAdminQaMode();
    runtimeMonitorRef.current = createPlacementRuntimeMonitor({
      getContext: () => ({
        stage: skillRef.current,
        turn: (turnEvidenceRef.current?.[skillRef.current] || []).length,
      }),
      onSync: ({ issue }) => {
        diagnosticRecorderRef.current?.recordIssue(issue);
        syncDiagnosticSession(diagnosticRecorderRef.current?.buildExportBundle());
      },
    });
    diagnosticRecorderRef.current = createPlacementDiagnosticRecorder({
      attemptId: nextAttemptId,
      selectedLevel,
      qaMode,
      onSync: ({ session }) => syncDiagnosticSession(session),
    });
    if (startModel) {
      diagnosticRecorderRef.current.recordStageStart({
        stageIndex: STAGE_SELF,
        skill: 'selbstvorstellung',
        modelId: startModel.id,
        modelLevel: startModel.level,
        difficulty: startModel.difficulty,
        reason: 'conservative A2 start',
      });
    }
  };

  const totalMinutes = 5;
  const skillName = getStudentSkillName(currentModel?.skill);
  const skill = currentModel?.skill;
  skillRef.current = skill;
  const isListeningSkill = skill === 'hoeren';
  const isVoiceSkill =
    skill === 'selbstvorstellung' ||
    skill === 'bildbeschreibung' ||
    skill === 'planung';

  const stopRecognition = () => {
    listenIntentRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setIsListening(false);
  };

  const stopAudio = () => {
    if (listeningAudioRef.current) {
      listeningAudioRef.current.pause();
      listeningAudioRef.current.currentTime = 0;
      listeningAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const playPlanningExaminerMove = (move) => {
    if (!move?.audioUrl || skill !== 'planung') return;
    stopRecognition();
    stopAudio();
    setPlanningPhase('examiner');
    setControlMessage('Der Prüfer spricht …');
    const audio = new Audio(move.audioUrl);
    listeningAudioRef.current = audio;
    audio.addEventListener('ended', () => {
      if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
      setPlanningPhase('responding');
      setPlanningResponseSeconds(move.responseSeconds);
      setControlMessage('Sie können jetzt antworten.');
    }, { once: true });
    audio.addEventListener('error', () => {
      if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
      runtimeMonitorRef.current?.recordIssue({
        type: 'planning_audio_playback_error',
        recoverable: true,
        adminNote: 'Planung examiner audio failed to play.',
      });
      setPlanningPhase('playback-error');
      setControlMessage('Die Prüferfrage konnte nicht abgespielt werden. Bitte tippen Sie auf „Erneut abspielen“.');
    }, { once: true });
    void audio.play().catch(() => {
      if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
      runtimeMonitorRef.current?.recordIssue({
        type: 'planning_audio_playback_error',
        recoverable: true,
        adminNote: 'Planung examiner audio play() rejected.',
      });
      setPlanningPhase('playback-error');
      setControlMessage('Die Prüferfrage konnte nicht abgespielt werden. Bitte tippen Sie auf „Erneut abspielen“.');
    });
  };

  useEffect(() => {
    if (skill !== 'planung' || planningPhase !== 'preparing') return undefined;
    if (planningCountdown <= 0) {
      playPlanningExaminerMove(planningMove);
      return undefined;
    }
    const timer = window.setTimeout(
      () => setPlanningCountdown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [skill, planningPhase, planningCountdown, planningMoveId]);

  useEffect(() => {
    if (isEvaluating || skill !== 'planung' || !pendingPlanningMoveRef.current) return;
    const nextMove = pendingPlanningMoveRef.current;
    pendingPlanningMoveRef.current = null;
    playPlanningExaminerMove(nextMove);
  }, [isEvaluating, skill]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [stageIndex, currentModel?.id]);

  useEffect(() => {
    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }
    setAnswerText('');
    setAnswerSubmitted(false);
    setControlMessage('');
    setIsEvaluating(false);
    setFollowUpCount(0);
    setActiveFollowUp(null);
    setRecognizedDraft('');
    setFinalizedTranscript('');
    setTypedFallbackAllowed(!SpeechRecognitionCtor);
    setListeningAnswers({});
    setRetryAnswer(null);
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    submitAfterStopRef.current = false;
    stopRecognition();
    stopAudio();
  }, [stageIndex, currentModel?.id]);

  useEffect(() => {
    let cancelled = false;
    getPlacementEntitlement()
      .then((entitlement) => {
        if (cancelled || entitlement?.attemptStatus !== 'in_progress' || !entitlement.attemptId) {
          return;
        }
        setAttemptId(entitlement.attemptId);
        const saved = loadPlacementSession(entitlement.attemptId);
        const savedModel = saved?.currentModelId
          ? getPlacementModel(saved.currentModelId) || getPlacementPlanningPack(saved.currentModelId)
          : null;
        if (!saved || !savedModel) return;
        hydratingRef.current = true;
        setSelectedLevel(saved.selectedLevel || 'A2');
        setStageIndex(Number(saved.stageIndex) || STAGE_SELF);
        setCurrentModel(savedModel);
        setSkillBands(saved.skillBands || {});
        setNumericScores(saved.numericScores || {});
        setModelsUsed(saved.modelsUsed || []);
        setTurnEvidence(saved.turnEvidence || {});
        setSelectedBildImage(saved.selectedBildImage || null);
        setBildImageBroken(false);
        setFollowUpCount(Number(saved.followUpCount) || 0);
        setActiveFollowUp(saved.activeFollowUp || null);
        setListeningAnswers(saved.listeningAnswers || {});
        setAnswerSubmitted(Boolean(saved.answerSubmitted));
        setFinalizedTranscript(saved.finalizedTranscript || '');
        setRetryAnswer(saved.retryAnswer || null);
        setRoutingContext(saved.routingContext || { bridgeProbeStatus: null, b1ListeningStable: false });
        setPlanningMoveId(saved.planningMoveId || null);
        setPlanningPhase(
          saved.planningPhase === 'examiner'
            ? 'playback-error'
            : saved.planningPhase === 'evaluating'
              ? 'responding'
              : saved.planningPhase || 'idle'
        );
        setPlanningCountdown(Number(saved.planningCountdown) || 15);
        setPlanningResponseSeconds(Number(saved.planningResponseSeconds) || 0);
        transcriptRef.current = saved.finalizedTranscript || saved.retryAnswer?.text || '';
        setStarted(true);
        setControlMessage('Ihr begonnener Einstufungstest wurde wiederhergestellt.');
      })
      .catch(() => {
        // Fail closed: the server entitlement remains the source of truth.
      })
      .finally(() => {
        if (!cancelled) setResumeChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!resumeChecked || !started || !attemptId) return;
    ensureDiagnosticCapture(attemptId, null);
  }, [resumeChecked, started, attemptId]);

  useEffect(() => {
    if (!resumeChecked || !started || !attemptId || !currentModel?.id) return;
    savePlacementSession(attemptId, {
      selectedLevel,
      stageIndex,
      currentModelId: currentModel.id,
      skillBands,
      numericScores,
      modelsUsed,
      turnEvidence,
      selectedBildImage,
      followUpCount,
      activeFollowUp,
      listeningAnswers,
      answerSubmitted,
      finalizedTranscript,
      retryAnswer,
      routingContext,
      planningMoveId,
      planningPhase,
      planningCountdown,
      planningResponseSeconds,
    });
  }, [
    resumeChecked, started, attemptId, selectedLevel, stageIndex, currentModel,
    skillBands, numericScores, modelsUsed, turnEvidence, selectedBildImage,
    followUpCount, activeFollowUp, listeningAnswers, answerSubmitted,
    finalizedTranscript, retryAnswer, routingContext, planningMoveId, planningPhase,
    planningCountdown, planningResponseSeconds,
  ]);

  useEffect(() => {
    return () => {
      stopRecognition();
      stopAudio();
    };
  }, []);

  const startTest = async () => {
    if (isStarting) return;
    const startModel = getPlacementStartModel(CONSERVATIVE_START_LEVEL);
    if (!startModel) {
      setControlMessage('Placement-Startmodell fehlt.');
      return;
    }
    setIsStarting(true);
    setControlMessage('Freigabe wird geprüft…');
    try {
      const attempt = await beginPlacementAttempt();
      setAttemptId(attempt.attemptId);
      ensureDiagnosticCapture(attempt.attemptId, startModel);
    } catch (error) {
      setControlMessage(
        error instanceof ApiError
          ? error.message
          : 'Placement-Freigabe konnte nicht bestätigt werden.'
      );
      setIsStarting(false);
      return;
    }
    setSkillBands({});
    setNumericScores({});
    setModelsUsed([{ stage: 'selbstvorstellung', modelId: startModel.id }]);
    setTurnEvidence({});
    setSelectedBildImage(null);
    setBildImageBroken(false);
    setStageIndex(STAGE_SELF);
    setCurrentModel(startModel);
    setResult(null);
    setControlMessage('');
    setIsStarting(false);
    setStarted(true);
  };

  const evidenceKey = currentModel?.skill;
  const planningMove = skill === 'planung'
    ? getPlacementPlanningMove(currentModel, planningMoveId)
    : null;
  const currentTurnQuestion =
    activeFollowUp ||
    (skill === 'planung'
      ? planningMove?.text || ''
      : getStudentPrompt(currentModel));

  const finishSkillAndAdvance = async (completedBands, completedScores, completedModels, evidenceSnapshot, options = {}) => {
    if (stageIndex >= STAGE_PLAN) {
      const qaOnly = Boolean(options.qaOnly) || isAdminQaMode();
      const scoredSkills = Object.keys(completedScores || {}).length;

      // Admin QA without full evaluation: show incomplete result — never invent CEFR/scores
      if (qaOnly && scoredSkills < STAGE_COUNT) {
        setResult({
          qaOnly: true,
          level: null,
          date: new Date().toISOString(),
          learnerReport: {
            levelExplanation: ADMIN_QA_NOT_EVALUATED,
            areas: [],
            strengths: [],
            improvements: [],
            recommendations: [],
          },
          studyPlan: [],
          skillBands: completedBands,
        });
        setIsBuildingReport(false);
        return;
      }

      if (!claimPlacementReportFinalization(finalReportInFlightRef, attemptId)) return;

      const historical = buildHistoricalPlacementResult({
        selectedLevel,
        numericScores: completedScores,
        bands: completedBands,
        modelsUsed: completedModels,
      });

      let profile = assemblePlacementLearnerProfile({
        historicalResult: historical,
        turnEvidence: evidenceSnapshot || turnEvidence,
      });

      // Freeze the grounded final snapshot before atomically completing the attempt.
      setIsBuildingReport(true);

      try {
        const ai = await polishPlacementReport(
          {
            ...buildPlacementReportAiInput(profile),
            attemptId,
            idempotencyKey: 'report:final',
          }
        );
        if (ai?.polished) {
          profile = applyPolishedLearnerReport(profile, ai.polished);
        }
      } catch {
        // Fail closed: keep deterministic report; do not alter assessment
      }

      try {
        await completePlacementAttempt(attemptId, profile);
      } catch (error) {
        releasePlacementReportFinalization(finalReportInFlightRef, attemptId);
        setIsBuildingReport(false);
        setControlMessage(
          (error instanceof ApiError
            ? error.message
            : 'Abschluss konnte nicht gespeichert werden.') +
            ' Bitte erneut auf Weiter klicken.'
        );
        return;
      }

      savePlacementProfile(profile);
      recordCompletedPlacementContent({
        attemptId,
        bild: selectedBildImage
          ? `${selectedBildImage.catalogLevel}:${selectedBildImage.catalogId}`
          : null,
        listening: completedModels.find((item) => item.stage === 'lesenHoeren')?.modelId || null,
        planning: completedModels.find((item) => item.stage === 'planung')?.modelId || null,
      });
      if (!qaOnly && diagnosticRecorderRef.current) {
        const bundle = diagnosticRecorderRef.current.finalize({
          finalPlacement: profile,
          learnerReport: profile.learnerReport,
          skillBands: completedBands,
          modelsUsed: completedModels,
          turnEvidence: evidenceSnapshot || turnEvidence,
        });
        void completePlacementDiagnostic({
          attemptId,
          qaMode: false,
          session: bundle,
          labReplay: diagnosticRecorderRef.current.buildLabReplayPayload(),
        }).catch(() => {});
      }
      clearPlacementSession(attemptId);
      setResult(profile);
      setIsBuildingReport(false);
      return;
    }

    const selfBand = completedBands.selbstvorstellung;
    const imageBand = completedBands.bildbeschreibung;
    const listenBand = completedBands.lesenHoeren;

    let nextStep = null;
    if (stageIndex === STAGE_SELF) {
      nextStep = getImageStepAfterSelfIntro(selfBand, CONSERVATIVE_START_LEVEL, routingContext);
    } else if (stageIndex === STAGE_IMAGE) {
      nextStep = getReadingListeningStep(selfBand, imageBand, CONSERVATIVE_START_LEVEL, routingContext);
    } else if (stageIndex === STAGE_LISTEN) {
      nextStep = getPlanningStep({
        selfIntroResult: selfBand,
        imageResult: imageBand,
        lesenHoerenResult: listenBand,
      });
    }

    const nextModel = nextStep
      ? nextStep.skill === 'lesenHoeren'
        ? selectPlacementListeningModel(nextStep, {
            recentIds: recentPlacementContentIds('listening'),
            b1Stable: routingContext.b1ListeningStable,
          })
        : nextStep.skill === 'planung'
          ? selectPlacementPlanningPack(nextStep, {
              recentIds: recentPlacementContentIds('planning'),
            })
          : resolvePlacementModelFromStep(nextStep)
      : null;
    if (!nextModel) {
      runtimeMonitorRef.current?.recordIssue({
        type: 'unavailable_listening_model',
        recoverable: false,
        adminNote: `Could not resolve model for ${nextStep?.skill || 'unknown'} step.`,
        stage: nextStep?.skill || null,
      });
      setControlMessage(
        'Nächstes Placement-Modell konnte nicht aufgelöst werden. Bitte Support kontaktieren.'
      );
      return;
    }

    diagnosticRecorderRef.current?.recordRoutingDecision({
      fromStageIndex: stageIndex,
      fromSkill: skill,
      nextStep,
      nextModelId: nextModel.id,
      routingContext,
      completedBands: {
        selbstvorstellung: selfBand,
        bildbeschreibung: imageBand,
        lesenHoeren: listenBand,
      },
    });

    if (nextStep.skill === 'lesenHoeren') {
      diagnosticRecorderRef.current?.recordListeningSelection({
        step: nextStep,
        modelId: nextModel.id,
        title: nextModel.title,
        difficulty: nextModel.difficulty,
        questionCount: nextModel.listeningQuestions?.length || 0,
      });
    }

    diagnosticRecorderRef.current?.recordStageStart({
      stageIndex: stageIndex + 1,
      skill: nextStep.skill === 'lesenHoeren' ? 'hoeren' : nextStep.skill,
      modelId: nextModel.id,
      modelLevel: nextModel.level,
      difficulty: nextStep.difficulty,
      reason: nextStep.reason,
    });

    if (nextStep.skill === 'bildbeschreibung') {
      const img = await selectPlacementBildImageSafe(nextStep, {
        recentIds: recentPlacementContentIds('bild'),
      });
      if (!img) {
        setControlMessage(
          'Für die Bildbeschreibung konnte kein Bild geladen werden. Bitte später erneut versuchen.'
        );
        return;
      }
      setSelectedBildImage(img);
      setBildImageBroken(false);
    } else {
      setSelectedBildImage(null);
      setBildImageBroken(false);
    }

    setModelsUsed([
      ...completedModels,
      {
        stage: nextStep.skill,
        modelId: nextModel.id,
        requested: nextStep,
        reason: nextStep.reason,
      },
    ]);
    setStageIndex(stageIndex + 1);
    setCurrentModel(nextModel);
    if (nextStep.skill === 'planung') {
      setPlanningMoveId(nextModel.mainMoves[0]?.id || null);
      setPlanningPhase('idle');
      setPlanningCountdown(15);
    }
  };

  const handleWeiter = () => {
    stopRecognition();
    stopAudio();

    if (!currentModel || isEvaluating || isBuildingReport) return;

    const evaluations = turnEvidence[evidenceKey] || [];
    if (skill === 'planung') {
      diagnosticRecorderRef.current?.recordPlanningStageSummary({
        band: getFinalBandFromTurnEvidence(evaluations, { skill }),
        turnCount: evaluations.length,
        evaluations,
      });
    }
    // Always aggregate the full stage; Planung must not let the closing turn dominate.
    const band = getFinalBandFromTurnEvidence(evaluations, { skill });
    const score = bandToPlacementScore(band);
    const qaMode = isAdminQaMode();
    const last = evaluations[evaluations.length - 1];
    if (skill === 'planung' && !isPlanningEvaluationComplete(last)) {
      setControlMessage('Bitte schließen Sie zuerst das Planungsgespräch erfolgreich ab.');
      return;
    }
    const qaSkip =
      qaMode &&
      (!band || score == null || last?.evaluationMethod === 'qa-not-evaluated');

    if (!qaSkip && (!band || score == null)) {
      setControlMessage(
        'Bitte senden Sie zuerst eine ausgewertete Antwort, bevor Sie fortfahren.'
      );
      return;
    }

    if (!qaSkip && last?.needsFollowUp && activeFollowUp) {
      setControlMessage('Bitte beantworten Sie zuerst die Nachfrage.');
      return;
    }

    if (qaSkip) {
      setControlMessage(ADMIN_QA_NOT_EVALUATED);
      finishSkillAndAdvance(skillBands, numericScores, modelsUsed, turnEvidence, {
        qaOnly: true,
      });
      return;
    }

    const scoreKey = scoreKeyForModelSkill(currentModel.skill);
    const completedBands = { ...skillBands, [scoreKey]: band };
    const completedScores = { ...numericScores, [scoreKey]: score };
    setSkillBands(completedBands);
    setNumericScores(completedScores);

    finishSkillAndAdvance(completedBands, completedScores, modelsUsed, turnEvidence);
  };

  const startRecording = () => {
    if (skill === 'planung' && !isPlanningRecordingAllowed({
      phase: planningPhase,
      examinerAudioActive: Boolean(listeningAudioRef.current),
    })) {
      setControlMessage('Bitte warten Sie, bis die Prüferfrage vollständig abgespielt wurde.');
      return;
    }
    setControlMessage('');
    setAnswerTooShortBlocked(false);
    if (!SpeechRecognitionCtor) {
      setTypedFallbackAllowed(true);
      setControlMessage(
        'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte tippen Sie Ihre Antwort (Chrome empfohlen).'
      );
      return;
    }

    stopRecognition();
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    submitAfterStopRef.current = false;
    setRecognizedDraft('');
    setFinalizedTranscript('');
    listenIntentRef.current = true;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'de-AT';
    // Keep listening until the learner clicks stop — continuous=false was ending after ~2–4s
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) {
          finalChunk += result[0]?.transcript || '';
        } else {
          interimChunk += result?.[0]?.transcript || '';
        }
      }
      if (finalChunk.trim()) {
        finalTranscriptRef.current = finalTranscriptRef.current
          ? `${finalTranscriptRef.current} ${finalChunk.trim()}`.trim()
          : finalChunk.trim();
      }
      const next = `${finalTranscriptRef.current} ${interimChunk.trim()}`.trim();
      if (!next) return;
      transcriptRef.current = next;
      setRecognizedDraft(next);
      setAnswerSubmitted(false);
      setControlMessage('');
    };

    recognition.onerror = (event) => {
      const err = String(event?.error || '');
      // Soft / expected events — do not treat as microphone failure
      if (err === 'no-speech' || err === 'aborted') {
        return;
      }
      listenIntentRef.current = false;
      setIsListening(false);
      if (transcriptRef.current) {
        submitAfterStopRef.current = true;
      } else {
        setTypedFallbackAllowed(true);
      }
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setControlMessage(
          'Mikrofonzugriff verweigert. Bitte erlauben oder tippen Sie Ihre Antwort.'
        );
        return;
      }
      if (err === 'network') {
        setControlMessage(
          'Spracherkennung vorübergehend nicht verfügbar. Bitte tippen Sie Ihre Antwort.'
        );
        return;
      }
      setControlMessage(
        'Spracherkennung fehlgeschlagen. Bitte tippen Sie Ihre Antwort.'
      );
    };

    recognition.onend = () => {
      // Chrome often ends the session after a pause; restart while user still wants to record
      if (listenIntentRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          listenIntentRef.current = false;
        }
      }
      setIsListening(false);
      if (submitAfterStopRef.current) {
        submitAfterStopRef.current = false;
        const transcript = transcriptRef.current.trim();
        if (transcript) {
          setFinalizedTranscript(transcript);
          void handleSendAnswer(transcript, 'voice_transcript');
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      setIsListening(true);
      recognition.start();
    } catch {
      listenIntentRef.current = false;
      setIsListening(false);
      setControlMessage('Aufnahme konnte nicht gestartet werden.');
    }
  };

  const stopRecording = () => {
    if (!transcriptRef.current.trim()) {
      setControlMessage(
        'Es wurde noch keine Sprache erkannt. Bitte versuchen Sie es erneut.'
      );
      return;
    }
    submitAfterStopRef.current = true;
    listenIntentRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      submitAfterStopRef.current = false;
      const transcript = transcriptRef.current.trim();
      setIsListening(false);
      setFinalizedTranscript(transcript);
      void handleSendAnswer(transcript, 'voice_transcript');
    }
  };

  const playHoerenAudio = () => {
    setControlMessage('');
    const audioUrl = currentModel?.audioUrl;
    const text = currentModel?.audioText;
    if (!audioUrl && !text) {
      setControlMessage('Kein Hörtext für diese Aufgabe hinterlegt.');
      return;
    }
    if (typeof window === 'undefined') {
      setControlMessage('Audio-Wiedergabe wird in diesem Browser nicht unterstützt.');
      return;
    }
    stopAudio();
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      listeningAudioRef.current = audio;
      audio.addEventListener('ended', () => {
        if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
      }, { once: true });
      audio.addEventListener('error', () => {
        if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
        setControlMessage('Der Hörtext konnte nicht abgespielt werden.');
      }, { once: true });
      void audio.play().catch(() => {
        if (listeningAudioRef.current === audio) listeningAudioRef.current = null;
        setControlMessage('Der Hörtext konnte nicht abgespielt werden.');
      });
      return;
    }
    if (!window.speechSynthesis) {
      setControlMessage('Audio-Wiedergabe wird in diesem Browser nicht unterstützt.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleListeningSubmit = () => {
    if (isEvaluating || answerSubmitted) return;
    const questions = currentModel?.listeningQuestions || [];
    if (!questions.length) {
      setControlMessage('Für diese Höraufgabe fehlen Verständnisfragen.');
      return;
    }
    if (questions.some((question) => !listeningAnswers[question.id])) {
      setControlMessage('Bitte beantworten Sie alle Hörfragen.');
      return;
    }

    const scored = scorePlacementListeningAnswers(currentModel, listeningAnswers);
    if (!scored?.band) {
      setControlMessage('Die Hörantworten konnten nicht ausgewertet werden.');
      return;
    }

    const evaluation = {
      productType: 'placement_test',
      modelId: currentModel.id,
      skill: currentModel.skill,
      modelLevel: currentModel.level,
      band: scored.band,
      coveredTopics: scored.questionResults
        .filter((item) => item.isCorrect)
        .map((item) => item.question),
      missingTopics: scored.questionResults
        .filter((item) => !item.isCorrect)
        .map((item) => item.question),
      needsFollowUp: false,
      followUpQuestion: null,
      followUpSource: null,
      notes: [],
      evaluationMethod: 'placement-listening-objective-v1',
      listeningModel: {
        id: currentModel.id,
        title: currentModel.title || '',
        level: currentModel.level,
        difficulty: currentModel.difficulty,
        audioRef: currentModel.audioRef || null,
      },
      listeningResult: scored,
    };

    setTurnEvidence((prev) => ({
      ...prev,
      [currentModel.skill]: [...(prev[currentModel.skill] || []), evaluation],
    }));
    diagnosticRecorderRef.current?.recordTurn({
      stageIndex,
      skill: currentModel.skill,
      turnIndex: (turnEvidence[currentModel.skill] || []).length,
      examinerQuestionText: 'Hörverstehen — objektive Fragen',
      learnerTranscript: JSON.stringify(listeningAnswers),
      inputMode: 'listening_mcq',
      evaluatorOutput: evaluation,
      semanticCoverage: {
        coveredTopics: evaluation.coveredTopics,
        missingTopics: evaluation.missingTopics,
      },
    });
    if (scored.band === 'strong' || scored.band === 'medium') {
      setRoutingContext((prev) => ({ ...prev, b1ListeningStable: true }));
    }
    setAnswerSubmitted(true);
    setControlMessage('Hörantworten erfasst. Klicken Sie auf Weiter.');
  };

  const handleSendAnswer = async (
    answerOverride = null,
    inputMode = 'typed'
  ) => {
    const text = String(answerOverride ?? answerText ?? '').trim();
    if (!text) {
      setControlMessage('Bitte sprechen oder tippen Sie zuerst eine Antwort.');
      return;
    }
    if (!currentModel?.id) {
      setControlMessage('Bitte sprechen oder tippen Sie zuerst eine Antwort.');
      return;
    }
    if (isEvaluating) {
      runtimeMonitorRef.current?.recordDuplicateRequestPrevented();
      return;
    }

    runtimeMonitorRef.current?.recordSttObservation({ transcript: text, inputMode });
    setRuntimeNotice(null);
    setIsEvaluating(true);
    setAnswerTooShortBlocked(false);
    if (currentModel.skill === 'planung') setPlanningPhase('evaluating');
    setControlMessage('Antwort wird ausgewertet…');
    submitAfterStopRef.current = false;
    stopRecognition();

    try {
      const payload = {
        attemptId,
        idempotencyKey: placementTurnIdempotencyKey({
          stageIndex,
          followUpCount,
          skill: currentModel.skill,
          modelId: currentModel.id,
          moveId: planningMoveId,
        }),
        productType: 'placement_test',
        modelId: currentModel.id,
        answerText: text,
        followUpCount,
        selectedLevel,
        currentQuestion: currentTurnQuestion,
        currentMoveId: currentModel.skill === 'planung' ? planningMoveId : null,
        inputMode,
        conversation: (turnEvidence[evidenceKey] || [])
          .filter((turn) => turn?.transcript)
          .map((turn) => ({
            question: turn.question,
            transcript: turn.transcript,
            inputMode: turn.inputMode,
            moveId: turn.moveId || null,
            // Bounded, closed-vocabulary semantic signals from this turn's own
            // prior evaluation — echoed back so the server can recognize
            // meaning already communicated across turns, even when this
            // turn's regex wording doesn't match. Re-validated server-side.
            coveredTopics: turn.coveredTopics || [],
            selfTopicsConfirmed: turn.selfTopicsConfirmed || [],
            semanticEvidenceConfirmed: turn.semanticEvidenceConfirmed || [],
          })),
      };

      if (currentModel.skill === 'bildbeschreibung') {
        if (!selectedBildImage || bildImageBroken) {
          setControlMessage(
            'Bild fehlt oder konnte nicht geladen werden. Auswertung nicht möglich.'
          );
          return;
        }
        payload.selectedImage = {
          catalogLevel: selectedBildImage.catalogLevel,
          catalogId: selectedBildImage.catalogId,
          imagePath: selectedBildImage.imagePath,
          title: selectedBildImage.title,
          sceneDescription: selectedBildImage.sceneDescription,
        };
      }

      const monitor = runtimeMonitorRef.current;
      const evaluation = monitor
        ? await monitor.withEvaluateRecovery(
            payload.idempotencyKey,
            () => evaluatePlacementTurn(payload)
          )
        : await evaluatePlacementTurn(payload);
      setRetryAnswer(null);
      const turnRecord = {
        ...evaluation,
        question: currentTurnQuestion,
        transcript: text,
        inputMode,
        examinerSignals: evaluation.examinerSignals || null,
        bridgeProbe: evaluation.followUpSource === 'bridgeProbe' || Boolean(evaluation.bridgeProbeDue),
        simplifiedRephraseUsed: Boolean(evaluation.simplifiedRephraseUsed),
        ...(currentModel.skill === 'planung'
          ? {
              moveId: planningMoveId,
              isClosingMove: Boolean(evaluation.planningComplete),
            }
          : {}),
      };

      if (currentModel.skill === 'selbstvorstellung') {
        if (evaluation.bridgeProbeResult === 'confirmed') {
          setRoutingContext((prev) => ({ ...prev, bridgeProbeStatus: 'confirmed' }));
        } else if (evaluation.bridgeProbeResult === 'failed') {
          setRoutingContext((prev) => ({ ...prev, bridgeProbeStatus: 'failed' }));
        } else if (evaluation.bridgeProbeDue) {
          setRoutingContext((prev) => ({ ...prev, bridgeProbeStatus: 'due' }));
        }
      }

      const skillKey = currentModel.skill;
      setTurnEvidence((prev) => ({
        ...prev,
        [skillKey]: [...(prev[skillKey] || []), turnRecord],
      }));
      diagnosticRecorderRef.current?.recordTurn({
        stageIndex,
        skill: skillKey,
        turnIndex: (turnEvidence[skillKey] || []).length,
        examinerQuestionId: evaluation.followUpQuestionId || planningMoveId || null,
        examinerQuestionText: currentTurnQuestion,
        learnerTranscript: text,
        sttConfidence: inputMode === 'typed' ? 'typed_input' : 'browser_stt_unknown',
        inputMode,
        evaluatorOutput: evaluation,
        examinerSignals: evaluation.examinerSignals || null,
        followUpDecision: {
          needsFollowUp: evaluation.needsFollowUp,
          followUpQuestion: evaluation.followUpQuestion,
          followUpSource: evaluation.followUpSource,
          bridgeProbeDue: evaluation.bridgeProbeDue,
          bridgeProbeResult: evaluation.bridgeProbeResult,
        },
        semanticCoverage: {
          coveredTopics: evaluation.coveredTopics,
          missingTopics: evaluation.missingTopics,
          selfTopicsConfirmed: evaluation.selfTopicsConfirmed,
        },
        routingContext,
        moveId: planningMoveId,
      });
      if (evaluation.simplifiedRephraseUsed) {
        runtimeMonitorRef.current?.recordSimplifiedRephraseUsed();
      }
      setRuntimeNotice(null);
      setFinalizedTranscript('');

      setAnswerSubmitted(true);

      if (currentModel.skill === 'planung') {
        if (evaluation.needsFollowUp && evaluation.followUpQuestionId) {
          const nextMove = getPlacementPlanningMove(currentModel, evaluation.followUpQuestionId);
          if (!nextMove) {
            setPlanningPhase('idle');
            setControlMessage('Die nächste geschlossene Prüferfrage ist ungültig. Bitte erneut versuchen.');
          } else {
            setFollowUpCount((c) => c + 1);
            setPlanningMoveId(nextMove.id);
            setActiveFollowUp(null);
            setAnswerText('');
            transcriptRef.current = '';
            finalTranscriptRef.current = '';
            setRecognizedDraft('');
            setFinalizedTranscript('');
            setAnswerSubmitted(false);
            runtimeMonitorRef.current?.recordPrematureAudioPrevented();
            pendingPlanningMoveRef.current = nextMove;
          }
        } else {
          setPlanningPhase('complete');
          setActiveFollowUp(null);
          setControlMessage('Planung abgeschlossen. Klicken Sie auf Weiter.');
        }
      } else if (evaluation.needsFollowUp && evaluation.followUpQuestion) {
        setFollowUpCount((c) => c + 1);
        setActiveFollowUp(evaluation.followUpQuestion);
        setAnswerText('');
        transcriptRef.current = '';
        finalTranscriptRef.current = '';
        setRecognizedDraft('');
        setFinalizedTranscript('');
        setAnswerSubmitted(false);
        setControlMessage('Bitte beantworten Sie die Nachfrage.');
      } else {
        setActiveFollowUp(null);
        setControlMessage('Antwort erfasst. Klicken Sie auf Weiter, um fortzufahren.');
      }
    } catch (err) {
      if (!isAdminQaMode() && isPlacementAnswerTooShortValidationError(err)) {
        runtimeMonitorRef.current?.recordIssue({
          type: 'answer_too_short_validation',
          recoverable: true,
          adminNote: 'Server rejected answer as too short.',
        });
        setRetryAnswer(null);
        setAnswerTooShortBlocked(true);
        setAnswerSubmitted(false);
        if (currentModel.skill === 'planung') setPlanningPhase('responding');
        setControlMessage(PLACEMENT_ANSWER_TOO_SHORT_MESSAGE);
        return;
      }

      if (isAdminQaMode()) {
        const msg =
          err instanceof ApiError
            ? err.message
            : 'Auswertung derzeit nicht verfügbar. Bitte erneut senden.';
        const skillKey = currentModel.skill;
        const qaEvidence = {
          productType: 'placement_test',
          modelId: currentModel.id,
          skill: skillKey,
          band: null,
          coveredTopics: [],
          missingTopics: [],
          needsFollowUp: false,
          followUpQuestion: null,
          followUpSource: null,
          notes: [ADMIN_QA_NOT_EVALUATED],
          evaluationMethod: 'qa-not-evaluated',
          qaOnly: true,
          question: currentTurnQuestion,
          transcript: text,
          inputMode,
        };
        setTurnEvidence((prev) => ({
          ...prev,
          [skillKey]: [...(prev[skillKey] || []), qaEvidence],
        }));
        setAnswerSubmitted(true);
        setActiveFollowUp(null);
        setControlMessage(`${ADMIN_QA_NOT_EVALUATED}. Sie können mit Weiter fortfahren. (${msg})`);
      } else {
        setRetryAnswer({ text, inputMode });
        if (currentModel.skill === 'planung') setPlanningPhase('responding');
        setRuntimeNotice(PLACEMENT_RUNTIME_CALM_MESSAGE);
        setControlMessage('Bitte versuchen Sie die Auswertung erneut.');
        setAnswerSubmitted(false);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (skill !== 'planung' || planningPhase !== 'responding') return undefined;
    if (planningResponseSeconds <= 0) {
      if (isListening && transcriptRef.current.trim()) {
        stopRecording();
      } else if (isListening) {
        stopRecognition();
        setPlanningPhase('response-timeout');
        setControlMessage('Die Antwortzeit ist beendet. Bitte versuchen Sie die Antwort erneut.');
      } else if (answerText.trim()) {
        void handleSendAnswer(answerText, 'typed');
      } else {
        setPlanningPhase('response-timeout');
        setControlMessage('Die Antwortzeit ist beendet. Bitte versuchen Sie die Antwort erneut.');
      }
      return undefined;
    }
    const timer = window.setTimeout(
      () => setPlanningResponseSeconds((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [skill, planningPhase, planningResponseSeconds, isListening, answerText]);

  if (result) {
    const report = result.learnerReport || {};
    const areas = report.areas || [];
    const strengths = report.strengths || [];
    const improvements = report.improvements || [];
    const recommendations = report.recommendations || [];
    const studyPlan = result.studyPlan || report.studyPlan || [];
    const reportTranscripts = report.transcripts || [];

    if (result.qaOnly) {
      return (
        <div style={pageStyle}>
          <h2>Ergebnis Einstufungstest</h2>
          <div style={cardStyle}>
            <h1>QA only</h1>
            <p>{ADMIN_QA_NOT_EVALUATED}</p>
            <p style={smallTextStyle}>
              Kein CEFR-Niveau und keine Bewertung wurden erzeugt. Die Aufgaben-UI wurde für QA
              durchlaufen.
            </p>
          </div>
          <button style={buttonStyle} onClick={startTest}>
            Test starten
          </button>
          <button style={backButtonStyle} onClick={() => setActiveTab('home')}>
            ← Zurück
          </button>
        </div>
      );
    }

    return (
      <div style={pageStyle}>
        <h2>Ergebnis Einstufungstest</h2>

        <div style={cardStyle}>
          <h1>{result.level}</h1>
          <p>{report.levelExplanation}</p>
          <p style={smallTextStyle}>
            Datum: {new Date(result.date).toLocaleDateString()}
            {isBuildingReport ? ' · Bericht wird personalisiert…' : ''}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Ihre Bereiche</h3>
          {areas.map((area) => (
            <div key={area.skill} style={areaBlockStyle}>
              <strong>
                {area.label}: {area.performanceLabel}
              </strong>
              <p style={smallTextStyle}>{area.summary}</p>
              {area.missingTopics?.length ? (
                <p style={smallTextStyle}>
                  Übungsschwerpunkte: {area.missingTopics.slice(0, 4).join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h3>Stärken</h3>
          {strengths.length === 0 ? (
            <p>Noch keine klaren Stärken erkannt.</p>
          ) : (
            strengths.map((item) => (
              <p key={item.skill || item.label}>✅ {item.text || item.label}</p>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h3>Verbesserungspotenzial</h3>
          {improvements.length === 0 ? (
            <p>Keine großen Schwächen erkannt.</p>
          ) : (
            improvements.map((item) => (
              <p key={item.skill || item.label}>⚠️ {item.text || item.label}</p>
            ))
          )}
        </div>

        <div style={cardStyle}>
          <h3>Empfehlungen</h3>
          {recommendations.map((text, i) => (
            <p key={i}>• {text}</p>
          ))}
        </div>

        {reportTranscripts.length ? (
          <div style={cardStyle}>
            <h3>Ihre gesprochenen Antworten</h3>
            {reportTranscripts.map((turn, index) => (
              <div key={`${turn.skill}-${index}`} style={conversationTurnStyle}>
                <strong>{turn.label}</strong>
                {turn.question ? <p style={smallTextStyle}>{turn.question}</p> : null}
                <p>{turn.transcript}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div style={cardStyle}>
          <h3>Persönlicher Lernplan</h3>
          {studyPlan.map((item) => (
            <p key={item.day}>
              <strong>{item.day}:</strong> {item.task}
            </p>
          ))}
        </div>

        <button style={buttonStyle} onClick={() => setActiveTab('weeklyPlanSetup')}>
          Wochenplan starten
        </button>

        <button style={buttonStyle} onClick={() => setActiveTab('profile')}>
          Zum Profil
        </button>

        <button style={backButtonStyle} onClick={() => setActiveTab('home')}>
          Zur Startseite
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={pageStyle}>
        <h2>Einstufungstest</h2>
        <p>Der Test dauert ungefähr {totalMinutes} Minuten.</p>
        <p>Auf welchem Niveau soll der Test beginnen? (nur Kontext — die Bewertung folgt Ihrer Leistung)</p>

        <div style={levelRowStyle}>
          {['A2', 'B1', 'B2'].map((level) => (
            <button
              key={level}
              style={{
                ...levelButtonStyle,
                background: selectedLevel === level ? '#2563eb' : '#e5e7eb',
                color: selectedLevel === level ? 'white' : '#111827',
              }}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>

        {controlMessage ? <p style={smallTextStyle}>{controlMessage}</p> : null}
        <button style={buttonStyle} onClick={startTest} disabled={isStarting || !resumeChecked}>
          {!resumeChecked || isStarting ? 'Freigabe wird geprüft…' : 'Test starten'}
        </button>
      </div>
    );
  }

  if (!currentModel) {
    return (
      <div style={pageStyle}>
        <p>Placement konnte nicht gestartet werden.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <p>
        Schritt {stageIndex + 1} von {STAGE_COUNT} · ca. {totalMinutes} Minuten
      </p>

      <h2>{skillName}</h2>

      <div style={cardStyle}>
        <p>{getStudentPrompt(currentModel)}</p>
        {skill !== 'bildbeschreibung' && currentModel?.studentPreview ? (
          <p style={smallTextStyle}>{currentModel.studentPreview}</p>
        ) : null}

        {skill === 'bildbeschreibung' ? (
          selectedBildImage && !bildImageBroken ? (
            <img
              src={selectedBildImage.imagePath}
              alt="Bild zur Beschreibung"
              style={bildImageStyle}
              onError={() => {
                setBildImageBroken(true);
                setControlMessage(
                  'Bild konnte nicht angezeigt werden. Bitte später erneut versuchen.'
                );
              }}
            />
          ) : (
            <p style={{ ...smallTextStyle, color: '#b45309' }}>
              Bild konnte nicht geladen werden.
            </p>
          )
        ) : null}

        {activeFollowUp && !isEvaluating ? (
          <p style={followUpPromptStyle}>{activeFollowUp}</p>
        ) : null}

        {skill === 'planung' ? (
          <div style={followUpPromptStyle}>
            {planningPhase === 'idle' ? (
              <button
                type="button"
                style={secondaryActionStyle}
                onClick={() => {
                  setPlanningCountdown(15);
                  setPlanningPhase('preparing');
                  setControlMessage('Sie haben 15 Sekunden Vorbereitungszeit.');
                }}
              >
                Planung starten
              </button>
            ) : null}
            {planningPhase === 'preparing' ? <p>Vorbereitung: {planningCountdown} Sekunden</p> : null}
            {planningPhase === 'examiner' ? <p>Prüferfrage wird abgespielt …</p> : null}
            {planningPhase === 'playback-error' ? (
              <button
                type="button"
                style={secondaryActionStyle}
                onClick={() => playPlanningExaminerMove(planningMove)}
              >
                Prüferfrage erneut abspielen
              </button>
            ) : null}
            {['responding', 'evaluating', 'complete'].includes(planningPhase) &&
            currentTurnQuestion &&
            !isEvaluating ? (
              <p>{currentTurnQuestion}</p>
            ) : null}
            {planningPhase === 'responding' ? <p>Verbleibende Antwortzeit: {planningResponseSeconds} Sekunden</p> : null}
            {planningPhase === 'response-timeout' ? (
              <button
                type="button"
                style={secondaryActionStyle}
                onClick={() => {
                  setPlanningResponseSeconds(planningMove?.responseSeconds || 15);
                  setPlanningPhase('responding');
                  setControlMessage('Sie können die Antwort jetzt erneut geben.');
                }}
              >
                Antwort erneut starten
              </button>
            ) : null}
          </div>
        ) : null}

        {isListeningSkill ? (
          <>
            <button type="button" style={secondaryActionStyle} onClick={playHoerenAudio}>
              ▶️ Hörtext abspielen
            </button>
            <div style={listeningQuestionsStyle}>
              {(currentModel.listeningQuestions || []).map((question, questionIndex) => (
                <fieldset key={question.id} style={questionFieldsetStyle}>
                  <legend style={questionLegendStyle}>
                    {questionIndex + 1}. {question.question}
                  </legend>
                  {question.options.map((option) => (
                    <label key={option} style={answerOptionStyle}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={listeningAnswers[question.id] === option}
                        onChange={() => {
                          setListeningAnswers((prev) => ({
                            ...prev,
                            [question.id]: option,
                          }));
                          setControlMessage('');
                        }}
                        disabled={answerSubmitted}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </>
        ) : null}

        {isVoiceSkill && (skill !== 'planung' || planningPhase === 'responding') ? (
          <>
            <div style={voiceRowStyle}>
              {!isListening ? (
                <button
                  type="button"
                  style={recordButtonStyle}
                  onClick={startRecording}
                  disabled={isEvaluating}
                >
                  🎤 Aufnahme starten
                </button>
              ) : (
                <button type="button" style={stopButtonStyle} onClick={stopRecording}>
                  ⏹ Aufnahme stoppen und bestätigen
                </button>
              )}
            </div>

            {recognizedDraft && isListening ? (
              <div style={transcriptStyle} aria-live="polite">
                <strong>Das verstehen wir gerade:</strong>
                <p>{recognizedDraft}</p>
              </div>
            ) : null}

            {finalizedTranscript ? (
              <div style={transcriptStyle}>
                <strong>Das haben wir verstanden:</strong>
                <p>{finalizedTranscript}</p>
              </div>
            ) : null}

            {retryAnswer && !isEvaluating ? (
              <button
                type="button"
                style={secondaryActionStyle}
                onClick={() => handleSendAnswer(retryAnswer.text, retryAnswer.inputMode)}
              >
                Auswertung erneut versuchen
              </button>
            ) : null}

            {(turnEvidence[evidenceKey] || [])
              .filter((turn) => turn?.transcript)
              .map((turn, index) => (
                <div key={`${turn.question}-${index}`} style={conversationTurnStyle}>
                  <strong>{turn.question || `Antwort ${index + 1}`}</strong>
                  <p>
                    <span style={transcriptLabelStyle}>Das haben wir verstanden:</span>{' '}
                    {turn.transcript}
                  </p>
                </div>
              ))}
          </>
        ) : null}

        {isVoiceSkill && typedFallbackAllowed && (skill !== 'planung' || planningPhase === 'responding') ? (
          <>
            {!answerTooShortBlocked ? (
              <p style={fallbackHintStyle}>
                Die Spracherkennung ist nicht verfügbar. Sie können diese Antwort stattdessen tippen.
              </p>
            ) : null}
            <label style={labelStyle}>Ihre getippte Antwort</label>
            <textarea
              style={textareaStyle}
              rows={6}
              value={answerText}
              onChange={(e) => {
                setAnswerText(e.target.value);
                setAnswerSubmitted(false);
                setAnswerTooShortBlocked(false);
              }}
              placeholder="Tippen Sie Ihre Antwort…"
              disabled={isEvaluating}
            />
          </>
        ) : null}

        {answerSubmitted && !activeFollowUp ? (
          <p style={{ ...smallTextStyle, color: '#166534' }}>✓ Antwort gesendet</p>
        ) : null}
        {runtimeNotice ? (
          <div style={runtimeNoticeStyle}>
            <p style={{ margin: 0 }}>{runtimeNotice.de}</p>
            <p style={{ margin: '6px 0 0', direction: 'rtl' }}>{runtimeNotice.ar}</p>
          </div>
        ) : null}
        {controlMessage ? <p style={{ ...smallTextStyle, color: '#b45309' }}>{controlMessage}</p> : null}

        {isVoiceSkill && typedFallbackAllowed && (skill !== 'planung' || planningPhase === 'responding') ? (
          <button
            type="button"
            style={sendButtonStyle}
            onClick={() => handleSendAnswer(null, 'typed')}
            disabled={isEvaluating}
          >
            {isEvaluating ? 'Wird ausgewertet…' : 'Getippte Antwort senden'}
          </button>
        ) : null}

        {isListeningSkill ? (
          <button
            type="button"
            style={sendButtonStyle}
            onClick={handleListeningSubmit}
            disabled={answerSubmitted}
          >
            {answerSubmitted ? 'Hörantworten erfasst' : 'Hörantworten bestätigen'}
          </button>
        ) : null}

        <button
          type="button"
          style={buttonStyle}
          onClick={handleWeiter}
          disabled={isEvaluating || isBuildingReport}
        >
          Weiter
        </button>

        <p style={smallTextStyle}>
          {isListeningSkill
            ? 'Hören Sie den Text und wählen Sie zu jeder Frage eine Antwort.'
            : 'Die Aufnahme wird beim Stoppen automatisch bestätigt und ausgewertet.'}
        </p>
      </div>
    </div>
  );
}

function getStudentSkillName(skill) {
  const names = {
    selbstvorstellung: 'Selbstvorstellung',
    bildbeschreibung: 'Bildbeschreibung',
    hoeren: 'Hören',
    lesenHoeren: 'Hören',
    planung: 'Planung',
    diskussion: 'Diskussion',
    grafikbeschreibung: 'Grafikbeschreibung',
  };

  return names[skill] || 'Einstufungstest';
}

function getStudentPrompt(model) {
  const skill = model?.skill;

  if (skill === 'selbstvorstellung') {
    return 'Stellen Sie sich bitte kurz vor.';
  }

  if (skill === 'bildbeschreibung') {
    if (model?.level === 'B2') {
      return 'Beschreiben Sie das Bild oder die Grafik zusammenhängend und detailliert. Interpretieren Sie die Aussage und nennen Sie mögliche Gründe, Folgen, Vergleiche oder Ihre Meinung.';
    }
    return 'Beschreiben Sie bitte das Bild.';
  }

  if (skill === 'hoeren') {
    return 'Hören Sie bitte den kurzen Text und beantworten Sie danach die Fragen.';
  }

  if (skill === 'planung') {
    return 'Planen Sie bitte gemeinsam mit dem AI Sprachcoach.';
  }

  if (skill === 'diskussion') {
    return 'Sprechen Sie bitte über das Thema und begründen Sie Ihre Meinung.';
  }

  if (skill === 'grafikbeschreibung') {
    return 'Beschreiben Sie bitte die Grafik und nennen Sie wichtige Informationen.';
  }

  return model?.studentPreview || 'Bitte beantworten Sie die Aufgabe.';
}

const pageStyle = {
  padding: 20,
  fontFamily: 'system-ui, sans-serif',
  maxWidth: 720,
  margin: '0 auto',
};

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 16,
  margin: '14px 0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const bildImageStyle = {
  display: 'block',
  width: '100%',
  maxHeight: 360,
  objectFit: 'contain',
  borderRadius: 12,
  margin: '12px 0',
  background: '#f3f4f6',
};

const levelRowStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  margin: '16px 0',
};

const levelButtonStyle = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const buttonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: 14,
  background: '#2563eb',
  color: 'white',
  fontWeight: 700,
  marginTop: 12,
};

const backButtonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: 14,
  background: '#e5e7eb',
  color: '#111827',
  fontWeight: 700,
  marginTop: 12,
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: 14,
  marginTop: 10,
};

const runtimeNoticeStyle = {
  marginTop: 10,
  padding: '12px 14px',
  borderRadius: 12,
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  fontSize: 14,
  lineHeight: 1.45,
};

const areaBlockStyle = {
  marginTop: 12,
  paddingBottom: 10,
  borderBottom: '1px solid #e2e8f0',
};

const followUpPromptStyle = {
  marginTop: 12,
  padding: 12,
  background: '#eff6ff',
  borderRadius: 12,
  color: '#1e3a8a',
  fontWeight: 600,
  lineHeight: 1.45,
};

const transcriptStyle = {
  marginTop: '14px',
  padding: '14px',
  borderRadius: '12px',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1e3a8a',
  lineHeight: 1.55,
};

const conversationTurnStyle = {
  marginTop: '12px',
  padding: '12px 14px',
  borderRadius: '12px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  lineHeight: 1.5,
};

const transcriptLabelStyle = {
  color: '#475569',
  fontWeight: 700,
};

const fallbackHintStyle = {
  marginTop: '14px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: '#fff7ed',
  color: '#9a3412',
  fontWeight: 650,
};

const listeningQuestionsStyle = {
  display: 'grid',
  gap: '14px',
  marginTop: '18px',
};

const questionFieldsetStyle = {
  border: '1px solid #dbeafe',
  borderRadius: '12px',
  padding: '14px',
};

const questionLegendStyle = {
  padding: '0 6px',
  fontWeight: 800,
  color: '#1e3a8a',
};

const answerOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 4px',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  marginTop: 14,
  fontWeight: 700,
};

const textareaStyle = {
  width: '100%',
  marginTop: 8,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: 12,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  lineHeight: 1.5,
  boxSizing: 'border-box',
};

const voiceRowStyle = {
  display: 'flex',
  gap: 10,
  marginTop: 12,
  flexWrap: 'wrap',
};

const recordButtonStyle = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  background: '#7c3aed',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

const stopButtonStyle = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  background: '#dc2626',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryActionStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 12,
  padding: 12,
  background: '#0ea5e9',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: 12,
};

const sendButtonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: 14,
  background: '#16a34a',
  color: 'white',
  fontWeight: 700,
  marginTop: 12,
  cursor: 'pointer',
};
