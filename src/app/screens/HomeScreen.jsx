import React from 'react';
import { getUserLanguage } from '../../utils/userPreferences';

const homeTexts = {
  Deutsch: {
    aiTitle: 'Intelligentes AI-Training',
    aiText:
      'Trainiere mit interaktiven AI-Übungen und erhalte Feedback zu Aussprache, Grammatik, Wortschatz und Satzbau.',
    aiPlan:
      'Beginne mit einer Niveau-Einschätzung und erhalte einen personalisierten Lernplan für kontinuierliche Verbesserung.',
    aiButton: 'AI-Training entdecken',
  },
  العربية: {
    aiTitle: 'تدريب AI ذكي',
    aiText:
      'تدرّب مع تمارين تفاعلية بالذكاء الاصطناعي واحصل على ملاحظات حول النطق، القواعد، المفردات وبناء الجمل.',
    aiPlan:
      'ابدأ بتقييم المستوى واحصل على خطة تعلم شخصية للتحسن المستمر.',
    aiButton: 'اكتشف تدريب AI',
  },
  Türkçe: {
    aiTitle: 'Akıllı AI Eğitimi',
    aiText:
      'Etkileşimli AI alıştırmalarıyla pratik yap ve telaffuz, gramer, kelime bilgisi ve cümle yapısı hakkında geri bildirim al.',
    aiPlan:
      'Seviye değerlendirmesiyle başla ve sürekli gelişim için kişisel bir öğrenme planı al.',
    aiButton: 'AI eğitimini keşfet',
  },
  فارسی: {
    aiTitle: 'آموزش هوشمند AI',
    aiText:
      'با تمرین‌های تعاملی هوش مصنوعی تمرین کن و درباره تلفظ، گرامر، واژگان و ساختار جمله بازخورد بگیر.',
    aiPlan:
      'با ارزیابی سطح شروع کن و برنامه یادگیری شخصی برای پیشرفت مداوم دریافت کن.',
    aiButton: 'آموزش AI را کشف کن',
  },
  Українська: {
    aiTitle: 'Розумне AI-тренування',
    aiText:
      'Тренуйся з інтерактивними AI-вправами та отримуй відгук щодо вимови, граматики, словника та побудови речень.',
    aiPlan:
      'Почни з оцінки рівня та отримай персональний навчальний план для постійного прогресу.',
    aiButton: 'Відкрити AI-тренування',
  },
};

export function HomeScreen({ setActiveTab }) {
  const userLanguage = getUserLanguage();
  const homeT = homeTexts[userLanguage] || homeTexts.Deutsch;

  return (
    <div style={pageStyle}>
      <div style={mobileAppStyle}>
        <div style={heroStyle}>
          <div style={heroImageStyle}>
            <img
              src="/austria-hero.jpeg"
              alt=""
              style={heroBackgroundImageStyle}
              aria-hidden="true"
            />
            <div style={heroImageOverlayStyle} aria-hidden="true" />
            <div style={heroTextInsideImageStyle}>
              <h1 style={heroTitleStyle}>Willkommen bei AustriaPath</h1>
            </div>
          </div>
        </div>

        <div style={contentStyle}>
          <div style={gridStyle}>
            <Card icon="📖" title="Lesen Trainer" text="Kostenlose Lesemodelle für A2, B1 und B2." color="#e0f2fe" onClick={() => setActiveTab('lesen')} />
            <Card icon="🎧" title="Hören Trainer" text="Kostenlose Hörmodelle mit Text, Audio und Fragen." color="#f3e8ff" onClick={() => setActiveTab('horen')} />
            <Card icon="🖼️" title="Bildbeschreibung" text="Trainiere Bilder mit Beschreibung, Meinung und Beispielen." color="#ecfdf5" onClick={() => setActiveTab('images')} />
            <Card icon="🗣️" title="Sprechen üben" text="A2: Selbstvorstellung · B1: Etwas planen · B2: Diskussion und Präsentation." color="#eff6ff" onClick={() => setActiveTab('speaking')} />
            <Card icon="📚" title="Themenbibliothek" text="Häufige Alltagsthemen nach Niveau, Bundesland und Stadt." color="#fff7ed" onClick={() => setActiveTab('database')} />
            <Card icon="⭐" title="AI-Training" text="Interaktive Übungssimulation mit AI-Feedback und Lernbericht." color="#fef9c3" onClick={() => setActiveTab('premium')} />
          </div>

          <div style={popularStyle}>
            
            <h2 style={sectionTitleStyle}>Beliebte Themen</h2>
            <p style={popularTextStyle}>📍 B1 Wien · Beliebte Alltagsthemen</p>
            <p style={popularTextStyle}>📖 Lesen · 🎧 Hören · 🖼️ Bildbeschreibung · 🗣️ Sprechen üben</p>
          </div>

          <div style={aiBoxStyle}>
            
            <h2 style={sectionTitleStyle}>{homeT.aiTitle}</h2>

            <p style={cardTextStyle}>{homeT.aiText}</p>

            <p style={aiPlanStyle}>{homeT.aiPlan}</p>

            <button onClick={() => setActiveTab('premium')} style={aiButtonStyle}>
              {homeT.aiButton}
            </button>
          </div>

          <p style={footerStyle}>
            AustriaPath ist eine unabhängige Lernplattform für tägliches Deutschlernen,
            personalisiertes Training und kontinuierliche Sprachverbesserung in Österreich.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, text, color, onClick }) {
  return (
    <button onClick={onClick} style={{ ...cardStyle, background: color }}>
      
      <div style={iconStyle}>{icon}</div>
      <h3 style={cardTitleStyle}>{title}</h3>
      <p style={cardTextStyle}>{text}</p>
    </button>
  );
}

function Watermark() {
  return <img src="/app-icon.png" alt="" style={watermarkStyle} />;
}

const pageStyle = {
  minHeight: '100vh',
  background: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
  width: '100%',
};

const mobileAppStyle = {
  width: '430px',
  maxWidth: '100%',
  minHeight: '844px',
  background: '#ffffff',
  overflowX: 'hidden',
  boxSizing: 'border-box',
};

const heroStyle = {
  padding: '14px 16px 26px',
  boxSizing: 'border-box',
  
};
const heroImageStyle = {
  position: 'relative',
  width: '100%',
  height: '205px',
  borderRadius: '26px',
  marginBottom: '22px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  padding: '16px',
  boxSizing: 'border-box',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
};

const heroBackgroundImageStyle = {
  position: 'absolute',
  top: 0,
  left: '50%',
  width: '105%',
  height: '100%',
  transform: 'translateX(-50%)',
  objectFit: 'cover',
  objectPosition: 'center top',
  display: 'block',
  pointerEvents: 'none',
};

const heroImageOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.16) 42%, rgba(255,255,255,0.02) 100%)',
  pointerEvents: 'none',
};
const heroLogoStyle = {
  width: '92px',
  height: 'auto',
  objectFit: 'contain',
};

const contentStyle = {
  padding: '16px',
  marginTop: '-10px',
  boxSizing: 'border-box',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '18px',
  width: '100%',
};

const cardStyle = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '205px',
  padding: '22px',
  border: 'none',
  borderRadius: '22px',
  boxSizing: 'border-box',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
};

const watermarkStyle = {
  position: 'absolute',
  right: '10px',
  bottom: '10px',
  width: '54px',
  opacity: 0.07,
  pointerEvents: 'none',
};

const heroTitleStyle = {
  margin: 0,
  marginTop: '38px',
  marginLeft: '-18px',

  color: '#1f2937',
  fontSize: '22px',
  lineHeight: '1.18',
  fontWeight: '700',

  maxWidth: '250px',
  letterSpacing: '-0.3px',
};


const iconStyle = {
  fontSize: '30px',
  marginBottom: '12px',
};

const cardTitleStyle = {
  margin: '0 0 10px',
  color: '#0f172a',
  fontSize: '20px',
  lineHeight: '1.2',
};

const cardTextStyle = {
  margin: 0,
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.45',
};

const popularStyle = {
  position: 'relative',
  overflow: 'hidden',
  marginTop: '18px',
  background: '#ffffff',
  border: '1px solid #bfdbfe',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
};

const aiBoxStyle = {
  position: 'relative',
  overflow: 'hidden',
  marginTop: '18px',
  background: '#ffffff',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
};

const sectionTitleStyle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: '22px',
};

const popularTextStyle = {
  margin: '6px 0',
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.5',
};

const aiPlanStyle = {
  marginTop: '12px',
  color: '#2563eb',
  fontWeight: '700',
  fontSize: '14px',
  lineHeight: '1.5',
};

const aiButtonStyle = {
  width: '100%',
  marginTop: '18px',
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '800',
  fontSize: '15px',
  cursor: 'pointer',
};

const footerStyle = {
  margin: '22px 4px 0',
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.5',
};
const heroTextInsideImageStyle = {
  position: 'relative',
  zIndex: 1,
  maxWidth: '285px',
  marginTop: '88px',
  marginLeft: '4px',
};
const heroProtectedStyle = {
  marginTop: '18px',
  color: '#1f2937',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.2px',
};

const heroCopyrightStyle = {
  marginTop: '6px',
  color: '#334155',
  fontSize: '12px',
  fontWeight: '600',
};