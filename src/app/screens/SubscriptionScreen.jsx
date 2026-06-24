import React from 'react';

export default function SubscriptionScreen({ setActiveTab, onOpenPremiumExam }) {
  const language =
    localStorage.getItem('userLanguage') ||
    localStorage.getItem('austriaPathLanguage') ||
    'Deutsch';

  const t = content[language] || content.Deutsch;
  const plans = t.plans;

  return (
    <div style={container}>
      <h1 style={title}>{t.title}</h1>
      <p style={subtitle}>{t.subtitle}</p>

      {plans.map((plan, index) => (
        <div
          key={index}
          style={{
            ...card,
            border: plan.highlight ? '2px solid #2563eb' : '1px solid #e5e7eb',
            background: plan.highlight ? '#eff6ff' : '#ffffff',
          }}
        >
          {plan.highlight && <div style={badge}>{t.recommended}</div>}

          <h2 style={planName}>{plan.name}</h2>
          <div style={price}>{plan.price}</div>
          <p style={examInfo}>{plan.exams} · {plan.duration}</p>

          <ul style={list}>
            {plan.features.map((feature, i) => (
              <li key={i} style={listItem}>✓ {feature}</li>
            ))}
          </ul>

  <button
  style={button}
  onClick={() => {
    if (plan.price === '2,00 €') {
      setActiveTab?.('placementTest');
      return;
    }

   if (plan.price === '14,99 €') {
  setActiveTab?.('weeklyPlanSetup');
  return;
}

    if (onOpenPremiumExam) {
      onOpenPremiumExam();
    }
  }}
>
  {plan.buttonText}
</button>
        </div>
      ))}

      <div style={infoBox}>
        <h3 style={{ marginTop: 0 }}>{t.infoTitle}</h3>
        <p>{t.infoText}</p>
      </div>
    </div>
  );
}



const content = {
  Deutsch: {
    title: 'AustriaPath Premium',
    subtitle: 'Bestimmen Sie Ihr Niveau und erhalten Sie einen passenden Lernplan.',
    recommended: 'Empfohlen',
    select: 'Auswählen',
    infoTitle: 'Was ist enthalten?',
    infoText:
      'AustriaPath Premium hilft Ihnen, Ihr Niveau zu bestimmen, Prüfungen zu trainieren, Stärken und Schwächen zu erkennen und einen persönlichen Lernplan zu erhalten.',
    plans: [
      {
        name: 'Persönlicher Lernplan',
        price: '2,00 €',
        exams: 'Einstufungstest',
        duration: 'ca. 8 Minuten',
        highlight: false,
        features: [
          'Selbstvorstellung: 1 Minute',
          'Bildbeschreibung: 1 Minute',
          'Hören, Lesen und Grammatik',
          'Niveau-Einschätzung A2 / B1 / B2',
          'Passender Lernplan für Sie',
        ],
      },
      {
        name: 'KI-Wochenplan',
        price: '14,99 €',
        exams: '3 Termine',
        duration: '7 Tage',
        highlight: true,
        features: [
          '3 Termine selbst auswählen',
          'Tag und Uhrzeit festlegen',
          'Termin 1: Selbstvorstellung',
          'Termin 2: Bildbeschreibung und Planung',
          'Termin 3: Abschlusstraining mit Ergebnis',
          'Persönlicher Plan nach deinen Zielen',
        ],
      },
      {
        name: 'AI Probeprüfung',
        price: '9,99 €',
        exams: '1 Prüfung',
        duration: 'Einmalig',
        highlight: false,
        features: [
          'Vollständige AI-Prüfung',
          'Aussprache-Analyse',
          'Grammatik-Analyse',
          'Wortschatz-Bewertung',
          'Kurzer Bericht und persönlicher Tipp',
        ],
      },
      {
        name: 'Intensive Woche',
        price: '24,99 €',
        exams: '3 Prüfungen',
        duration: '7 Tage gültig',
        highlight: false,
        features: [
          '3 vollständige AI-Prüfungen',
          'Interaktive Nachfragen',
          'Bildbeschreibung',
          'Planung oder Gespräch je nach Niveau',
          'Detaillierter Bericht und kurzer Lernplan',
        ],
      },
      {
        name: 'Premium Monat',
        price: '39,99 €',
        exams: '5 Prüfungen',
        duration: '30 Tage gültig',
        highlight: false,
        features: [
          '5 vollständige AI-Prüfungen',
          'Fortschrittsvergleich',
          'Analyse wiederholter Fehler',
          'Lernplan für mehrere Wochen',
          'Trainingsempfehlungen in AustriaPath',
        ],
      },
    ],
  },

  العربية: {
    title: 'AustriaPath Premium',
    subtitle: 'اختبر مستواك واحصل على خطة دراسة مناسبة لك.',
    recommended: 'مقترح',
    select: 'اختيار',
    infoTitle: 'ماذا تحصل؟',
    infoText:
      'تساعدك خطط AustriaPath Premium على معرفة مستواك، والتدريب على الامتحان، وتحليل نقاط القوة والضعف، والحصول على خطة دراسة مناسبة لك.',
    plans: [
      {
        name: 'خطة الدراسة الشخصية',
        price: '2,00 €',
        exams: 'اختبار مستوى',
        duration: 'حوالي 8 دقائق',
        highlight: false,
        features: [
          'تعريف النفس',
          'شرح صورة',
          'استماع وقراءة',
          'تحديد المستوى A2 / B1 / B2',
          'خطة دراسة شخصية',
        ],
      },
      {
        name: 'خطة أسبوع بالذكاء الاصطناعي',
        price: '14,99 €',
        exams: '3 جلسات',
        duration: '7 أيام',
        highlight: true,
        features: [
          'اختيار 3 مواعيد بنفسك',
          'تحديد الأيام والساعات',
          'الجلسة الأولى: تعريف النفس',
          'الجلسة الثانية: شرح صورة وبلان',
          'الجلسة الثالثة: تدريب نهائي ونتيجة',
          'خطة شخصية حسب أهدافك',
        ],
      },
      {
        name: 'امتحان AI تجريبي',
        price: '9,99 €',
        exams: 'امتحان واحد',
        duration: 'مرة واحدة',
        highlight: false,
        features: [
          'امتحان كامل',
          'تعريف النفس',
          'شرح صورة',
          'بلان أو مناقشة',
          'تقرير مختصر',
        ],
      },
      {
        name: 'أسبوع مكثف',
        price: '24,99 €',
        exams: '3 امتحانات',
        duration: '7 أيام',
        highlight: false,
        features: [
          '3 امتحانات كاملة',
          'تحليل الأخطاء',
          'خطة دراسة قصيرة',
          'متابعة التقدم',
        ],
      },
      {
        name: 'شهر Premium',
        price: '39,99 €',
        exams: '5 امتحانات',
        duration: '30 يوماً',
        highlight: false,
        features: [
          '5 امتحانات كاملة',
          'مقارنة التقدم',
          'تحليل نقاط الضعف',
          'خطة دراسة متقدمة',
        ],
      },
    ],
  },

  Türkçe: {
    title: 'AustriaPath Premium',
    subtitle: 'Seviyenizi belirleyin ve size uygun bir çalışma planı alın.',
    recommended: 'Önerilen',
    select: 'Seç',
    infoTitle: 'Neler dahildir?',
    infoText:
      'AustriaPath Premium seviyenizi belirlemenize, sınava hazırlanmanıza, güçlü ve zayıf yönlerinizi görmenize ve kişisel bir çalışma planı almanıza yardımcı olur.',
    plans: [
      {
        name: 'Kişisel Çalışma Planı',
        price: '2,00 €',
        exams: 'Seviye testi',
        duration: 'Yaklaşık 8 dakika',
        highlight: false,
        features: [
          '1 dakika kendini tanıtma',
          '1 dakika resim açıklama',
          'Dinleme, okuma ve dil bilgisi',
          'A2 / B1 / B2 seviye belirleme',
          'Size uygun çalışma planı',
        ],
      },
      {
        name: 'AI ile Haftalık Plan',
        price: '14,99 €',
        exams: '3 Oturum',
        duration: '7 Gün',
        highlight: true,
        features: [
          '3 randevuyu kendiniz seçin',
          'Gün ve saat belirleme',
          '1. oturum: Kendini tanıtma',
          '2. oturum: Resim açıklama ve planlama',
          '3. oturum: Son değerlendirme ve sonuç',
          'Hedeflerinize uygun kişisel plan',
        ],
      },
      {
        name: 'AI Deneme Sınavı',
        price: '9,99 €',
        exams: '1 sınav',
        duration: 'Tek seferlik',
        highlight: false,
        features: [
          'Tam AI sınavı',
          'Telaffuz analizi',
          'Dil bilgisi analizi',
          'Kelime değerlendirmesi',
          'Kısa rapor ve kişisel tavsiye',
        ],
      },
      {
        name: 'Yoğun Hafta',
        price: '24,99 €',
        exams: '3 sınav',
        duration: '7 gün geçerli',
        highlight: false,
        features: [
          '3 tam AI sınavı',
          'Etkileşimli sorular',
          'Resim açıklama',
          'Seviyeye göre planlama veya konuşma',
          'Detaylı rapor ve kısa çalışma planı',
        ],
      },
      {
        name: 'Premium Ay',
        price: '39,99 €',
        exams: '5 sınav',
        duration: '30 gün geçerli',
        highlight: false,
        features: [
          '5 tam AI sınavı',
          'İlerleme karşılaştırması',
          'Tekrarlanan hata analizi',
          'Birkaç haftalık çalışma planı',
          'AustriaPath içinde çalışma önerileri',
        ],
      },
    ],
  },

  فارسی: {
    title: 'AustriaPath Premium',
    subtitle: 'سطح خود را مشخص کنید و یک برنامه آموزشی مناسب دریافت کنید.',
    recommended: 'پیشنهادی',
    select: 'انتخاب',
    infoTitle: 'چه چیزی دریافت می‌کنید؟',
    infoText:
      'AustriaPath Premium به شما کمک می‌کند سطح خود را بشناسید، برای امتحان تمرین کنید، نقاط قوت و ضعف خود را ببینید و یک برنامه آموزشی مناسب دریافت کنید.',
    plans: [
      {
        name: 'برنامه آموزشی شخصی',
        price: '2,00 €',
        exams: 'آزمون تعیین سطح',
        duration: 'حدود 8 دقیقه',
        highlight: false,
        features: [
          'معرفی خود به مدت یک دقیقه',
          'توصیف تصویر به مدت یک دقیقه',
          'شنیدن، خواندن و گرامر',
          'تخمین سطح A2 / B1 / B2',
          'برنامه آموزشی مناسب شما',
        ],
      },
      {
        name: 'برنامه هفتگی با هوش مصنوعی',
        price: '14,99 €',
        exams: '3 جلسه',
        duration: '7 روز',
        highlight: true,
        features: [
          'انتخاب 3 وقت توسط خودتان',
          'تعیین روز و ساعت',
          'جلسه اول: معرفی خود',
          'جلسه دوم: توصیف تصویر و برنامه‌ریزی',
          'جلسه سوم: تمرین نهایی و نتیجه',
          'برنامه شخصی بر اساس هدف‌های شما',
        ],
      },
      {
        name: 'آزمون آزمایشی AI',
        price: '9,99 €',
        exams: '1 آزمون',
        duration: 'یک بار',
        highlight: false,
        features: [
          'آزمون کامل AI',
          'تحلیل تلفظ',
          'تحلیل گرامر',
          'ارزیابی واژگان',
          'گزارش کوتاه و توصیه شخصی',
        ],
      },
      {
        name: 'هفته فشرده',
        price: '24,99 €',
        exams: '3 آزمون',
        duration: 'معتبر برای 7 روز',
        highlight: false,
        features: [
          '3 آزمون کامل AI',
          'پرسش‌های تعاملی',
          'توصیف تصویر',
          'برنامه‌ریزی یا گفت‌وگو طبق سطح',
          'گزارش تفصیلی و برنامه کوتاه',
        ],
      },
      {
        name: 'ماه Premium',
        price: '39,99 €',
        exams: '5 آزمون',
        duration: 'معتبر برای 30 روز',
        highlight: false,
        features: [
          '5 آزمون کامل AI',
          'مقایسه پیشرفت',
          'تحلیل اشتباهات تکراری',
          'برنامه آموزشی چند هفته‌ای',
          'پیشنهاد تمرین داخل AustriaPath',
        ],
      },
    ],
  },

  Українська: {
    title: 'AustriaPath Premium',
    subtitle: 'Визначте свій рівень та отримайте відповідний навчальний план.',
    recommended: 'Рекомендовано',
    select: 'Обрати',
    infoTitle: 'Що входить?',
    infoText:
      'AustriaPath Premium допомагає визначити рівень, тренувати іспити, побачити сильні та слабкі сторони й отримати персональний навчальний план.',
    plans: [
      {
        name: 'Персональний навчальний план',
        price: '2,00 €',
        exams: 'Тест рівня',
        duration: 'близько 8 хвилин',
        highlight: false,
        features: [
          'Самопрезентація 1 хвилина',
          'Опис зображення 1 хвилина',
          'Аудіювання, читання і граматика',
          'Оцінка рівня A2 / B1 / B2',
          'Навчальний план для вас',
        ],
      },
      {
        name: 'AI план на тиждень',
        price: '14,99 €',
        exams: '3 сесії',
        duration: '7 днів',
        highlight: true,
        features: [
          'Оберіть 3 зустрічі самостійно',
          'Визначте день і час',
          'Сесія 1: Самопрезентація',
          'Сесія 2: Опис зображення і планування',
          'Сесія 3: Фінальне тренування і результат',
          'Персональний план за вашими цілями',
        ],
      },
      {
        name: 'AI пробний іспит',
        price: '9,99 €',
        exams: '1 іспит',
        duration: 'одноразово',
        highlight: false,
        features: [
          'Повний AI іспит',
          'Аналіз вимови',
          'Аналіз граматики',
          'Оцінка словникового запасу',
          'Короткий звіт і особиста порада',
        ],
      },
      {
        name: 'Інтенсивний тиждень',
        price: '24,99 €',
        exams: '3 іспити',
        duration: 'дійсно 7 днів',
        highlight: false,
        features: [
          '3 повні AI іспити',
          'Інтерактивні запитання',
          'Опис зображення',
          'Планування або розмова за рівнем',
          'Детальний звіт і короткий план',
        ],
      },
      {
        name: 'Premium місяць',
        price: '39,99 €',
        exams: '5 іспитів',
        duration: 'дійсно 30 днів',
        highlight: false,
        features: [
          '5 повних AI іспитів',
          'Порівняння прогресу',
          'Аналіз повторюваних помилок',
          'Навчальний план на кілька тижнів',
          'Рекомендації для тренування в AustriaPath',
        ],
      },
    ],
  },
};

const container = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  background: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '90px',
};

const title = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#0f172a',
  marginBottom: '8px',
};

const subtitle = {
  color: '#64748b',
  lineHeight: '1.5',
  marginBottom: '22px',
};

const card = {
  position: 'relative',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '18px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const badge = {
  position: 'absolute',
  top: '14px',
  right: '14px',
  background: '#2563eb',
  color: 'white',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
};

const planName = {
  fontSize: '21px',
  color: '#0f172a',
  marginBottom: '8px',
};

const price = {
  fontSize: '30px',
  fontWeight: '800',
  color: '#2563eb',
};

const examInfo = {
  color: '#475569',
  marginTop: '4px',
};

const list = {
  paddingLeft: 0,
  listStyle: 'none',
  marginTop: '16px',
};

const listItem = {
  marginBottom: '9px',
  color: '#334155',
};

const button = {
  width: '100%',
  padding: '13px',
  borderRadius: '12px',
  border: 'none',
  background: '#2563eb',
  color: 'white',
  fontWeight: '700',
  fontSize: '15px',
  marginTop: '10px',
};

const infoBox = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '18px',
  color: '#334155',
  lineHeight: '1.6',
  border: '1px solid #e5e7eb',
};