import React, { useMemo, useState } from 'react';
import { buildWeeklySession } from '../../data/weeklyPlanLibrary';

function cleanLevel(level = 'B1') {
  return String(level).replace('+', '').trim().toUpperCase() || 'B1';
}

function evaluateAnswer(text = '') {
  const answer = text.trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  const strongMarkers = [
    'weil',
    'deshalb',
    'obwohl',
    'damit',
    'während',
    'meiner meinung',
    'ich denke',
    'ich finde',
    'zukunft',
    'erfahrung',
  ];

  const markerCount = strongMarkers.filter((m) =>
    answer.toLowerCase().includes(m)
  ).length;

  if (wordCount >= 35 && markerCount >= 2) return 'strong';
  if (wordCount >= 15 || markerCount >= 1) return 'middle';
  return 'weak';
}

function getAdaptiveTask(level, result, currentSkill) {
  const finalLevel = cleanLevel(level);

  if (result === 'strong') {
    if (finalLevel === 'A2') {
      return {
        text: 'Sehr gut. Jetzt machen wir es etwas schwieriger: Erzählen Sie Ihre Meinung und benutzen Sie „weil“ oder „deshalb“.',
        mode: 'writing',
      };
    }

    if (finalLevel === 'B1') {
      return {
        text: 'Sehr gut. Jetzt wird es schwieriger: Antworten Sie ausführlicher mit Meinung, Grund und eigener Erfahrung.',
        mode: 'writing',
      };
    }

    return {
      text: 'Sehr gut. Jetzt formulieren Sie bitte eine differenzierte Antwort mit Vorteil, Nachteil und persönlicher Bewertung.',
      mode: 'writing',
    };
  }

  if (result === 'middle') {
    return {
      text:
        currentSkill === 'hoeren'
          ? 'Gut. Hören oder lesen Sie die Information noch einmal genau und beantworten Sie die nächste Frage.'
          : 'Gut. Machen Sie weiter und benutzen Sie bitte einen vollständigen Satz mit Verb an der richtigen Position.',
      mode: 'writing',
    };
  }

  return {
    text: 'Kein Problem. Wir üben einfacher: Schreiben Sie bitte einen kurzen, klaren Satz.',
    mode: 'writing',
  };
}

function buildStartMessages(sessionTasks) {
  const firstTask = sessionTasks?.[0]?.task;

  if (!firstTask) {
    return [
      {
        role: 'ai',
        text: 'Bitte stellen Sie sich kurz vor.',
      },
    ];
  }

  return [
    {
      role: 'ai',
      text: firstTask.task || firstTask.title || 'Bitte beginnen Sie mit der ersten Aufgabe.',
    },
  ];
}

export default function WeeklyPlanSessionScreen({ setActiveTab }) {
  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('austriaPathActiveWeeklySession'));
    } catch {
      return null;
    }
  }, []);

  const level = cleanLevel(session?.level || localStorage.getItem('userLevel') || 'B1');

  const weaknesses =
    session?.weaknesses ||
    session?.focusAreas ||
    session?.recommendedFocus ||
    ['selbstvorstellung', 'hoeren', 'planung', 'grammatik'];

  const sessionTasks = useMemo(() => {
    return buildWeeklySession({
      level,
      weaknesses,
      maxMinutes: 20,
    });
  }, [level, weaknesses]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState('speaking');
  const [answer, setAnswer] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [difficulty, setDifficulty] = useState('normal');
  const [results, setResults] = useState([]);
  const [messages, setMessages] = useState(buildStartMessages(sessionTasks));

  if (!session) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <h1>KI-Wochentraining</h1>
        <p>Keine aktive Sitzung gefunden.</p>
      </div>
    );
  }

  const currentTask = sessionTasks[currentStep]?.task;
  const progressText = `${currentStep + 1} / ${sessionTasks.length || 1}`;

  const moveToNextTask = (answerResult) => {
    const nextStep = currentStep + 1;
    const adaptive = getAdaptiveTask(level, answerResult, currentTask?.skill);

    if (answerResult === 'strong') {
      setDifficulty('schwerer');
    } else if (answerResult === 'weak') {
      setDifficulty('leichter');
    } else {
      setDifficulty('normal');
    }

    if (nextStep < sessionTasks.length) {
      const nextTask = sessionTasks[nextStep].task;

      setCurrentStep(nextStep);
      setMode(nextTask.answerMode === 'audio' ? 'speaking' : 'writing');

      setMessages((old) => [
        ...old,
        {
          role: 'ai',
          text: adaptive.text,
        },
        {
          role: 'ai',
          text: nextTask.task || nextTask.text || nextTask.title,
        },
      ]);
    } else {
      setMessages((old) => [
        ...old,
        {
          role: 'ai',
          text: adaptive.text,
        },
        {
          role: 'ai',
          text: 'Sehr gut. Wir nutzen die restliche Zeit für kurze Grammatik- und Satzbauübungen.',
        },
      ]);
    }
  };

  const sendAnswer = () => {
    if (!answer.trim()) return;

    const answerResult = evaluateAnswer(answer);

    setResults((old) => [
      ...old,
      {
        skill: currentTask?.skill || 'training',
        title: currentTask?.title || 'Aufgabe',
        result: answerResult,
        answer,
      },
    ]);

    setMessages((old) => [
      ...old,
      { role: 'student', text: answer },
      {
        role: 'ai',
        text:
          answerResult === 'strong'
            ? 'Das war eine starke Antwort.'
            : answerResult === 'middle'
              ? 'Das war eine gute Antwort. Wir verbessern jetzt die Struktur.'
              : 'Das war noch kurz. Wir üben jetzt einfacher und klarer.',
      },
    ]);

    setAnswer('');
    setTimeout(() => moveToNextTask(answerResult), 300);
  };

  const simulateSpeakingAnswer = () => {
    const fakeAnswer =
      level === 'A2'
        ? 'Ich heiße Ahmed. Ich komme aus Syrien. Ich wohne in Österreich und lerne Deutsch, weil ich arbeiten möchte.'
        : 'Ich lebe seit einigen Jahren in Österreich und lerne Deutsch, weil ich beruflich bessere Möglichkeiten haben möchte. In Zukunft möchte ich eine Ausbildung machen.';

    setAnswer(fakeAnswer);
    setMode('writing');
  };

  const finishSession = () => {
    const strongCount = results.filter((r) => r.result === 'strong').length;
    const weakCount = results.filter((r) => r.result === 'weak').length;

    const report = {
      title: `${session.day || 'Training'}: ${session.title || 'KI-Wochentraining'}`,
      date: new Date().toLocaleDateString('de-DE'),
      summary:
        weakCount > strongCount
          ? 'Training abgeschlossen. Fokus: kurze klare Sätze, Satzbau und Grundgrammatik.'
          : 'Training abgeschlossen. Der Schüler konnte mehrere Aufgaben gut lösen. Die Schwierigkeit wurde erhöht.',
      type: 'weekly-session',
      level,
      difficulty,
      results,
    };

    const oldReports = JSON.parse(localStorage.getItem('austriaPathAIReports') || '[]');
    localStorage.setItem('austriaPathAIReports', JSON.stringify([report, ...oldReports]));
    setFinished(true);
  };

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={() => setActiveTab('profile')}>
        ← Zurück zum Profil
      </button>

      <div style={panelStyle}>
        <h1>🤖 KI-Wochentraining</h1>
        <p>
          Niveau: <b>{level}</b> · Schritt: <b>{progressText}</b> · Schwierigkeit:{' '}
          <b>{difficulty}</b>
        </p>
        <h2>⏱️ 20:00</h2>

        {!started && !finished && (
          <>
            <p>
              Wenn Sie bereit sind, beginnt die KI mit einer kurzen Aufgabe.
              Wenn Ihre Antwort stark ist, wird die nächste Aufgabe schwieriger.
            </p>

            <button style={primaryButtonStyle} onClick={() => setStarted(true)}>
              Ich bin bereit
            </button>
          </>
        )}

        {started && !finished && (
          <>
            {currentTask && (
              <div style={taskInfoStyle}>
                <b>{currentTask.title}</b>
                <p>{currentTask.task || currentTask.text || 'Beantworten Sie die Aufgabe.'}</p>
              </div>
            )}

            <div style={modeRowStyle}>
              <button
                style={mode === 'speaking' ? activeModeButtonStyle : modeButtonStyle}
                onClick={() => setMode('speaking')}
              >
                🎤 Sprechen
              </button>

              <button
                style={mode === 'writing' ? activeModeButtonStyle : modeButtonStyle}
                onClick={() => setMode('writing')}
              >
                ✍️ Schreiben
              </button>
            </div>

            <div style={chatBoxStyle}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={msg.role === 'ai' ? aiMessageStyle : studentMessageStyle}
                >
                  <b>{msg.role === 'ai' ? 'KI:' : 'Sie:'}</b> {msg.text}
                </div>
              ))}
            </div>

            {mode === 'speaking' ? (
              <div style={recordBoxStyle}>
                <p>🎤 Aufnahmebereich</p>
                <button style={recordButtonStyle} onClick={simulateSpeakingAnswer}>
                  Aufnahme testen
                </button>
                <p style={smallTextStyle}>
                  Später: echte Aufnahme + automatische Stopp-Funktion nach 3–4 Sekunden Stille.
                </p>
              </div>
            ) : (
              <textarea
                style={textAreaStyle}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Schreiben Sie Ihre Antwort hier..."
              />
            )}

            {mode === 'writing' && (
              <button style={primaryButtonStyle} onClick={sendAnswer}>
                Antwort senden
              </button>
            )}

            <button style={finishButtonStyle} onClick={finishSession}>
              Sitzung abschließen
            </button>
          </>
        )}

        {finished && (
          <div style={successStyle}>
            <h2>✅ Sitzung abgeschlossen</h2>
            <p>Der Bericht wurde im Profil gespeichert.</p>

            <button style={primaryButtonStyle} onClick={() => setActiveTab('profile')}>
              Zum Profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '90px',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '16px',
};

const panelStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '22px',
  padding: '20px',
  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
};

const taskInfoStyle = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '12px',
  marginBottom: '14px',
};

const modeRowStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '14px',
};

const modeButtonStyle = {
  flex: 1,
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  padding: '12px',
  borderRadius: '14px',
  fontWeight: '700',
  cursor: 'pointer',
};

const activeModeButtonStyle = {
  ...modeButtonStyle,
  backgroundColor: '#2563eb',
  color: '#ffffff',
};

const chatBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '12px',
  marginBottom: '14px',
};

const aiMessageStyle = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '10px',
  borderRadius: '12px',
  marginBottom: '8px',
};

const studentMessageStyle = {
  backgroundColor: '#ecfdf5',
  color: '#166534',
  padding: '10px',
  borderRadius: '12px',
  marginBottom: '8px',
};

const recordBoxStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '16px',
  padding: '14px',
  textAlign: 'center',
  marginBottom: '12px',
};

const recordButtonStyle = {
  border: 'none',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: '800',
  cursor: 'pointer',
};

const textAreaStyle = {
  width: '100%',
  minHeight: '110px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  padding: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  marginBottom: '12px',
};

const primaryButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  marginBottom: '10px',
};

const finishButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: '#16a34a',
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: '13px',
};

const successStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '16px',
  borderRadius: '16px',
};