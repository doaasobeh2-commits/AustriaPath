import React, { useEffect, useMemo, useState } from 'react';
import { getUserLanguage } from '../../utils/userPreferences';

export default function AISessionScreen({
  mode = 'exam', // exam | weekly_plan | placement_test
  sessionType = 'ai_exam', // ai_exam | weekly_plan | placement_test | intensive_week | premium_month
  title = 'AustriaPath AI',
  level = 'B1',
  parts = [],
  onFinish,
  onBack,
}) {
  const defaultExamParts = useMemo(
    () => [
      {
        type: 'writing',
        label: 'Schreiben',
        title: 'E-Mail schreiben',
        instruction: 'Schreiben Sie eine E-Mail zur folgenden Situation.',
        points: ['Anrede', 'Grund', 'Bitte/Vorschlag', 'Grußformel'],
      },
      {
        type: 'reading',
        label: 'Lesen',
        title: 'Lesen',
        instruction: 'Lesen Sie den Text und beantworten Sie die Fragen.',
        text:
          'Sie erhalten eine Nachricht von Ihrem Deutschkurs. Der Unterricht am Freitag beginnt nicht um 18:00 Uhr, sondern erst um 19:00 Uhr, weil der Raum vorher besetzt ist.',
        questions: [
          { q: 'Wann beginnt der Unterricht am Freitag?', options: ['18:00 Uhr', '19:00 Uhr', '20:00 Uhr'] },
          { q: 'Warum beginnt der Unterricht später?', options: ['Der Lehrer ist krank', 'Der Raum ist besetzt', 'Der Kurs fällt aus'] },
        ],
      },
      {
        type: 'listening',
        label: 'Hören',
        title: 'Hören',
        instruction: 'Hören Sie den Text und beantworten Sie die Fragen.',
        audioText:
          'Guten Tag, hier ist die Sprachschule. Der Kurs beginnt heute 30 Minuten später.',
        questions: [
          { q: 'Wer ruft an?', options: ['Die Sprachschule', 'Der Arzt', 'Der Nachbar'] },
          { q: 'Was ist die Information?', options: ['Der Kurs beginnt früher', 'Der Kurs beginnt später', 'Der Kurs ist morgen'] },
        ],
      },
      {
        type: 'self_intro',
        label: 'Sprechen',
        title: 'Selbstvorstellung',
        instruction: 'Bitte stellen Sie sich kurz vor.',
        points: ['Name', 'Herkunft', 'Wohnort', 'Arbeit oder Kurs', 'Familie', 'Freizeit'],
      },
      {
        type: 'image',
        label: 'Bildbeschreibung',
        title: 'Bildbeschreibung',
        instruction: 'Beschreiben Sie das Bild. Sagen Sie auch Ihre Meinung oder Erfahrung.',
        imageUrl: '',
        points: ['Wer ist auf dem Bild?', 'Wo sind die Personen?', 'Was machen sie?', 'Wie ist Ihre Meinung?'],
      },
      {
        type: 'planning',
        label: 'Planung',
        title: 'Etwas gemeinsam planen',
        instruction: 'Planen Sie gemeinsam eine Aktivität.',
        points: ['Wann?', 'Wo?', 'Wer kommt?', 'Was brauchen Sie?', 'Wer macht was?'],
        preparationSeconds: 10,
      },
    ],
    []
  );

  const sessionParts = parts?.length ? parts : defaultExamParts;

  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [prepTime, setPrepTime] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [playedAudio, setPlayedAudio] = useState(false);

  const current = sessionParts[step];
useEffect(() => {
  localStorage.removeItem('austriaPathCurrentSessionAnswers');
}, []);
  useEffect(() => {
    if (!started || current?.type !== 'planning') return;

    const seconds = current.preparationSeconds ?? 10;
    setPrepTime(seconds);

    const timer = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, started, current?.type]);

  useEffect(() => {
    setRecording(false);
    setAnswer('');
    setAnswers({});
    setPlayedAudio(false);
  }, [step]);

  if (!current) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={onBack}>← Zurück</button>
        <h1>{title}</h1>
        <p>Keine Aufgabe gefunden.</p>
      </div>
    );
  }

  const evaluateCurrentAnswer = () => {
  const textAnswer = String(answer || '').trim();
  const writtenAnswers = Object.values(answers || {}).join(' ').trim();

  const combined = `${textAnswer} ${writtenAnswers}`.trim();
  const wordCount = combined.split(/\s+/).filter(Boolean).length;

  const strongWords = [
    'weil',
    'deshalb',
    'obwohl',
    'trotzdem',
    'außerdem',
    'meiner meinung',
    'ich denke',
    'ich finde',
    'erfahrung',
    'zukunft',
  ];

  const markerCount = strongWords.filter((w) =>
    combined.toLowerCase().includes(w)
  ).length;

  if (current.type === 'reading' || current.type === 'listening') {
    const answeredCount = Object.keys(answers || {}).length;
    const questionCount = current.questions?.length || 0;

    if (questionCount && answeredCount >= questionCount) return 'strong';
    if (answeredCount > 0) return 'middle';
    return 'weak';
  }

  if (wordCount >= 30 && markerCount >= 2) return 'strong';
  if (wordCount >= 12 || markerCount >= 1) return 'middle';
  return 'weak';
};

const buildAdaptiveFeedback = (result) => {
  if (result === 'strong') {
    return 'Sehr gut. Die nächste Aufgabe wird etwas schwieriger. Bitte benutzen Sie mehr Begründungen, Beispiele und passende Konnektoren.';
  }

  if (result === 'middle') {
    return 'Gut. Achten Sie jetzt besonders auf Satzbau, Verbposition und vollständige Antworten.';
  }

  return 'Kein Problem. Wir machen es einfacher: Antworten Sie kurz, klar und mit einem vollständigen Satz.';
};

const saveCurrentStep = () => {
  const result = evaluateCurrentAnswer();

  const savedStep = {
    step: step + 1,
    type: current.type,
    title: current.title,
    label: current.label,
    result,
    answer,
    answers,
    feedback: buildAdaptiveFeedback(result),
    savedAt: new Date().toISOString(),
  };

  const oldSessionAnswers = JSON.parse(
    localStorage.getItem('austriaPathCurrentSessionAnswers') || '[]'
  );

  localStorage.setItem(
    'austriaPathCurrentSessionAnswers',
    JSON.stringify([...oldSessionAnswers, savedStep])
  );

  return savedStep;
};
const getAdaptiveMessage = (result) => {
  const lang = getUserLanguage();

  const messages = {
    Deutsch: {
      strong: 'Sehr gut. Die nächste Aufgabe wird etwas schwieriger.',
      middle: 'Gut. Achten Sie jetzt besonders auf Satzbau und Wortschatz.',
      weak: 'Kein Problem. Wir machen die nächste Aufgabe etwas einfacher.',
    },
    العربية: {
      strong: 'إجابتك قوية. السؤال التالي سيكون أصعب قليلاً.',
      middle: 'إجابتك جيدة. انتبه أكثر إلى ترتيب الجملة والمفردات.',
      weak: 'لا مشكلة. سنجعل المهمة التالية أسهل قليلاً.',
    },
    Türkçe: {
      strong: 'Cevabınız güçlü. Bir sonraki görev biraz daha zor olacak.',
      middle: 'İyi cevap. Şimdi cümle yapısına ve kelime kullanımına dikkat edin.',
      weak: 'Sorun değil. Bir sonraki görev biraz daha kolay olacak.',
    },
    فارسی: {
      strong: 'پاسخ شما خوب بود. سؤال بعدی کمی سخت‌تر خواهد بود.',
      middle: 'پاسخ خوبی بود. اکنون به ساختار جمله و واژگان توجه کنید.',
      weak: 'اشکالی ندارد. تمرین بعدی کمی آسان‌تر خواهد بود.',
    },
    Українська: {
      strong: 'Ваша відповідь була дуже хорошою. Наступне завдання буде трохи складнішим.',
      middle: 'Хороша відповідь. Зверніть увагу на побудову речень та словниковий запас.',
      weak: 'Нічого страшного. Наступне завдання буде трохи легшим.',
    },
  };

  return messages[lang]?.[result] || messages.Deutsch[result];
};
const nextStep = () => {
  const savedStep = saveCurrentStep();

  if (step < sessionParts.length - 1) {
  alert(getAdaptiveMessage(savedStep.result));
    setStep(step + 1);
  } else {
    const sessionAnswers = JSON.parse(
      localStorage.getItem('austriaPathCurrentSessionAnswers') || '[]'
    );
const strongCount = sessionAnswers.filter((x) => x.result === 'strong').length;
const middleCount = sessionAnswers.filter((x) => x.result === 'middle').length;
const weakCount = sessionAnswers.filter((x) => x.result === 'weak').length;

const strengths = sessionAnswers
  .filter((x) => x.result === 'strong')
  .map((x) => x.label || x.title || x.type);

const weaknesses = sessionAnswers
  .filter((x) => x.result === 'weak')
  .map((x) => x.label || x.title || x.type);

const focusAreas = weaknesses.length
  ? weaknesses
  : sessionAnswers
      .filter((x) => x.result === 'middle')
      .map((x) => x.label || x.title || x.type);
    if (import.meta.env.DEV) {
      console.log('SESSION ANSWERS', sessionAnswers);
      console.log('STRONG', strongCount, 'MIDDLE', middleCount, 'WEAK', weakCount);
    }
const buildSmartSummary = () => {
  if (weakCount === 0 && strongCount >= middleCount) {
    return 'Sehr gute Sitzung. Die meisten Aufgaben wurden sicher gelöst. Der Schüler kann mit schwierigeren Aufgaben weitertrainieren.';
  }

  if (strongCount > weakCount && middleCount > 0) {
    return 'Gute Sitzung. Der Schüler zeigt stabile Leistungen, braucht aber noch mehr Sicherheit in einzelnen Bereichen.';
  }

  if (weakCount > strongCount) {
    return 'Die Sitzung zeigt klare Schwächen. Der Schüler braucht gezieltes Training mit einfachen, vollständigen Sätzen und mehr Struktur.';
  }

  return 'Die Sitzung ist gemischt. Einige Aufgaben wurden gut gelöst, andere brauchen noch Wiederholung und gezielte Übung.';
};

const buildSmartRecommendation = () => {
  if (focusAreas.length > 0) {
    return `Nächster Fokus: ${[...new Set(focusAreas)].slice(0, 2).join(' und ')} gezielt wiederholen.`;
  }

  if (weaknesses.length > 0) {
    return `Wiederhole zuerst: ${[...new Set(weaknesses)].slice(0, 2).join(' und ')}.`;
  }

  return 'Weiter mit einer schwierigeren Aufgabe oder einer AI Probeprüfung.';
};
const report = {
  title,
  sessionType,
  mode,
  level,
  date: new Date().toLocaleDateString('de-DE'),
  finishedAt: new Date().toISOString(),
  partsCount: sessionParts.length,

  strongCount,
  middleCount,
  weakCount,

  strengths: [...new Set(strengths)],
  weaknesses: [...new Set(weaknesses)],
  focusAreas: [...new Set(focusAreas)],

  results: sessionAnswers,

  summary: buildSmartSummary(),

nextRecommendation: buildSmartRecommendation(),
};
    const oldReports = JSON.parse(
      localStorage.getItem('austriaPathAIReports') || '[]'
    );

    localStorage.setItem('austriaPathLastAIReport', JSON.stringify(report));
    localStorage.setItem(
  'austriaPathLastWeaknesses',
  JSON.stringify(report.focusAreas || [])
);

localStorage.setItem(
  'austriaPathLastStrengths',
  JSON.stringify(report.strengths || [])
);
    localStorage.setItem(
      'austriaPathAIReports',
      JSON.stringify([report, ...oldReports])
    );
    localStorage.removeItem('austriaPathCurrentSessionAnswers');

    onFinish?.(report);
  }
};

  const playAudio = () => {
    setPlayedAudio(true);

    if (current.audioText && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(current.audioText);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const setQuestionAnswer = (index, value) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={onBack}>← Zurück</button>

      <div style={heroStyle}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ marginBottom: 0 }}>
          Niveau {level} · Teil {step + 1} / {sessionParts.length}
        </p>
        <p style={{ marginBottom: 0, opacity: 0.9 }}>
          {getSessionText(sessionType)}
        </p>
      </div>

      {!started ? (
        <div style={cardStyle}>
          <h2>Bereit?</h2>
          <p style={mutedStyle}>
            Die KI führt dich Schritt für Schritt. Die Seite passt sich automatisch an:
            Schreiben, Lesen, Hören, Sprechen, Bildbeschreibung oder Planung.
          </p>

          <button style={primaryButtonStyle} onClick={() => setStarted(true)}>
            ▶️ Starten
          </button>
        </div>
      ) : (
        <div style={cardStyle}>
          <span style={badgeStyle}>{current.label || current.type}</span>

          <h2>{current.title}</h2>

          {current.instruction && <p style={mutedStyle}>{current.instruction}</p>}

          {current.points?.length > 0 && (
            <div style={infoBoxStyle}>
              <b>Aufgabe:</b>
              <ul>
                {current.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {current.type === 'writing' && (
            <WritingTask answer={answer} setAnswer={setAnswer} />
          )}

          {current.type === 'reading' && (
            <ReadingTask
              current={current}
              answers={answers}
              setQuestionAnswer={setQuestionAnswer}
            />
          )}

          {current.type === 'listening' && (
            <ListeningTask
              current={current}
              answers={answers}
              setQuestionAnswer={setQuestionAnswer}
              playAudio={playAudio}
              playedAudio={playedAudio}
            />
          )}

          {current.type === 'self_intro' && (
            <SpeakingTask
              recording={recording}
              setRecording={setRecording}
              aiText="Bitte sprechen Sie frei. Die KI stellt danach eine passende Frage."
            />
          )}

          {current.type === 'image' && (
            <ImageTask
              current={current}
              recording={recording}
              setRecording={setRecording}
            />
          )}

          {(current.type === 'planning' || current.type === 'roleplay') && (
            <PlanningTask
              prepTime={prepTime}
              recording={recording}
              setRecording={setRecording}
            />
          )}

          {current.type === 'grammar' && (
            <GrammarTask answer={answer} setAnswer={setAnswer} />
          )}

          <button style={primaryButtonStyle} onClick={nextStep}>
            {step < sessionParts.length - 1 ? '➡ Weiter' : '✅ Abschließen'}
          </button>
        </div>
      )}
    </div>
  );
}

function getSessionText(sessionType) {
  if (sessionType === 'weekly_plan') return 'Flexibles KI-Training nach deinen Schwächen';
  if (sessionType === 'placement_test') return 'Kurzer Einstufungstest mit KI';
  if (sessionType === 'intensive_week') return 'Intensive Woche';
  if (sessionType === 'premium_month') return 'Premium Monat';
  return 'AI Probeprüfung';
}

function WritingTask({ answer, setAnswer }) {
  return (
    <textarea
      style={textareaStyle}
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      placeholder="Schreiben Sie Ihre E-Mail hier..."
    />
  );
}

function ReadingTask({ current, answers, setQuestionAnswer }) {
  return (
    <>
      {current.text && <div style={textBoxStyle}>{current.text}</div>}

      {current.questions?.map((q, index) => (
        <div key={index} style={questionBoxStyle}>
          <b>{index + 1}. {q.q}</b>

         {q.options?.length === 1 && q.options[0] === 'Antwort schreiben' ? (
  <input
    type="text"
    value={answers[index] || ''}
    onChange={(e) => setQuestionAnswer(index, e.target.value)}
    placeholder="Antwort hier schreiben..."
    style={inputAnswerStyle}
  />
) : (
  q.options?.map((option) => (
    <button
      key={option}
      style={{
        ...choiceButtonStyle,
        backgroundColor: answers[index] === option ? '#dbeafe' : '#ffffff',
        borderColor: answers[index] === option ? '#2563eb' : '#cbd5e1',
      }}
      onClick={() => setQuestionAnswer(index, option)}
    >
      {option}
    </button>
  ))
)}
        </div>
      ))}
    </>
  );
}

function ListeningTask({ current, answers, setQuestionAnswer, playAudio, playedAudio }) {
  return (
    <>
      <button style={audioButtonStyle} onClick={playAudio}>
        🔊 Audio abspielen
      </button>

      {playedAudio && (
        <p style={mutedStyle}>
          Audio wurde abgespielt. Bitte beantworten Sie die Fragen.
        </p>
      )}

      {current.questions?.map((q, index) => (
        <div key={index} style={questionBoxStyle}>
          <b>{index + 1}. {q.q}</b>

          {q.options?.length === 1 && q.options[0] === 'Antwort schreiben' ? (
            <input
              type="text"
              value={answers[index] || ''}
              onChange={(e) => setQuestionAnswer(index, e.target.value)}
              placeholder="Antwort hier schreiben..."
              style={inputAnswerStyle}
            />
          ) : (
            q.options?.map((option) => (
              <button
                key={option}
                style={{
                  ...choiceButtonStyle,
                  backgroundColor: answers[index] === option ? '#dcfce7' : '#ffffff',
                  borderColor: answers[index] === option ? '#16a34a' : '#cbd5e1',
                }}
                onClick={() => setQuestionAnswer(index, option)}
              >
                {option}
              </button>
            ))
          )}
        </div>
      ))}
    </>
  );
}
function SpeakingTask({ recording, setRecording, aiText }) {
  return (
    <>
      <div style={aiBoxStyle}>
        <b>AI Prüfer:</b> {aiText || 'Bitte sprechen Sie frei.'}
      </div>

      <VoiceButtons recording={recording} setRecording={setRecording} />
    </>
  );
}
function ImageTask({ current, recording, setRecording }) {
  return (
    <>
      {current.imageUrl ? (
        <img src={current.imageUrl} alt="Bildbeschreibung" style={imageStyle} />
      ) : (
        <div style={imagePlaceholderStyle}>🖼️ Bild kommt später aus der KI-Bibliothek</div>
      )}

      <VoiceButtons recording={recording} setRecording={setRecording} />
    </>
  );
}

function PlanningTask({ prepTime, recording, setRecording }) {
  return (
    <>
      {prepTime > 0 ? (
        <div style={timerStyle}>⏱️ Vorbereitung: {prepTime} Sekunden</div>
      ) : (
        <div style={aiBoxStyle}>
          <b>AI Prüfer:</b> Beginnen wir. Was schlagen Sie zuerst vor?
        </div>
      )}

      {prepTime === 0 && (
        <VoiceButtons recording={recording} setRecording={setRecording} />
      )}
    </>
  );
}

function GrammarTask({ answer, setAnswer }) {
  return (
    <textarea
      style={textareaStyle}
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      placeholder="Schreiben Sie die richtige Antwort..."
    />
  );
}

function VoiceButtons({ recording, setRecording }) {
  return (
    <div style={voiceBoxStyle}>
      {!recording ? (
        <button style={recordButtonStyle} onClick={() => setRecording(true)}>
          🎙️ Aufnahme starten
        </button>
      ) : (
        <button style={stopButtonStyle} onClick={() => setRecording(false)}>
          ⏹ Aufnahme stoppen
        </button>
      )}

      <p style={mutedStyle}>
        Später wird hier echte Aufnahme, automatische Stopp-Funktion und KI-Auswertung verbunden.
      </p>
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

const heroStyle = {
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
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

const primaryButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  marginTop: '14px',
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: '800',
};

const mutedStyle = {
  color: '#64748b',
  lineHeight: '1.6',
};

const infoBoxStyle = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '14px',
  borderRadius: '14px',
  margin: '14px 0',
};

const aiBoxStyle = {
  backgroundColor: '#f5f3ff',
  color: '#5b21b6',
  padding: '14px',
  borderRadius: '14px',
  margin: '14px 0',
};

const timerStyle = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  textAlign: 'center',
  margin: '14px 0',
};

const voiceBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '14px',
  margin: '14px 0',
};

const recordButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
};

const stopButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#111827',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
};

const audioButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  margin: '14px 0',
};

const choiceButtonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
  textAlign: 'left',
};

const textareaStyle = {
  width: '100%',
  minHeight: '150px',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
  marginTop: '12px',
};

const textBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: '14px',
  borderRadius: '14px',
  margin: '14px 0',
  whiteSpace: 'pre-line',
};

const questionBoxStyle = {
  marginTop: '14px',
};

const imageStyle = {
  width: '100%',
  borderRadius: '16px',
  margin: '14px 0',
};

const imagePlaceholderStyle = {
  backgroundColor: '#f1f5f9',
  border: '1px dashed #94a3b8',
  color: '#475569',
  borderRadius: '16px',
  padding: '40px 14px',
  textAlign: 'center',
  margin: '14px 0',
  fontWeight: '700',
};
const inputAnswerStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
  marginTop: '10px',
};