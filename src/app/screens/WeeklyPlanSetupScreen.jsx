import React, { useEffect, useMemo, useState } from 'react';

import {
  getWeeklyPlanTasks,
  buildWeeklySession,
  getDailyTrainingMessages,
} from '../../data/weeklyPlanLibrary';

export default function WeeklyPlanSetupScreen({ setActiveTab }) {
  const placementProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('austriaPathPlacementProfile'));
    } catch {
      return null;
    }
  }, []);

  const hasPlacement = Boolean(placementProfile);

  const [level, setLevel] = useState(
    placementProfile?.level?.replace('+', '') ||
      localStorage.getItem('userLevel') ||
      'B1'
  );

  const recommendedFocus =
    placementProfile?.recommendedFocus ||
    placementProfile?.focusAreas ||
    ['selbstvorstellung', 'hoeren', 'planung'];

  const weaknessOptions = [
    { key: 'selbstvorstellung', label: 'Selbstvorstellung' },
    { key: 'bildbeschreibung', label: 'Bildbeschreibung' },
    { key: 'grafikbeschreibung', label: 'Grafikbeschreibung' },
{ key: 'diskussion', label: 'Diskussion' },
    { key: 'hoeren', label: 'Hören' },
    { key: 'lesen', label: 'Lesen' },
    { key: 'schreiben', label: 'Schreiben / E-Mail' },
    { key: 'planung', label: 'Planung' },
    { key: 'grammatik', label: 'Grammatik' },
    { key: 'satzbau', label: 'Satzbau' },
    { key: 'konnektoren', label: 'Konnektoren' },
  ];

  const [weaknesses, setWeaknesses] = useState(
    recommendedFocus.slice(0, 3)
  );

  const [appointments, setAppointments] = useState([
    {
      title: `Termin 1: ${focusName(recommendedFocus[0] || 'selbstvorstellung')}`,
      focus: recommendedFocus[0] || 'selbstvorstellung',
      date: '',
      time: '',
      duration: 20,
    },
    {
      title: `Termin 2: ${focusName(recommendedFocus[1] || 'hoeren')}`,
      focus: recommendedFocus[1] || 'hoeren',
      date: '',
      time: '',
      duration: 20,
    },
    {
      title: `Termin 3: ${focusName(recommendedFocus[2] || 'planung')}`,
      focus: recommendedFocus[2] || 'planung',
      date: '',
      time: '',
      duration: 20,
    },
  ]);

  const [saved, setSaved] = useState(false);

  const dailyPreview = getDailyTrainingMessages({
    level,
    weaknesses,
  }).slice(0, 7);

  useEffect(() => {
    setAppointments((prev) =>
      prev.map((item, index) => {
        const newFocus =
          weaknesses[index] ||
          recommendedFocus[index] ||
          item.focus ||
          'selbstvorstellung';

        return {
          ...item,
          focus: newFocus,
          title: `Termin ${index + 1}: ${focusName(newFocus)}`,
        };
      })
    );
  }, [weaknesses]);

  const toggleWeakness = (key) => {
    if (weaknesses.includes(key)) {
      setWeaknesses(weaknesses.filter((item) => item !== key));
      return;
    }

    if (weaknesses.length >= 3) {
      alert('Bitte wählen Sie maximal 3 Bereiche.');
      return;
    }

    setWeaknesses([...weaknesses, key]);
  };

  const updateAppointment = (index, field, value) => {
    const updated = [...appointments];
    updated[index] = { ...updated[index], [field]: value };
    setAppointments(updated);
  };
const handleStartAISession = () => {
  const savedPlan = JSON.parse(
    localStorage.getItem('austriaPathWeeklyPlan') || 'null'
  );

  if (!savedPlan) {
    alert('Bitte bestätigen Sie zuerst den Wochenplan.');
    return;
  }

  const sessionParts = buildWeeklySession({
    level: savedPlan.level,
   weaknesses: savedPlan.weaknesses || savedPlan.focusAreas || [],
    maxMinutes: 20,
  });

  localStorage.setItem(
    'austriaPathCurrentAISession',
    JSON.stringify({
      sessionType: 'weekly_plan',
      mode: 'weekly_plan',
      title: 'KI-Wochentraining',
      level: savedPlan.level,
      parts: sessionParts,
     weaknesses: savedPlan.weaknesses || savedPlan.focusAreas || [],

      startedAt: new Date().toISOString(),
    })
  );

  setActiveTab('aiSession');
};

const handleSave = () => {
  const allFilled = appointments.every(
    (item) => item.date && item.time
  );
    if (!allFilled) {
      alert('Bitte wählen Sie für alle 3 Termine Datum und Uhrzeit.');
      return;
    }

    if (!weaknesses.length) {
      alert('Bitte wählen Sie mindestens einen Trainingsbereich.');
      return;
    }

    const dailyMessages = getDailyTrainingMessages({
      level,
      weaknesses,
    });

    const weeklyTasks = getWeeklyPlanTasks({
      level,
      skills: weaknesses,
      limit: 12,
    });

    const plan = {
      id: Date.now(),
      type: 'ki-wochenplan',
      level,
      price: '14,99 €',
      status: 'pending-payment',
      createdAt: new Date().toISOString(),

      weaknesses,
      appointments,
      dailyMessages,
      weeklyTasks,

      sessionContent: {
        selectedWeaknesses: weaknesses,
        dailyMessages,
        weeklyTasks,
      },

      aiSessionEngine: {
        enabled: true,
        sessionDurationMinutes: 20,

        timerRules: {
          totalMinutes: 20,
          warningAtMinute: 15,
          finalMinuteReminder: true,
          endSessionAutomatically: true,
        },

        adaptiveRules: {
          weakAnswer:
            'Wenn die Antwort schwach ist, bleibt die KI beim gleichen Niveau, gibt ein einfacheres Beispiel und übt Satzbau, Wortschatz oder Grammatik.',
          mediumAnswer:
            'Wenn die Antwort mittel ist, stellt die KI eine passende Nachfrage und gibt eine kleine Verbesserung.',
          strongAnswer:
            'Wenn die Antwort stark ist, erhöht die KI die Schwierigkeit und gibt eine anspruchsvollere Aufgabe.',
        },

        timeManagement: {
          ifStudentFinishesEarly:
            'Wenn der Schüler früh fertig ist, füllt die KI die restliche Zeit mit Grammatik, Satzbau, Konnektoren, Mini-Lesen oder Mini-Hören.',
          ifStudentNeedsMoreTime:
            'Wenn der Schüler langsam oder unsicher ist, reduziert die KI die Schwierigkeit und trainiert die wichtigste Schwäche.',
          ifTimeAlmostOver:
            'Wenn wenig Zeit bleibt, fasst die KI die wichtigsten Fehler zusammen und gibt eine kurze Hausaufgabe.',
        },

        fallbackTraining: weeklyTasks,

        feedbackReport: {
          afterEachSession: true,
          fields: [
            'Stärken',
            'Schwächen',
            'Aussprache / Verständlichkeit',
            'Wortschatz',
            'Satzbau',
            'Grammatik',
            'Nächste Übung',
          ],
        },
      },

      sessionReports: [],
    };

    localStorage.setItem('austriaPathWeeklyPlan', JSON.stringify(plan));
    setSaved(true);
  };

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={() => setActiveTab('premium')}>
        ← Zurück
      </button>

      <div style={heroStyle}>
        <h1 style={titleStyle}>KI-Wochenplan</h1>
        <p style={textStyle}>
          3 Sitzungen · 7 Tage · tägliche Mini-Übungen · ca. 60 Minuten AI-Training.
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>1. Trainingsniveau</h2>

        {hasPlacement ? (
          <div style={infoBoxStyle}>
            ✅ Einstufungstest gefunden: Niveau {placementProfile.level}
            <br />
            Du kannst die vorgeschlagenen Schwächen übernehmen oder anpassen.
          </div>
        ) : (
          <>
            <p style={mutedStyle}>
              Kein Einstufungstest gefunden. Bitte wähle dein Trainingsniveau selbst.
            </p>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={inputStyle}
            >
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>2. Was möchten Sie verbessern?</h2>

        <p style={mutedStyle}>
          Wählen Sie bis zu 3 Bereiche. Die täglichen Trainingsnachrichten und die KI-Sitzungen richten sich danach.
        </p>

        <p style={counterStyle}>Ausgewählt: {weaknesses.length} / 3</p>

        <div style={weaknessGridStyle}>
          {weaknessOptions.map((option) => {
            const active = weaknesses.includes(option.key);

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleWeakness(option.key)}
                style={{
                  ...weaknessButtonStyle,
                  backgroundColor: active ? '#2563eb' : '#f8fafc',
                  color: active ? 'white' : '#334155',
                  borderColor: active ? '#2563eb' : '#cbd5e1',
                }}
              >
                {active ? '✓ ' : ''}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>3. Tägliche Mini-Übungen</h2>

        <p style={mutedStyle}>
          Diese kurzen Übungen erscheinen während der Woche passend zu deinen ausgewählten Schwächen.
        </p>

        {dailyPreview.length ? (
          dailyPreview.map((msg) => (
            <div key={msg.id} style={dailyMessageStyle}>
              <strong>
                Tag {msg.day}: {focusName(msg.skill)}
              </strong>
              <p style={smallTextStyle}>
                {msg.title} · ca. {msg.duration} Min.
              </p>
            </div>
          ))
        ) : (
          <p style={mutedStyle}>Bitte wählen Sie zuerst einen Bereich.</p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>4. Drei Termine wählen</h2>

        {appointments.map((item, index) => (
          <div key={index} style={appointmentStyle}>
            <h3 style={appointmentTitleStyle}>{item.title}</h3>

            <p style={focusBadgeStyle}>Fokus: {focusName(item.focus)}</p>

            <p style={mutedStyle}>{getTaskText(level, item.focus)}</p>

            <label style={labelStyle}>Datum</label>
            <input
              type="date"
              value={item.date}
              onChange={(e) => updateAppointment(index, 'date', e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle}>Uhrzeit</label>
            <input
              type="time"
              value={item.time}
              onChange={(e) => updateAppointment(index, 'time', e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>5. KI steuert die 20 Minuten</h2>

        <ul style={listStyle}>
          <li>✓ Jede Sitzung dauert 20 Minuten.</li>
          <li>✓ Die KI startet mit dem geplanten Fokus.</li>
          <li>✓ Bei starken Antworten wird die Aufgabe schwieriger.</li>
          <li>✓ Bei schwachen Antworten gibt es einfachere Übungen.</li>
          <li>✓ Wenn Zeit übrig bleibt, kommen Grammatik, Satzbau oder Mini-Übungen.</li>
          <li>✓ Nach jeder Sitzung wird ein kurzer Bericht gespeichert.</li>
        </ul>
      </div>

      <button style={confirmButtonStyle} onClick={handleSave}>
        Wochenplan bestätigen
      </button>

      {saved && (
        <div style={successStyle}>
          <h3>✅ KI-Wochenplan gespeichert.</h3>
          <p>Der Plan erscheint jetzt im Profil.</p>

        <button
  style={profileButtonStyle}
  onClick={handleStartAISession}
>
  Ich bin bereit
</button>

<button
  style={{
    ...profileButtonStyle,
    backgroundColor: '#2563eb',
    marginTop: '10px',
  }}
  onClick={() => setActiveTab('profile')}
>
  Zum Profil
</button>
        </div>
      )}
    </div>
  );
}

function focusName(skill) {
  const names = {
    selbstvorstellung: 'Selbstvorstellung',
    hoeren: 'Hören',
    bildbeschreibung: 'Bildbeschreibung',
    planung: 'Planung',
    lesen: 'Lesen',
    schreiben: 'Schreiben',
    diskussion: 'Diskussion',
    grammatik: 'Grammatik',
    satzbau: 'Satzbau',
    konnektoren: 'Konnektoren',
  };

  return names[skill] || skill;
}

function getTaskText(level, focus) {
  const tasks = {
    selbstvorstellung: `${level} Selbstvorstellung: frei sprechen, Nachfragen beantworten und bessere Sätze bilden.`,
    hoeren: `${level} Hören: Zahlen, Uhrzeiten und Hauptinformationen erkennen.`,
    bildbeschreibung: `${level} Bildbeschreibung: Bild beschreiben, Meinung und eigene Erfahrung nennen.`,
    planung: `${level} Planung: Vorschläge machen, begründen, zustimmen, ablehnen und Alternativen nennen.`,
    lesen: `${level} Lesen: kurze Texte bearbeiten und wichtige Informationen erkennen.`,
    schreiben: `${level} Schreiben: E-Mail, Satzbau und Konnektoren verbessern.`,
    diskussion: `${level} Diskussion: Meinung sagen, begründen, Beispiele nennen und Gegenargumente verstehen.`,
    grammatik: `${level} Grammatik: Fälle, Verbposition, Nebensätze und typische Fehler üben.`,
    satzbau: `${level} Satzbau: Hauptsatz, Nebensatz und bessere Satzverbindungen üben.`,
    konnektoren: `${level} Konnektoren: weil, deshalb, obwohl, trotzdem und außerdem richtig benutzen.`,
  };

  return tasks[focus] || `${level} gezielt mit AustriaPath-Modellen trainieren.`;
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '100px',
};

const backButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: '700',
  marginBottom: '14px',
  cursor: 'pointer',
};

const heroStyle = {
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: 'white',
  padding: '22px',
  borderRadius: '22px',
  marginBottom: '18px',
};

const titleStyle = {
  margin: 0,
  fontSize: '30px',
  fontWeight: '800',
};

const textStyle = {
  lineHeight: '1.6',
  marginBottom: 0,
};

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '16px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
};

const sectionTitleStyle = {
  marginTop: 0,
  color: '#0f172a',
  fontSize: '20px',
};

const appointmentStyle = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '14px',
  marginTop: '14px',
};

const appointmentTitleStyle = {
  marginBottom: '12px',
  color: '#1e293b',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  marginTop: '10px',
  color: '#334155',
  fontWeight: '700',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
};

const listStyle = {
  lineHeight: '1.9',
  paddingLeft: '18px',
  color: '#334155',
};

const confirmButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  fontSize: '16px',
  cursor: 'pointer',
};

const successStyle = {
  marginTop: '16px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '16px',
  borderRadius: '16px',
};

const profileButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const infoBoxStyle = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '14px',
  borderRadius: '14px',
  lineHeight: '1.6',
  fontWeight: '700',
};

const mutedStyle = {
  color: '#64748b',
  lineHeight: '1.6',
};

const focusBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#ede9fe',
  color: '#7c3aed',
  padding: '8px 12px',
  borderRadius: '999px',
  fontWeight: '800',
};

const weaknessGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
};

const weaknessButtonStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: '14px',
  padding: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  textAlign: 'center',
};

const counterStyle = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '10px 12px',
  borderRadius: '12px',
  fontWeight: '800',
  marginBottom: '14px',
};

const dailyMessageStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '12px',
  marginTop: '10px',
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: '14px',
  margin: '5px 0 0',
};