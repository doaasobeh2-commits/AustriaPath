import React, { useEffect, useMemo, useState } from 'react';
import { models } from '../../data/models';
import { placementBank } from '../../data/src/placementBank';
import {
  buildPremiumExamPackage,
  savePremiumExamPackage,
} from '../../data/premiumExamBuilder';
import { getUserLanguage } from '../../utils/userPreferences';
import { isAdminQaMode } from '../../utils/adminQaMode.js';

const premiumTexts = {
  Deutsch: {
    heroTitle: 'AustriaPath Premium',
    heroText: 'Wähle den passenden Plan für personalisiertes Lernen oder interaktives AI-Training.',
    preparation: 'Vorbereitung',
    level: 'Niveau',
    whatYouGet: 'Was bekommst du?',
    benefits: [
      'Einstufungstest oder interaktives AI-Training je nach Plan',
      'Analyse von Stärken und Schwächen',
      'Hinweise zu Aussprache, Grammatik und Wortschatz',
      'Lernplan oder Empfehlungen für dein Training in AustriaPath',
    ],
    choose: 'Auswählen',
    selected: 'Ausgewählt',
    soon: 'Premium bald verfügbar',
    noteTitle: 'Wichtiger Hinweis',
    noteText:
      'Diese Dienste sind nur Training und Lernanalyse. Es gibt keine behördliche Bewertung, keine Erfolgsgarantie und der Bericht wird an keine Institution gesendet.',
    duration: 'Dauer',
    valid: 'Gültigkeit',
    report: 'Bericht',
    chooseAlert: 'Bitte wählen Sie zuerst einen Plan.',
    lockedAlert: 'Premium wird bald verfügbar sein. Der Plan ist vorbereitet, aber die Zahlung ist noch nicht aktiviert.',
  },

  العربية: {
    heroTitle: 'AustriaPath Premium',
    heroText: 'اختر الخطة المناسبة لمعرفة مستواك أو التدريب على امتحان تفاعلي.',
    preparation: 'التحضير',
    level: 'المستوى',
    whatYouGet: 'ماذا تحصل؟',
    benefits: [
      'تحديد مستوى أو امتحان تفاعلي حسب الخطة',
      'تحليل نقاط القوة والضعف',
      'ملاحظات على النطق والقواعد والمفردات',
      'خطة دراسة أو توصيات للتدريب داخل AustriaPath',
    ],
    choose: 'اختيار',
    selected: 'تم الاختيار',
    soon: 'Premium قريباً',
    noteTitle: 'ملاحظة مهمة',
    noteText:
      'هذه الخدمات هي تدريب وتحليل تعليمي فقط. لا توجد علامات رسمية، ولا ضمان لنتيجة امتحان، ولا يتم إرسال التقرير إلى أي مدرسة أو جهة امتحان.',
    duration: 'المدة',
    valid: 'الصلاحية',
    report: 'التقرير',
    chooseAlert: 'الرجاء اختيار خطة أولاً.',
    lockedAlert: 'Premium سيكون متاحاً قريباً. الخطة جاهزة لكن الدفع غير مفعل حالياً.',
  },

  Türkçe: {
    heroTitle: 'AustriaPath Premium',
    heroText: 'Seviyeni öğrenmek veya etkileşimli sınav antrenmanı yapmak için uygun planı seç.',
    preparation: 'Hazırlık',
    level: 'Seviye',
    whatYouGet: 'Ne alırsın?',
    benefits: [
      'Plana göre seviye testi veya etkileşimli sınav',
      'Güçlü ve zayıf yön analizi',
      'Telaffuz, gramer ve kelime notları',
      'AustriaPath içinde kişisel çalışma önerileri',
    ],
    choose: 'Seç',
    selected: 'Seçildi',
    soon: 'Premium yakında',
    noteTitle: 'Önemli not',
    noteText:
      'Bu hizmetler sadece eğitim ve öğrenme analizi içindir. Resmi not yoktur, sınav sonucu garantisi yoktur ve rapor hiçbir okula gönderilmez.',
    duration: 'Süre',
    valid: 'Geçerlilik',
    report: 'Rapor',
    chooseAlert: 'Lütfen önce bir plan seçin.',
    lockedAlert: 'Premium yakında aktif olacak. Plan hazır, ancak ödeme henüz aktif değil.',
  },

  فارسی: {
    heroTitle: 'AustriaPath Premium',
    heroText: 'برای شناخت سطح خود یا تمرین آزمون تعاملی، برنامه مناسب را انتخاب کنید.',
    preparation: 'آماده‌سازی',
    level: 'سطح',
    whatYouGet: 'چه چیزی دریافت می‌کنید؟',
    benefits: [
      'تعیین سطح یا آزمون تعاملی بر اساس برنامه',
      'تحلیل نقاط قوت و ضعف',
      'نکات درباره تلفظ، گرامر و واژگان',
      'برنامه مطالعه یا پیشنهاد تمرین در AustriaPath',
    ],
    choose: 'انتخاب',
    selected: 'انتخاب شد',
    soon: 'Premium به‌زودی',
    noteTitle: 'نکته مهم',
    noteText:
      'این خدمات فقط برای تمرین و تحلیل آموزشی هستند. نمره رسمی یا تضمین نتیجه آزمون وجود ندارد و گزارش برای هیچ مدرسه‌ای ارسال نمی‌شود.',
    duration: 'مدت',
    valid: 'اعتبار',
    report: 'گزارش',
    chooseAlert: 'لطفاً ابتدا یک برنامه انتخاب کنید.',
    lockedAlert: 'Premium به‌زودی فعال می‌شود. برنامه آماده است اما پرداخت هنوز فعال نیست.',
  },

  Українська: {
    heroTitle: 'AustriaPath Premium',
    heroText: 'Оберіть відповідний план, щоб визначити рівень або пройти інтерактивне тренування.',
    preparation: 'Підготовка',
    level: 'Рівень',
    whatYouGet: 'Що ви отримаєте?',
    benefits: [
      'Тест рівня або інтерактивний іспит залежно від плану',
      'Аналіз сильних і слабких сторін',
      'Поради щодо вимови, граматики та словника',
      'Навчальний план або рекомендації в AustriaPath',
    ],
    choose: 'Обрати',
    selected: 'Обрано',
    soon: 'Premium незабаром',
    noteTitle: 'Важлива примітка',
    noteText:
      'Ці послуги є лише навчанням та освітнім аналізом. Це не офіційна оцінка, без гарантії результату іспиту, і звіт нікуди не надсилається.',
    duration: 'Тривалість',
    valid: 'Дійсність',
    report: 'Звіт',
    chooseAlert: 'Будь ласка, спочатку оберіть план.',
    lockedAlert: 'Premium скоро буде доступний. План готовий, але оплата ще не активована.',
  },
};
const plans = [
  {
    name: 'خطة الدراسة الشخصية',
    price: '2,00 €',
    subtitle: 'اختبار تحديد مستوى · حوالي 8 دقائق',
    tag: 'ابدأ هنا',
    exams: 0,
    valid: 'مرة واحدة',
    duration: 'حوالي 8 دقائق',
    reportType: 'مستوى + خطة دراسة',
    highlighted: true,
    features: [
      'تعريف النفس: تحدث لمدة دقيقة',
      'وصف صورة: تحدث لمدة دقيقة',
      'استماع قصير مع سؤالين',
      'قراءة قصيرة مع أسئلة',
      'قواعد ومفردات',
      'تقدير المستوى A2 / B1 / B2',
      'خطة دراسة شخصية تناسب مستواك'
    ]
  },
  {
    name: 'امتحان AI تجريبي',
    price: '9,99 €',
    subtitle: 'امتحان واحد · مرة واحدة',
    tag: 'للتجربة',
    exams: 1,
    valid: 'مرة واحدة',
    duration: 'A2: 8–12 دقيقة · B1: 15–20 دقيقة · B2: 20–25 دقيقة',
    reportType: 'تقرير قصير',
    features: [
      'امتحان AI كامل',
      'موضوع من نماذج AustriaPath',
      'أسئلة تفاعلية',
      'وصف صورة / تخطيط / مناقشة حسب المستوى',
      'تقرير كتابي قصير',
      'نقاط القوة والضعف ونصيحة شخصية'
    ]
  },
  {
    name: 'أسبوع مكثف',
    price: '24,99 €',
    subtitle: '3 امتحانات · صالحة 7 أيام',
    tag: 'مناسب للتحضير',
    exams: 3,
    valid: '7 أيام',
    duration: 'حوالي 45–60 دقيقة تدريب',
    reportType: 'تقرير + خطة يومين',
    features: [
      '3 امتحانات AI مختلفة',
      'لا يوجد تكرار لنفس الامتحان',
      'مواضيع من نماذج AustriaPath',
      'أسئلة تفاعلية في كل امتحان',
      'مقارنة نقاط الضعف المتكررة',
      'خطة دراسة شخصية لمدة يومين'
    ]
  },
  {
    name: 'شهر Premium',
    price: '39,99 €',
    subtitle: '5 امتحانات · صالحة 30 يوماً',
    tag: 'تحضير ذكي',
    exams: 5,
    valid: '30 يوماً',
    duration: 'حوالي 90–120 دقيقة تدريب',
    reportType: 'تقرير ذكي + خطة دراسة',
    features: [
      '5 امتحانات AI مختلفة',
      'بدون تكرار نفس مسار الامتحان',
      'مواضيع من أفضل محتوى AustriaPath',
      'اكتشاف الأخطاء المتكررة',
      'خطة دراسة حسب نقاط الضعف',
      'توصيات بما يجب أن يتدرب عليه الطالب داخل AustriaPath'
    ]
  }
];

export function PremiumExamScreen({ setActiveTab }) {
  const [level, setLevel] = useState('B1');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

 const premiumLocked = false;
const userLanguage = getUserLanguage();
const t = premiumTexts[userLanguage] || premiumTexts.Deutsch;
const localizedPlans = getLocalizedPlans(userLanguage);
 const examFlow = useMemo(() => {
  if (exam?.parts?.length) {
    return exam.parts.map((part, index) => ({
      key: `${part.type}-${index}`,
      icon:
        part.type === 'writing' ? '✉️' :
        part.type.includes('reading') ? '📖' :
        part.type === 'listening' ? '🎧' :
        part.type === 'self_intro' ? '👤' :
        part.type === 'image' ? '🖼️' :
        '🗓️',
      title: part.label || part.title || 'Übung',
      type: part.type,
      time: '03:00',
    }));
  }

  return getExamFlow(level);
}, [level, exam]);
  const currentStep = examFlow[step];
  const currentPart = exam?.parts?.find((part) => {
  if (!currentStep) return false;

  if (currentStep.type === 'writing') return part.type === 'writing';
  if (currentStep.type === 'reading') return part.type === 'reading';
  if (currentStep.type === 'listening') return part.type === 'listening';
  if (currentStep.type === 'self_intro') return part.type === 'self_intro';
  if (currentStep.type === 'image') return part.type === 'image';
  if (currentStep.type === 'planning') {
    return part.type === 'planning' || part.type === 'roleplay';
  }

  return false;
});
  const [timeLeft, setTimeLeft] = useState(parseTime(currentStep?.time || '01:00'));

  useEffect(() => {
    if (!started || showResult || !currentStep) return;

    setTimeLeft(parseTime(currentStep.time));

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, started, showResult, currentStep]);

  const getRandomItem = (items) => {
    if (!items || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  };
const startExam = () => {
  if (!selectedPlan) {
    alert(t.chooseAlert);
    return;
  }

  if (premiumLocked) {
    alert(t.lockedAlert);
    return;
  }

  const packageType =
    selectedPlan.price === '9,99 €'
      ? 'single_exam'
      : selectedPlan.price === '24,99 €'
      ? 'intensive_week'
      : selectedPlan.price === '39,99 €'
      ? 'premium_month'
      : 'placement_test';

  if (packageType === 'placement_test') {
    // Admin QA: use the real Placement learner flow, not the inline Weiter stub
    if (isAdminQaMode()) {
      setActiveTab('placementTest');
      return;
    }
    setStarted(true);
    setStep(0);
    setAnswers({});
    setShowResult(false);
    
    return;
  }

  const packageData = buildPremiumExamPackage({
    level,
    packageType,
  });

  savePremiumExamPackage(packageData);

const firstExam = packageData?.exams?.[0];

if (!firstExam || !Array.isArray(firstExam.parts) || firstExam.parts.length === 0) {
  alert('Keine Übungsinhalte gefunden. Bitte später erneut versuchen.');
  return;
}

setExam({
  level,
  plan: selectedPlan,
  packageData,
  currentExam: firstExam,
  parts: firstExam.parts,
});

  setStarted(true);
  setStep(0);
  setAnswers({});
  setShowResult(false);
  setActiveTab('premiumExamSession');
};
  const updateAnswer = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  const nextStep = () => {
    if (step < examFlow.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetExam = () => {
    setStarted(false);
    setStep(0);
    setExam(null);
    setAnswers({});
    setShowResult(false);
  };

  if (!started) {
    return (
      <div style={containerStyle}>
        <div style={heroStyle}>
         <h1 style={{ margin: 0 }}>{t.heroTitle}</h1>
<p style={{ lineHeight: '1.5' }}>{t.heroText}</p>
        </div>

        <div style={cardStyle}>
          <h2>{t.preparation}</h2>

          <label style={labelStyle}>{t.level}</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>

         <div style={infoBoxStyle}>
  <b>{t.whatYouGet}</b>
  <ul>
    {t.benefits.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
</div>
        </div>

       {localizedPlans.map((plan) => (
          <PlanCard
  key={plan.name}
  plan={plan}
  selected={selectedPlan?.name === plan.name}
  onSelect={() => setSelectedPlan(plan)}
  t={t}
/>
        ))}

       {selectedPlan && (
  <button style={startButtonStyle} onClick={startExam}>
    Training starten
  </button>
)}

        <div style={cardStyle}>
          <h3>{t.noteTitle}</h3>
<p style={smallTextStyle}>{t.noteText}</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div style={containerStyle}>
        <div style={resultHeroStyle}>
          <h1 style={{ margin: 0 }}>🏆 Persönlicher Bericht</h1>
          <p>Simulation abgeschlossen · Niveau {exam?.level} · {exam?.plan?.name}</p>
        </div>

        <ScoreCard title="Gesamteindruck" score="Gut" status="verständliche Antworten mit Verbesserungsmöglichkeiten" />
        <ScoreCard title="Aussprache" score="Üben" status="einige Wörter deutlicher sprechen" />
        <ScoreCard title="Grammatik" score="Üben" status="Verbposition und Artikel genauer verwenden" />
        <ScoreCard title="Wortschatz" score="Gut" status="mehr passende Verben und weniger Wiederholungen verwenden" />
        <ScoreCard title="Satzbau" score="Üben" status="Antworten stärker verbinden" />
        <ScoreCard title="Redefluss" score="Gut" status="Antworten ruhig und klar formulieren" />

        <div style={cardStyle}>
          <h3>✅ Stärken</h3>
          <ul>
            <li>Sie antworten klar und verständlich.</li>
            <li>Ihre Antworten haben eine einfache, nachvollziehbare Struktur.</li>
            <li>Sie verwenden passenden Grundwortschatz für das gewählte Niveau.</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h3>⚠️ Verbesserungen</h3>
          <ul>
            <li>Achten Sie auf die Verbposition nach „weil“ und „dass“.</li>
            <li>Verwenden Sie Artikel genauer: der, die, das.</li>
            <li>Benutzen Sie mehr Verbindungswörter: weil, deshalb, außerdem, trotzdem.</li>
            <li>Sprechen Sie schwierige Wörter langsamer und deutlicher.</li>
          </ul>
        </div>

        <button style={startButtonStyle} onClick={resetExam}>
          Neues AI-Training starten
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={topProgressStyle}>
        <div>
          <b>AI Sprechtraining</b>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>
            Schritt {step + 1} von {examFlow.length} · Niveau {exam?.level}
          </p>
        </div>

        <div
          style={{
            ...timerStyle,
            backgroundColor: timeLeft <= 15 ? '#fee2e2' : timeLeft <= 30 ? '#ffedd5' : '#eff6ff',
            color: timeLeft <= 15 ? '#dc2626' : timeLeft <= 30 ? '#ea580c' : '#2563eb',
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div style={progressBarBackground}>
        <div style={{ ...progressBarFill, width: `${((step + 1) / examFlow.length) * 100}%` }} />
      </div>

      <div style={cardStyle}>
        <div style={stepIconStyle}>{currentStep.icon}</div>
        <h2>{currentStep.title}</h2>

        <p style={taskTextStyle}>
  {currentPart?.instruction || buildTaskText(currentStep, exam, answers)}
</p>
{currentPart?.text && (
  <div style={infoBoxStyle}>
    <b>Text:</b>
    <p>{currentPart.text}</p>
  </div>
)}

{currentPart?.audioText && (
  <div style={infoBoxStyle}>
    <b>Hörtext:</b>
    <p>{currentPart.audioText}</p>
  </div>
)}

{currentPart?.questions?.length > 0 && (
  <div style={infoBoxStyle}>
    <b>Fragen:</b>
    <ul>
      {currentPart.questions.map((q, index) => (
        <li key={index}>{q.q}</li>
      ))}
    </ul>
  </div>
)}
        {currentStep.type === 'image' && (
          <div style={imagePlaceholderStyle}>
            🖼 {exam?.imageGroup?.title || 'Bildbeschreibung'}
          </div>
        )}

        <button style={micButtonStyle}>🎤 Aufnahme starten</button>

        <textarea
          style={textareaStyle}
          placeholder="Demo: Antwort hier schreiben oder später per Sprache aufnehmen..."
          value={answers[currentStep.key] || ''}
          onChange={(e) => updateAnswer(currentStep.key, e.target.value)}
        />

        <div style={hintStyle}>
          Hinweis: In der echten Version wird hier die Stimme aufgenommen, in Text umgewandelt
          und anschließend analysiert.
        </div>
      </div>

      <div style={cardStyle}>
        <h3>KI achtet auf</h3>
        <div style={criteriaGridStyle}>
          <Badge text="Aussprache" />
          <Badge text="Grammatik" />
          <Badge text="Wortschatz" />
          <Badge text="Satzbau" />
          <Badge text="Redefluss" />
          <Badge text="Konnektoren" />
        </div>
      </div>

      <button style={nextButtonStyle} onClick={nextStep}>
        {step < examFlow.length - 1 ? 'Weiter' : 'Ergebnis anzeigen'}
      </button>

      <button style={secondaryButtonStyle} onClick={resetExam}>
        Training abbrechen
      </button>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect, t }) {
  return (
    <div
      style={{
        ...planCardStyle,
        border: selected
          ? '2px solid #16a34a'
          : plan.highlighted
            ? '2px solid #2563eb'
            : '1px solid #e2e8f0',
      }}
    >
      <div style={planHeaderStyle}>
        <h2 style={{ margin: 0 }}>{plan.name}</h2>
        {plan.tag && <span style={tagStyle}>{plan.tag}</span>}
      </div>

      <div style={priceStyle}>{plan.price}</div>
      <p style={planSubtitleStyle}>{plan.subtitle}</p>

      <div style={detailBoxStyle}>
        <p><b>{t.duration}:</b> {plan.duration}</p>
<p><b>{t.valid}:</b> {plan.valid}</p>
<p><b>{t.report}:</b> {plan.reportType}</p>
      </div>

      <ul style={featureListStyle}>
        {plan.features.map((feature, i) => (
          <li key={i}>✓ {feature}</li>
        ))}
      </ul>

      <button onClick={onSelect} style={selected ? selectedButtonStyle : chooseButtonStyle}>
        {selected ? t.selected : t.choose}
      </button>
    </div>
  );
}
function getLocalizedPlans(language) {
  const all = {
    Deutsch: [
      {
        name: 'Persönlicher Lernplan',
        price: '2,00 €',
        subtitle: 'Einstufungstest · ca. 8 Minuten',
        tag: 'Hier starten',
        exams: 0,
        valid: 'Einmalig',
        duration: 'ca. 8 Minuten',
        reportType: 'Niveau + Lernplan',
        highlighted: true,
        features: [
          'Selbstvorstellung: ca. 1 Minute sprechen',
          'Bildbeschreibung: ca. 1 Minute sprechen',
          'Kurzes Hören mit zwei Fragen',
          'Kurzes Lesen mit Fragen',
          'Grammatik und Wortschatz',
          'Einschätzung A2 / B1 / B2',
          'Persönlicher Lernplan passend zum Niveau',
        ],
      },
      {
        name: 'AI Sprechtraining',
        price: '9,99 €',
        subtitle: '1 Trainingseinheit · einmalig',
        tag: 'Zum Testen',
        exams: 1,
        valid: 'Einmalig',
        duration: 'A2: 8–12 Min. · B1: 15–20 Min. · B2: 20–25 Min.',
        reportType: 'Kurzer Bericht',
        features: [
          'Eine vollständige AI-Trainingseinheit',
          'Thema aus AustriaPath-Modellen',
          'Interaktive Fragen',
          'Bildbeschreibung / Planung / Diskussion je nach Niveau',
          'Kurzer schriftlicher Bericht',
          'Stärken, Schwächen und persönlicher Tipp',
        ],
      },
      {
        name: 'Intensive Woche',
        price: '24,99 €',
        subtitle: '3 Trainingseinheiten · 7 Tage gültig',
        tag: 'Zur Vorbereitung',
        exams: 3,
        valid: '7 Tage',
        duration: 'ca. 45–60 Minuten Training',
        reportType: 'Bericht + 2-Tage-Plan',
        features: [
          '3 verschiedene AI-Trainingseinheiten',
          'Keine Wiederholung derselben Übung',
          'Themen aus AustriaPath-Modellen',
          'Interaktive Fragen in jeder Einheit',
          'Vergleich wiederkehrender Schwächen',
          'Persönlicher Lernplan für zwei Tage',
        ],
      },
      {
        name: 'Premium Monat',
        price: '39,99 €',
        subtitle: '5 Trainingseinheiten · 30 Tage gültig',
        tag: 'Smart Training',
        exams: 5,
        valid: '30 Tage',
        duration: 'ca. 90–120 Minuten Training',
        reportType: 'Smart-Bericht + Lernplan',
        features: [
          '5 verschiedene AI-Trainingseinheiten',
          'Keine Wiederholung desselben Übungswegs',
          'Themen aus bestem AustriaPath-Inhalt',
          'Erkennung wiederkehrender Fehler',
          'Lernplan nach Schwächen',
          'Empfehlungen für Training in AustriaPath',
        ],
      },
    ],

    Türkçe: [
      {
        name: 'Kişisel Öğrenme Planı',
        price: '2,00 €',
        subtitle: 'Seviye testi · yaklaşık 8 dakika',
        tag: 'Buradan başla',
        exams: 0,
        valid: 'Tek seferlik',
        duration: 'yaklaşık 8 dakika',
        reportType: 'Seviye + öğrenme planı',
        highlighted: true,
        features: [
          'Kendini tanıtma: yaklaşık 1 dakika konuşma',
          'Resim açıklama: yaklaşık 1 dakika konuşma',
          'İki soruluk kısa dinleme',
          'Sorulu kısa okuma',
          'Gramer ve kelime',
          'A2 / B1 / B2 seviye tahmini',
          'Seviyene uygun kişisel öğrenme planı',
        ],
      },
      {
        name: 'AI Deneme Sınavı',
        price: '9,99 €',
        subtitle: '1 sınav · tek seferlik',
        tag: 'Denemek için',
        exams: 1,
        valid: 'Tek seferlik',
        duration: 'A2: 8–12 dk · B1: 15–20 dk · B2: 20–25 dk',
        reportType: 'Kısa rapor',
        features: [
          'Tam bir AI sınavı',
          'AustriaPath modellerinden konu',
          'Etkileşimli sorular',
          'Seviyeye göre resim açıklama / planlama / tartışma',
          'Kısa yazılı rapor',
          'Güçlü yönler, zayıf yönler ve kişisel öneri',
        ],
      },
      {
        name: 'Yoğun Hafta',
        price: '24,99 €',
        subtitle: '3 sınav · 7 gün geçerli',
        tag: 'Hazırlık için',
        exams: 3,
        valid: '7 gün',
        duration: 'yaklaşık 45–60 dakika eğitim',
        reportType: 'Rapor + 2 günlük plan',
        features: [
          '3 farklı AI sınavı',
          'Aynı sınav tekrar edilmez',
          'AustriaPath modellerinden konular',
          'Her sınavda etkileşimli sorular',
          'Tekrarlayan zayıf yönlerin karşılaştırılması',
          'İki günlük kişisel öğrenme planı',
        ],
      },
      {
        name: 'Premium Ay',
        price: '39,99 €',
        subtitle: '5 sınav · 30 gün geçerli',
        tag: 'Akıllı eğitim',
        exams: 5,
        valid: '30 gün',
        duration: 'yaklaşık 90–120 dakika eğitim',
        reportType: 'Akıllı rapor + öğrenme planı',
        features: [
          '5 farklı AI sınavı',
          'Aynı sınav yolu tekrar edilmez',
          'AustriaPath’in en iyi içeriklerinden konular',
          'Tekrarlayan hataları bulma',
          'Zayıf yönlere göre öğrenme planı',
          'AustriaPath içinde ne çalışılacağına dair öneriler',
        ],
      },
    ],

    فارسی: [
      {
        name: 'برنامه یادگیری شخصی',
        price: '2,00 €',
        subtitle: 'تعیین سطح · حدود ۸ دقیقه',
        tag: 'از اینجا شروع کنید',
        exams: 0,
        valid: 'یک‌بار',
        duration: 'حدود ۸ دقیقه',
        reportType: 'سطح + برنامه یادگیری',
        highlighted: true,
        features: [
          'معرفی خود: حدود ۱ دقیقه صحبت',
          'توصیف تصویر: حدود ۱ دقیقه صحبت',
          'شنیداری کوتاه با دو سؤال',
          'خواندن کوتاه با سؤال',
          'گرامر و واژگان',
          'تخمین سطح A2 / B1 / B2',
          'برنامه یادگیری شخصی متناسب با سطح شما',
        ],
      },
      {
        name: 'آزمون آزمایشی AI',
        price: '9,99 €',
        subtitle: '۱ آزمون · یک‌بار',
        tag: 'برای امتحان کردن',
        exams: 1,
        valid: 'یک‌بار',
        duration: 'A2: ۸–۱۲ دقیقه · B1: ۱۵–۲۰ دقیقه · B2: ۲۰–۲۵ دقیقه',
        reportType: 'گزارش کوتاه',
        features: [
          'یک آزمون کامل با AI',
          'موضوع از مدل‌های AustriaPath',
          'سؤال‌های تعاملی',
          'توصیف تصویر / برنامه‌ریزی / بحث بر اساس سطح',
          'گزارش کوتاه نوشتاری',
          'نقاط قوت، ضعف و یک پیشنهاد شخصی',
        ],
      },
      {
        name: 'هفته فشرده',
        price: '24,99 €',
        subtitle: '۳ آزمون · معتبر برای ۷ روز',
        tag: 'مناسب برای آمادگی',
        exams: 3,
        valid: '۷ روز',
        duration: 'حدود ۴۵–۶۰ دقیقه تمرین',
        reportType: 'گزارش + برنامه دو روزه',
        features: [
          '۳ آزمون AI متفاوت',
          'بدون تکرار همان آزمون',
          'موضوعات از مدل‌های AustriaPath',
          'سؤال‌های تعاملی در هر آزمون',
          'مقایسه ضعف‌های تکراری',
          'برنامه یادگیری شخصی برای دو روز',
        ],
      },
      {
        name: 'ماه Premium',
        price: '39,99 €',
        subtitle: '۵ آزمون · معتبر برای ۳۰ روز',
        tag: 'تمرین هوشمند',
        exams: 5,
        valid: '۳۰ روز',
        duration: 'حدود ۹۰–۱۲۰ دقیقه تمرین',
        reportType: 'گزارش هوشمند + برنامه یادگیری',
        features: [
          '۵ آزمون AI متفاوت',
          'بدون تکرار مسیر آزمون',
          'موضوعات از بهترین محتوای AustriaPath',
          'تشخیص خطاهای تکراری',
          'برنامه یادگیری بر اساس ضعف‌ها',
          'پیشنهاد تمرین داخل AustriaPath',
        ],
      },
    ],

    Українська: [
      {
        name: 'Особистий навчальний план',
        price: '2,00 €',
        subtitle: 'Тест рівня · приблизно 8 хвилин',
        tag: 'Почати тут',
        exams: 0,
        valid: 'Один раз',
        duration: 'приблизно 8 хвилин',
        reportType: 'Рівень + навчальний план',
        highlighted: true,
        features: [
          'Самопрезентація: говорити приблизно 1 хвилину',
          'Опис зображення: говорити приблизно 1 хвилину',
          'Коротке аудіювання з двома питаннями',
          'Коротке читання з питаннями',
          'Граматика та словниковий запас',
          'Оцінка рівня A2 / B1 / B2',
          'Особистий навчальний план відповідно до рівня',
        ],
      },
      {
        name: 'Пробний AI-іспит',
        price: '9,99 €',
        subtitle: '1 іспит · один раз',
        tag: 'Для проби',
        exams: 1,
        valid: 'Один раз',
        duration: 'A2: 8–12 хв · B1: 15–20 хв · B2: 20–25 хв',
        reportType: 'Короткий звіт',
        features: [
          'Повний AI-іспит',
          'Тема з моделей AustriaPath',
          'Інтерактивні питання',
          'Опис зображення / планування / дискусія залежно від рівня',
          'Короткий письмовий звіт',
          'Сильні сторони, слабкі сторони та особиста порада',
        ],
      },
      {
        name: 'Інтенсивний тиждень',
        price: '24,99 €',
        subtitle: '3 іспити · дійсно 7 днів',
        tag: 'Для підготовки',
        exams: 3,
        valid: '7 днів',
        duration: 'приблизно 45–60 хвилин тренування',
        reportType: 'Звіт + план на 2 дні',
        features: [
          '3 різні AI-іспити',
          'Без повторення того самого іспиту',
          'Теми з моделей AustriaPath',
          'Інтерактивні питання в кожному іспиті',
          'Порівняння повторюваних слабких сторін',
          'Особистий навчальний план на два дні',
        ],
      },
      {
        name: 'Premium місяць',
        price: '39,99 €',
        subtitle: '5 іспитів · дійсно 30 днів',
        tag: 'Розумне тренування',
        exams: 5,
        valid: '30 днів',
        duration: 'приблизно 90–120 хвилин тренування',
        reportType: 'Розумний звіт + навчальний план',
        features: [
          '5 різних AI-іспитів',
          'Без повторення того самого маршруту іспиту',
          'Теми з найкращого контенту AustriaPath',
          'Виявлення повторюваних помилок',
          'Навчальний план за слабкими сторонами',
          'Рекомендації для тренування в AustriaPath',
        ],
      },
    ],
  };

  if (language === 'العربية') return plans;

  return all[language] || all.Deutsch;
}
function getExamFlow(level) {
  const times = {
    A2: {
      writing: '04:00',
      reading: '03:00',
      listening: '02:00',
      selfIntro: '01:00',
      image: '02:00',
      planning: '02:00',
    },
    B1: {
      writing: '06:00',
      reading: '05:00',
      listening: '04:00',
      selfIntro: '02:00',
      image: '03:00',
      planning: '05:00',
    },
    B2: {
      writing: '08:00',
      reading: '06:00',
      listening: '05:00',
      selfIntro: '02:00',
      image: '05:00',
      planning: '06:00',
    },
  };

  const t = times[level] || times.B1;

  return [
    {
      key: 'writing',
      icon: '✉️',
      title: 'E-Mail schreiben',
      type: 'writing',
      time: t.writing,
    },
    {
      key: 'reading',
      icon: '📖',
      title: 'Lesen',
      type: 'reading',
      time: t.reading,
    },
    {
      key: 'listening',
      icon: '🎧',
      title: 'Hören',
      type: 'listening',
      time: t.listening,
    },
    {
      key: 'selfIntro',
      icon: '👤',
      title: 'Selbstvorstellung',
      type: 'self_intro',
      time: t.selfIntro,
    },
    {
      key: 'image',
      icon: '🖼️',
      title: 'Bildbeschreibung',
      type: 'image',
      time: t.image,
    },
    {
      key: 'planning',
      icon: '🗓️',
      title: 'Planungsgespräch',
      type: 'planning',
      time: t.planning,
    },
  ];
}

function buildTaskText(step, exam) {
  const realPart = exam?.parts?.find((part) => {
    if (step.type === 'writing') return part.type === 'writing' || part.skill === 'schreiben';
    if (step.type === 'reading') return part.type === 'reading' || part.skill === 'lesen';
    if (step.type === 'listening') return part.type === 'listening' || part.skill === 'hoeren';
    if (step.type === 'self_intro') return part.type === 'self_intro' || part.skill === 'selbstvorstellung';
    if (step.type === 'image') return part.type === 'image' || part.skill === 'bildbeschreibung';
    if (step.type === 'planning') return part.type === 'planning' || part.skill === 'planung' || part.skill === 'diskussion';
    return false;
  });

  if (realPart) {
    return (
      realPart.instruction ||
      realPart.task ||
      realPart.text ||
      realPart.description ||
      realPart.title ||
      'Antworten Sie klar und in ganzen Sätzen.'
    );
  }

  switch (step.type) {
    case 'writing':
      return 'Schreiben Sie eine E-Mail. Achten Sie auf Anrede, Grund, Bitte oder Vorschlag und Grußformel.';

    case 'reading':
      return 'Lesen Sie den Text aufmerksam und beantworten Sie die Fragen.';

    case 'listening':
      return 'Hören Sie den Text und beantworten Sie danach die Fragen.';

    case 'self_intro':
      return 'Stellen Sie sich kurz vor.';

    case 'image':
      return 'Beschreiben Sie das Bild.';

    case 'planning':
      return 'Führen Sie ein Planungsgespräch.';

    default:
      return 'Antworten Sie klar, langsam und in ganzen Sätzen.';
  }
}

function parseTime(time) {
  const [minutes, seconds] = time.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Badge({ text }) {
  return <div style={badgeStyle}>{text}</div>;
}

function ScoreCard({ title, score, status }) {
  return (
    <div style={scoreCardStyle}>
      <div>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>{status}</p>
      </div>
      <strong style={{ color: '#2563eb', fontSize: '18px' }}>{score}</strong>
    </div>
  );
}

const containerStyle = { padding: '22px', fontFamily: 'system-ui, sans-serif', paddingBottom: '100px' };
const heroStyle = { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '22px', padding: '22px', marginBottom: '16px' };
const resultHeroStyle = { backgroundColor: '#16a34a', color: '#ffffff', borderRadius: '22px', padding: '22px', marginBottom: '16px' };
const cardStyle = { backgroundColor: '#ffffff', borderRadius: '18px', padding: '18px', marginBottom: '14px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' };
const labelStyle = { display: 'block', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '15px', boxSizing: 'border-box' };
const infoBoxStyle = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', marginBottom: '14px', color: '#334155' };
const startButtonStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', marginBottom: '14px' };
const topProgressStyle = { backgroundColor: '#ffffff', borderRadius: '18px', padding: '16px', marginBottom: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const timerStyle = { padding: '10px 12px', borderRadius: '12px', fontWeight: 'bold' };
const progressBarBackground = { height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' };
const progressBarFill = { height: '100%', backgroundColor: '#2563eb', borderRadius: '999px' };
const stepIconStyle = { fontSize: '34px' };
const taskTextStyle = { color: '#475569', lineHeight: '1.6' };
const micButtonStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const textareaStyle = { width: '100%', minHeight: '120px', padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '10px', marginBottom: '12px', fontSize: '14px' };
const hintStyle = { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '14px', padding: '12px', fontSize: '13px', lineHeight: '1.5' };
const imagePlaceholderStyle = { height: '160px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center', padding: '12px' };
const criteriaGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' };
const badgeStyle = { backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 10px', borderRadius: '999px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' };
const nextButtonStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' };
const secondaryButtonStyle = { width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' };
const scoreCardStyle = { backgroundColor: '#ffffff', borderRadius: '18px', padding: '16px', marginBottom: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' };
const planCardStyle = { backgroundColor: '#ffffff', borderRadius: '22px', padding: '20px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' };
const planHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' };
const tagStyle = { backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold' };
const priceStyle = { color: '#2563eb', fontSize: '42px', fontWeight: '900', marginTop: '16px' };
const planSubtitleStyle = { color: '#475569', fontSize: '18px', margin: '8px 0 14px' };
const detailBoxStyle = { backgroundColor: '#f8fafc', borderRadius: '14px', padding: '12px', color: '#334155', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' };
const featureListStyle = { paddingLeft: '18px', color: '#334155', lineHeight: '1.7' };
const chooseButtonStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' };
const selectedButtonStyle = { ...chooseButtonStyle, backgroundColor: '#16a34a' };
const smallTextStyle = { color: '#475569', lineHeight: '1.6' };