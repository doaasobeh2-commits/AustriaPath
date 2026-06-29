import React, { useState } from 'react';

export function WritingPart({ part, value, onChange, onSubmit, submitted }) {
  return (
    <div>
      <h2>{part.title || 'E-Mail schreiben'}</h2>

      <p style={taskTextStyle}>
        {part.instruction || 'Schreiben Sie eine E-Mail. Bearbeiten Sie alle Punkte.'}
      </p>

      {part.taskPoints?.length > 0 && (
        <div style={boxStyle}>
          <b>Aufgabe:</b>
          <ul>
            {part.taskPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        style={textareaStyle}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Schreiben Sie Ihre E-Mail hier..."
      />

      <SubmitButton submitted={submitted} onClick={onSubmit} />
    </div>
  );
}

export function ReadingClozePart({ part, value = {}, onChange, onSubmit, submitted }) {
  const options = part.options || {};
  const numbers = Object.keys(options);

  return (
    <div>
      <h2>{part.title || 'Lesen Teil 1'}</h2>

      <p style={taskTextStyle}>
        {part.instruction || 'Lesen Sie den Text und wählen Sie die richtige Lösung.'}
      </p>

      <div style={textBoxStyle}>
        {part.text}
      </div>

      {numbers.map((num) => (
        <div key={num} style={questionBoxStyle}>
          <b>{num}</b>

          <div style={optionGridStyle}>
            {options[num].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...value, [num]: option })}
                style={{
                  ...optionButtonStyle,
                  background: value[num] === option ? '#dcfce7' : '#ffffff',
                  borderColor: value[num] === option ? '#16a34a' : '#cbd5e1',
                }}
              >
                {value[num] === option ? '✓ ' : ''}
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <SubmitButton submitted={submitted} onClick={onSubmit} />
    </div>
  );
}

export function ReadingAdsPart({ part, value = {}, onChange, onSubmit, submitted }) {
  const questions = part.questions || [];

  return (
    <div>
      <h2>{part.title || 'Lesen Teil 2'}</h2>

      <p style={taskTextStyle}>
        {part.instruction || 'Lesen Sie die Anzeigen und ordnen Sie zu.'}
      </p>

      {part.imageUrl && (
        <img
          src={part.imageUrl}
          alt="Broschüre"
          style={imageStyle}
        />
      )}

      {questions.map((question, index) => (
        <div key={index} style={questionBoxStyle}>
          <p>{question.q}</p>

          <input
            style={smallInputStyle}
            value={value[index] || ''}
            maxLength={1}
            onChange={(e) =>
              onChange({
                ...value,
                [index]: e.target.value.toUpperCase(),
              })
            }
            placeholder="A-H"
          />
        </div>
      ))}

      <SubmitButton submitted={submitted} onClick={onSubmit} />
    </div>
  );
}

export function ListeningPart({ part, value = {}, onChange, onSubmit, submitted }) {
  const questions = part.questions || [];

  const speakText = () => {
    if (!part.audioText) return;

    const utterance = new SpeechSynthesisUtterance(part.audioText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div>
      <h2>{part.title || 'Hören'}</h2>

      <p style={taskTextStyle}>
        {part.instruction || 'Hören Sie den Text und beantworten Sie die Fragen.'}
      </p>

      {part.audioUrl ? (
        <audio controls style={{ width: '100%', marginBottom: 14 }}>
          <source src={part.audioUrl} />
        </audio>
      ) : (
        <button style={recordButtonStyle} onClick={speakText}>
          ▶️ Hörtext abspielen
        </button>
      )}

      {questions.map((question, index) => (
        <div key={index} style={questionBoxStyle}>
          <p>{question.q}</p>

          {question.options?.length > 0 ? (
            question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...value, [index]: option })}
                style={{
                  ...optionButtonStyle,
                  background: value[index] === option ? '#dcfce7' : '#ffffff',
                  borderColor: value[index] === option ? '#16a34a' : '#cbd5e1',
                }}
              >
                {value[index] === option ? '✓ ' : ''}
                {option}
              </button>
            ))
          ) : (
            <input
              style={inputStyle}
              value={value[index] || ''}
              onChange={(e) => onChange({ ...value, [index]: e.target.value })}
              placeholder="Antwort schreiben..."
            />
          )}
        </div>
      ))}

      <SubmitButton submitted={submitted} onClick={onSubmit} />
    </div>
  );
}

export function SpeakingPart({ part, value = '', onChange, onSubmit, submitted }) {
  const [recording, setRecording] = useState(false);
  const [followUp, setFollowUp] = useState(0);

  const questions =
    part.type === 'image'
      ? [
          'Was denken Sie über diese Situation?',
          'Haben Sie so etwas schon erlebt?',
          'Wie ist das in Ihrem Heimatland?',
        ]
      : part.type === 'self_intro'
      ? [
          'Warum lernen Sie Deutsch?',
          'Was möchten Sie in Österreich machen?',
          'Was ist Ihr Ziel?',
        ]
      : [
          'Was schlagen Sie vor?',
          'Wer übernimmt welche Aufgabe?',
          'Was machen Sie, wenn es ein Problem gibt?',
        ];

  const send = () => {
    onSubmit();

    if (followUp < questions.length - 1) {
      setFollowUp(followUp + 1);
    }
  };

  return (
    <div>
      <h2>{part.title || part.label}</h2>

      <p style={taskTextStyle}>
        {part.instruction || 'Antworten Sie mündlich.'}
      </p>

      {part.imageUrl && (
        <img src={part.imageUrl} alt={part.title || 'Bild'} style={imageStyle} />
      )}

      {part.points?.length > 0 && (
        <div style={boxStyle}>
          <b>Punkte:</b>
          <ul>
            {part.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        style={{
          ...recordButtonStyle,
          background: recording ? '#dc2626' : '#7c3aed',
        }}
        onClick={() => setRecording(!recording)}
      >
        {recording ? '⏹ Aufnahme stoppen' : '🎤 Aufnahme starten'}
      </button>

      <div style={boxStyle}>
        <b>AI-Frage:</b>
        <p>{questions[followUp]}</p>
      </div>

      <textarea
        style={textareaStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Demo: Antwort hier schreiben. Später wird hier die Aufnahme transkribiert..."
      />

      <SubmitButton submitted={submitted} onClick={send} />
    </div>
  );
}

export function PlanningPart({ part, value = '', onChange, onSubmit, submitted }) {
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);

  return (
    <div>
      <h2>{part.title || 'Planung / Diskussion'}</h2>

      {!ready ? (
        <div style={boxStyle}>
          <b>Vorbereitung:</b>
          <p>{part.instruction}</p>

          {part.points?.length > 0 && (
            <ul>
              {part.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}

          <button style={submitButtonStyle} onClick={() => setReady(true)}>
            ⏱️ Vorbereitung fertig – Gespräch starten
          </button>
        </div>
      ) : (
        <>
          <div style={boxStyle}>
            <b>AI Prüfer:</b>
            <p>Beginnen wir mit der Planung. Was schlagen Sie zuerst vor?</p>
          </div>

          <button
            style={{
              ...recordButtonStyle,
              background: recording ? '#dc2626' : '#7c3aed',
            }}
            onClick={() => setRecording(!recording)}
          >
            {recording ? '⏹ Aufnahme stoppen' : '🎤 Antwort aufnehmen'}
          </button>

          <textarea
            style={textareaStyle}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Demo: Antwort hier schreiben..."
          />

          <SubmitButton submitted={submitted} onClick={onSubmit} />
        </>
      )}
    </div>
  );
}

function SubmitButton({ submitted, onClick }) {
  return (
    <button
      style={{
        ...submitButtonStyle,
        background: submitted ? '#16a34a' : '#2563eb',
      }}
      onClick={onClick}
    >
      {submitted ? '✓ Antwort gesendet' : 'Antwort senden'}
    </button>
  );
}

const taskTextStyle = {
  color: '#475569',
  lineHeight: 1.6,
};

const boxStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  marginBottom: 14,
  color: '#334155',
};

const textBoxStyle = {
  whiteSpace: 'pre-line',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: 14,
  marginBottom: 14,
  lineHeight: 1.7,
};

const questionBoxStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  marginBottom: 12,
};

const optionGridStyle = {
  display: 'grid',
  gap: 8,
  marginTop: 10,
};

const optionButtonStyle = {
  width: '100%',
  padding: 11,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  textAlign: 'left',
  fontWeight: 700,
};

const textareaStyle = {
  width: '100%',
  minHeight: 140,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: 12,
  fontSize: 15,
  boxSizing: 'border-box',
  marginBottom: 14,
};

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};

const smallInputStyle = {
  width: 70,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  textAlign: 'center',
  fontWeight: 800,
  fontSize: 18,
};

const imageStyle = {
  width: '100%',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  marginBottom: 14,
};

const recordButtonStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: '#7c3aed',
  color: 'white',
  fontWeight: 800,
  marginBottom: 14,
};

const submitButtonStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  fontWeight: 800,
  marginBottom: 12,
};