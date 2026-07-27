import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  flattenA2HorenQuestions,
  resolveA2HorenAudioPath,
} from '../../../data/a2HorenCatalog.js';

/**
 * Guided A2 Hören — audio and questions on one screen per clip block.
 */
export function A2HorenGuidedPanel({ model, onComplete, onRestart }) {
  const [answers, setAnswers] = useState({});
  const [clip1Unlocked, setClip1Unlocked] = useState(false);
  const [clip2Unlocked, setClip2Unlocked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [phase, setPhase] = useState('practice');
  const audioRef = useRef(null);

  const clips = model?.clips || [];
  const clip1 = clips[0];
  const clip2 = clips[1];
  const flatQuestions = useMemo(() => flattenA2HorenQuestions(model), [model]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioPlaying(false);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  useEffect(() => {
    setAnswers({});
    setClip1Unlocked(false);
    setClip2Unlocked(false);
    setPhase('practice');
    stopAudio();
  }, [model?.model_id, stopAudio]);

  const playClip = useCallback(
    (clip, onUnlocked) => {
      if (!clip?.audio_file) return;
      stopAudio();
      const audio = new Audio(resolveA2HorenAudioPath(clip.audio_file));
      audioRef.current = audio;
      setAudioPlaying(true);
      audio.onended = () => {
        setAudioPlaying(false);
        audioRef.current = null;
        onUnlocked?.();
      };
      audio.onerror = () => {
        setAudioPlaying(false);
        audioRef.current = null;
      };
      audio.play().catch(() => setAudioPlaying(false));
    },
    [stopAudio]
  );

  const score = useMemo(() => {
    return flatQuestions.reduce((total, question, index) => {
      return answers[index] === question.correct_answer ? total + 1 : total;
    }, 0);
  }, [answers, flatQuestions]);

  const allAnswered = flatQuestions.every((_, index) => Boolean(answers[index]));

  const selectAnswer = (questionIndex, option) => {
    if (audioPlaying) return;
    const clipUnlocked =
      questionIndex < 2 ? clip1Unlocked : clip2Unlocked;
    if (!clipUnlocked) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleFinish = () => {
    setPhase('result');
  };

  const handleReturn = () => {
    onComplete?.({ score, total: flatQuestions.length, answers });
  };

  const handleRestart = () => {
    stopAudio();
    setAnswers({});
    setClip1Unlocked(false);
    setClip2Unlocked(false);
    setPhase('practice');
    onRestart?.();
  };

  const renderQuestion = (question, questionIndex, questionNumber) => {
    const clipUnlocked = questionIndex < 2 ? clip1Unlocked : clip2Unlocked;
    const disabled = audioPlaying || !clipUnlocked;
    const selected = answers[questionIndex];

    return (
      <div
        key={question.question_id}
        style={questionBoxStyle(disabled)}
        aria-disabled={disabled}
      >
        <p style={stepLabelStyle}>Frage {questionNumber} von 4</p>
        <h3 style={questionTitleStyle}>{question.text}</h3>
        <div style={optionsStyle}>
          {question.options.map((option) => {
            const isSelected = selected === option;
            return (
              <button
                key={option}
                type="button"
                style={optionButtonStyle(isSelected, disabled)}
                onClick={() => selectAnswer(questionIndex, option)}
                disabled={disabled}
              >
                {option}
              </button>
            );
          })}
        </div>
        {!clipUnlocked && (
          <p style={hintStyle}>Bitte hören Sie zuerst den Clip bis zum Ende.</p>
        )}
        {clipUnlocked && audioPlaying && (
          <p style={hintStyle}>Bitte warten Sie, bis die Wiedergabe beendet ist.</p>
        )}
      </div>
    );
  };

  const renderClipBlock = (clip, clipLabel, questionIndices, unlocked, setUnlocked) => (
    <section style={clipSectionStyle}>
      <span style={badgeStyle}>A2</span>
      <h2 style={clipTitleStyle}>{clipLabel}</h2>
      {clip?.topic && <p style={topicStyle}>{clip.topic}</p>}
      <button
        type="button"
        style={primaryButtonStyle}
        onClick={() => playClip(clip, () => setUnlocked(true))}
        disabled={audioPlaying}
      >
        {audioPlaying ? '▶ Wird abgespielt…' : '🔊 Clip abspielen'}
      </button>
      {questionIndices.map((questionIndex, offset) =>
        renderQuestion(flatQuestions[questionIndex], questionIndex, questionIndex + 1)
      )}
    </section>
  );

  if (phase === 'result') {
    return (
      <div style={boxStyle}>
        <h2>Ergebnis</h2>
        <p style={resultStyle}>
          Sie haben <strong>{score}</strong> von <strong>{flatQuestions.length}</strong> Fragen richtig
          beantwortet.
        </p>
        <div style={reviewStyle}>
          {flatQuestions.map((question, index) => {
            const selected = answers[index];
            const correct = selected === question.correct_answer;
            return (
              <div key={question.question_id} style={reviewItemStyle(correct)}>
                <p>
                  <strong>Frage {index + 1}:</strong> {question.text}
                </p>
                <p>Ihre Antwort: {selected || '—'}</p>
                {!correct && <p>Richtige Antwort: {question.correct_answer}</p>}
              </div>
            );
          })}
        </div>
        <button type="button" style={primaryButtonStyle} onClick={handleReturn}>
          Zurück zum Trainingsplan
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={boxStyle}>
        <h2 style={{ marginTop: 0 }}>{model.title}</h2>
        <p style={mutedStyle}>
          Hören Sie jeden Clip und beantworten Sie die Fragen direkt darunter. Während der Wiedergabe
          sind die Fragen gesperrt.
        </p>
      </div>

      {renderClipBlock(clip1, 'Clip 1', [0, 1], clip1Unlocked, setClip1Unlocked)}
      {renderClipBlock(clip2, 'Clip 2', [2, 3], clip2Unlocked, setClip2Unlocked)}

      <button
        type="button"
        style={primaryButtonStyle}
        onClick={handleFinish}
        disabled={!allAnswered || audioPlaying}
      >
        Antworten einreichen
      </button>
    </div>
  );
}

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: 1.6,
};

const clipSectionStyle = {
  ...boxStyle,
  borderLeft: '4px solid #2563eb',
};

const badgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 'bold',
  marginBottom: '10px',
};

const topicStyle = {
  color: '#64748b',
  margin: '0 0 8px',
};

const mutedStyle = {
  color: '#64748b',
  marginBottom: '12px',
};

const clipTitleStyle = {
  margin: '0 0 8px',
  fontSize: '18px',
};

const stepLabelStyle = {
  color: '#64748b',
  fontWeight: 600,
  margin: '0 0 8px',
};

const questionTitleStyle = {
  margin: '0 0 8px',
  fontSize: '16px',
};

const hintStyle = {
  margin: '8px 0 0',
  fontSize: '13px',
  color: '#94a3b8',
};

const primaryButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 700,
  marginTop: '8px',
  marginBottom: '8px',
};

const secondaryButtonStyle = {
  backgroundColor: '#f1f5f9',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 600,
  marginTop: '8px',
};

const optionsStyle = {
  display: 'grid',
  gap: '10px',
  margin: '12px 0',
};

const optionButtonStyle = (selected, disabled) => ({
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: '12px',
  border: selected ? '2px solid #2563eb' : '1px solid #cbd5e1',
  backgroundColor: disabled ? '#f8fafc' : selected ? '#eff6ff' : '#ffffff',
  color: disabled ? '#94a3b8' : '#0f172a',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: selected ? 700 : 500,
  opacity: disabled ? 0.7 : 1,
});

const questionBoxStyle = (disabled) => ({
  marginTop: '12px',
  padding: '12px',
  borderRadius: '12px',
  border: `1px solid ${disabled ? '#e2e8f0' : '#cbd5e1'}`,
  backgroundColor: disabled ? '#f8fafc' : '#ffffff',
});

const resultStyle = {
  fontSize: '18px',
  marginBottom: '12px',
};

const reviewStyle = {
  display: 'grid',
  gap: '10px',
  marginBottom: '12px',
};

const reviewItemStyle = (correct) => ({
  padding: '10px',
  borderRadius: '12px',
  backgroundColor: correct ? '#f0fdf4' : '#fef2f2',
  border: `1px solid ${correct ? '#bbf7d0' : '#fecaca'}`,
});
