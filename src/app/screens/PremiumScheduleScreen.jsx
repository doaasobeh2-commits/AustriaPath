import React, { useEffect, useState } from 'react';
import {
  buildPremiumExamPackage,
  savePremiumExamPackage,
} from '../../data/premiumExamBuilder';
export default function PremiumScheduleScreen({ setActiveTab }) {
  const type = localStorage.getItem('austriaPathCurrentPremiumType') || 'ai_exam';

  const config =
    type === 'premium_month'
      ? { title: 'Premium Monat', count: 5, days: 30 }
      : type === 'intensive_week'
      ? { title: 'Intensive Woche', count: 3, days: 7 }
      : {
          title: 'AI Sprechtraining',
          count: 1,
          days: 0,
          subtitle: 'Das Training ist ab jetzt 30 Minuten verfügbar.',
        };

  const [secondsLeft, setSecondsLeft] = useState(30 * 60);

  useEffect(() => {
    if (type !== 'ai_exam') return;

    const startedAt = localStorage.getItem('austriaPathAIExamTimerStart');

    let startTime;

    if (startedAt) {
      startTime = new Date(startedAt);
    } else {
      startTime = new Date();
      localStorage.setItem('austriaPathAIExamTimerStart', startTime.toISOString());
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, 30 * 60 - diff);

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [type]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startAIExamNow = () => {
    if (secondsLeft <= 0) {
      alert('Die 30 Minuten sind abgelaufen. Bitte wählen Sie den Plan erneut.');
      return;
    }

    const now = new Date();

    const appointment = {
      id: 'ai_exam-1',
      type: 'ai_exam',
      title: 'AI Sprechtraining',
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      startAt: now.toISOString(),
      status: 'scheduled',
      used: false,
    };
const level =
  localStorage.getItem('userLevel') ||
  localStorage.getItem('currentLevel') ||
  localStorage.getItem('austriaPathUserLevel') ||
  'B1';

const examPackage = buildPremiumExamPackage({
  level,
  packageType: 'ai_exam',
});

savePremiumExamPackage(examPackage);

localStorage.setItem(
  'austriaPathActivePremiumExam',
  JSON.stringify(examPackage.exams[0])
);
    localStorage.setItem('austriaPathPremiumSchedule', JSON.stringify([appointment]));
    localStorage.setItem('austriaPathPremiumScheduleStatus', 'active');
    localStorage.setItem(
      'austriaPathActivePremiumAppointment',
      JSON.stringify(appointment)
    );

  setActiveTab('premiumExamSession');
  };

  const [dates, setDates] = useState(
    Array.from({ length: config.count }, () => ({ date: '', time: '' }))
  );

  const updateDate = (index, field, value) => {
    const copy = [...dates];
    copy[index] = { ...copy[index], [field]: value };
    setDates(copy);
  };

  const saveSchedule = () => {
    const appointments = dates.map((item, index) => {
      if (!item.date || !item.time) return null;

      const start = new Date(`${item.date}T${item.time}`);

      return {
        id: `${type}-${index + 1}`,
        type,
        title: `${config.title} · Termin ${index + 1}`,
        date: item.date,
        time: item.time,
        startAt: start.toISOString(),
        status: 'scheduled',
        used: false,
      };
    });

    if (appointments.some((item) => !item)) {
      alert('Bitte alle Termine auswählen.');
      return;
    }

    const sorted = [...appointments].sort(
      (a, b) => new Date(a.startAt) - new Date(b.startAt)
    );

    const hasDuplicate = sorted.some(
      (item, index) => index > 0 && item.startAt === sorted[index - 1].startAt
    );

    if (hasDuplicate) {
      alert('Bitte wählen Sie verschiedene Termine.');
      return;
    }

    if (type === 'intensive_week' || type === 'premium_month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + config.days);

      const invalid = sorted.some((item) => {
        const start = new Date(item.startAt);
        start.setHours(0, 0, 0, 0);

        return start < today || start > maxDate;
      });

      if (invalid) {
        alert(`Alle Termine müssen innerhalb von ${config.days} Tagen liegen.`);
        return;
      }
    }

    localStorage.setItem('austriaPathPremiumSchedule', JSON.stringify(sorted));
    localStorage.setItem('austriaPathPremiumScheduleStatus', 'active');

    alert('Termine gespeichert.');
    setActiveTab?.('profile');
  };

  return (
    <div style={container}>
      <button style={backButton} onClick={() => setActiveTab?.('profile')}>
        ← Zurück
      </button>

      <div style={hero}>
        <h1 style={{ margin: 0 }}>{config.title}</h1>
        <p style={{ marginBottom: 0 }}>
          {type === 'ai_exam'
            ? config.subtitle
            : `Wählen Sie ${config.count} Termine innerhalb von ${config.days} Tagen.`}
        </p>
      </div>

      {type === 'ai_exam' ? (
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Training starten</h2>

          <div style={timerBox}>
            ⏳ {formatTime(secondsLeft)}
          </div>

          <p style={hint}>
            Sie können das Training sofort starten. Der Zugang bleibt 30 Minuten aktiv.
          </p>

          <button
            style={{
              ...saveButton,
              background: secondsLeft > 0 ? '#2563eb' : '#94a3b8',
            }}
            onClick={startAIExamNow}
            disabled={secondsLeft <= 0}
          >
            {secondsLeft > 0 ? 'Training jetzt starten' : 'Zeit abgelaufen'}
          </button>
        </div>
      ) : (
        <>
          {dates.map((item, index) => (
            <div key={index} style={card}>
              <h3>Termin {index + 1}</h3>

              <label style={label}>Datum</label>
              <input
                type="date"
                value={item.date}
                onChange={(e) => updateDate(index, 'date', e.target.value)}
                style={input}
              />

              <label style={label}>Uhrzeit</label>
              <input
                type="time"
                value={item.time}
                onChange={(e) => updateDate(index, 'time', e.target.value)}
                style={input}
              />
            </div>
          ))}

          <button style={saveButton} onClick={saveSchedule}>
            Termine speichern
          </button>
        </>
      )}
    </div>
  );
}

const container = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  background: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '90px',
};

const backButton = {
  border: 'none',
  background: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  marginBottom: '14px',
};

const hero = {
  background: '#2563eb',
  color: 'white',
  borderRadius: '22px',
  padding: '22px',
  marginBottom: '18px',
};

const card = {
  background: 'white',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '14px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
};

const timerBox = {
  fontSize: '42px',
  fontWeight: '900',
  textAlign: 'center',
  color: '#2563eb',
  background: '#eff6ff',
  borderRadius: '18px',
  padding: '22px',
  marginBottom: '14px',
};

const hint = {
  color: '#475569',
  lineHeight: '1.6',
  marginBottom: '18px',
};

const label = {
  display: 'block',
  fontWeight: '700',
  marginBottom: '6px',
  color: '#0f172a',
};

const input = {
  width: '100%',
  padding: '13px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
};

const saveButton = {
  width: '100%',
  padding: '15px',
  borderRadius: '14px',
  border: 'none',
  background: '#16a34a',
  color: 'white',
  fontWeight: '800',
  fontSize: '16px',
};