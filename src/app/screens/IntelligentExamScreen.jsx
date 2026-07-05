import React, { useState, useEffect } from 'react';
import { requestOpenAIProxy } from '../../security/secureOpenAI';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'de-AT';
  recognition.interimResults = false;
}

const LEVEL_CONFIG = {
  A2: {
    title: 'A2 Sprechtraining',
    intro:
      'Willkommen zum A2 Sprechtraining. Bitte stellen Sie sich einfach vor: Name, Herkunft, Wohnort, Familie und Hobbys.',
    system:
      'Du bist ein freundlicher Deutsch-Sprachtrainer für A2. Stelle einfache kurze Fragen. Verwende einfache deutsche Sprache. Frage nach Name, Herkunft, Wohnort, Familie, Arbeit, Freizeit und Alltag. Du bist kein Prüfer.',
    planning:
      'Teil 2: Gemeinsam etwas planen. Sie möchten mit einem Freund Deutsch lernen. Planen Sie: Wann? Wo? Wie lange? Was bringen Sie mit?',
    picture:
      'Teil 3: Bildbeschreibung. Bitte beschreiben Sie einfach: Was sehen Sie? Wo sind die Personen? Was machen sie?'
  },
  B1: {
    title: 'B1 Sprechtraining',
    intro:
      'Willkommen zum B1 Sprechtraining. Bitte stellen Sie sich vor und erzählen Sie etwas über Herkunft, Beruf, Wohnen, Familie und Zukunftspläne.',
    system:
      'Du bist ein Deutsch-Sprachtrainer für B1. Stelle realistische Übungsfragen. Verwende normales, klares Deutsch. Frage nach Gründen, Erfahrungen und Meinungen. Du bist kein Prüfer.',
    planning:
      'Teil 2: Gemeinsam etwas planen. Ein Kollege ist krank und liegt im Krankenhaus. Planen Sie gemeinsam einen Besuch und ein Geschenk.',
    picture:
      'Teil 3: Bildbeschreibung. Beschreiben Sie das Bild genau. Sagen Sie auch Ihre Meinung und erzählen Sie eine passende Erfahrung.'
  },
  B2: {
    title: 'B2 Sprechtraining',
    intro:
      'Willkommen zum B2 Sprechtraining. Bitte stellen Sie sich ausführlich vor und sprechen Sie über Ausbildung, Beruf, Integration, Ziele und persönliche Erfahrungen.',
    system:
      'Du bist ein Deutsch-Sprachtrainer für B2. Stelle anspruchsvollere Übungsfragen. Fordere Begründungen, Beispiele, Vergleiche und persönliche Meinungen. Verwende gehobenes, aber klares Deutsch. Du bist kein Prüfer.',
    planning:
      'Teil 2: Gemeinsam etwas planen. Ihre Sprachschule organisiert eine Informationsveranstaltung zum Thema Integration und Arbeit in Österreich. Planen Sie gemeinsam Ablauf, Gäste, Aufgaben und Werbung.',
    picture:
      'Teil 3: Bildbeschreibung und Diskussion. Beschreiben Sie das Bild, interpretieren Sie die Situation und diskutieren Sie mögliche gesellschaftliche Hintergründe.'
  }
};

const PRESET_BILDER = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
    theme: 'Menschen arbeiten zusammen im Büro'
  }
];

export function IntelligentExamScreen({ level, onBackToLevels }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.A2;

  const [examStep, setExamStep] = useState('intro');
  const [currentImage] = useState(PRESET_BILDER[0]);
  const [isListening, setIsListening] = useState(false);
  const [studentText, setStudentText] = useState('');
  const [aiResponse, setAiResponse] = useState(config.intro);
  const [isLoading, setIsLoading] = useState(false);
  const [finalReport, setFinalReport] = useState('');

  const [conversationHistory, setConversationHistory] = useState([
    {
      role: 'system',
      content: config.system
    },
    {
      role: 'assistant',
      content: config.intro
    }
  ]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setStudentText(speechToText);
      processStudentTurn(speechToText);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [conversationHistory, examStep]);

  const toggleListening = () => {
    if (!recognition) {
      alert(
        'Speech recognition wird in diesem Browser nicht unterstützt. Bitte Google Chrome verwenden.'
      );
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const processStudentTurn = async (text) => {
    const nextHistory = [
      ...conversationHistory,
      {
        role: 'user',
        content: text
      }
    ];

    setConversationHistory(nextHistory);
    await dispatchOpenAI(nextHistory);
  };

  const dispatchOpenAI = async (currentHistory) => {
    const demoReply =
      level === 'A2'
        ? 'Danke. Können Sie bitte noch mehr über Ihre Familie oder Ihre Hobbys erzählen?'
        : level === 'B1'
        ? 'Danke. Können Sie das bitte genauer erklären und ein Beispiel nennen?'
        : 'Danke. Können Sie Ihre Meinung dazu ausführlicher begründen und einen Vergleich machen?';

    setIsLoading(true);

    try {
      const data = await requestOpenAIProxy({ messages: currentHistory });
      const aiReply = data.result || demoReply;

      setAiResponse(aiReply);
      setConversationHistory([
        ...currentHistory,
        {
          role: 'assistant',
          content: aiReply
        }
      ]);
    } catch (err) {
      setAiResponse(demoReply);
      setConversationHistory([
        ...currentHistory,
        {
          role: 'assistant',
          content: demoReply
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const advanceStep = (next) => {
    setExamStep(next);

    let msg = '';

    if (next === 'planning') {
      msg = config.planning;
    }

    if (next === 'picture') {
      msg = config.picture;
    }

    if (next === 'finished') {
      generateFinalReport();
      return;
    }

    setAiResponse(msg);
    setConversationHistory([
      ...conversationHistory,
      {
        role: 'assistant',
        content: msg
      }
    ]);
  };

  const generateFinalReport = async () => {
    setIsLoading(true);

    const demoReport = `
Demo Bewertung für ${level}:

Gesamtnote: 72 / 100

Grammatik: 18 / 25
Wortschatz: 18 / 25
Flüssigkeit: 17 / 25
Kommunikation: 19 / 25

Feedback:
Sie können auf Fragen reagieren. Versuchen Sie, längere Antworten zu geben und mehr Verbindungswörter zu benutzen.

Empfehlung:
Üben Sie täglich 10 Minuten Selbstvorstellung, Planung und Bildbeschreibung.
`;

    try {
      const data = await requestOpenAIProxy({
        messages: [
          ...conversationHistory,
          {
            role: 'user',
            content: `Die ${level}-Prüfung ist beendet. Gib eine Bewertung auf Deutsch mit Punkten von 0 bis 100. Bewerte Grammatik, Wortschatz, Flüssigkeit und Kommunikation. Gib konkrete Tipps für das Niveau ${level}.`
          }
        ]
      });

      setFinalReport(data.result || demoReport);
    } catch (err) {
      setFinalReport(demoReport);
    } finally {
      setExamStep('finished');
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '750px',
        margin: '0 auto',
        color: '#1e293b'
      }}
    >
      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  }}
>
  <h2>{config.title}</h2>

  <button
    onClick={onBackToLevels}
    style={{
      padding: '8px 14px',
      border: 'none',
      borderRadius: '8px',
      background: '#e2e8f0',
      cursor: 'pointer'
    }}
  >
    ← Zurück
  </button>
</div>

      <p style={{ color: '#64748b' }}>
        Niveau: <strong>{level}</strong> — Trainieren Sie Vorstellung, gemeinsames Planen und Bildbeschreibung.
      </p>

      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        {['intro', 'planning', 'picture', 'finished'].map((stepItem) => (
          <div
            key={stepItem}
            style={{
              flex: 1,
              height: '8px',
              borderRadius: '4px',
              backgroundColor:
                examStep === stepItem ? '#2563eb' : '#e2e8f0'
            }}
          />
        ))}
      </div>

      {examStep === 'planning' && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}
        >
          {config.planning}
        </div>
      )}

      {examStep === 'picture' && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <img
            src={currentImage.url}
            style={{
              maxWidth: '100%',
              maxHeight: '220px',
              borderRadius: '12px'
            }}
            alt="Exam"
          />
        </div>
      )}

      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}
      >
        <strong>AI Sprachcoach:</strong>
        <p>{isLoading ? 'Bitte warten...' : aiResponse}</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <strong>Ihre Antwort:</strong>
        <p style={{ fontStyle: 'italic', color: '#64748b' }}>
          {studentText || 'Noch keine Antwort aufgenommen.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={toggleListening}
          disabled={isLoading || examStep === 'finished'}
          style={{
            padding: '12px 24px',
            color: '#ffffff',
            backgroundColor: isListening ? '#ef4444' : '#22c55e',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isListening ? 'Stop Mic' : 'Start Mic'}
        </button>

        {examStep === 'intro' && (
          <button
            onClick={() => advanceStep('planning')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Weiter: Planen
          </button>
        )}

        {examStep === 'planning' && (
          <button
            onClick={() => advanceStep('picture')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Weiter: Bild
          </button>
        )}

        {examStep === 'picture' && (
          <button
            onClick={() => advanceStep('finished')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Training beenden
          </button>
        )}
      </div>

      {examStep === 'finished' && finalReport && (
        <div
          style={{
            marginTop: '24px',
            backgroundColor: '#f0fdf4',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #bbf7d0'
          }}
        >
          <h3>Feedback</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{finalReport}</p>
        </div>
      )}
    </div>
  );
}