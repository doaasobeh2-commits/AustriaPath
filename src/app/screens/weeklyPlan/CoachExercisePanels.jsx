import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getA2SchreibenEvaluation } from '../../../data/a2SchreibenEvaluationCatalog.js';
import { isB1SchreibenResponseReady } from '../../../data/utils/b1SchreibenTaskParser.js';
import { B1_BILD_TASK_PROMPT } from '../../../data/utils/b1WeeklyPlanCoachTaskAdapter.js';
import { useWeeklyPlanSpeechRecognition } from '../../hooks/useWeeklyPlanSpeechRecognition.js';
import {
  weeklyAudioButtonStyle,
  weeklyInputStyle,
  weeklyMutedStyle,
  weeklyPrimaryButtonStyle,
  weeklyQuestionBoxStyle,
  weeklyRecordButtonStyle,
  weeklySecondaryButtonStyle,
  weeklyStopButtonStyle,
  weeklyTextareaStyle,
  weeklyTextBoxStyle,
} from './weeklyPlanStyles.js';

const BILD_MAX_RECORDING_MS = 80_000;
const SELBST_MAX_RECORDING_MS = 120_000;

function optionButtonStyle(isSelected, disabled) {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    marginBottom: '8px',
    borderRadius: '10px',
    border: isSelected ? '2px solid #7c3aed' : '1px solid #e2e8f0',
    backgroundColor: isSelected ? '#f5f3ff' : '#fff',
    color: disabled ? '#94a3b8' : '#0f172a',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
  };
}

export function B1ListeningExercisePanel({
  task,
  selectedAnswers,
  onAnswerChange,
  clipProgress,
  onClipProgressChange,
  readOnly = false,
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const parts = task?.parts || [];
  const clip1 = parts[0];
  const clip2 = parts[1];

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const clip1Played = Boolean(clipProgress?.clip1Played);
  const clip2Played = Boolean(clipProgress?.clip2Played);

  const clip1Questions = clip1?.questions || [];
  const clip2Questions = clip2?.questions || [];

  const clip1Answered =
    clip1Questions.length === 2 &&
    clip1Questions.every((question) => String(selectedAnswers[question.id] || '').trim());

  const playClip = useCallback(
    (clip, clipKey) => {
      if (!clip?.audioPath || readOnly) return;
      stopAudio();
      const audio = new Audio(clip.audioPath);
      audioRef.current = audio;
      setAudioPlaying(true);
      audio.onended = () => {
        setAudioPlaying(false);
        audioRef.current = null;
        onClipProgressChange?.({
          ...clipProgress,
          [clipKey]: true,
        });
      };
      audio.onerror = () => {
        setAudioPlaying(false);
        audioRef.current = null;
      };
      audio.play().catch(() => setAudioPlaying(false));
    },
    [clipProgress, onClipProgressChange, readOnly, stopAudio]
  );

  const renderQuestion = (question, questionNumber, disabled) => {
    const selected = String(selectedAnswers[question.id] || '').trim();
    const options = question.options || {};

    return (
      <div key={question.id} style={weeklyQuestionBoxStyle}>
        <strong>
          {questionNumber}. {question.q}
        </strong>
        <div style={{ marginTop: '10px' }}>
          {Object.entries(options).map(([optionId, optionText]) => {
            const isSelected = selected === optionId;
            return (
              <button
                key={optionId}
                type="button"
                style={optionButtonStyle(isSelected, disabled)}
                onClick={() => onAnswerChange(question.id, optionId)}
                disabled={disabled}
              >
                <strong>{optionId}.</strong> {optionText}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const clip1QuestionsDisabled = readOnly || audioPlaying || !clip1Played;
  const clip2PlayDisabled = readOnly || audioPlaying || !clip1Answered;
  const clip2QuestionsDisabled = readOnly || audioPlaying || !clip2Played;

  return (
    <>
      <div style={weeklyQuestionBoxStyle}>
        <strong>Hörteil 1{clip1?.title ? `: ${clip1.title}` : ''}</strong>
        <button
          type="button"
          style={{ ...weeklyAudioButtonStyle, marginTop: '10px' }}
          onClick={() => playClip(clip1, 'clip1Played')}
          disabled={readOnly || audioPlaying}
        >
          🔊 Hörteil 1 abspielen
        </button>
        {clip1Played && (
          <p style={weeklyMutedStyle}>Hörteil 1 wurde abgespielt. Beantworte die beiden Fragen.</p>
        )}
      </div>

      {clip1Questions.map((question, index) =>
        renderQuestion(question, index + 1, clip1QuestionsDisabled)
      )}

      <div style={{ ...weeklyQuestionBoxStyle, marginTop: '16px' }}>
        <strong>Hörteil 2{clip2?.title ? `: ${clip2.title}` : ''}</strong>
        <button
          type="button"
          style={{ ...weeklyAudioButtonStyle, marginTop: '10px' }}
          onClick={() => playClip(clip2, 'clip2Played')}
          disabled={clip2PlayDisabled}
        >
          🔊 Hörteil 2 abspielen
        </button>
        {!clip1Answered && !readOnly && (
          <p style={weeklyMutedStyle}>Beantworte zuerst die Fragen zu Hörteil 1.</p>
        )}
        {clip2Played && (
          <p style={weeklyMutedStyle}>Hörteil 2 wurde abgespielt. Beantworte die beiden Fragen.</p>
        )}
      </div>

      {clip2Questions.map((question, index) =>
        renderQuestion(question, index + 3, clip2QuestionsDisabled)
      )}
    </>
  );
}

export function ListeningExercisePanel({
  task,
  selectedAnswers,
  onAnswerChange,
  onPlayAudio,
  audioPlayed,
  readOnly = false,
}) {
  return (
    <>
      <button type="button" style={weeklyAudioButtonStyle} onClick={onPlayAudio} disabled={readOnly}>
        🔊 Audio abspielen
      </button>
      {audioPlayed && (
        <p style={weeklyMutedStyle}>
          Audio wurde abgespielt. Bitte beantworte die Fragen.
        </p>
      )}

      {task.questions?.map((q, index) => (
        <div key={index} style={weeklyQuestionBoxStyle}>
          <strong>
            {index + 1}. {q.q}
          </strong>
          <input
            type="text"
            style={{ ...weeklyInputStyle, marginTop: '8px' }}
            value={selectedAnswers[String(index)] || selectedAnswers[String(q.id ?? index)] || ''}
            onChange={(e) => onAnswerChange(index, e.target.value)}
            placeholder="Deine Antwort..."
            disabled={readOnly}
          />
        </div>
      ))}
    </>
  );
}

export function ReadingExercisePanel({
  task,
  selectedAnswers,
  onAnswerChange,
  readOnly = false,
}) {
  return (
    <>
      {task.text && <div style={weeklyTextBoxStyle}>{task.text}</div>}
      {task.questions?.map((q, index) => (
        <div key={index} style={weeklyQuestionBoxStyle}>
          <strong>
            {index + 1}. {q.q}
          </strong>
          <input
            type="text"
            style={{ ...weeklyInputStyle, marginTop: '8px' }}
            value={selectedAnswers[String(index)] || selectedAnswers[String(q.id ?? index)] || ''}
            onChange={(e) => onAnswerChange(index, e.target.value)}
            placeholder="Deine Antwort..."
            disabled={readOnly}
          />
        </div>
      ))}
    </>
  );
}

export function B1SchreibenExercisePanel({
  task,
  learnerResponse,
  onResponseChange,
  readOnly = false,
}) {
  const minimumLength = Number(task?.minimumLength) || 80;
  const charCount = String(learnerResponse || '').length;
  const isReady = isB1SchreibenResponseReady(learnerResponse, minimumLength);

  return (
    <>
      {task.emailTitle && (
        <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginTop: 0 }}>{task.emailTitle}</p>
      )}
      <div style={weeklyTextBoxStyle}>
        <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 6px' }}>Situation</p>
        <p style={{ margin: 0 }}>{task.scenario}</p>
      </div>
      <p style={weeklyMutedStyle}>
        <strong>An:</strong> {task.recipient}
      </p>
      {task.taskPoints?.length > 0 && (
        <div style={weeklyQuestionBoxStyle}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 8px' }}>
            Inhaltspunkte (Stichpunkte)
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {task.taskPoints.map((point) => (
              <li key={point} style={{ marginBottom: '4px' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={weeklyQuestionBoxStyle}>
        <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 8px' }}>Ihre E-Mail</p>
        <textarea
          style={{ ...weeklyTextareaStyle, minHeight: '280px', lineHeight: 1.5 }}
          value={learnerResponse}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Schreiben Sie hier Ihre vollständige E-Mail …"
          disabled={readOnly}
          spellCheck={false}
        />
        {!readOnly && (
          <p style={{ ...weeklyMutedStyle, marginTop: '8px', marginBottom: 0 }}>
            {isReady
              ? 'Sie können Ihre E-Mail jetzt einreichen.'
              : `Mindestens ${minimumLength} Zeichen erforderlich (${charCount}/${minimumLength}).`}
          </p>
        )}
      </div>
    </>
  );
}

export function WritingExercisePanel({
  task,
  learnerResponse,
  onResponseChange,
  showExample = true,
  readOnly = false,
}) {
  const schreibenMeta = getA2SchreibenEvaluation(task);

  return (
    <>
      {schreibenMeta ? (
        <>
          <div style={weeklyTextBoxStyle}>
            <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 6px' }}>Situation</p>
            <p style={{ margin: 0 }}>{schreibenMeta.scenario}</p>
          </div>
          <p style={weeklyMutedStyle}>
            <strong>An:</strong> {schreibenMeta.recipient}
          </p>
          {schreibenMeta.context && (
            <p style={weeklyMutedStyle}>
              <strong>Kontext:</strong> {schreibenMeta.context}
            </p>
          )}
          <div style={weeklyQuestionBoxStyle}>
            <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 8px' }}>
              Inhaltspunkte (Stichpunkte)
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {schreibenMeta.taskPoints.map((point) => (
                <li key={point} style={{ marginBottom: '4px' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          {task.task && <p style={weeklyMutedStyle}>{task.task}</p>}
          {showExample && task.example && (
            <p style={{ ...weeklyMutedStyle, fontStyle: 'italic' }}>Beispiel: {task.example}</p>
          )}
        </>
      )}
      <textarea
        style={weeklyTextareaStyle}
        value={learnerResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder={
          schreibenMeta ? 'Schreiben Sie hier Ihre vollständige E-Mail...' : 'Schreibe deine Antwort hier...'
        }
        disabled={readOnly}
      />
    </>
  );
}

export function SpeakingExercisePanel({
  task,
  learnerResponse,
  onResponseChange,
  recording,
  onStartRecording,
  onStopRecording,
  readOnly = false,
}) {
  return (
    <>
      {task.task && <p style={weeklyMutedStyle}>{task.task}</p>}
      {!readOnly && (
        <div style={{ marginTop: '10px' }}>
          {!recording ? (
            <button type="button" style={weeklyRecordButtonStyle} onClick={onStartRecording}>
              🎙️ Aufnahme starten
            </button>
          ) : (
            <button type="button" style={weeklyStopButtonStyle} onClick={onStopRecording}>
              ⏹ Aufnahme stoppen und speichern
            </button>
          )}
        </div>
      )}
      <p style={{ ...weeklyMutedStyle, marginTop: '10px' }}>
        Optional kannst du deine Antwort auch kurz notieren:
      </p>
      <textarea
        style={weeklyTextareaStyle}
        value={learnerResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Kurze Notiz zu deiner Antwort..."
        disabled={readOnly}
      />
    </>
  );
}

const stickyImageWrapStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  marginBottom: '14px',
  paddingBottom: '8px',
  backgroundColor: '#fff',
};

const stickyImageStyle = {
  width: '100%',
  maxHeight: '320px',
  objectFit: 'cover',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
};

const taskPromptStyle = {
  margin: '0 0 12px',
  fontSize: '17px',
  fontWeight: 700,
  color: '#0f172a',
  lineHeight: 1.45,
};

const dialogueBubbleStyle = (role) => ({
  marginBottom: '10px',
  padding: '10px 12px',
  borderRadius: '12px',
  backgroundColor: role === 'assistant' ? '#f5f3ff' : '#f8fafc',
  border: role === 'assistant' ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
});

const recordingBlockStyle = {
  marginTop: '14px',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#fafafa',
};

function formatRecordingLimitLabel(maxDurationMs) {
  const seconds = Math.round(maxDurationMs / 1000);
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return remainder ? `${minutes} Min. ${remainder} Sek.` : `${minutes} Minuten`;
  }
  return `${seconds} Sekunden`;
}

function InteractiveRecordingTurn({
  turnKey,
  maxDurationMs,
  turnLoading,
  turnRetrying = false,
  disabled,
  initialText = '',
  onSend,
}) {
  const [draftText, setDraftText] = useState(initialText);
  const [phase, setPhase] = useState(() => (initialText?.trim() ? 'review' : 'idle'));
  const [showManualFallback, setShowManualFallback] = useState(false);
  const speech = useWeeklyPlanSpeechRecognition({ maxDurationMs });

  useEffect(() => {
    const seed = String(initialText || '').trim();
    setDraftText(seed);
    setPhase(seed ? 'review' : 'idle');
    setShowManualFallback(false);
    if (!seed) {
      speech.resetTranscript();
    }
  }, [turnKey, initialText]);

  const handleStopRecording = () => {
    const stopped = speech.stopRecording();
    if (stopped) {
      setDraftText(speech.transcript.trim());
      setPhase('review');
    }
  };

  const handleSend = async () => {
    const text = String(draftText || speech.transcript || '').trim();
    if (!text || turnLoading || disabled) return;
    await onSend?.(text);
    if (!turnRetrying) {
      setDraftText('');
      setPhase('idle');
      speech.resetTranscript();
    }
  };

  if (disabled) return null;

  const limitLabel = formatRecordingLimitLabel(maxDurationMs);
  const busy = turnLoading || turnRetrying;

  return (
    <div style={recordingBlockStyle}>
      {busy && (
        <p style={{ ...weeklyMutedStyle, fontStyle: 'italic', marginBottom: '10px', color: '#7c3aed' }}>
          {turnRetrying ? 'Antwort wird erneut verarbeitet…' : 'Coach antwortet …'}
        </p>
      )}

      {phase === 'idle' && !speech.isListening && !busy && (
        <button type="button" style={weeklyRecordButtonStyle} onClick={speech.startRecording}>
          🎙️ Aufnahme starten
        </button>
      )}

      {speech.isListening && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ ...weeklyMutedStyle, color: '#b91c1c', fontWeight: 700 }}>
            Aufnahme läuft … (max. {limitLabel})
          </p>
          {speech.recognizedDraft && <p style={liveTranscriptStyle}>{speech.recognizedDraft}</p>}
          <button type="button" style={weeklyStopButtonStyle} onClick={handleStopRecording}>
            ⏹ Aufnahme stoppen
          </button>
        </div>
      )}

      {speech.controlMessage && (
        <p style={{ ...weeklyMutedStyle, color: '#b45309', marginTop: '8px' }}>{speech.controlMessage}</p>
      )}

      {(phase === 'review' || draftText || speech.transcript) && !speech.isListening && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 700 }}>Ihr Transkript:</p>
          <textarea
            style={weeklyTextareaStyle}
            value={draftText || speech.transcript}
            onChange={(e) => {
              speech.setManualTranscript(e.target.value);
              setDraftText(e.target.value);
              setPhase(e.target.value.trim() ? 'review' : 'idle');
            }}
            placeholder="Ihre Antwort erscheint hier nach der Aufnahme …"
            disabled={busy}
            readOnly={false}
          />
          <button
            type="button"
            style={{
              ...weeklyPrimaryButtonStyle,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
            onClick={handleSend}
            disabled={busy || !String(draftText || speech.transcript || '').trim()}
          >
            {busy ? 'Wird gesendet …' : 'Antwort senden'}
          </button>
        </div>
      )}

      {(speech.typedFallbackAllowed || showManualFallback) && !busy && (
        <div style={{ marginTop: '12px' }}>
          {!showManualFallback ? (
            <button
              type="button"
              style={weeklySecondaryButtonStyle}
              onClick={() => setShowManualFallback(true)}
            >
              Manuell tippen (Fallback)
            </button>
          ) : (
            <>
              <textarea
                style={weeklyTextareaStyle}
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  setPhase(e.target.value.trim() ? 'review' : 'idle');
                }}
                placeholder="Ihre Antwort …"
                disabled={busy}
              />
              <button
                type="button"
                style={weeklyPrimaryButtonStyle}
                onClick={handleSend}
                disabled={busy || !draftText.trim()}
              >
                {busy ? 'Wird gesendet …' : 'Antwort senden'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function B1InteractiveSpeakingExercisePanel({
  task,
  image = null,
  interactiveState = {},
  onSendTurn,
  onBeginPlanung,
  maxRecordingMs = BILD_MAX_RECORDING_MS,
  learnerResponse,
  onSpeakingSubmitted,
  readOnly = false,
}) {
  const isPlanung = Boolean(task?.isB1WeeklyPlanPlanungTask);
  const isSelbstvorstellung = Boolean(task?.isB1WeeklyPlanSelbstvorstellungTask);
  const isBild = Boolean(task?.isB1WeeklyPlanBildbeschreibungTask);

  const dialogue = interactiveState.dialogue || [];
  const turnLoading = Boolean(interactiveState.turnLoading);
  const turnRetrying = Boolean(interactiveState.turnRetrying);
  const pendingCoachResponse = Boolean(interactiveState.pendingCoachResponse);
  const coachError = interactiveState.coachError || '';
  const conversationComplete = Boolean(interactiveState.conversationComplete);
  const [planungStarted, setPlanungStarted] = useState(
    () =>
      !isPlanung ||
      dialogue.length > 0 ||
      Boolean(interactiveState.planungConversationStarted)
  );
  const [beginLoading, setBeginLoading] = useState(false);
  const lastSpokenAssistantRef = useRef('');

  const taskPrompt =
    task?.task ||
    (isBild ? B1_BILD_TASK_PROMPT : '') ||
    'Sprechen Sie mit Ihrem Coach.';

  const lastEntry = dialogue[dialogue.length - 1];
  const awaitingLearnerAnswer =
    !readOnly &&
    !conversationComplete &&
    !turnLoading &&
    (isPlanung
      ? planungStarted && (lastEntry?.role === 'assistant' || pendingCoachResponse)
      : dialogue.length === 0 || lastEntry?.role === 'assistant' || pendingCoachResponse);

  const pendingRetryText =
    pendingCoachResponse && lastEntry?.role === 'learner' ? String(lastEntry.text || '') : '';

  const recordingTurnKey = awaitingLearnerAnswer
    ? pendingRetryText
      ? `retry-${dialogue.length}`
      : dialogue.length === 0
        ? 'initial'
        : `after-assistant-${dialogue.length}`
    : null;

  useEffect(() => {
    if (!isPlanung || readOnly) return;
    const lastAssistant = [...dialogue].reverse().find((entry) => entry.role === 'assistant');
    const text = String(lastAssistant?.text || '').trim();
    if (!text || text === lastSpokenAssistantRef.current) return;
    lastSpokenAssistantRef.current = text;
    playPartnerSpeech(text);
  }, [dialogue, isPlanung, readOnly]);

  const handleSendTurn = async (text) => {
    onSpeakingSubmitted?.(true);
    await onSendTurn?.(text);
  };

  const handleStartPlanung = async () => {
    if (beginLoading || planungStarted) return;
    setBeginLoading(true);
    try {
      await onBeginPlanung?.();
      setPlanungStarted(true);
    } finally {
      setBeginLoading(false);
    }
  };

  const renderAssistantQuestions = () => {
    const assistantEntries = dialogue.filter((entry) => entry.role === 'assistant');
    if (!assistantEntries.length) return null;

    return (
      <div style={{ marginBottom: '14px' }}>
        <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginBottom: '8px' }}>
          {isPlanung ? 'Ihr Gesprächspartner' : 'Fragen Ihres Coaches'}
        </p>
        {assistantEntries.map((entry, index) => (
          <div key={`assistant-${index}`} style={dialogueBubbleStyle('assistant')}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#6d28d9' }}>
              {isPlanung ? 'Partner' : 'Frage'}
            </p>
            <p style={{ margin: '6px 0 0' }}>{entry.text}</p>
            {isPlanung && (
              <button
                type="button"
                style={{ ...weeklySecondaryButtonStyle, marginTop: '8px', fontSize: '13px' }}
                onClick={() => playPartnerSpeech(entry.text)}
              >
                🔊 Noch einmal anhören
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderLearnerHistory = () => {
    const learnerEntries = dialogue.filter((entry) => entry.role === 'learner');
    if (!learnerEntries.length || isPlanung) return null;

    return (
      <div style={{ marginBottom: '12px' }}>
        <p style={{ ...weeklyMutedStyle, fontWeight: 700, marginBottom: '6px' }}>Ihre Antworten</p>
        {learnerEntries.map((entry, index) => (
          <p key={`learner-${index}`} style={{ ...weeklyMutedStyle, margin: '0 0 6px' }}>
            {index + 1}. {entry.text}
          </p>
        ))}
      </div>
    );
  };

  const renderPlanungScenario = () => {
    if (!isPlanung) return null;

    return (
      <>
        <div style={weeklyTextBoxStyle}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 6px' }}>Situation</p>
          <p style={{ margin: 0 }}>{task.scenario}</p>
        </div>
        {task.requiredDiscussionPoints?.length > 0 && (
          <div style={weeklyQuestionBoxStyle}>
            <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 8px' }}>Aufgabe</p>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {task.requiredDiscussionPoints.map((point) => (
                <li key={point} style={{ marginBottom: '4px' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
        {task.conversationGoal && (
          <div style={weeklyQuestionBoxStyle}>
            <p style={{ ...weeklyMutedStyle, fontWeight: 700, margin: '0 0 6px' }}>Gesprächsziel</p>
            <p style={{ margin: 0 }}>{task.conversationGoal}</p>
          </div>
        )}
        <p style={weeklyMutedStyle}>
          Sie sprechen mit einem KI-Partner. Der Partner beginnt das Gespräch — antworten Sie mit
          Ihrer Stimme nach jeder Frage.
        </p>
      </>
    );
  };

  if (readOnly) {
    return (
      <>
        {image?.image && (
          <div style={stickyImageWrapStyle}>
            <img src={image.image} alt={image.title || 'Bildbeschreibung'} style={stickyImageStyle} />
          </div>
        )}
        {renderPlanungScenario()}
        {!isPlanung && <p style={taskPromptStyle}>{taskPrompt}</p>}
        {renderAssistantQuestions()}
        {renderLearnerHistory()}
        <pre style={transcriptPreviewStyle}>{learnerResponse || '—'}</pre>
      </>
    );
  }

  return (
    <>
      {image?.image && (
        <div style={stickyImageWrapStyle}>
          <img src={image.image} alt={image.title || 'Bildbeschreibung'} style={stickyImageStyle} />
          {image.title && (
            <p style={{ ...weeklyMutedStyle, marginTop: '8px', fontWeight: 600 }}>{image.title}</p>
          )}
        </div>
      )}

      {renderPlanungScenario()}

      {!isPlanung && <p style={taskPromptStyle}>{taskPrompt}</p>}

      {isSelbstvorstellung && (
        <p style={weeklyMutedStyle}>
          Stellen Sie sich vor (max. {formatRecordingLimitLabel(maxRecordingMs)}). Ihr Coach stellt
          danach nur noch fehlende Themen nach — maximal zwei Nachfragen.
        </p>
      )}

      {isBild && (
        <p style={weeklyMutedStyle}>
          Beschreiben Sie das Bild (max. {formatRecordingLimitLabel(maxRecordingMs)}). Ihr Coach
          fragt bei Bedarf kurz nach — maximal zwei Nachfragen.
        </p>
      )}

      {renderAssistantQuestions()}
      {renderLearnerHistory()}

      {turnLoading && !turnRetrying && (
        <p style={{ ...weeklyMutedStyle, fontStyle: 'italic', marginBottom: '12px' }}>
          Ihr Coach denkt nach …
        </p>
      )}

      {conversationComplete && (
        <p style={{ ...weeklyMutedStyle, color: '#166534', fontWeight: 700, marginBottom: '12px' }}>
          Das Gespräch ist abgeschlossen. Sie können die Übung jetzt einreichen.
        </p>
      )}

      {isPlanung && !planungStarted ? (
        <button
          type="button"
          style={{
            ...weeklyPrimaryButtonStyle,
            opacity: beginLoading ? 0.7 : 1,
            cursor: beginLoading ? 'wait' : 'pointer',
          }}
          onClick={handleStartPlanung}
          disabled={beginLoading}
        >
          {beginLoading ? 'Gespräch wird gestartet …' : 'Gespräch starten'}
        </button>
      ) : (
        recordingTurnKey && (
          <InteractiveRecordingTurn
            turnKey={recordingTurnKey}
            maxDurationMs={maxRecordingMs}
            turnLoading={turnLoading}
            turnRetrying={turnRetrying}
            initialText={pendingRetryText}
            disabled={!awaitingLearnerAnswer}
            onSend={handleSendTurn}
          />
        )
      )}

      {coachError && (
        <p style={{ ...weeklyMutedStyle, color: '#b91c1c', marginTop: '8px' }}>{coachError}</p>
      )}
    </>
  );
}

/** @deprecated Use B1InteractiveSpeakingExercisePanel */
export function B1BildbeschreibungExercisePanel(props) {
  return <B1InteractiveSpeakingExercisePanel {...props} />;
}

export function BildbeschreibungExercisePanel({
  task,
  image,
  learnerResponse,
  onResponseChange,
  onSpeakingSubmitted,
  readOnly = false,
}) {
  const [phase, setPhase] = useState(() => (learnerResponse?.trim() ? 'review' : 'idle'));
  const [showManualFallback, setShowManualFallback] = useState(false);

  const speech = useWeeklyPlanSpeechRecognition({ maxDurationMs: BILD_MAX_RECORDING_MS });

  useEffect(() => {
    if (readOnly) return;
    if (learnerResponse?.trim() && phase === 'idle') {
      setPhase('review');
    }
  }, [learnerResponse, phase, readOnly]);

  const handleStopRecording = () => {
    const stopped = speech.stopRecording();
    if (stopped) {
      setPhase('review');
      onSpeakingSubmitted?.(true);
    }
  };

  const handleUseTranscript = () => {
    const text = speech.transcript.trim();
    if (!text) return;
    onResponseChange(text);
    onSpeakingSubmitted?.(true);
    setPhase('review');
  };

  const handleManualChange = (value) => {
    onResponseChange(value);
    onSpeakingSubmitted?.(Boolean(value.trim()));
    setPhase(value.trim() ? 'review' : 'idle');
  };

  if (readOnly) {
    return (
      <>
        {image?.image && (
          <div style={{ marginBottom: '12px' }}>
            <img
              src={image.image}
              alt={image.title || 'Bildbeschreibung'}
              style={{
                width: '100%',
                maxHeight: '280px',
                objectFit: 'cover',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            />
          </div>
        )}
        <pre style={transcriptPreviewStyle}>{learnerResponse || '—'}</pre>
      </>
    );
  }

  return (
    <>
      {image?.image && (
        <div style={{ marginBottom: '12px' }}>
          <img
            src={image.image}
            alt={image.title || 'Bildbeschreibung'}
            style={{
              width: '100%',
              maxHeight: '280px',
              objectFit: 'cover',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          />
          {image.title && (
            <p style={{ ...weeklyMutedStyle, marginTop: '8px', fontWeight: 600 }}>{image.title}</p>
          )}
        </div>
      )}
      {task.task && <p style={weeklyMutedStyle}>{task.task}</p>}

      <p style={{ ...weeklyMutedStyle, marginTop: '10px' }}>
        Beschreiben Sie das Bild in 45–60 Sekunden. Ihre Stimme wird in Text umgewandelt, den Sie
        vor dem Einreichen prüfen können.
      </p>

      {phase === 'idle' && !speech.isListening && (
        <button type="button" style={weeklyRecordButtonStyle} onClick={speech.startRecording}>
          🎙️ Aufnahme starten
        </button>
      )}

      {speech.isListening && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ ...weeklyMutedStyle, color: '#b91c1c', fontWeight: 700 }}>
            Aufnahme läuft … (max. 60 Sekunden)
          </p>
          {speech.recognizedDraft && (
            <p style={liveTranscriptStyle}>{speech.recognizedDraft}</p>
          )}
          <button type="button" style={weeklyStopButtonStyle} onClick={handleStopRecording}>
            ⏹ Aufnahme stoppen
          </button>
        </div>
      )}

      {speech.controlMessage && (
        <p style={{ ...weeklyMutedStyle, color: '#b45309', marginTop: '8px' }}>{speech.controlMessage}</p>
      )}

      {(phase === 'review' || speech.transcript) && !speech.isListening && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 700 }}>Ihr Transkript – bitte prüfen und ggf. bearbeiten:</p>
          <textarea
            style={weeklyTextareaStyle}
            value={learnerResponse || speech.transcript}
            onChange={(e) => {
              speech.setManualTranscript(e.target.value);
              handleManualChange(e.target.value);
            }}
            placeholder="Ihre Bildbeschreibung erscheint hier nach der Aufnahme …"
          />
          {!learnerResponse?.trim() && speech.transcript?.trim() && (
            <button type="button" style={weeklyPrimaryButtonStyle} onClick={handleUseTranscript}>
              Transkript übernehmen
            </button>
          )}
        </div>
      )}

      {(speech.typedFallbackAllowed || showManualFallback) && (
        <div style={{ marginTop: '12px' }}>
          {!showManualFallback ? (
            <button
              type="button"
              style={weeklySecondaryButtonStyle}
              onClick={() => setShowManualFallback(true)}
            >
              Manuell tippen (Fallback)
            </button>
          ) : (
            <>
              <p style={weeklyMutedStyle}>Fallback: Beschreibung manuell eingeben</p>
              <textarea
                style={weeklyTextareaStyle}
                value={learnerResponse}
                onChange={(e) => handleManualChange(e.target.value)}
                placeholder="Deine Bildbeschreibung …"
              />
            </>
          )}
        </div>
      )}
    </>
  );
}

const liveTranscriptStyle = {
  margin: '8px 0',
  padding: '10px',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#334155',
  lineHeight: 1.5,
};

const transcriptPreviewStyle = {
  whiteSpace: 'pre-wrap',
  fontFamily: 'inherit',
  margin: 0,
  padding: '12px',
  borderRadius: '12px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
};


export function B1SchreibenCoachFeedbackPanel({
  learnerResponse = '',
  aiCorrection,
  aiStatus = 'idle',
  aiError = '',
  onRetryAi,
}) {
  const preStyle = {
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    margin: '8px 0 0',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Dein Original</h3>
      <pre style={preStyle}>{learnerResponse || aiCorrection?.originalText || ''}</pre>

      {aiStatus === 'loading' && (
        <p style={{ ...weeklyMutedStyle, marginTop: '12px' }}>Korrektur wird erstellt …</p>
      )}

      {aiStatus === 'failed' && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ ...weeklyMutedStyle, color: '#b45309', lineHeight: 1.55 }}>{aiError}</p>
          {onRetryAi && (
            <button type="button" style={weeklySecondaryButtonStyle} onClick={onRetryAi}>
              Korrektur erneut versuchen
            </button>
          )}
        </div>
      )}

      {aiCorrection?.status === 'ready' && aiCorrection.correctedEmail && (
        <>
          <h3 style={{ margin: '16px 0 8px', fontSize: '16px' }}>Korrigierte Version</h3>
          <pre style={preStyle}>{aiCorrection.correctedEmail}</pre>
        </>
      )}

      {aiCorrection?.coveredPoints?.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 600, marginBottom: '4px' }}>
            Erfüllte Stichpunkte
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {aiCorrection.coveredPoints.map((point) => (
              <li key={point} style={{ color: '#166534' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiCorrection?.missingPoints?.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 600, marginBottom: '4px' }}>
            Fehlende Stichpunkte
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {aiCorrection.missingPoints.map((point) => (
              <li key={point} style={{ color: '#9a3412' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function A2SchreibenCoachFeedbackPanel({
  feedback,
  aiCorrection,
  aiStatus = 'idle',
  aiError = '',
  onRetryAi,
  showStaticModelAnswer = false,
  staticModelAnswer = '',
}) {
  if (!feedback) return null;

  const meta = feedback.evaluationMeta || {};
  const score = meta.deterministicScore || {
    covered: meta.coveredPoints?.length || 0,
    total: (meta.coveredPoints?.length || 0) + (meta.missingPoints?.length || 0),
  };

  const preStyle = {
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    margin: '8px 0 0',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>1. Ergebnis</h3>
      <p style={{ ...weeklyMutedStyle, fontWeight: 700, color: '#0f172a' }}>{feedback.summary}</p>
      <p style={weeklyMutedStyle}>
        Inhaltspunkte: <strong>{score.covered}</strong> von <strong>{score.total}</strong> erfüllt
      </p>
      {meta.coveredPoints?.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 600, marginBottom: '4px' }}>Erfüllte Stichpunkte</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {meta.coveredPoints.map((point) => (
              <li key={point} style={{ color: '#166534' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
      {meta.missingPoints?.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 600, marginBottom: '4px' }}>Fehlende Stichpunkte</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {meta.missingPoints.map((point) => (
              <li key={point} style={{ color: '#9a3412' }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiStatus === 'loading' && (
        <p style={weeklyMutedStyle}>KI-Korrektur wird erstellt …</p>
      )}

      {aiStatus === 'failed' && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ ...weeklyMutedStyle, color: '#b45309', lineHeight: 1.55 }}>
            {aiError}
          </p>
          {onRetryAi && (
            <button type="button" style={weeklySecondaryButtonStyle} onClick={onRetryAi}>
              KI-Korrektur erneut versuchen
            </button>
          )}
        </div>
      )}

      {aiCorrection?.status === 'ready' && aiCorrection.correctedEmail && (
        <>
          <h3 style={{ margin: '16px 0 8px', fontSize: '16px' }}>2. Dein korrigierter E-Mail-Text</h3>
          <pre style={preStyle}>{aiCorrection.correctedEmail}</pre>

          {aiCorrection.corrections?.length > 0 && (
            <>
              <h3 style={{ margin: '16px 0 8px', fontSize: '16px' }}>3. Wichtige Korrekturen</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {aiCorrection.corrections.map((item, index) => (
                  <li key={index} style={{ marginBottom: '8px', color: '#475569' }}>
                    <strong>{item.original}</strong> → <strong>{item.corrected}</strong>
                    <div style={{ fontSize: '14px', marginTop: '2px' }}>{item.explanation}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {aiCorrection.addedMissingPoints?.length > 0 && (
            <>
              <h3 style={{ margin: '16px 0 8px', fontSize: '16px' }}>4. Ergänzte Punkte</h3>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {aiCorrection.addedMissingPoints.map((item, index) => (
                  <li key={index} style={{ marginBottom: '6px', color: '#475569' }}>
                    <strong>{item.point}:</strong> {item.addedText}
                  </li>
                ))}
              </ul>
            </>
          )}

          {aiCorrection.positiveFeedback?.length > 0 && (
            <ul style={{ margin: '12px 0 0', paddingLeft: '18px' }}>
              {aiCorrection.positiveFeedback.map((item) => (
                <li key={item} style={{ color: '#166534', marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {aiCorrection.learningTip && (
            <>
              <h3 style={{ margin: '16px 0 8px', fontSize: '16px' }}>5. Lerntipp</h3>
              <p style={weeklyMutedStyle}>{aiCorrection.learningTip}</p>
            </>
          )}
        </>
      )}

      {showStaticModelAnswer && staticModelAnswer && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ ...weeklyMutedStyle, fontWeight: 600 }}>Zusätzliche Musterlösung (Referenz)</p>
          <pre style={preStyle}>{staticModelAnswer}</pre>
        </div>
      )}
    </div>
  );
}

export function CoachFeedbackPanel({ feedback, showSolution, solution }) {
  if (!feedback) return null;

  const toneStyle = (tone) => {
    if (tone === 'success') return { color: '#166534' };
    if (tone === 'partial') return { color: '#92400e' };
    if (tone === 'retry') return { color: '#9a3412' };
    return { color: '#475569' };
  };

  return (
    <div>
      <p style={{ ...weeklyMutedStyle, fontWeight: 700, color: '#0f172a' }}>{feedback.summary}</p>
      <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
        {(feedback.lines || []).map((line, index) => (
          <li key={index} style={{ ...toneStyle(line.tone), marginBottom: '6px' }}>
            {line.text}
            {line.correction && (
              <div style={{ marginTop: '4px', fontSize: '14px' }}>
                Mögliche Antwort: {line.correction}
              </div>
            )}
          </li>
        ))}
      </ul>
      {showSolution && solution && (
        <div style={{ ...weeklyMutedStyle, marginTop: '10px' }}>
          <strong>Musterlösung:</strong>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              margin: '8px 0 0',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            {solution}
          </pre>
        </div>
      )}
      {feedback.followUps?.length > 0 && (
        <>
          <p style={{ ...weeklyMutedStyle, marginTop: '12px', fontWeight: 700 }}>
            Als Nächstes kannst du darüber nachdenken:
          </p>
          <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
            {feedback.followUps.map((item) => (
              <li key={item} style={weeklyMutedStyle}>
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function playListeningAudio(audioText) {
  playPartnerSpeech(audioText);
}

export function playPartnerSpeech(audioText) {
  if (!audioText || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(audioText);
  utterance.lang = 'de-AT';
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
