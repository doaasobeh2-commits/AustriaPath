import React, { useMemo, useState } from 'react';
import { runExaminerMind } from "../../ai/examinerMind/runExaminerMind";
import { runModelRouter } from "../../ai/examinerMind/learning/modelRouter";
export default function PremiumExamSessionScreen({ setActiveTab }) {
  const exam = useMemo(() => {
    try {
      const packageData = JSON.parse(
        localStorage.getItem('austriaPathPremiumExamPackage') || 'null'
      );

      const activeExam =
        packageData?.exams?.find((item) => item.status === 'available') ||
        packageData?.exams?.[0];

      return activeExam
        ? {
            ...activeExam,
            packageData,
            used: activeExam.number || 1,
            total: packageData.totalExams || packageData.examCount || 1,
          }
        : null;
    } catch {
      return null;
    }
  }, []);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState({});

  const parts = exam?.parts || [];
  const currentPart = parts[step] || null;

  const answerKey = (suffix = '') => `${step}${suffix}`;

  const updateAnswer = (key, value) => {
    setAnswers((old) => ({ ...old, [key]: value }));
  };

  const playAudioText = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
const evaluateCurrentPart = async () => {
  if (!currentPart) return null;

  return await runExaminerMind({
    answerText:
      answers[currentPart.id] ||
      answers[currentPart.type] ||
      currentPart.studentAnswer ||
      "",

    taskAnswered: true,

    examType: currentPart.examiner?.examType || "OEIF",
    level: currentPart.examiner?.level || exam.level,
    sectionIndex: currentPart.examiner?.sectionIndex || 0,

    currentSection: {
      title: currentPart.title,
      skill: currentPart.type,
    },

    saveToProfile: true,
  });
};
  const nextStep = () => {
    if (step < parts.length - 1) {
      setStep(step + 1);
    } else {
      finishExam();
    }
  };
const buildExamSummary = (decision = {}) => {
  const score = decision.score || 0;
  const confidence = decision.confidence || 0;

  if (decision.conflicts?.length) {
    return "Die Prüfer sind sich noch nicht vollständig einig. Eine erneute Bewertung wird empfohlen.";
  }

  if (decision.warnings?.length) {
    return "Die Hauptaufgabe wurde nicht vollständig erfüllt. Einige wichtige Prüfungspunkte fehlen.";
  }

  if (confidence < 65) {
    return "Die Bewertung ist noch nicht eindeutig. Eine genauere Analyse wird empfohlen.";
  }

  if (score >= 85) {
    return "Sehr gute Leistung. Die Prüfungsziele wurden sicher erreicht.";
  }

  if (score >= 70) {
    return "Gute Leistung. Die Antwort entspricht weitgehend dem Niveau.";
  }

  if (score >= 55) {
    return "Ausreichende Leistung. Einige Bereiche sollten noch verbessert werden.";
  }

  return "Das gewünschte Prüfungsniveau wurde noch nicht erreicht. Weitere Vorbereitung wird empfohlen.";
};

 

 const finishExam = async () => {
  const aiResult = await runExaminerMind({
  examType: "OEIF",
  level: exam.level,
 currentSection: {
  ...currentPart,
  allParts: exam.parts || [],
  answers,
},
  answerText: answers[currentPart?.type] || "",
  taskAnswered: true,
  saveToProfile: true,
});
await runModelRouter({
  engineName: "reportBuilder",
  mode: "ai_exam",
  prompt: "Bewerte diese Premium-Prüfung und erstelle einen kurzen Bericht auf Deutsch.",
  studentAnswer: JSON.stringify(answers),
  context: {
    serviceType: "ai_exam",
    level: exam.level,
    examType: "OEIF",
  },
});
console.log("Examiner Mind:", aiResult);
  const report = {
    title: `${exam.title} · ${exam.level}`,
    date: new Date().toLocaleDateString('de-DE'),
  summary: buildExamSummary(aiResult.decision),
strongCount:
(aiResult.decision?.strengths || []).length,
middleCount:
  aiResult.decision?.score >= 55 &&
  aiResult.decision?.score < 75
    ? 1
    : 0,
weakCount: aiResult.decision?.score < 55 ? 1 : 0,

strengths: aiResult.decision?.strengths || [],
weaknesses: aiResult.decision?.weaknesses || [],
focusAreas: aiResult.decision?.focusAreas || [],
    type: 'premium-exam',
    level: exam.level,
    packageType: exam.packageData?.packageType,
    examNumber: exam.examNumber || exam.used,
    total: exam.total,
    examinerMind: aiResult,
  };

  try {
    const oldReports = JSON.parse(localStorage.getItem('austriaPathAIReports') || '[]');
    localStorage.setItem('austriaPathAIReports', JSON.stringify([report, ...oldReports]));
  } catch {
    localStorage.setItem('austriaPathAIReports', JSON.stringify([report]));
  }

 setActiveTab('profile');
};


  const renderQuestionsWithInputs = (questions = []) => (
    <div style={infoBoxStyle}>
      <b>Fragen:</b>

      {questions.length === 0 && (
        <p>Die Fragen werden später vom AI-Prüfer passend erstellt.</p>
      )}

      {questions.map((q, index) => (
        <div key={index} style={questionBoxStyle}>
          <p style={questionTextStyle}>{index + 1}. {q.q}</p>
          <input
            style={lineInputStyle}
            placeholder="Antwort schreiben..."
            value={answers[answerKey(`-q-${index}`)] || ''}
            onChange={(e) => updateAnswer(answerKey(`-q-${index}`), e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const renderPartContent = () => {
    if (!currentPart) return null;

    if (currentPart.type === 'writing') {
      return (
        <>
          {currentPart.taskPoints?.length > 0 && (
            <div style={infoBoxStyle}>
              <b>Punkte:</b>
              <ul>
                {currentPart.taskPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          <textarea
            style={textareaStyle}
            placeholder="Schreiben Sie hier Ihre E-Mail..."
            value={answers[answerKey('-writing')] || ''}
            onChange={(e) => updateAnswer(answerKey('-writing'), e.target.value)}
          />
        </>
      );
    }

    if (currentPart.type === 'reading_cloze') {
      return (
        <>
          <div style={infoBoxStyle}>
            <b>Text:</b>
            <p style={{ whiteSpace: 'pre-line' }}>{currentPart.text}</p>
          </div>

          {Object.entries(currentPart.options || {}).map(([gap, options]) => (
            <div key={gap} style={questionBoxStyle}>
              <p style={questionTextStyle}>Lücke {gap}</p>
              <select
                style={inputStyle}
                value={answers[answerKey(`-gap-${gap}`)] || ''}
                onChange={(e) => updateAnswer(answerKey(`-gap-${gap}`), e.target.value)}
              >
                <option value="">Antwort wählen</option>
                {options.map((option, i) => (
                  <option key={i} value={option}>{option}</option>
                ))}
              </select>
            </div>
          ))}
        </>
      );
    }

    if (currentPart.type === 'reading_ads' || currentPart.type === 'reading') {
      return (
        <>
          {currentPart.text && (
            <div style={infoBoxStyle}>
              <b>Text:</b>
              <p style={{ whiteSpace: 'pre-line' }}>{currentPart.text}</p>
            </div>
          )}

          {currentPart.imageUrl && (
            <img src={currentPart.imageUrl} alt={currentPart.title} style={examImageStyle} />
          )}

          {renderQuestionsWithInputs(currentPart.questions || [])}
        </>
      );
    }

    if (currentPart.type === 'listening') {
      return (
        <>
          <button style={purpleButtonStyle} onClick={() => playAudioText(currentPart.audioText)}>
            ▶️ Hörtext abspielen
          </button>

          {renderQuestionsWithInputs(currentPart.questions || [])}

          <div style={hintStyle}>
            Später wird hier ein echtes AI-Audio mit realistischen Hintergrundgeräuschen abgespielt.
          </div>
        </>
      );
    }

    if (currentPart.type === 'self_intro') {
      return (
        <>
          <div style={infoBoxStyle}>
            <b>Punkte:</b>
            <ul>
              {currentPart.points?.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          <div style={aiQuestionStyle}>
            <b>AI-Frage:</b>
            <p>Warum lernen Sie Deutsch?</p>
          </div>

          <button style={purpleButtonStyle}>🎤 Antwort aufnehmen</button>

          <div style={transcriptBoxStyle}>
            Demo: Hier erscheint später die Transkription der Sprachaufnahme.
          </div>
        </>
      );
    }

    if (currentPart.type === 'image') {
      return (
        <>
          {currentPart.imageUrl && (
            <img src={currentPart.imageUrl} alt={currentPart.title} style={examImageStyle} />
          )}

          <div style={infoBoxStyle}>
            <b>Punkte:</b>
            <ul>
              {currentPart.points?.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          <div style={aiQuestionStyle}>
            <b>AI-Frage:</b>
            <p>Was denken Sie über diese Situation?</p>
          </div>

          <button style={purpleButtonStyle}>🎤 Beschreibung aufnehmen</button>

          <div style={transcriptBoxStyle}>
            Demo: Hier erscheint später die Transkription der Sprachaufnahme.
          </div>
        </>
      );
    }

   if (currentPart.type === 'planning' || currentPart.type === 'roleplay') {
  return (
    <>
      <div style={infoBoxStyle}>
        <b>Aufgabe:</b>
        <p>{currentPart.instruction}</p>

        <ul>
          {currentPart.points?.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div style={chatBoxStyle}>
        <div style={aiBubbleStyle}>
          <b>AI-Partner:</b>
          <p>Gut, wir planen zusammen. Was schlagen Sie zuerst vor?</p>
        </div>

        <div style={studentBubbleStyle}>
          <b>Student:</b>
          <p>🎤 Ihre Antwort wird hier später als Audio aufgenommen.</p>
        </div>

        <div style={aiBubbleStyle}>
          <b>AI-Partner:</b>
          <p>Okay. Und wann möchten wir das machen?</p>
        </div>

        <div style={studentBubbleStyle}>
          <b>Student:</b>
          <p>🎤 Nächste Antwort aufnehmen...</p>
        </div>
      </div>

      <button style={purpleButtonStyle}>🎤 Antwort aufnehmen</button>

      <div style={transcriptBoxStyle}>
        Demo: Später läuft hier eine echte interaktive Unterhaltung zwischen AI-Prüfer und Student.
      </div>
    </>
  );
}

    return null;
  };

  if (!exam) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={() => setActiveTab('profile')}>
          ← Zurück
        </button>
        <h1>AI-Prüfung</h1>
        <p>Keine aktive Prüfung gefunden.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={pageStyle}>
        <div style={successStyle}>
          <h2>✅ Prüfung abgeschlossen</h2>
          <p>Der Bericht wurde im Profil gespeichert.</p>
          <button style={primaryButtonStyle} onClick={() => setActiveTab('profile')}>
            Zum Profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={() => setActiveTab('profile')}>
        ← Zurück zum Profil
      </button>

      <div style={heroStyle}>
        <h1>🧪 {exam.title}</h1>
        <p>{exam.level} · Prüfung {exam.used}/{exam.total}</p>
      </div>

      {!started ? (
        <div style={cardStyle}>
          <h2>Prüfung bereit</h2>
          <p>
            Diese Prüfung simuliert einen vollständigen AI-Prüfer. Am Ende bekommst du einen Bericht.
          </p>

          <button style={primaryButtonStyle} onClick={() => setStarted(true)}>
            ▶️ Prüfung starten
          </button>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={badgeStyle}>
            Schritt {step + 1} von {parts.length}
          </p>

          <h2>{currentPart?.title || currentPart?.label}</h2>

          <p style={taskTextStyle}>{currentPart?.instruction}</p>

          {renderPartContent()}

          <button style={primaryButtonStyle} onClick={nextStep}>
            {step < parts.length - 1 ? 'Weiter' : 'Prüfung abschließen'}
          </button>
        </div>
      )}
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

const heroStyle = {
  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  color: '#ffffff',
  padding: '22px',
  borderRadius: '22px',
  marginBottom: '16px',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6',
  marginBottom: '14px',
};

const primaryButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  marginTop: '12px',
};

const purpleButtonStyle = {
  ...primaryButtonStyle,
  marginBottom: '14px',
};

const infoBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '14px',
  marginBottom: '14px',
  color: '#334155',
};

const taskTextStyle = {
  color: '#475569',
  lineHeight: '1.6',
};

const textareaStyle = {
  width: '100%',
  minHeight: '160px',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
  fontSize: '15px',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
};

const questionBoxStyle = {
  marginTop: '14px',
  paddingTop: '12px',
  borderTop: '1px solid #e2e8f0',
};

const questionTextStyle = {
  fontWeight: 'bold',
  color: '#0f172a',
  marginBottom: '8px',
};

const lineInputStyle = {
  width: '100%',
  border: 'none',
  borderBottom: '2px solid #cbd5e1',
  padding: '10px 4px',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

const aiQuestionStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '14px',
  color: '#334155',
};

const transcriptBoxStyle = {
  minHeight: '120px',
  border: '1px solid #cbd5e1',
  borderRadius: '16px',
  padding: '14px',
  color: '#94a3b8',
  fontSize: '15px',
  lineHeight: '1.6',
  marginTop: '12px',
  marginBottom: '14px',
};

const examImageStyle = {
  width: '100%',
  borderRadius: '18px',
  marginBottom: '14px',
  objectFit: 'cover',
};

const hintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  borderRadius: '14px',
  padding: '12px',
  fontSize: '13px',
  lineHeight: '1.5',
  marginBottom: '14px',
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#ede9fe',
  color: '#7c3aed',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: '800',
};

const successStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '18px',
  borderRadius: '18px',
};

const chatBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '14px',
  marginBottom: '14px',
};

const aiBubbleStyle = {
  backgroundColor: '#ede9fe',
  color: '#4c1d95',
  padding: '12px',
  borderRadius: '14px',
  marginBottom: '10px',
};

const studentBubbleStyle = {
  backgroundColor: '#e0f2fe',
  color: '#075985',
  padding: '12px',
  borderRadius: '14px',
  marginBottom: '10px',
  marginLeft: '24px',
};