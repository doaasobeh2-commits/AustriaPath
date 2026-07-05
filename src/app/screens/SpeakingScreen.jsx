import React, { useEffect, useMemo, useState } from 'react';
import { b1PlanningModels } from '../../data/modelsb1';
import { b2DiscussionModels } from '../../data/b2PlanningModels';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
import { isPremiumUser, trackSectionVisit } from '../../data/utils/premiumHint';
import { getUserLanguage } from '../../utils/userPreferences';

const STORAGE_KEY = 'austriaPathAdminData';



const b2SpeakingModels = [
  {
    title: 'Künstliche Intelligenz',
    type: 'Diskussion',
    level: 'B2',
    situation:
      'In einem Sprachkurs diskutieren Sie über künstliche Intelligenz im Alltag.',
    task:
      'Diskutieren Sie mit Ihrer Partnerin / Ihrem Partner. Sprechen Sie über Vorteile, Nachteile, persönliche Erfahrungen und Ihre Meinung.',
    example:
      'Meiner Meinung nach spielt künstliche Intelligenz heute eine immer größere Rolle. Einerseits kann KI den Alltag erleichtern, zum Beispiel beim Übersetzen, Lernen oder bei der Arbeit. Andererseits gibt es auch Risiken, weil Menschen zu abhängig von Technik werden können. Ich finde, man sollte KI sinnvoll nutzen, aber trotzdem selbstständig denken.',
    words: ['künstliche Intelligenz', 'Datenschutz', 'Technik', 'Alltag', 'Risiko', 'Vorteil'],
    verbs: ['erleichtern', 'ersetzen', 'unterstützen', 'beeinflussen', 'nutzen'],
    sentences: [
      'Einerseits bietet KI viele Möglichkeiten, andererseits gibt es auch Risiken.',
      'Man sollte berücksichtigen, dass Datenschutz sehr wichtig ist.',
      'Aus meiner Sicht kann KI den Alltag erleichtern.'
    ],
    grammar: ['einerseits ... andererseits', 'dass-Satz', 'Modalverben: sollte / kann'],
    mistakes: ['❌ KI ist immer gut.', '✅ KI hat Vorteile, aber auch Risiken.'],
    tip: 'Nennen Sie immer beide Seiten und geben Sie ein Beispiel.'
  },
  {
    title: 'Mit den Eltern wohnen oder allein leben',
    type: 'Diskussion',
    level: 'B2',
    situation:
      'Viele junge Erwachsene wohnen lange bei ihren Eltern. Andere möchten früh unabhängig leben.',
    task:
      'Diskutieren Sie Vor- und Nachteile. Begründen Sie Ihre Meinung und nennen Sie Beispiele.',
    example:
      'Ich denke, dass beide Lebensformen Vorteile haben. Wenn man bei den Eltern wohnt, spart man Geld und bekommt Unterstützung. Andererseits lernt man beim Alleinleben, Verantwortung zu übernehmen und selbstständiger zu werden. Meiner Meinung nach hängt die Entscheidung von der persönlichen Situation ab.',
    words: ['Unabhängigkeit', 'Verantwortung', 'Familie', 'Kosten', 'Unterstützung'],
    verbs: ['sparen', 'übernehmen', 'unterstützen', 'entscheiden', 'abhängen von'],
    sentences: [
      'Das hängt von der persönlichen Situation ab.',
      'Ein Vorteil besteht darin, dass man Geld sparen kann.',
      'Andererseits wird man selbstständiger.'
    ],
    grammar: ['abhängen von + Dativ', 'dass-Satz', 'Infinitiv mit zu'],
    mistakes: ['❌ Ich wohne mit meine Eltern.', '✅ Ich wohne bei meinen Eltern.'],
    tip: 'Bei B2 ist wichtig: nicht nur Meinung sagen, sondern begründen.'
  },
  {
    title: 'Studium oder Ausbildung',
    type: 'Diskussion',
    level: 'B2',
    situation:
      'Nach der Schule entscheiden sich viele Menschen zwischen Studium und Berufsausbildung.',
    task:
      'Diskutieren Sie, welche Vorteile ein Studium und welche Vorteile eine Ausbildung haben.',
    example:
      'Meiner Ansicht nach haben sowohl Studium als auch Ausbildung Vorteile. Ein Studium bietet oft bessere Karrierechancen, aber es dauert länger. Eine Ausbildung ist praktischer und man verdient früher Geld. Deshalb sollte jeder nach seinen Fähigkeiten und Zielen entscheiden.',
    words: ['Studium', 'Ausbildung', 'Beruf', 'Karrierechancen', 'Praxis', 'Zukunft'],
    verbs: ['studieren', 'ausbilden', 'verdienen', 'entscheiden', 'sich eignen für'],
    sentences: [
      'Ein Studium bietet langfristig gute Chancen.',
      'Eine Ausbildung ist oft praxisnäher.',
      'Es kommt darauf an, welche Ziele man hat.'
    ],
    grammar: ['sowohl ... als auch', 'Relativsatz', 'es kommt darauf an'],
    mistakes: ['❌ Ich mache ein Studium in Firma.', '✅ Ich mache eine Ausbildung in einer Firma.'],
    tip: 'Vergleichen Sie beide Möglichkeiten klar.'
  },
  {
    title: 'Sozialhilfe und Arbeit',
    type: 'Diskussion',
    level: 'B2',
    situation:
      'In vielen Ländern wird diskutiert, ob Menschen mehr staatliche Unterstützung bekommen sollten.',
    task:
      'Diskutieren Sie über Sozialhilfe, Arbeit, Verantwortung und Unterstützung durch den Staat.',
    example:
      'Ich finde, dass der Staat Menschen in schwierigen Situationen unterstützen sollte. Gleichzeitig ist es wichtig, dass Menschen motiviert bleiben, eine Arbeit zu suchen. Sozialhilfe sollte also helfen, aber keine dauerhafte Lösung sein. Entscheidend ist eine gute Balance zwischen Hilfe und Eigenverantwortung.',
    words: ['Sozialhilfe', 'Staat', 'Arbeit', 'Verantwortung', 'Unterstützung', 'Motivation'],
    verbs: ['unterstützen', 'fördern', 'helfen', 'motivieren', 'arbeiten'],
    sentences: [
      'Der Staat sollte Menschen in Not unterstützen.',
      'Gleichzeitig muss Eigenverantwortung gefördert werden.',
      'Eine gute Balance ist wichtig.'
    ],
    grammar: ['Passiv: gefördert werden', 'dass-Satz', 'gleichzeitig'],
    mistakes: ['❌ Staat muss alles bezahlen.', '✅ Der Staat sollte Menschen in Not unterstützen.'],
    tip: 'Formulieren Sie ausgewogen und vermeiden Sie extreme Aussagen.'
  },

  {
    title: 'Sporttag für Kinder organisieren',
    type: 'Gemeinsame Lösung',
    level: 'B2',
    situation:
      'Ihr Kurs möchte einen Sporttag für Kinder organisieren.',
    task:
      'Planen Sie gemeinsam. Sprechen Sie über Ort, Datum, Programm, Aufgaben, Essen, Sicherheit und Werbung.',
    example:
      'Ich schlage vor, dass wir den Sporttag an einem Samstag im Park organisieren. Dort gibt es genug Platz. Wir könnten verschiedene Stationen planen, zum Beispiel Fußball, Laufen und kleine Spiele. Wichtig ist auch, dass jemand für Getränke und Sicherheit verantwortlich ist. Am Ende könnten alle Kinder eine kleine Urkunde bekommen.',
    words: ['Sporttag', 'Kinder', 'Programm', 'Sicherheit', 'Getränke', 'Organisation'],
    verbs: ['organisieren', 'planen', 'vorbereiten', 'übernehmen', 'einladen'],
    sentences: [
      'Ich schlage vor, dass wir ...',
      'Wer übernimmt diese Aufgabe?',
      'Wir sollten auch an die Sicherheit denken.'
    ],
    grammar: ['Konjunktiv II: könnten', 'dass-Satz', 'Modalverben'],
    mistakes: ['❌ Wir machen Sporttag irgendwo.', '✅ Wir organisieren den Sporttag im Park.'],
    tip: 'Bei Planung: Vorschläge machen, Aufgaben verteilen und sich einigen.'
  },
  {
    title: 'Museumsbesuch planen',
    type: 'Gemeinsame Lösung',
    level: 'B2',
    situation:
      'Sie möchten mit Ihrem Deutschkurs einen Museumsbesuch in Wien planen.',
    task:
      'Besprechen Sie Museum, Termin, Treffpunkt, Kosten, Anreise und Aufgabenverteilung.',
    example:
      'Wir könnten ein Museum auswählen, das für alle interessant ist. Ich würde vorschlagen, dass wir uns am Bahnhof treffen und gemeinsam hinfahren. Vorher sollten wir prüfen, wie viel der Eintritt kostet. Eine Person kann die Tickets reservieren, und eine andere informiert die Gruppe.',
    words: ['Museum', 'Eintritt', 'Treffpunkt', 'Anreise', 'Reservierung', 'Gruppe'],
    verbs: ['auswählen', 'reservieren', 'informieren', 'prüfen', 'hinfahren'],
    sentences: [
      'Wie wäre es, wenn wir ...?',
      'Wir sollten vorher die Kosten prüfen.',
      'Dann einigen wir uns auf einen Termin.'
    ],
    grammar: ['wenn-Satz', 'Konjunktiv II', 'trennbare Verben'],
    mistakes: ['❌ Wir gehen in Museum.', '✅ Wir gehen ins Museum.'],
    tip: 'Denken Sie an praktische Punkte: Zeit, Kosten, Treffpunkt.'
  },
  {
    title: 'Freiwillig im Umweltschutz engagieren',
    type: 'Gemeinsame Lösung',
    level: 'B2',
    situation:
      'Ihr Kurs möchte sich freiwillig für den Umweltschutz engagieren.',
    task:
      'Planen Sie eine Aktion. Sprechen Sie über Ziel, Ort, Material, Teilnehmer, Werbung und Aufgaben.',
    example:
      'Ich finde die Idee sehr gut, weil Umweltschutz alle betrifft. Wir könnten eine Müllsammelaktion im Park organisieren. Dafür brauchen wir Handschuhe, Müllsäcke und vielleicht eine Genehmigung. Außerdem sollten wir Plakate machen, damit mehr Menschen mitmachen.',
    words: ['Umweltschutz', 'Müll', 'Aktion', 'Teilnehmer', 'Material', 'Genehmigung'],
    verbs: ['sich engagieren', 'sammeln', 'organisieren', 'mitmachen', 'vorbereiten'],
    sentences: [
      'Wir könnten eine Müllsammelaktion organisieren.',
      'Dafür brauchen wir ...',
      'Außerdem sollten wir Werbung machen.'
    ],
    grammar: ['sich engagieren für + Akkusativ', 'Finalsatz: damit', 'Konjunktiv II'],
    mistakes: ['❌ Ich engagiere mich für Umweltschutz freiwillig.', '✅ Ich engagiere mich freiwillig für den Umweltschutz.'],
    tip: 'Verwenden Sie Wörter wie zuerst, danach, außerdem, am Ende.'
  },
  {
    title: 'Kulturwettbewerb organisieren',
    type: 'Gemeinsame Lösung',
    level: 'B2',
    situation:
      'Ein Kulturverein möchte einen kleinen Kulturwettbewerb organisieren.',
    task:
      'Planen Sie gemeinsam Thema, Ort, Teilnehmer, Programm, Preise, Werbung und Aufgaben.',
    example:
      'Zuerst sollten wir ein Thema festlegen, zum Beispiel Musik, Sprache oder Traditionen. Der Wettbewerb könnte im Kulturzentrum stattfinden. Wir brauchen eine Jury, kleine Preise und Werbung in sozialen Medien. Ich könnte die Einladungen schreiben, und du könntest das Programm vorbereiten.',
    words: ['Kulturverein', 'Wettbewerb', 'Teilnehmer', 'Jury', 'Preis', 'Werbung'],
    verbs: ['festlegen', 'stattfinden', 'vorbereiten', 'einladen', 'bewerten'],
    sentences: [
      'Zuerst sollten wir das Thema festlegen.',
      'Der Wettbewerb könnte im Kulturzentrum stattfinden.',
      'Ich könnte die Einladungen übernehmen.'
    ],
    grammar: ['Konjunktiv II', 'trennbares Verb: stattfinden', 'Infinitiv mit zu'],
    mistakes: ['❌ Der Wettbewerb ist in Kulturzentrum.', '✅ Der Wettbewerb findet im Kulturzentrum statt.'],
    tip: 'Zeigen Sie Zusammenarbeit: fragen, reagieren, zustimmen, entscheiden.'
  },
  ...b2DiscussionModels,
];

const speakingModels = {
  A2: [
    {
      title: 'Aufgabe lösen: Termin beim Arzt',
      type: 'Aufgabe lösen',
      level: 'A2',
      situation:
        'Sie können morgen nicht zum Arzt kommen. Rufen Sie in der Praxis an.',
      task: 'Sagen Sie warum. Bitten Sie um einen neuen Termin.',
      example: `Person A: Guten Tag. Ich habe morgen einen Termin beim Arzt.

Person B: Um wie viel Uhr haben Sie den Termin?

Person A: Um 10 Uhr. Leider kann ich nicht kommen, weil ich arbeiten muss.

Person B: Kein Problem. Möchten Sie einen neuen Termin?

Person A: Ja bitte.

Person B: Nächsten Dienstag um 14 Uhr.

Person A: Das passt gut. Vielen Dank.

Person B: Gern geschehen. Auf Wiederhören.`,
      words: ['der Termin', 'die Praxis', 'der Arzt', 'nächste Woche'],
      verbs: ['anrufen', 'verschieben', 'kommen', 'arbeiten'],
      sentences: [
        'Leider kann ich nicht kommen.',
        'Können wir den Termin verschieben?',
        'Das passt gut.',
        'Vielen Dank.'
      ],
      grammar: ['Modalverb können', 'weil + Verb am Ende', 'höfliche Fragen'],
      mistakes: [
        '❌ Ich muss arbeiten weil.',
        '✅ Ich muss arbeiten, weil ich arbeiten muss.'
      ],
      tip: 'Antworten Sie kurz und höflich.'
    }
  ],

  B1: b1PlanningModels.map((item) => ({
    title: `Etwas planen: ${item.title}`,
    type: 'Etwas planen',
    level: 'B1',
    situation: item.situation || '',
    task: Array.isArray(item.points)
      ? item.points.join('\n')
      : Array.isArray(item.task)
        ? item.task.join('\n')
        : item.task || '',
    example: Array.isArray(item.dialog)
      ? item.dialog.join('\n')
      : item.example || '',
    words: item.words || [],
    verbs: item.verbs || [],
    sentences: item.sentences || [
      'Was meinst du?',
      'Ich finde, wir könnten ...',
      'Das ist eine gute Idee.',
      'Ich bin einverstanden.',
      'Dann machen wir das so.'
    ],
    grammar: item.grammar || [
      'Konjunktiv II: könnten',
      'Fragen stellen',
      'Vorschläge machen'
    ],
    mistakes: item.mistakes || [],
    tip:
      item.tip ||
      'Machen Sie Vorschläge, stellen Sie Fragen und einigen Sie sich.'
  })),

  B2: b2SpeakingModels
};

const splitLines = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getTypeByLevel = (level) => {
  if (level === 'A2') return 'Aufgabe lösen';
  if (level === 'B1') return 'Etwas planen';
return 'Diskussion & Gemeinsame Lösung';
};

const getDefaultTask = (level) => {
  if (level === 'A2') {
    return 'Lesen Sie die Situation und lösen Sie die Aufgabe kurz und höflich.';
  }

  if (level === 'B1') {
    return 'Planen Sie gemeinsam. Sprechen Sie über Ort, Zeit, Aufgaben und Entscheidung.';
  }

  return 'Diskutieren oder planen Sie das Thema. Begründen Sie Ihre Meinung mit Beispielen.';
};

const getDefaultTip = (level) => {
  if (level === 'A2') return 'Antworten Sie kurz, klar und höflich.';
  if (level === 'B1') {
    return 'Machen Sie Vorschläge, reagieren Sie und einigen Sie sich.';
  }
  return 'Sprechen Sie strukturiert, begründen Sie Ihre Meinung und nennen Sie Beispiele.';
};

function getAdminSpeakingModels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list
      .filter((item) => {
        const bereich = normalizeText(item.bereich || item.area || item.type);
        const status = normalizeText(item.status);

        return (
          (bereich === 'sprechen' ||
            bereich === 'mündlich' ||
            bereich === 'muendlich' ||
            bereich === 'mündliche prüfung' ||
            bereich === 'planung' ||
            bereich === 'diskussion') &&
          status === 'published'
        );
      })
      .map((item) => {
        const itemLevel = item.level || item.niveau || 'A2';
        const rawType = normalizeText(item.bereich || item.area || item.type);

        return {
          title: item.title || 'Sprechübung aus Admin',
          type:
            rawType === 'planung'
              ? 'Etwas planen'
              : rawType === 'diskussion'
                ? 'Diskussion'
                : getTypeByLevel(itemLevel),
          level: itemLevel,
          situation:
            item.situation || item.content || item.text || item.notes || '',
          task: item.task || item.aufgabe || getDefaultTask(itemLevel),
          example:
            item.example ||
            item.solution ||
            item.musterloesung ||
            item.musterlösung ||
            '',
          words: Array.isArray(item.words)
            ? item.words
            : splitLines(item.words || item.wortschatz || item.vocabulary),
          verbs: Array.isArray(item.verbs)
            ? item.verbs
            : splitLines(item.verbs || item.verben),
          sentences: Array.isArray(item.sentences)
            ? item.sentences
            : splitLines(item.sentences || item.satzbau),
          grammar: Array.isArray(item.grammar)
            ? item.grammar
            : splitLines(item.grammar || item.grammatik),
          mistakes: Array.isArray(item.mistakes)
            ? item.mistakes
            : splitLines(item.mistakes),
          tip: item.tip || getDefaultTip(itemLevel),
          fromAdmin: true
        };
      });
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Sprechen-Modelle:', error);
    return [];
  }
}

export function SpeakingScreen({
  setActiveTab,
  userLevel = localStorage.getItem('userLevel') || 'A2'
}) {
  const level = userLevel;
  const [index, setIndex] = useState(0);
  const [showPremiumHint, setShowPremiumHint] = useState(false);

  const adminModels = useMemo(() => getAdminSpeakingModels(), []);

  const modelsByLevel = useMemo(() => {
    const result = {
      A2: [...(speakingModels.A2 || [])],
      B1: [...(speakingModels.B1 || [])],
      B2: [...(speakingModels.B2 || [])]
    };

    adminModels.forEach((item) => {
      const itemLevel = item.level || 'A2';
      if (!result[itemLevel]) result[itemLevel] = [];
      result[itemLevel].push(item);
    });

    return result;
  }, [adminModels]);

  const models = modelsByLevel[level] || [];
  const current = models[index];
  const sectionTitle = getTypeByLevel(level);

  const language = getUserLanguage();

 const premiumMessage = getSmartPremiumMessage(language, 'speaking');

  useEffect(() => {
  if (!models.length) return;

  if (isPremiumUser()) {
    setShowPremiumHint(false);
    return;
  }

  if (trackSectionVisit('speaking')) {
    setShowPremiumHint(true);
  }
}, [models.length]);
  if (!current) {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <h1>🗣️ Sprechen üben</h1>

        <select style={inputStyle} value={userLevel} disabled>
          <option value={userLevel}>{userLevel}</option>
        </select>

        <div style={cardStyle}>
          Für {level} sind noch keine Inhalte verfügbar.
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1>🗣️ Sprechen üben</h1>

      <p style={subtitleStyle}>
        Wählen Sie ein Niveau und trainieren Sie den passenden mündlichen
        Sprechteil.
      </p>

      {showPremiumHint && (
        <div style={premiumHintStyle}>
          <div style={{ fontSize: '30px' }}>{premiumMessage.icon}</div>

          <h3 style={{ margin: '8px 0', color: '#0f172a' }}>
            {premiumMessage.title}
          </h3>

          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            {premiumMessage.text}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('premium')}
              style={premiumButtonStyle}
            >
              {premiumMessage.button}
            </button>

            <button
              onClick={() => {
                setShowPremiumHint(false);
              }}
              style={laterButtonStyle}
            >
              {premiumMessage.later}
            </button>
          </div>
        </div>
      )}

      <select style={inputStyle} value={userLevel} disabled>
        <option value={userLevel}>{userLevel}</option>
      </select>

      <div style={levelInfoStyle}>
        <b>{level}:</b> {sectionTitle}
      </div>

      <select
        style={inputStyle}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
      >
        {models.map((item, i) => (
          <option key={i} value={i}>
            {item.type} {i + 1}: {item.title}
          </option>
        ))}
      </select>

      <div style={mainCardStyle}>
        <span style={badgeStyle}>{level}</span>
        <span style={typeBadgeStyle}>{current.type}</span>
        {current.fromAdmin && <span style={adminBadgeStyle}>Aus Admin</span>}

        <h2>
          {current.type}: {current.title}
        </h2>

        <h3>📌 Situation</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{current.situation}</p>

        <h3>🎯 Aufgabe</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{current.task}</p>

        <h3>✅ Beispiel</h3>
        <p style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
          {current.example || 'Beispiel wird bald ergänzt.'}
        </p>
      </div>

      <InfoBox title="📌 Wichtige Wörter" items={current.words} />
      <InfoBox title="💪 Wichtige Verben" items={current.verbs} />
      <InfoBox title="🗣️ Nützliche Sätze" items={current.sentences} />
      <InfoBox title="📚 Wichtige Grammatik" items={current.grammar} />
      <InfoBox title="⚠️ Häufige Fehler" items={current.mistakes} />

      <div style={cardStyle}>
        <h3>⭐ Lerntipp</h3>
        <p>{current.tip}</p>
      </div>
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={cardStyle}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};

const levelInfoStyle = {
  backgroundColor: '#ecfdf5',
  color: '#166534',
  padding: '12px',
  borderRadius: '14px',
  marginBottom: '12px',
  border: '1px solid #bbf7d0'
};

const mainCardStyle = {
  backgroundColor: '#eff6ff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #bfdbfe',
  lineHeight: '1.6'
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6'
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#2563eb',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginRight: '8px',
  marginBottom: '10px'
};

const typeBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginRight: '8px',
  marginBottom: '10px'
};

const adminBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '6px 12px',
  borderRadius: '999px',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px'
};

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
};

const premiumButtonStyle = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const laterButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};