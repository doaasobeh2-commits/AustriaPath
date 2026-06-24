import React from 'react';

const homeTexts = {
  Deutsch: {
    aiTitle: 'AI Probeprüfung',
    aiText:
      'Trainiere später mit einer interaktiven AI-Prüfung und erhalte Feedback zu Aussprache, Grammatik, Wortschatz und Satzbau.',
    aiPlan:
      'Beginne mit einem Einstufungstest und erhalte einen Lernplan, der zu deinem Niveau passt.',
    aiButton: 'Jetzt AI Prüfung ansehen',
  },
  العربية: {
    aiTitle: 'اختبار AI تجريبي',
    aiText:
      'تدرّب لاحقاً مع اختبار تفاعلي بالذكاء الاصطناعي واحصل على ملاحظات حول النطق، القواعد، المفردات وبناء الجمل.',
    aiPlan:
      'ابدأ باختبار تحديد المستوى واحصل على خطة دراسة تناسب مستواك.',
    aiButton: 'عرض اختبار AI الآن',
  },
  Türkçe: {
    aiTitle: 'AI Deneme Sınavı',
    aiText:
      'Daha sonra etkileşimli bir AI sınavıyla pratik yap ve telaffuz, gramer, kelime bilgisi ve cümle yapısı hakkında geri bildirim al.',
    aiPlan:
      'Seviye belirleme testiyle başla ve seviyene uygun bir çalışma planı al.',
    aiButton: 'AI sınavını şimdi gör',
  },
  فارسی: {
    aiTitle: 'آزمون آزمایشی AI',
    aiText:
      'بعداً با یک آزمون تعاملی هوش مصنوعی تمرین کن و درباره تلفظ، گرامر، واژگان و ساختار جمله بازخورد بگیر.',
    aiPlan:
      'با آزمون تعیین سطح شروع کن و برنامه مطالعه مناسب سطح خود را دریافت کن.',
    aiButton: 'مشاهده آزمون AI',
  },
  Українська: {
    aiTitle: 'Пробний AI-іспит',
    aiText:
      'Пізніше тренуйся з інтерактивним AI-іспитом і отримуй відгук щодо вимови, граматики, словника та побудови речень.',
    aiPlan:
      'Почни з тесту визначення рівня та отримай навчальний план відповідно до свого рівня.',
    aiButton: 'Переглянути AI-іспит',
  },
};

export function HomeScreen({ setActiveTab }) {
  const userLanguage = localStorage.getItem('userLanguage') || 'Deutsch';
  const homeT = homeTexts[userLanguage] || homeTexts.Deutsch;

  return (
    <div style={pageStyle}>
      <div style={mobileAppStyle}>
        <div style={heroStyle}>
          <div style={heroImageStyle}>
            <img src="/logo.png" alt="AustriaPath" style={heroLogoStyle} />
          </div>

          <h1 style={heroTitleStyle}>Willkommen bei AustriaPath</h1>

          <p style={heroTextStyle}>
            Dein Begleiter für Deutsch, Prüfungsvorbereitung und Alltag in Österreich.
          </p>
        </div>

        <div style={contentStyle}>
          <div style={gridStyle}>
            <Card icon="📖" title="Lesen Trainer" text="Kostenlose Lesemodelle für A2, B1 und B2." color="#e0f2fe" onClick={() => setActiveTab('lesen')} />
            <Card icon="🎧" title="Hören Trainer" text="Kostenlose Hörmodelle mit Text, Audio und Fragen." color="#f3e8ff" onClick={() => setActiveTab('horen')} />
            <Card icon="🖼️" title="Bildbeschreibung" text="Trainiere Bilder mit Beschreibung, Meinung und Beispielen." color="#ecfdf5" onClick={() => setActiveTab('images')} />
            <Card icon="🗣️" title="Mündliche Prüfung" text="A2: Selbstvorstellung · B1: Etwas planen · B2: Diskussion und Präsentation." color="#eff6ff" onClick={() => setActiveTab('speaking')} />
            <Card icon="📚" title="Prüfungsdatenbank" text="Häufige Themen nach Niveau, Bundesland und Stadt." color="#fff7ed" onClick={() => setActiveTab('database')} />
            <Card icon="⭐" title="AI Prüfung" text="Interaktive Probeprüfung mit Analyse und Ergebnisbericht." color="#fef9c3" onClick={() => setActiveTab('premium')} />
          </div>

          <div style={popularStyle}>
            <Watermark />
            <h2 style={sectionTitleStyle}>Beliebte Themen</h2>
            <p style={popularTextStyle}>📍 B1 Wien · Häufige Prüfungsthemen</p>
            <p style={popularTextStyle}>📖 Lesen · 🎧 Hören · 🖼️ Bildbeschreibung · 🗣️ Mündliche Prüfung</p>
          </div>

          <div style={aiBoxStyle}>
            <Watermark />
            <h2 style={sectionTitleStyle}>{homeT.aiTitle}</h2>

            <p style={cardTextStyle}>{homeT.aiText}</p>

            <p style={aiPlanStyle}>{homeT.aiPlan}</p>

            <button onClick={() => setActiveTab('premium')} style={aiButtonStyle}>
              {homeT.aiButton}
            </button>
          </div>

          <p style={footerStyle}>
            AustriaPath ist eine unabhängige Lernplattform für Deutsch, Alltag und
            Prüfungsvorbereitung in Österreich.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, text, color, onClick }) {
  return (
    <button onClick={onClick} style={{ ...cardStyle, background: color }}>
      <Watermark />
      <div style={iconStyle}>{icon}</div>
      <h3 style={cardTitleStyle}>{title}</h3>
      <p style={cardTextStyle}>{text}</p>
    </button>
  );
}

function Watermark() {
  return <img src="/logo.png" alt="" style={watermarkStyle} />;
}

const pageStyle = {
  minHeight: '100vh',
  background: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
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
  width: '100%',
  height: '185px',
  borderRadius: '26px',
  marginBottom: '22px',

  backgroundImage:
    'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0.18) 100%), url("/src/public/austria-hero.jpeg")',

  backgroundSize: 'cover',
  backgroundPosition: 'center',

  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',

  padding: '16px',
  boxSizing: 'border-box',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
};
const heroLogoStyle = {
  width: '115px',
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
  color: '#0f172a',
  fontSize: '34px',
  lineHeight: '1.1',
  fontWeight: '800',
};

const heroTextStyle = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.5',
  maxWidth: '310px',
  marginTop: '14px',
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