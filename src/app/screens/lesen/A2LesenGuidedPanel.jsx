import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getA2LesenQuestions } from '../../../data/a2LesenCatalog.js';

function InfoBox({ title, items = [] }) {
  if (!items?.length) return null;
  return (
    <div style={boxStyle}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Guided A2 Lesen flow.
 * - coach: step-by-step questions with score, corrections, mistakes, and tips
 * - practice: all questions visible, submit without revealing answers or coaching feedback
 */
export function A2LesenGuidedPanel({ model, mode = 'practice', onComplete, onRestart }) {
  const questionsRef = useRef(null);
  const isCoachMode = mode === 'coach';
  const [step, setStep] = useState('read');
  const [answers, setAnswers] = useState({});

  const questions = useMemo(() => getA2LesenQuestions(model), [model]);

  useEffect(() => {
    setStep('read');
    setAnswers({});
  }, [model?.model_id]);

  const currentQuestionIndex =
    step === 'q1' ? 0 : step === 'q2' ? 1 : step === 'q3' ? 2 : step === 'q4' ? 3 : -1;
  const currentQuestion = currentQuestionIndex >= 0 ? questions[currentQuestionIndex] : null;

  const score = useMemo(
    () =>
      questions.reduce(
        (total, question, index) =>
          answers[index] === question.correct_answer ? total + 1 : total,
        0
      ),
    [answers, questions]
  );

  const allAnswered = questions.every((_, index) => Boolean(answers[index]));

  const selectAnswer = (questionIndex, option) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const scrollToQuestions = () => {
    requestAnimationFrame(() => {
      questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const startQuestions = () => {
    setStep(isCoachMode ? 'q1' : 'questions');
    scrollToQuestions();
  };

  const goNextFromQuestion = () => {
    if (step === 'q1') {
      setStep('q2');
      return;
    }
    if (step === 'q2') {
      setStep('q3');
      return;
    }
    if (step === 'q3') {
      setStep('q4');
      return;
    }
    if (step === 'q4') {
      setStep('result');
      scrollToQuestions();
    }
  };

  const returnToPlan = () => {
    onComplete?.({ score, total: questions.length, answers });
  };

  const submitPractice = () => {
    if (!allAnswered) return;
    setStep('submitted');
    onComplete?.({ score, total: questions.length, answers, practiceOnly: true });
  };

  const handleRestart = () => {
    setStep('read');
    setAnswers({});
    onRestart?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCoachQuestion = (questionNumber) => {
    if (!currentQuestion) return null;
    const selected = answers[currentQuestionIndex];
    return (
      <div style={boxStyle}>
        <p style={stepLabelStyle}>Frage {questionNumber} von 4</p>
        <h3>{currentQuestion.text}</h3>
        <div style={optionsStyle}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              style={optionButtonStyle(selected === option)}
              onClick={() => selectAnswer(currentQuestionIndex, option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          style={primaryButtonStyle}
          onClick={goNextFromQuestion}
          disabled={!selected}
        >
          Weiter
        </button>
      </div>
    );
  };

  const renderPracticeQuestions = () => (
    <div style={boxStyle}>
      <h3>Fragen zum Text</h3>
      {questions.map((question, index) => (
        <div key={question.question_id} style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            {index + 1}. {question.text}
          </p>
          <div style={optionsStyle}>
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                style={optionButtonStyle(answers[index] === option)}
                onClick={() => selectAnswer(index, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        style={primaryButtonStyle}
        onClick={submitPractice}
        disabled={!allAnswered}
      >
        Antworten abschicken
      </button>
    </div>
  );

  return (
    <>
      <div style={textBoxStyle}>
        <span style={badgeStyle}>A2</span>
        <h2>{model.title}</h2>
        {step === 'read' && (
          <p style={mutedStyle}>
            {isCoachMode
              ? 'Lesen Sie den Text und beantworten Sie danach die Fragen.'
              : 'Lesen Sie den Text und beantworten Sie alle Fragen. Im Home-Bereich gibt es kein Bewertungsfeedback.'}
          </p>
        )}
        <p style={passageStyle}>{model.text}</p>
        {step === 'read' && (
          <button type="button" style={primaryButtonStyle} onClick={startQuestions}>
            Weiter zu den Fragen
          </button>
        )}
      </div>

      <div ref={questionsRef} style={questionsSectionStyle}>
        {isCoachMode && step === 'q1' && renderCoachQuestion(1)}
        {isCoachMode && step === 'q2' && renderCoachQuestion(2)}
        {isCoachMode && step === 'q3' && renderCoachQuestion(3)}
        {isCoachMode && step === 'q4' && renderCoachQuestion(4)}

        {!isCoachMode && step === 'questions' && renderPracticeQuestions()}

        {!isCoachMode && step === 'submitted' && (
          <div style={boxStyle}>
            <h2>Übung abgeschlossen</h2>
            <p style={mutedStyle}>
              Ihre Antworten wurden übermittelt. Auswertung, Lösungen und Lerntipps sind im
              Wochenplan verfügbar.
            </p>
            <button type="button" style={secondaryButtonStyle} onClick={handleRestart}>
              Noch einmal üben
            </button>
          </div>
        )}

        {isCoachMode && step === 'result' && (
          <>
            <div style={boxStyle}>
              <h2>Ergebnis</h2>
              <p style={resultStyle}>
                Sie haben <strong>{score}</strong> von <strong>{questions.length}</strong> Fragen
                richtig beantwortet.
              </p>
              <div style={reviewStyle}>
                {questions.map((question, index) => {
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
              <button type="button" style={primaryButtonStyle} onClick={returnToPlan}>
                Zurück zum Trainingsplan
              </button>
            </div>
            <InfoBox title="⚠️ Häufige Fehler" items={model.mistakes} />
            {model.tip && (
              <div style={boxStyle}>
                <h3>⭐ Lerntipp</h3>
                <p>{model.tip}</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
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

const textBoxStyle = {
  ...boxStyle,
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
};

const questionsSectionStyle = {
  scrollMarginTop: '16px',
};

const passageStyle = {
  whiteSpace: 'pre-line',
  lineHeight: 1.7,
  margin: 0,
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

const mutedStyle = {
  color: '#64748b',
  marginBottom: '12px',
};

const stepLabelStyle = {
  color: '#64748b',
  fontWeight: 600,
  margin: '0 0 8px',
};

const primaryButtonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 700,
  marginTop: '12px',
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

const optionButtonStyle = (selected) => ({
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: '12px',
  border: selected ? '2px solid #2563eb' : '1px solid #cbd5e1',
  backgroundColor: selected ? '#eff6ff' : '#ffffff',
  cursor: 'pointer',
  fontWeight: selected ? 700 : 500,
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
