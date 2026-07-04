import React from 'react';
import { getUserLanguage } from '../../utils/userPreferences';
import { applyClientPlanSelection } from '../../utils/clientSubscription';

export default function SubscriptionScreen({ setActiveTab }) {
  const language = getUserLanguage();

  const t = content[language] || content.Deutsch;
  const plans = t.plans;

  const handleSelectPlan = (plan) => {
    const now = new Date();

    const subscription = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      type: plan.type,
      status: 'active',
      purchasedAt: now.toISOString(),
      validUntil: plan.validDays
        ? new Date(now.getTime() + plan.validDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
      totalUses: plan.totalUses,
      remainingUses: plan.totalUses,
    };

    localStorage.setItem('austriaPathSubscription', JSON.stringify(subscription));
    localStorage.setItem('userPlan', plan.type);
    localStorage.setItem('premiumActive', 'true');
    localStorage.setItem('austriaPathSelectedPremiumPlan', JSON.stringify(plan));

    applyClientPlanSelection(plan);

    if (plan.type === 'placement') {
      setActiveTab?.('placementTest');
      return;
    }

    if (plan.type === 'weekly_plan') {
      setActiveTab?.('weeklyPlanSetup');
      return;
    }

 if (
  plan.type === 'ai_exam' ||
  plan.type === 'intensive_week' ||
  plan.type === 'premium_month'
) {
  setActiveTab?.('profile');
  return;
}
};
  return (
    <div style={container}>
      <h1 style={title}>{t.title}</h1>
      <p style={subtitle}>{t.subtitle}</p>

      {plans.map((plan) => (
        <div
          key={plan.id}
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
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.buttonText || t.select}
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

const planMeta = {
  placement: {
    id: 'placement',
    type: 'placement',
    totalUses: 1,
    validDays: null,
  },
  weekly: {
    id: 'weekly-plan',
    type: 'weekly_plan',
    totalUses: 3,
    validDays: 7,
  },
  exam: {
    id: 'ai-exam',
    type: 'ai_exam',
    totalUses: 1,
    validDays: null,
  },
  intensive: {
    id: 'intensive-week',
    type: 'intensive_week',
    totalUses: 3,
    validDays: 7,
  },
  month: {
    id: 'premium-month',
    type: 'premium_month',
    totalUses: 5,
    validDays: 30,
  },
};

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
        ...planMeta.placement,
        name: 'Persönlicher Lernplan',
        price: '2,00 €',
        buttonText: 'Einstufungstest starten',
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
        ...planMeta.weekly,
        name: 'KI-Wochenplan',
        price: '14,99 €',
        buttonText: 'Wochenplan erstellen',
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
        ...planMeta.exam,
        name: 'AI Probeprüfung',
        price: '9,99 €',
        buttonText: 'Prüfung starten',
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
        ...planMeta.intensive,
        name: 'Intensive Woche',
        price: '24,99 €',
        buttonText: 'Intensive Woche starten',
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
        ...planMeta.month,
        name: 'Premium Monat',
        price: '39,99 €',
        buttonText: 'Premium Monat starten',
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
        ...planMeta.placement,
        name: 'خطة الدراسة الشخصية',
        price: '2,00 €',
        buttonText: 'بدء اختبار المستوى',
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
        ...planMeta.weekly,
        name: 'خطة أسبوع بالذكاء الاصطناعي',
        price: '14,99 €',
        buttonText: 'إنشاء الخطة الأسبوعية',
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
        ...planMeta.exam,
        name: 'امتحان AI تجريبي',
        price: '9,99 €',
        buttonText: 'بدء الامتحان',
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
        ...planMeta.intensive,
        name: 'أسبوع مكثف',
        price: '24,99 €',
        buttonText: 'بدء الأسبوع المكثف',
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
        ...planMeta.month,
        name: 'شهر Premium',
        price: '39,99 €',
        buttonText: 'بدء شهر Premium',
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
        ...planMeta.placement,
        name: 'Kişisel Çalışma Planı',
        price: '2,00 €',
        buttonText: 'Seviye testini başlat',
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
        ...planMeta.weekly,
        name: 'AI ile Haftalık Plan',
        price: '14,99 €',
        buttonText: 'Haftalık plan oluştur',
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
        ...planMeta.exam,
        name: 'AI Deneme Sınavı',
        price: '9,99 €',
        buttonText: 'Sınavı başlat',
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
        ...planMeta.intensive,
        name: 'Yoğun Hafta',
        price: '24,99 €',
        buttonText: 'Yoğun haftayı başlat',
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
        ...planMeta.month,
        name: 'Premium Ay',
        price: '39,99 €',
        buttonText: 'Premium ayı başlat',
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
        ...planMeta.placement,
        name: 'برنامه آموزشی شخصی',
        price: '2,00 €',
        buttonText: 'شروع آزمون تعیین سطح',
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
        ...planMeta.weekly,
        name: 'برنامه هفتگی با هوش مصنوعی',
        price: '14,99 €',
        buttonText: 'ساخت برنامه هفتگی',
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
        ...planMeta.exam,
        name: 'آزمون آزمایشی AI',
        price: '9,99 €',
        buttonText: 'شروع آزمون',
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
        ...planMeta.intensive,
        name: 'هفته فشرده',
        price: '24,99 €',
        buttonText: 'شروع هفته فشرده',
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
        ...planMeta.month,
        name: 'ماه Premium',
        price: '39,99 €',
        buttonText: 'شروع ماه Premium',
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
        ...planMeta.placement,
        name: 'Персональний навчальний план',
        price: '2,00 €',
        buttonText: 'Почати тест рівня',
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
        ...planMeta.weekly,
        name: 'AI план на тиждень',
        price: '14,99 €',
        buttonText: 'Створити тижневий план',
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
        ...planMeta.exam,
        name: 'AI пробний іспит',
        price: '9,99 €',
        buttonText: 'Почати іспит',
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
        ...planMeta.intensive,
        name: 'Інтенсивний тиждень',
        price: '24,99 €',
        buttonText: 'Почати інтенсивний тиждень',
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
        ...planMeta.month,
        name: 'Premium місяць',
        price: '39,99 €',
        buttonText: 'Почати Premium місяць',
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