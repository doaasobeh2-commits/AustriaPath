import { useCallback, useEffect, useRef, useState } from 'react';
import { createPlacementStopSubmitCoordinator } from '../../data/utils/placementRecordingStop.js';

const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Weekly Plan voice capture — browser SpeechRecognition with typed fallback.
 * @param {{ maxDurationMs?: number, lang?: string }} [options]
 */
export function useWeeklyPlanSpeechRecognition({
  maxDurationMs = 60_000,
  lang = 'de-AT',
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognizedDraft, setRecognizedDraft] = useState('');
  const [typedFallbackAllowed, setTypedFallbackAllowed] = useState(!SpeechRecognitionCtor);
  const [controlMessage, setControlMessage] = useState('');

  const transcriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const recognitionRef = useRef(null);
  const listenIntentRef = useRef(false);
  const submitAfterStopRef = useRef(false);
  const stopSubmitCoordinatorRef = useRef(createPlacementStopSubmitCoordinator());
  const maxDurationTimerRef = useRef(null);

  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current != null) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    clearMaxDurationTimer();
    listenIntentRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, [clearMaxDurationTimer]);

  useEffect(() => () => {
    stopRecognition();
    stopSubmitCoordinatorRef.current.clearFallbackTimer();
  }, [stopRecognition]);

  const commitTranscript = useCallback((text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return false;
    stopSubmitCoordinatorRef.current.submitOnce(() => {
      setTranscript(trimmed);
      setRecognizedDraft(trimmed);
    });
    return true;
  }, []);

  const finalizeStop = useCallback(() => {
    const pending = transcriptRef.current.trim();
    submitAfterStopRef.current = false;
    stopRecognition();
    if (!pending) {
      setControlMessage('Es wurde noch keine Sprache erkannt. Bitte versuchen Sie es erneut.');
      return false;
    }
    return commitTranscript(pending);
  }, [commitTranscript, stopRecognition]);

  const startRecording = useCallback(() => {
    setControlMessage('');
    if (!SpeechRecognitionCtor) {
      setTypedFallbackAllowed(true);
      setControlMessage(
        'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte tippen Sie Ihre Antwort.'
      );
      return;
    }

    stopRecognition();
    stopSubmitCoordinatorRef.current.reset();
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    submitAfterStopRef.current = false;
    setRecognizedDraft('');
    setTranscript('');
    listenIntentRef.current = true;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
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
          interimChunk += result[0]?.transcript || '';
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
      setControlMessage('');
    };

    recognition.onerror = (event) => {
      const err = String(event?.error || '');
      if (err === 'no-speech' || err === 'aborted') return;
      listenIntentRef.current = false;
      setIsListening(false);
      if (transcriptRef.current.trim()) {
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
      setControlMessage('Spracherkennung vorübergehend nicht verfügbar. Bitte tippen Sie Ihre Antwort.');
    };

    recognition.onend = () => {
      if (listenIntentRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          listenIntentRef.current = false;
        }
      }
      setIsListening(false);
      if (!submitAfterStopRef.current) return;
      finalizeStop();
    };

    recognitionRef.current = recognition;
    try {
      setIsListening(true);
      recognition.start();
      maxDurationTimerRef.current = window.setTimeout(() => {
        submitAfterStopRef.current = true;
        listenIntentRef.current = false;
        try {
          recognition.stop();
        } catch {
          finalizeStop();
        }
      }, maxDurationMs);
    } catch {
      listenIntentRef.current = false;
      setIsListening(false);
      setTypedFallbackAllowed(true);
      setControlMessage('Aufnahme konnte nicht gestartet werden.');
    }
  }, [finalizeStop, lang, maxDurationMs, stopRecognition]);

  const stopRecording = useCallback(() => {
    if (!transcriptRef.current.trim()) {
      setControlMessage('Es wurde noch keine Sprache erkannt. Bitte versuchen Sie es erneut.');
      return false;
    }
    if (stopSubmitCoordinatorRef.current.hasCommitted()) {
      return Boolean(transcript);
    }
    submitAfterStopRef.current = true;
    listenIntentRef.current = false;
    clearMaxDurationTimer();

    const runStopFallback = () => {
      if (!submitAfterStopRef.current) return;
      finalizeStop();
    };

    try {
      recognitionRef.current?.stop?.();
      stopSubmitCoordinatorRef.current.armStopFallback({
        scheduleTimeout: (ms, fn) => window.setTimeout(fn, ms),
        onFallback: runStopFallback,
      });
    } catch {
      return finalizeStop();
    }
    return true;
  }, [clearMaxDurationTimer, finalizeStop, transcript]);

  const resetTranscript = useCallback(() => {
    stopRecognition();
    stopSubmitCoordinatorRef.current.reset();
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    setTranscript('');
    setRecognizedDraft('');
    setControlMessage('');
  }, [stopRecognition]);

  const setManualTranscript = useCallback((value) => {
    const next = String(value || '');
    transcriptRef.current = next;
    setTranscript(next);
    setRecognizedDraft(next);
  }, []);

  return {
    isListening,
    transcript,
    recognizedDraft,
    typedFallbackAllowed,
    controlMessage,
    speechSupported: Boolean(SpeechRecognitionCtor),
    startRecording,
    stopRecording,
    resetTranscript,
    setManualTranscript,
    setControlMessage,
  };
}
