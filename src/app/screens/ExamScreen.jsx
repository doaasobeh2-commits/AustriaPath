import React, { useState, useEffect } from 'react';

const OPENAI_API_KEY = 'sk-...';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'de-AT'; 
  recognition.interimResults = false;
}

export function ExamScreen() {
  const [isListening, setIsListening] = useState(false);
  const [studentText, setStudentText] = useState('');
  const [aiResponse, setAiResponse] = useState('Willkommen! Bitte stellen Sie sich vor und erzählen Sie etwas über sich (Name, Herkunft, Beruf/Studium).');
  const [examStep, setExamStep] = useState('intro'); 
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: 'Du bist ein offizieller ÖIF (Österreichischer Integrationsfonds) Prüfer für das B1/A2 Sprechen. Deine Aufgabe ist es, den Schüler schrittweise zu prüfen: 1. Über sich sprechen (Frage nach Heimatstadt/Studium, wenn er Herkunft nennt). 2. Gemeinsam etwas planen (Nutze Vorlagen/Templates für Dialoge). 3. Bildbeschreibung (Stelle am Ende 2 Fragen). Antworte IMMER auf Deutsch (Österreich), kurz, präzise und realistisch wie ein Prüfer. Wenn der User auf "Finish" klickt, gibst du ein strukturiertes Feedback mit Note und Grammatikkorrekturen.' },
    { role: 'assistant', content: 'Willkommen! Bitte stellen Sie sich vor und erzählen Sie etwas über sich (Name, Herkunft, Beruf/Studium).' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalReport, setFinalReport] = useState('');

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setStudentText(speechToText);
      callOpenAI(speechToText);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    recognition.onresult = handleResult;
    recognition.onend = handleEnd;

    return () => {
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
      }
    };
  }, [conversationHistory, examStep]);

  const callOpenAI = async (inputText, isFinalTrigger = false) => {
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('sk-...')) {
      alert('Please enter your OpenAI API Key at the top of the file first!');
      return;
    }

    setIsLoading(true);
    
    let currentMessages = [...conversationHistory];
    if (inputText) {
      currentMessages.push({ role: 'user', content: inputText });
    }

    if (isFinalTrigger) {
      currentMessages.push({ role: 'user', content: 'Ich bin fertig mit allen Teilen der Prüfung. Bitte gib mir jetzt mein finales Feedback: Eine Note (z.B. 22/30) und eine detaillierte Liste meiner Grammatik- und Aussprachefehler mit Korrekturen.' });
    }

    try {
      const response = await fetch('https://openai.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', 
          messages: currentMessages,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      if (isFinalTrigger) {
        setFinalReport(aiReply);
        setExamStep('evaluation');
      } else {
        setAiResponse(aiReply);
        setConversationHistory([...currentMessages, { role: 'assistant', content: aiReply }]);
        
        if (aiReply.toLowerCase().includes('planen') || aiReply.toLowerCase().includes('aufgabe 2')) {
          setExamStep('planning');
        } else if (aiReply.toLowerCase().includes('bild') || aiReply.toLowerCase().includes('aufgabe 3')) {
          setExamStep('image');
        }
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      alert('An error occurred while connecting to the AI server. Please check your API key and connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      setStudentText('');
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '450px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', direction: 'ltr', textAlign: 'left' }}>
      
      <div style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>ÖIF Live AI Exam Simulator</h3>
        <p style={{ fontSize: '12px', margin: '4px 0 0 0', opacity: 0.8 }}>
          Current Stage: <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{examStep.toUpperCase()}</span>
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', marginBottom: '20px', minHeight: '100px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <strong style={{ color: '#2563eb', display: 'block', marginBottom: '8px' }}>🤖 ÖIF Prüfer (AI):</strong>
        <p style={{ fontSize: '15px', color: '#1e293b', margin: 0, lineHeight: '1.5' }}>
          {isLoading && !studentText ? '⏳ AI is thinking...' : aiResponse}
        </p>
      </div>

      <div style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
        <strong style={{ color: '#475569', display: 'block', marginBottom: '8px' }}>🗣️ Your Speech (Detected Text):</strong>
        <p style={{ fontSize: '14px', color: '#334155', margin: 0, minHeight: '40px' }}>
          {studentText || "Click the button below and start talking to the examiner..."}
        </p>
      </div>

      <button 
        onClick={toggleListening}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: isListening ? '#ef4444' : '#10b981',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}
      >
        {isListening ? '🛑 Listening... Click to stop' : isLoading ? '🔄 Processing...' : '🎙️ Click & Speak to Examiner'}
      </button>

      <button 
        onClick={() => callOpenAI(null, true)}
        disabled={isLoading}
        style={{ width: '100%', marginTop: '12px', padding: '12px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {isLoading && examStep !== 'evaluation' ? 'Calculating Score...' : '🏁 Finish Exam & Get Final Report'}
      </button>

      {examStep === 'evaluation' && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '12px', border: '2px solid #2563eb', whiteSpace: 'pre-line', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#1e3a8a', marginTop: 0, marginBottom: '10px' }}>📊 Official AI Evaluation & Feedback:</h4>
          <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
            {finalReport}
          </div>
        </div>
      )}

    </div>
  );
}