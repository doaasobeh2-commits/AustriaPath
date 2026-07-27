import React, { useCallback, useEffect, useRef, useState } from 'react';
import { resolveA2AufgabeLoesenAudioPath } from '../../../data/a2AufgabeLoesenCatalog.js';
import { getAufgabeLoesenPronunciationNote } from '../../../data/utils/a2AufgabeLoesenTurnEvaluation.js';
import { getScreenLabels } from '../../../i18n/screenLabels.js';
import { getUserLanguage } from '../../../utils/userPreferences.js';
import { useWeeklyPlanSpeechRecognition } from '../../hooks/useWeeklyPlanSpeechRecognition.js';

const TURN_RECORDING_MS = 45_000;

/**
 * A2 Aufgabe lösen — guided speaking practice with visible model sentences.
 * @param {{ task: object, onComplete?: (payload: { learnerResponse: string, turnResponses: object[] }) => void, onRestart?: () => void }} props
 */
export function AufgabeLoesenGuidedPanel({ task, onComplete }) {
  const labels = getScreenLabels(getUserLanguage());
  const [phase, setPhase] = useState('intro');
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnPhase, setTurnPhase] = useState('partner');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [turnResponses, setTurnResponses] = useState([]);
  const audioRef = useRef(null);

  const speech = useWeeklyPlanSpeechRecognition({ maxDurationMs: TURN_RECORDING_MS });

  const turns = task?.turns || [];
  const currentTurn = turns[turnIndex] || null;
  const requiredSentence = currentTurn?.learnerResponse || '';

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const playPartnerAudio = useCallback(() => {
    if (!currentTurn?.audioFile) {
      setTurnPhase('speak');
      return;
    }
    stopAudio();
    const audio = new Audio(resolveA2AufgabeLoesenAudioPath(currentTurn.audioFile));
    audioRef.current = audio;
    setAudioPlaying(true);
    audio.onended = () => {
      setAudioPlaying(false);
      audioRef.current = null;
      setTurnPhase('speak');
    };
    audio.onerror = () => {
      setAudioPlaying(false);
      audioRef.current = null;
      setTurnPhase('speak');
    };
    audio.play().catch(() => {
      setAudioPlaying(false);
      setTurnPhase('speak');
    });
  }, [currentTurn, stopAudio]);

  useEffect(() => {
    if (phase !== 'turn' || turnPhase !== 'partner') return;
    playPartnerAudio();
  }, [phase, turnPhase, turnIndex, playPartnerAudio]);

  const startGuidedStudy = () => {
    stopAudio();
    speech.resetTranscript();
    setTurnIndex(0);
    setTurnResponses([]);
    setTurnPhase('partner');
    setPhase('turn');
  };

  const submitTurnResponse = () => {
    const transcript = (speech.transcript || '').trim();
    const note = getAufgabeLoesenPronunciationNote(transcript, requiredSentence);
    const entry = {
      turn: currentTurn?.turn || turnIndex + 1,
      requiredSentence,
      transcript,
      note,
    };
    const nextResponses = [...turnResponses, entry];
    setTurnResponses(nextResponses);
    speech.resetTranscript();

    if (turnIndex + 1 >= turns.length) {
      setPhase('debrief');
      return;
    }

    setTurnIndex((prev) => prev + 1);
    setTurnPhase('partner');
  };

  const handleStopRecording = () => {
    if (speech.stopRecording()) {
      setTurnPhase('review');
    }
  };

  if (phase === 'intro') {
    return (
      <div>
        <p style={mutedStyle}>
          Hören Sie die Partnerfrage, lesen Sie den angezeigten Satz laut vor und nehmen Sie Ihre
          Stimme auf. Dies ist Sprechpraxis – kein Prüfungsgespräch.
        </p>
        <button type="button" style={primaryButtonStyle} onClick={startGuidedStudy}>
          Gespräch starten
        </button>
      </div>
    );
  }

  if (phase === 'debrief') {
    return (
      <div style={doneBoxStyle}>
        <h3 style={{ marginTop: 0 }}>Übung abgeschlossen</h3>
        <p style={mutedStyle}>Ihre gesprochenen Sätze und erkannten Transkripte:</p>
        {turnResponses.map((response, index) => (
          <div key={response.turn || index} style={debriefTurnStyle}>
            <p style={labelStyle}>Runde {response.turn}</p>
            <p style={labelStyle}>Satz zum Vorlesen:</p>
            <p style={requiredSentenceStyle}>{response.requiredSentence}</p>
            <p style={labelStyle}>Erkanntes Transkript:</p>
            <p style={transcriptStyle}>{response.transcript || '—'}</p>
            <p style={noteStyle(response.note.tone)}>{response.note.message}</p>
          </div>
        ))}
        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() =>
            onComplete?.({
              learnerResponse: JSON.stringify({ turns: turnResponses }),
              turnResponses,
            })
          }
        >
          Zurück zum Trainingsplan
        </button>
      </div>
    );
  }

  return (
    <div>
      <p style={roundStyle}>
        Runde {currentTurn?.turn || turnIndex + 1} von {turns.length}
      </p>

      <div style={dialogueBoxStyle}>
        <p style={labelStyle}>Partner:</p>
        <p style={lineStyle}>{currentTurn?.partnerText}</p>

        {turnPhase === 'partner' && (
          <button
            type="button"
            style={audioButtonStyle}
            onClick={playPartnerAudio}
            disabled={audioPlaying}
          >
            {audioPlaying ? '🔊 Wird abgespielt…' : '🔊 Partner-Audio erneut abspielen'}
          </button>
        )}

        {(turnPhase === 'speak' || turnPhase === 'review' || speech.isListening || speech.transcript) && (
          <div style={{ marginTop: '14px' }}>
            <p style={labelStyle}>Ihr Satz:</p>
            <p style={requiredSentenceStyle}>{requiredSentence}</p>
            <p style={instructionStyle}>{labels.guidedSpeakingRecordInstruction}</p>
          </div>
        )}

        {turnPhase === 'speak' && !speech.isListening && !speech.transcript && (
          <button type="button" style={recordButtonStyle} onClick={speech.startRecording}>
            🎙️ Aufnahme starten
          </button>
        )}

        {speech.isListening && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ ...mutedStyle, color: '#b91c1c', fontWeight: 700 }}>Aufnahme läuft …</p>
            {speech.recognizedDraft && <p style={liveTranscriptStyle}>{speech.recognizedDraft}</p>}
            <button type="button" style={stopButtonStyle} onClick={handleStopRecording}>
              ⏹ Aufnahme stoppen
            </button>
          </div>
        )}

        {(turnPhase === 'review' || speech.transcript) && !speech.isListening && (
          <div style={{ marginTop: '10px' }}>
            <p style={labelStyle}>Erkanntes Transkript – bitte prüfen:</p>
            <textarea
              style={textareaStyle}
              value={speech.transcript}
              onChange={(e) => speech.setManualTranscript(e.target.value)}
              placeholder="Ihr gesprochener Satz …"
            />
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={submitTurnResponse}
              disabled={!speech.transcript.trim()}
            >
              {turnIndex + 1 >= turns.length ? 'Übung abschließen' : 'Weiter zur nächsten Runde'}
            </button>
          </div>
        )}

        {speech.controlMessage && (
          <p style={{ ...mutedStyle, color: '#b45309' }}>{speech.controlMessage}</p>
        )}
      </div>
    </div>
  );
}

const mutedStyle = { color: '#64748b', lineHeight: 1.6, margin: '0 0 12px' };
const roundStyle = { margin: '0 0 10px', fontWeight: 700, color: '#0f172a' };
const labelStyle = { margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#475569' };
const lineStyle = { margin: '0 0 12px', lineHeight: 1.6, color: '#0f172a' };
const instructionStyle = {
  margin: '0 0 12px',
  color: '#1d4ed8',
  fontWeight: 700,
  lineHeight: 1.5,
};
const dialogueBoxStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '14px',
};
const doneBoxStyle = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #bbf7d0',
  borderRadius: '14px',
  padding: '16px',
};
const debriefTurnStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '12px',
  marginBottom: '12px',
};
const requiredSentenceStyle = {
  margin: '0 0 12px',
  lineHeight: 1.6,
  color: '#0f172a',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  padding: '12px',
  fontWeight: 600,
};
const transcriptStyle = {
  margin: '0 0 8px',
  lineHeight: 1.6,
  color: '#0f172a',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '12px',
};
const liveTranscriptStyle = {
  margin: '8px 0',
  padding: '10px',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  border: '1px dashed #cbd5e1',
};
const primaryButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  marginTop: '8px',
};
const audioButtonStyle = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  cursor: 'pointer',
  fontSize: '14px',
};
const recordButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '8px',
};
const stopButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '8px',
};
const textareaStyle = {
  width: '100%',
  minHeight: '72px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  padding: '12px',
  fontSize: '15px',
  lineHeight: 1.5,
  boxSizing: 'border-box',
  marginBottom: '8px',
};

function noteStyle(tone) {
  const colors = {
    success: '#166534',
    partial: '#92400e',
    retry: '#9a3412',
  };
  return {
    margin: 0,
    fontWeight: 600,
    color: colors[tone] || '#475569',
  };
}
