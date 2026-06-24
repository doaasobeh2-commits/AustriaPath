import React, { useState } from 'react';

const translations = {
  Deutsch: {
    languageTitle: 'Wähle deine Erklärungssprache',
    offersTitle: 'Was bietet AustriaPath?',
    freePremiumTitle: 'Kostenlos & Premium',
    freeTitle: 'Kostenlos',
    premiumTitle: 'Premium',
    freeItems: [
      '📖 Lesen Training',
      '🎧 Hören Training',
      '✍️ Schreiben Modelle',
      '🖼️ Bildbeschreibung',
      '🗣️ Mündliche Prüfung',
      '📚 Grammatik & Wortschatz',
      '🏆 Prüfungsdatenbank',
    ],
    freePlanItems: [
      '✓ Modelle und Übungen',
      '✓ Grammatik und Wortschatz',
      '✓ Bildbeschreibung',
      '✓ Prüfungsdatenbank',
    ],
    premiumItems: [
      '✓ Interaktive AI-Prüfungen',
      '✓ Persönliches Feedback',
      '✓ Individuelle Lernpläne',
    ],
    noticeTitle: 'Wichtiger Hinweis',
    noticeTexts: [
      'AustriaPath ist eine unabhängige Lernplattform.',
      'AustriaPath steht in keiner Verbindung zu Behörden, Sprachschulen oder Prüfungsinstituten.',
      'Alle Inhalte dienen ausschließlich Lern- und Übungszwecken.',
    ],
    accept: 'Ich habe die Hinweise gelesen und akzeptiert.',
    register: 'Weiter',
    next: 'Weiter',
    chooseLevel: 'Niveau auswählen',
  },

  العربية: {
    languageTitle: 'اختر لغة الشرح',
    offersTitle: 'ماذا يقدم AustriaPath؟',
    freePremiumTitle: 'مجاني وبريميوم',
    freeTitle: 'مجاني',
    premiumTitle: 'بريميوم',
    freeItems: [
      '📖 تدريب القراءة',
      '🎧 تدريب الاستماع',
      '✍️ نماذج الكتابة',
      '🖼️ وصف الصور',
      '🗣️ التدريب الشفهي',
      '📚 القواعد والمفردات',
      '🏆 قاعدة بيانات مواضيع الامتحان',
    ],
    freePlanItems: [
      '✓ نماذج وتمارين جاهزة',
      '✓ قواعد ومفردات',
      '✓ وصف الصور',
      '✓ قاعدة بيانات للمواضيع المتكررة',
    ],
    premiumItems: [
      '✓ امتحانات AI تفاعلية',
      '✓ ملاحظات شخصية',
      '✓ خطة دراسة مناسبة لمستواك',
    ],
    noticeTitle: 'ملاحظة مهمة',
    noticeTexts: [
      'AustriaPath منصة تعليمية مستقلة.',
      'لا ترتبط AustriaPath بأي جهة رسمية أو مدرسة لغة أو مؤسسة امتحانات.',
      'كل المحتوى مخصص للتعلم والتدريب فقط.',
    ],
    accept: 'قرأت الملاحظات وأوافق عليها.',
    register: 'متابعة',
    next: 'متابعة',
    chooseLevel: 'اختر مستواك',
  },

  Türkçe: {
    languageTitle: 'Açıklama dilini seç',
    offersTitle: 'AustriaPath ne sunar?',
    freePremiumTitle: 'Ücretsiz & Premium',
    freeTitle: 'Ücretsiz',
    premiumTitle: 'Premium',
    freeItems: [
      '📖 Okuma eğitimi',
      '🎧 Dinleme eğitimi',
      '✍️ Yazma modelleri',
      '🖼️ Resim anlatımı',
      '🗣️ Sözlü sınav',
      '📚 Dil bilgisi ve kelime',
      '🏆 Sınav konu veritabanı',
    ],
    freePlanItems: [
      '✓ Modeller ve alıştırmalar',
      '✓ Dil bilgisi ve kelime',
      '✓ Resim anlatımı',
      '✓ Sınav konu veritabanı',
    ],
    premiumItems: [
      '✓ Etkileşimli AI sınavları',
      '✓ Kişisel geri bildirim',
      '✓ Seviyene uygun çalışma planı',
    ],
    noticeTitle: 'Önemli bilgi',
    noticeTexts: [
      'AustriaPath bağımsız bir öğrenme platformudur.',
      'AustriaPath resmi kurumlar, dil okulları veya sınav kurumlarıyla bağlantılı değildir.',
      'Tüm içerikler sadece öğrenme ve pratik amaçlıdır.',
    ],
    accept: 'Bilgileri okudum ve kabul ediyorum.',
    register: 'Devam',
    next: 'Devam',
    chooseLevel: 'Seviyeni seç',
  },

  فارسی: {
    languageTitle: 'زبان توضیحات را انتخاب کنید',
    offersTitle: 'AustriaPath چه چیزی ارائه می‌دهد؟',
    freePremiumTitle: 'رایگان و پرمیوم',
    freeTitle: 'رایگان',
    premiumTitle: 'پرمیوم',
    freeItems: [
      '📖 تمرین خواندن',
      '🎧 تمرین شنیدن',
      '✍️ نمونه‌های نوشتن',
      '🖼️ توصیف تصویر',
      '🗣️ آزمون شفاهی',
      '📚 گرامر و واژگان',
      '🏆 پایگاه موضوعات امتحانی',
    ],
    freePlanItems: [
      '✓ نمونه‌ها و تمرین‌ها',
      '✓ گرامر و واژگان',
      '✓ توصیف تصویر',
      '✓ پایگاه موضوعات امتحانی',
    ],
    premiumItems: [
      '✓ آزمون‌های تعاملی AI',
      '✓ بازخورد شخصی',
      '✓ برنامه مطالعه مناسب سطح شما',
    ],
    noticeTitle: 'اطلاع مهم',
    noticeTexts: [
      'AustriaPath یک پلتفرم آموزشی مستقل است.',
      'AustriaPath وابسته به هیچ اداره، مدرسه زبان یا مؤسسه امتحانی نیست.',
      'همه محتوا فقط برای یادگیری و تمرین است.',
    ],
    accept: 'اطلاعات را خواندم و قبول دارم.',
    register: 'ادامه',
    next: 'ادامه',
    chooseLevel: 'سطح خود را انتخاب کنید',
  },

  Українська: {
    languageTitle: 'Оберіть мову пояснення',
    offersTitle: 'Що пропонує AustriaPath?',
    freePremiumTitle: 'Безкоштовно & Premium',
    freeTitle: 'Безкоштовно',
    premiumTitle: 'Premium',
    freeItems: [
      '📖 Тренування читання',
      '🎧 Тренування аудіювання',
      '✍️ Моделі письма',
      '🖼️ Опис зображення',
      '🗣️ Усна частина',
      '📚 Граматика та словник',
      '🏆 База тем іспиту',
    ],
    freePlanItems: [
      '✓ Моделі та вправи',
      '✓ Граматика та словник',
      '✓ Опис зображення',
      '✓ База тем іспиту',
    ],
    premiumItems: [
      '✓ Інтерактивні AI-іспити',
      '✓ Персональний відгук',
      '✓ Індивідуальний навчальний план',
    ],
    noticeTitle: 'Важлива інформація',
    noticeTexts: [
      'AustriaPath — незалежна навчальна платформа.',
      'AustriaPath не пов’язана з державними органами, мовними школами або екзаменаційними установами.',
      'Усі матеріали призначені лише для навчання та практики.',
    ],
    accept: 'Я прочитав/прочитала інформацію та погоджуюся.',
    register: 'Далі',
    next: 'Далі',
    chooseLevel: 'Оберіть рівень',
  },
};

export function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem('userLanguage') || 'Deutsch'
  );
  const [selectedLevel, setSelectedLevel] = useState(
    localStorage.getItem('userLevel') || 'B1'
  );

  const t = translations[language] || translations.Deutsch;

  const next = () => setStep((prev) => prev + 1);

  const finish = () => {
  localStorage.setItem('userLanguage', language);
  localStorage.setItem('austriaPathLanguage', language);

  localStorage.setItem('userLevel', selectedLevel);
  localStorage.setItem('austriaPathUserLevel', selectedLevel);

  if (onFinish) onFinish();
};
  return (
    <div style={pageStyle}>
      {step === 1 && (
        <Screen>
          <h1 style={titleStyle}>{t.languageTitle}</h1>

          {Object.keys(translations).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                ...cardStyle,
                width: '100%',
                textAlign: 'left',
                background: language === lang ? '#dbeafe' : '#ffffff',
                border:
                  language === lang
                    ? '2px solid #2563eb'
                    : '1px solid #e5e7eb',
              }}
            >
              {lang}
            </button>
          ))}

          <Button text={t.next} onClick={next} />
        </Screen>
      )}

      {step === 2 && (
        <Screen>
          <h1 style={titleStyle}>{t.offersTitle}</h1>

          {t.freeItems.map((item) => (
            <div key={item} style={cardStyle}>
              {item}
            </div>
          ))}

          <Button text={t.next} onClick={next} />
        </Screen>
      )}

      {step === 3 && (
        <Screen>
          <h1 style={titleStyle}>{t.freePremiumTitle}</h1>

          <div style={boxStyle}>
            <h2>{t.freeTitle}</h2>
            {t.freePlanItems.map((item) => (
              <p key={item} style={textStyle}>{item}</p>
            ))}
          </div>

          <div style={boxStyle}>
            <h2>{t.premiumTitle}</h2>
            {t.premiumItems.map((item) => (
              <p key={item} style={textStyle}>{item}</p>
            ))}
          </div>

          <Button text={t.next} onClick={next} />
        </Screen>
      )}

      {step === 4 && (
        <Screen>
          <h1 style={titleStyle}>{t.noticeTitle}</h1>

          {t.noticeTexts.map((text) => (
            <p key={text} style={textStyle}>{text}</p>
          ))}

          <h3 style={{ marginTop: '24px' }}>{t.chooseLevel}</h3>

          <div style={levelBoxStyle}>
            {['A2', 'B1', 'B2'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedLevel(item)}
                style={{
                  ...levelButtonStyle,
                  background: selectedLevel === item ? '#2563eb' : '#ffffff',
                  color: selectedLevel === item ? '#ffffff' : '#0f172a',
                  border:
                    selectedLevel === item
                      ? '1px solid #2563eb'
                      : '1px solid #d1d5db',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <label style={checkStyle}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t.accept}</span>
          </label>

          <button
            onClick={finish}
            disabled={!accepted}
            style={{
              ...buttonStyle,
              opacity: accepted ? 1 : 0.5,
              cursor: accepted ? 'pointer' : 'not-allowed',
            }}
          >
            {t.register}
          </button>
        </Screen>
      )}
    </div>
  );
}

function Screen({ children }) {
  return <div style={screenStyle}>{children}</div>;
}

function Button({ text, onClick }) {
  return (
    <button onClick={onClick} style={buttonStyle}>
      {text}
    </button>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#e5e7eb',
  display: 'flex',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
};

const screenStyle = {
  width: '390px',
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '34px',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: '34px',
  lineHeight: 1.15,
  marginBottom: '28px',
  color: '#0f172a',
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  fontWeight: '800',
  color: '#0f172a',
};

const boxStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '20px',
};

const textStyle = {
  color: '#334155',
  fontSize: '17px',
  lineHeight: 1.6,
};

const checkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '22px',
  marginBottom: '22px',
  color: '#334155',
  fontSize: '16px',
};

const levelBoxStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '12px',
  marginBottom: '20px',
};

const levelButtonStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '900',
  cursor: 'pointer',
};

const buttonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: '16px',
  padding: '16px',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: '900',
  fontSize: '17px',
};