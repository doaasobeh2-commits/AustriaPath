import React, { useMemo, useState } from 'react';
import {
  WritingPart,
  ReadingClozePart,
  ReadingAdsPart,
  ListeningPart,
  SpeakingPart,
  PlanningPart,
} from './PremiumExamParts';
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
            used: activeExam.number,
            total: packageData.examCount,
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
const [submitted, setSubmitted] = useState({});

const updateAnswer = (value) => {
  setAnswers((old) => ({ ...old, [step]: value }));
};

const submitCurrent = () => {
  setSubmitted((old) => ({ ...old, [step]: true }));
};
  const parts = exam?.parts || [];
  const currentPart = parts[step];

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

  const finishExam = () => {
    const report = {
      title: `${exam.title} · ${exam.level}`,
      date: new Date().toLocaleDateString('de-DE'),
      summary: 'AI-Prüfung abgeschlossen. Bericht wurde gespeichert.',
      type: 'premium-exam',
      level: exam.level,
      packageType: exam.packageData?.type,
      examNumber: exam.number,
      total: exam.total,
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

      <div style={heroStyle}>
        <h1>🧪 {exam.title}</h1>
        <p>
          {exam.level} · Prüfung {exam.used}/{exam.total}
        </p>
      </div>

      {!started && !finished && (
        <div style={cardStyle}>
          <h2>Prüfung bereit</h2>
          <p>
            Diese Prüfung simuliert einen vollständigen AI-Prüfer. Während der Prüfung wird
            nicht ausführlich erklärt. Am Ende bekommst du einen Bericht.
          </p>

          <button style={primaryButtonStyle} onClick={() => setStarted(true)}>
            ▶️ Prüfung starten
          </button>
        </div>
      )}

   <>
  {currentPart?.type === 'writing' && (
    <WritingPart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  {currentPart?.type === 'reading_cloze' && (
    <ReadingClozePart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  {currentPart?.type === 'reading_ads' && (
    <ReadingAdsPart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  {currentPart?.type === 'listening' && (
    <ListeningPart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  {(currentPart?.type === 'self_intro' || currentPart?.type === 'image') && (
    <SpeakingPart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  {(currentPart?.type === 'planning' || currentPart?.type === 'roleplay') && (
    <PlanningPart part={currentPart} value={answers[step]} onChange={updateAnswer} onSubmit={submitCurrent} submitted={submitted[step]} />
  )}

  <button
    style={primaryButtonStyle}
    onClick={step < parts.length - 1 ? () => setStep(step + 1) : finishExam}
  >
    {step < parts.length - 1 ? 'Weiter' : 'Prüfung abschließen'}
  </button>
</>
            

      {finished && (
        <div style={successStyle}>
          <h2>✅ Prüfung abgeschlossen</h2>
          <p>Der Bericht wurde im Profil gespeichert.</p>

          <button style={primaryButtonStyle} onClick={() => setActiveTab('profile')}>
            Zum Profil
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
};

const aiBoxStyle = {
  backgroundColor: '#f5f3ff',
  color: '#5b21b6',
  padding: '14px',
  borderRadius: '14px',
  margin: '14px 0',
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