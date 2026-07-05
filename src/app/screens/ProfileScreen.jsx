import React, { useMemo } from 'react';
import { isAdminAccount } from '../../config/authConfig';
import { getCurrentUser } from '../userAccess';
import { buildWeeklySession } from '../../data/weeklyPlanLibrary';
import { buildPremiumExamParts } from '../../data/premiumExamBuilder';
import { readJsonStorage } from '../../security/secureStorage';
import { AI_SESSION_STORAGE_KEY } from '../../constants/storageKeys';
export function ProfileScreen({ setActiveTab }) {
  const placementProfile = useMemo(() => {
    return readJsonStorage('austriaPathPlacementProfile', null);
  }, []);

  const weeklyPlan = useMemo(() => {
    return readJsonStorage('austriaPathWeeklyPlan', null);
  }, []);

  const premiumExams = useMemo(() => {
    return readJsonStorage('austriaPathPremiumExams', []) || [];
  }, []);

  const reports = useMemo(() => {
    return readJsonStorage('austriaPathAIReports', []) || [];
  }, []);

 const currentUser = getCurrentUser() || {};

const userName = currentUser.name || 'Benutzer';

const userEmail = currentUser.email || 'user@example.com';

const profileImage = localStorage.getItem('userProfileImage') || '';

const targetLevel =
  localStorage.getItem('userLevel') ||
  currentUser.level ||
  'B1';

  const hasAIResult = Boolean(placementProfile);
  const level = placementProfile?.level || targetLevel;
  const scores = placementProfile?.skillScores || {};
  const strengths = placementProfile?.strengths || [];
  const focusAreas =
    placementProfile?.focusAreas ||
    placementProfile?.recommendedFocus ||
    [];

  const skillCards = buildSkillCards(level, scores, hasAIResult);
  const calendarPlan = buildCalendarPlan(hasAIResult, placementProfile, weeklyPlan);
  const exams = buildPremiumExamCards(premiumExams, level);

 const openWeeklySession = (item, index) => {
  const focus = item.focus || 'selbstvorstellung';
  const cleanLevel = level?.replace('+', '') || 'B1';

  const sessionTasks = buildWeeklySession({
  level: cleanLevel,
  weaknesses: weeklyPlan?.weaknesses || [focus],
  maxMinutes: item.duration || 20,
});

const parts = sessionTasks.length
  ? sessionTasks.map((sessionItem) =>
      convertWeeklyTaskToAISessionPart(sessionItem.task)
    )
  : [
      {
        type: 'self_intro',
        label: 'Sprechen',
        title: item.title || 'Selbstvorstellung',
        instruction: 'Bitte stellen Sie sich kurz vor.',
        points: ['Name', 'Herkunft', 'Wohnort', 'Familie', 'Freizeit'],
      },
    ];

  localStorage.setItem(
    AI_SESSION_STORAGE_KEY,
    JSON.stringify({
      sessionType: 'weekly_plan',
      mode: 'weekly_plan',
      title: `KI-Wochentraining · ${item.title}`,
      level: cleanLevel,
      parts,
      appointmentIndex: index,
      focus,
      duration: item.duration || 20,
      startedAt: new Date().toISOString(),
    })
  );

  setActiveTab('aiSession');
};
function convertWeeklyTaskToAISessionPart(task) {
  const base = {
    label: skillLabel(task.skill),
    title: task.title,
    instruction: task.task || task.title,
  };

  if (task.type === 'listening') {
    return {
      ...base,
      type: 'listening',
      audioText: task.audioText,
      questions: normalizeQuestions(task.questions),
    };
  }

  if (task.type === 'reading') {
    return {
      ...base,
      type: 'reading',
      text: task.text,
      questions: normalizeQuestions(task.questions),
    };
  }

  if (task.type === 'speaking') {
    return {
      ...base,
      type:
        task.skill === 'bildbeschreibung'
          ? 'image'
          : task.skill === 'planung'
          ? 'planning'
          : 'self_intro',
      points: task.followUps || ['Antworten Sie frei.'],
      preparationSeconds: task.skill === 'planung' ? 10 : undefined,
    };
  }

  if (task.type === 'writing') {
    return {
      ...base,
      type: task.skill === 'schreiben' ? 'writing' : 'grammar',
    };
  }

  return {
    ...base,
    type: 'grammar',
  };
}

function normalizeQuestions(questions = []) {
  return questions.map((q) => {
    if (q.answerMode === 'trueFalse') {
      return {
        q: q.q,
        options: ['richtig', 'falsch'],
      };
    }

    return {
      q: q.q,
      options: q.options || ['Antwort schreiben'],
    };
  });
}

function skillLabel(skill) {
  const labels = {
    selbstvorstellung: 'Sprechen',
    bildbeschreibung: 'Bildbeschreibung',
    planung: 'Planung',
    hoeren: 'Hören',
    lesen: 'Lesen',
    schreiben: 'Schreiben',
    grammatik: 'Grammatik',
    satzbau: 'Satzbau',
    konnektoren: 'Konnektoren',
  };

  return labels[skill] || 'Training';
}
const getPremiumSchedule = () => {
  try {
    return JSON.parse(localStorage.getItem('austriaPathPremiumSchedule') || '[]');
  } catch {
    return [];
  }
};

const canStartScheduledExam = (exam) => {
  const schedule = getPremiumSchedule();
  const now = new Date();

  const next = schedule.find(
    (item) => item.type === exam.type && !item.used
  );

  if (!next) return { allowed: false, message: 'Bitte zuerst Termine planen.' };

  const start = new Date(next.startAt);

  if (now < start) {
    return {
      allowed: false,
      message: `Diese Trainingseinheit beginnt am ${next.date} um ${next.time}.`,
    };
  }

  return { allowed: true, appointment: next };
};
const openPremiumExam = (exam) => {
  const cleanLevel = level?.replace('+', '') || 'B1';

  localStorage.setItem(
    AI_SESSION_STORAGE_KEY,
    JSON.stringify({
      sessionType:
        exam.type === 'intensive'
          ? 'intensive_week'
          : exam.type === 'month'
          ? 'premium_month'
          : 'ai_exam',
      mode: 'exam',
      title: exam.title || 'AI Sprechtraining',
      level: cleanLevel,
    parts: buildPremiumExamParts(cleanLevel),
      examId: exam.id,
      startedAt: new Date().toISOString(),
    })
  );

setActiveTab('aiSession');
};

const handlePremiumExamClick = (exam) => {
  const subscription = JSON.parse(
    localStorage.getItem("austriaPathSubscription") || "null"
  );

  if (!subscription) {
    alert("Bitte zuerst einen Premium-Plan auswählen.");
    setActiveTab("premium");
    return;
  }

 if (exam.type === "probe" || exam.type === "ai_exam") {
    localStorage.setItem(
  "austriaPathCurrentPremiumType",
  "ai_exam"
);

setActiveTab("premiumSchedule");
    return;
  }

 if (exam.type === "intensive") {
   localStorage.setItem(
  "austriaPathCurrentPremiumType",
  "intensive_week"
);

setActiveTab("premiumSchedule");
    return;
  }

 if (exam.type === "month") {
   localStorage.setItem(
  "austriaPathCurrentPremiumType",
  "premium_month"
);

setActiveTab("premiumSchedule");
    return;
  }

const result = canStartScheduledExam(exam);

if (!result.allowed) {
  alert(result.message);
  return;
}

localStorage.setItem(
  'austriaPathActivePremiumAppointment',
  JSON.stringify(result.appointment)
);

openPremiumExam(exam);
};

return (
  <div style={pageStyle}>
    

    <div style={heroCardStyle}>
      <div style={heroLeftStyle}>
       <div style={avatarStyle}>
  {profileImage ? (
    <img src={profileImage} alt="Profil" style={avatarImageStyle} />
  ) : (
    <span>👤</span>
  )}
</div>
          <div>
            <h1 style={nameStyle}>{userName}</h1>
            <p style={mutedStyle}>{userEmail}</p>

            <div style={levelRowStyle}>
              <div style={levelBadgeStyle}>{level}</div>
              <div style={goodBadgeStyle}>
                ⭐ {hasAIResult ? 'Gutes Niveau!' : 'Free Profil'}
              </div>
              <button
  onClick={() => setActiveTab('accountSettings')}
  style={settingsButtonStyle}
>
  ⚙️ Kontoeinstellungen
</button>
            </div>
{isAdminAccount(currentUser) && (
  <button
  onClick={() => setActiveTab("userManagement")}
  style={{
    ...settingsButtonStyle,
    marginTop: "10px",
    background: "#2563eb",
    color: "#ffffff",
  }}
>
  👥 Benutzerverwaltung
</button>
)}

            <div style={infoRowStyle}>📅 21. Juni 2026</div>
            <div style={infoRowStyle}>
              ⏱️ {hasAIResult ? 'Dauer: 8 Min.' : 'Noch kein Test'}
            </div>
          </div>
        </div>

        <div style={summaryPanelStyle}>
          <h3 style={{ color: '#16a34a', marginTop: 0 }}>🎯 Stärken</h3>
          {strengths.length ? (
            strengths.map((s) => <p key={s}>✓ {skillName(s)}</p>)
          ) : (
            <p style={mutedStyle}>Noch kein Ergebnis</p>
          )}

          <h3 style={{ color: '#f97316' }}>🔥 Fokus verbessern</h3>
          {focusAreas.length ? (
            focusAreas.map((s) => <p key={s}>● {skillName(s)}</p>)
          ) : (
            <p style={mutedStyle}>Noch kein Fokus</p>
          )}
        </div>
      </div>

      <div style={cardsGridStyle}>
        {skillCards.map((card) => (
          <div key={card.title} style={{ ...skillCardStyle, borderColor: card.border }}>
            <div style={skillHeaderStyle}>
              <div style={{ ...iconCircleStyle, background: card.color }}>
                {card.icon}
              </div>
              <div style={skillLevelStyle}>{card.level}</div>
            </div>

            <h2 style={{ margin: '12px 0 6px' }}>{card.title}</h2>

            <div style={{ ...statusBadgeStyle, color: card.color }}>
              {card.status}
            </div>

            <div style={barRowStyle}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...miniBarStyle,
                    background: i < card.bars ? card.color : '#e5e7eb',
                  }}
                />
              ))}
            </div>

            <ul style={listStyle}>
              {card.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={planCardStyle}>
  <div style={planIntroStyle}>
    <div>
      <h2 style={{ margin: 0 }}>🎯 Persönlicher Lernplan</h2>
      <p style={mutedStyle}>
        {weeklyPlan
          ? 'Dein gespeicherter Wochenplan ist bereit.'
          : hasAIResult
            ? 'Erstelle einen Wochenplan auf Basis deines Einstufungstests.'
            : 'Erstelle einen Wochenplan auf Basis deines gespeicherten Niveaus.'}
      </p>
    </div>

    <div style={calendarIconStyle}>📅</div>
  </div>

  {!weeklyPlan && (
    <button
      style={createPlanButtonStyle}
      onClick={() => setActiveTab('weeklyPlanSetup')}
    >
      ➕ Wochenplan erstellen
    </button>
  )}

       <div style={calendarGridStyle}>
  {calendarPlan.map((item, index) => (
    <div key={item.day} style={calendarItemStyle}>
      <div style={{ ...calendarDotStyle, background: item.color }} />
      <strong style={{ color: item.color }}>{item.day}</strong>
      <div style={calendarIconSmallStyle}>{item.icon}</div>

      <p style={{ margin: '6px 0 0', fontWeight: 700 }}>
        {item.title}
      </p>

      <p style={smallTextStyle}>{item.text}</p>

      <p style={smallTextStyle}>
        ⏱️ {item.duration || 20} Min.
      </p>

      {weeklyPlan && (
        <button
          type="button"
          style={startMiniButtonStyle}
          onClick={() => openWeeklySession(item, index)}
        >
          ▶ Starten
        </button>
      )}
    </div>
  ))}
</div>
        <div style={tipStyle}>
          💡 Übe regelmäßig in kleinen Einheiten. So erreichst du dein nächstes Niveau sicherer.
        </div>
      </div>

      <div style={planCardStyle}>
        <h2 style={{ marginTop: 0 }}>🧪 Mein AI-Training</h2>

        <div style={examGridStyle}>
          {exams.map((exam) => (
            <div key={exam.id} style={examCardStyle}>
              <div style={examIconStyle}>{exam.icon}</div>
              <h3>{exam.title}</h3>
              <p style={mutedStyle}>{exam.text}</p>
              <p style={smallTextStyle}>
                Fortschritt: {exam.used}/{exam.total}
              </p>

              <button
                style={examButtonStyle}
                onClick={() => handlePremiumExamClick(exam)}
                disabled={exam.used >= exam.total}
              >
                {
  exam.used >= exam.total
    ? "Abgeschlossen"
    : "Termin planen"
}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={planCardStyle}>
  <h2 style={{ marginTop: 0 }}>📊 Ergebnisse & Berichte</h2>
<h3 style={{ marginBottom: 12 }}>
  Letzte 3 Berichte
</h3>
  {reports.length ? (
    
   reports.slice(0, 3).map((report, index) => (
      <div key={index} style={reportCardStyle}>
        <strong>{report.title || `Bericht ${index + 1}`}</strong>

        <p style={smallTextStyle}>
          {report.date || 'Datum unbekannt'} · Niveau {report.level || level}
        </p>
{report.examinerMind?.decision?.score != null && (
  <p
    style={{
      color: "#2563eb",
      fontWeight: 700,
      margin: "8px 0"
    }}
  >
    Gesamtbewertung: {report.examinerMind.decision.score}/100
  </p>
)}
        <p style={mutedStyle}>
          {report.summary || 'Kurzer Bericht gespeichert.'}
        </p>
{report.examinerMind?.decision?.score != null && (
  <div style={tipStyle}>
    💡 {report.examinerMind.decision.score >= 75
      ? "Sehr gute Leistung. Üben Sie weiter, um das Niveau zu stabilisieren."
      : report.examinerMind.decision.score >= 55
      ? "Mit etwas mehr Struktur und vollständiger Bearbeitung aller Aufgabenpunkte können Sie das Niveau sicher erreichen."
      : "Trainieren Sie zuerst den Aufbau der E-Mail und beantworten Sie alle Aufgabenpunkte vollständig."}
  </div>
)}
        <div style={reportGridStyle}>
          <div style={reportMiniBoxStyle}>
           <b>✅ Stärken</b>
            <p>
  {report.examinerMind?.decision?.score >= 75
    ? 1
    : report.strongCount || 0}
</p>
          </div>

          <div style={reportMiniBoxStyle}>
            <b>➖ Mittel</b>
          <p>
  {report.examinerMind?.decision?.score >= 55 &&
  report.examinerMind?.decision?.score < 75
    ? 1
    : report.middleCount || 0}
</p>
          </div>

          <div style={reportMiniBoxStyle}>
            <b>⚠️ Verbesserungen</b>
            <p>
  {report.examinerMind?.decision?.score < 55
    ? 1
    : report.weakCount || 0}
</p>
          </div>
        </div>

        {report.strengths?.length > 0 && (
        
          <div style={reportSectionStyle}>
            <b>🎯 Stärken</b>
            {uniqueLabels(report.strengths).map((item) => (
              <p key={item} style={smallTextStyle}>✓ {item}</p>
            ))}
          </div>
        )}
{report.weaknesses?.length > 0 && (
  <div style={reportSectionStyle}>
   <b>🛠️ Verbesserungsbereiche</b>
    {uniqueLabels(report.weaknesses).map((item) => (
      <p key={item} style={smallTextStyle}>
        • {item}
      </p>
    ))}
  </div>
)}
        {report.focusAreas?.length > 0 && (
          <div style={reportSectionStyle}>
           <b>🎯 Empfohlener Schwerpunkt</b>
           <p style={{ margin: 0 }}>
  {uniqueLabels(report.focusAreas).slice(0, 3).join(" • ")}
</p>
          </div>
        )}

        {report.nextRecommendation && (
          <div style={tipStyle}>
            💡 {report.nextRecommendation}
          </div>
        )}
      </div>
    ))
  ) : (
    <div style={reportCardStyle}>
      <strong>Noch keine Berichte</strong>
      <p style={mutedStyle}>
        Nach einer AI-Trainingseinheit oder Wochenplan-Sitzung erscheinen hier deine Ergebnisse.
      </p>
    </div>
  )}
</div>
    </div>
  );
  function labelReportItem(item) {
  const labels = {
    taskCompletion: "Aufgabe vollständig bearbeitet",
    grammar: "Grammatik",
    vocabulary: "Wortschatz",
    structure: "Satzbau",
    reasoning: "Begründungen",
    communication: "Kommunikation",
    writing: "Schreiben",
    reading: "Lesen",
    listening: "Hören",
    speaking: "Sprechen",
    image: "Bildbeschreibung",
    planning: "Planung",
  };

  return labels[item] || item;
}

function uniqueLabels(items = []) {
  return [...new Set(items)].map(labelReportItem);
}
}

function skillName(skill) {
  const names = {
    selbstvorstellung: 'Selbstvorstellung',
    bildbeschreibung: 'Bildbeschreibung',
    grafikbeschreibung: 'Grafikbeschreibung',
    hoeren: 'Hören',
    planung: 'Planung',
    diskussion: 'Diskussion',
    lesen: 'Lesen',
  };
  return names[skill] || skill;
}

function buildPremiumExamCards(exams, level) {
  if (exams.length) return exams;

  return [
    {
      id: 'probe-1',
      icon: '🧪',
      title: 'AI Sprechtraining',
      text: `${level} · 1 Trainingseinheit mit kurzem Bericht`,
      level,
      total: 1,
      used: 0,
      type: 'probe',
    },
    {
      id: 'intensive-1',
      icon: '🔥',
      title: 'Intensive Woche',
      text: `${level} · 3 Trainingseinheiten innerhalb von 7 Tagen`,
      level,
      total: 3,
      used: 0,
      type: 'intensive',
    },
    {
      id: 'premium-month-1',
      icon: '👑',
      title: 'Premium Monat',
      text: `${level} · 5 Trainingseinheiten mit Fortschrittsvergleich`,
      level,
      total: 5,
      used: 0,
      type: 'month',
    },
  ];
}

function buildSkillCards(level, scores, hasAIResult) {
  const hoerenWeak = scores.hoeren === 'A2' || scores.hoeren === 'A2+';

  return [
    {
      title: 'Lesen',
      icon: '📖',
      level,
      status: hasAIResult ? 'Gut' : 'Noch leer',
      color: '#2563eb',
      border: '#bfdbfe',
      bars: hasAIResult ? 5 : 1,
      points: hasAIResult
        ? ['Hauptinformationen verstanden', 'Wichtige Details erkannt', 'Wenige Fehler gemacht']
        : ['Noch kein AI-Ergebnis'],
    },
    {
      title: 'Hören',
      icon: '🎧',
      level: scores.hoeren || level,
      status: hoerenWeak ? 'Verbesserung nötig' : hasAIResult ? 'Gut' : 'Noch leer',
      color: '#f97316',
      border: '#fed7aa',
      bars: hoerenWeak ? 3 : hasAIResult ? 5 : 1,
      points: hoerenWeak
        ? ['Zahlen und Uhrzeiten schwierig', 'Einige Informationen verpasst', 'Mehr Hörübungen empfohlen']
        : hasAIResult
        ? ['Hauptinformationen verstanden', 'Fragen beantwortet']
        : ['Noch kein AI-Ergebnis'],
    },
    {
      title: 'Bildbeschreibung',
      icon: '🖼️',
      level: scores.bildbeschreibung || level,
      status: hasAIResult ? 'Sehr gut' : 'Noch leer',
      color: '#16a34a',
      border: '#bbf7d0',
      bars: hasAIResult ? 6 : 1,
      points: hasAIResult
        ? ['Bild gut beschrieben', 'Eigene Meinung gegeben', 'Eigene Erfahrung erwähnt', 'Gute Satzverbindungen']
        : ['Noch kein AI-Ergebnis'],
    },
    {
      title: 'Sprechen üben',
      icon: '💬',
      level: scores.planung || scores.diskussion || level,
      status: hasAIResult ? 'Mittel' : 'Noch leer',
      color: '#7c3aed',
      border: '#ddd6fe',
      bars: hasAIResult ? 3 : 1,
      points: hasAIResult
        ? ['Antworten oft zu kurz', 'Mehr Begründungen geben', 'weil / deshalb häufiger benutzen']
        : ['Noch kein AI-Ergebnis'],
    },
  ];
}

function buildCalendarPlan(hasAIResult, profile, weeklyPlan) {
  if (weeklyPlan?.appointments?.length) {
    return weeklyPlan.appointments.map((item, index) => ({
      ...item,
      day: `Termin ${index + 1}`,
      icon: getCalendarIcon(item.focus),
      title: focusTitle(item.focus),
      text: `${item.date} · ${item.time}`,
      duration: item.duration || 20,
      color: getCalendarColor(item.focus),
    }));
  }

  if (!hasAIResult) {
    return [
      { day: 'Tag 1', icon: '🎧', title: 'Noch offen', text: 'Starte zuerst den Einstufungstest.', color: '#2563eb' },
      { day: 'Tag 3', icon: '🖼️', title: 'Noch offen', text: 'Dein Plan erscheint hier.', color: '#16a34a' },
      { day: 'Tag 5', icon: '💬', title: 'Noch offen', text: 'Training wird empfohlen.', color: '#7c3aed' },
      { day: 'Tag 7', icon: '⭐', title: 'Wiederholung', text: 'Mini-Test und Wiederholung.', color: '#f97316' },
    ];
  }

  return [
    { day: 'Tag 1', icon: '🎧', title: 'Hören trainieren', text: 'Nachrichten und Fragen', color: '#2563eb' },
    { day: 'Tag 3', icon: '💬', title: 'Planung üben', text: 'Gemeinsam planen', color: '#7c3aed' },
    { day: 'Tag 5', icon: '🖼️', title: 'Bildbeschreibung', text: 'Bilder und Meinung', color: '#16a34a' },
    { day: 'Tag 7', icon: '🏆', title: 'Wiederholung', text: 'Mini-Test und Übung', color: '#f97316' },
  ];
}

function getCalendarIcon(focus) {
  const icons = {
    selbstvorstellung: '👤',
    hoeren: '🎧',
    bildbeschreibung: '🖼️',
    planung: '💬',
    lesen: '📖',
    schreiben: '✍️',
    diskussion: '🗣️',
  };
  return icons[focus] || '⭐';
}

function focusTitle(focus) {
  const names = {
    selbstvorstellung: 'Selbstvorstellung',
    hoeren: 'Hören üben',
    bildbeschreibung: 'Bildbeschreibung',
    planung: 'Planung üben',
    lesen: 'Lesen üben',
    schreiben: 'Schreiben üben',
    diskussion: 'Diskussion',
  };
  return names[focus] || 'Training';
}

function getCalendarColor(focus) {
  const colors = {
    selbstvorstellung: '#2563eb',
    hoeren: '#f97316',
    bildbeschreibung: '#16a34a',
    planung: '#7c3aed',
    lesen: '#2563eb',
    schreiben: '#dc2626',
    diskussion: '#7c3aed',
  };
  return colors[focus] || '#64748b';
}

const pageStyle = {
  padding: 14,
  fontFamily: 'system-ui, sans-serif',
  background: '#f8fafc',
  width: '100%',
  maxWidth: 430,
  margin: '0 auto',
  color: '#0f172a',
  boxSizing: 'border-box',
  overflowX: 'hidden',
};

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
};

const logoStyle = {
  margin: 0,
  color: '#0f52d6',
  fontWeight: 900,
  fontSize: 30,
};

const heroCardStyle = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 24,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  marginBottom: 18,
};
const heroLeftStyle = {
  display: 'flex',
  gap: 22,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const avatarStyle = {
  width: 130,
  height: 130,
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#2563eb,#38bdf8)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 54,
  fontWeight: 900,
  overflow: 'hidden',
  flexShrink: 0,
};
const avatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%',
};
const nameStyle = {
  fontSize: 38,
  margin: 0,
};

const mutedStyle = {
  color: '#475569',
  margin: '4px 0',
};

const levelRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  margin: '12px 0',
};

const levelBadgeStyle = {
  background: '#ede9fe',
  color: '#7c3aed',
  fontSize: 38,
  fontWeight: 900,
  padding: '8px 24px',
  borderRadius: 18,
  border: '2px solid #c084fc',
};

const goodBadgeStyle = {
  background: 'white',
  color: '#7c3aed',
  fontWeight: 900,
  padding: '12px 18px',
  borderRadius: 18,
  border: '2px solid #c084fc',
};

const infoRowStyle = {
  display: 'inline-block',
  marginRight: 18,
  color: '#334155',
  fontWeight: 600,
};

const summaryPanelStyle = {
  background: 'white',
  borderRadius: 20,
  padding: 18,
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 16,
};

const skillCardStyle = {
  background: 'white',
  border: '1.5px solid',
  borderRadius: 22,
  padding: 18,
  minHeight: 255,
};

const skillHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const iconCircleStyle = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 34,
};

const skillLevelStyle = {
  background: '#f1f5f9',
  color: '#2563eb',
  padding: '8px 16px',
  borderRadius: 16,
  fontWeight: 900,
  fontSize: 22,
};

const statusBadgeStyle = {
  display: 'inline-block',
  background: 'white',
  border: '1px solid currentColor',
  padding: '6px 14px',
  borderRadius: 14,
  fontWeight: 800,
  marginBottom: 12,
};

const barRowStyle = {
  display: 'flex',
  gap: 5,
  margin: '10px 0 16px',
};

const miniBarStyle = {
  height: 10,
  flex: 1,
  borderRadius: 10,
};

const listStyle = {
  paddingLeft: 18,
  lineHeight: 1.7,
  margin: 0,
};

const planCardStyle = {
  background: 'white',
  border: '1px solid #bfdbfe',
  borderRadius: 24,
  padding: 22,
  marginTop: 18,
};

const planIntroStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
};

const calendarIconStyle = {
  fontSize: 64,
};

const calendarGridStyle = {
  display: 'flex',
  gap: 14,
  overflowX: 'auto',
  padding: '4px 2px 14px',
  WebkitOverflowScrolling: 'touch',
};

const calendarItemStyle = {
  minWidth: 150,
  maxWidth: 160,
  flex: '0 0 auto',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 14,
  textAlign: 'center',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const calendarDotStyle = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  margin: '0 auto 8px',
};

const calendarIconSmallStyle = {
  fontSize: 38,
  margin: '10px 0',
};

const smallTextStyle = {
  color: '#475569',
  fontSize: 14,
  margin: '4px 0',
};

const tipStyle = {
  background: '#eff6ff',
  color: '#1d4ed8',
  borderRadius: 16,
  padding: 14,
  marginTop: 16,
  fontWeight: 600,
};

const startMiniButtonStyle = {
  marginTop: 10,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  borderRadius: 12,
  padding: '9px 12px',
  fontWeight: 800,
  cursor: 'pointer',
};

const examGridStyle = {
  display: 'flex',
  gap: 14,
  overflowX: 'auto',
  padding: '4px 2px 14px',
  WebkitOverflowScrolling: 'touch',
};

const examCardStyle = {
  minWidth: 150,
  maxWidth: 160,
  flex: '0 0 auto',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  textAlign: 'center',
  boxSizing: 'border-box',
};

const examIconStyle = {
  fontSize: 42,
};

const examButtonStyle = {
  width: '100%',
  marginTop: 10,
  border: 'none',
  background: '#7c3aed',
  color: 'white',
  borderRadius: 12,
  padding: 11,
  fontWeight: 800,
  cursor: 'pointer',
};
const reportGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 8,
  marginTop: 12,
  marginBottom: 12,
};

const reportMiniBoxStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 10,
  textAlign: 'center',
};

const reportSectionStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 12,
  marginTop: 10,
};
const reportCardStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10,
};
const createPlanButtonStyle = {
  width: '100%',
  border: 'none',
  background: '#2563eb',
  color: 'white',
  borderRadius: 14,
  padding: '13px',
  fontWeight: 900,
  cursor: 'pointer',
  marginBottom: 16,
};

const settingsButtonStyle = {
  marginTop: 14,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  borderRadius: 14,
  padding: '11px 14px',
  fontWeight: 800,
  cursor: 'pointer',
};