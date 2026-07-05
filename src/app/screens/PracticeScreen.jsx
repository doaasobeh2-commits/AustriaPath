import React, { useMemo, useState } from 'react';
import { a2Models } from '../../data/modelsA2';
import { b1Models } from '../../data/modelsb1';
import { b2Models } from '../../data/modelsB2';
import { getPublishedAdminItems } from "../../utils/adminContent";

export function PracticeScreen({
  setActiveTab,
  setSelectedWritingModel,
  userLevel = localStorage.getItem('userLevel') || 'B1',
}) {
  const [level] = useState(userLevel);
  const [showPremiumHint, setShowPremiumHint] = useState(false);
  const [smartSection, setSmartSection] = useState('writing');

  const staticModels =
    level === 'A2' ? a2Models :
    level === 'B1' ? b1Models :
    b2Models;

  const allowedTypes = [
    'schreiben',
    'lesen',
    'hoeren',
    'hören',
    'bildbeschreibung',
    'planung',
    'sprechen',
    'speaking',
    'akademie',
    'grammatik',
    'wortschatz',
    'satzbau',
    'konnektoren',
  ];

  const adminModels = useMemo(() => {
    return getPublishedAdminItems({ level })
      .filter((item) =>
        allowedTypes.includes(String(item.type || '').toLowerCase())
      )
      .map((item, index) => {
        const type = String(item.type || '').toLowerCase();

        return {
          id: `admin-${item.id || index}`,
          originalId: item.id,
          displayNumber: staticModels.length + index + 1,
          title: item.title || 'Admin Modell',
          level: item.level || level,
          type,
          category: type,
          source: 'admin',
          content: item.content || '',
          solution: item.solution || '',
          schreiben: type === 'schreiben' ? item.solution || item.content || '' : '',
          words: item.words || [],
          verbs: item.verbs || [],
          grammar: item.grammar || [],
          satzbau: item.satzbau || [],
          konnektoren: item.konnektoren || [],
          confirmations: item.confirmations || 1,
          imageUrl: item.imageUrl || '',
          audioUrl: item.audioUrl || '',
        };
      });
  }, [level, staticModels.length]);

  const models = [...staticModels, ...adminModels];

  const shouldShowSmartHint = (model) => {
    const rawType = String(model.type || 'schreiben').toLowerCase();

    const sectionMap = {
      schreiben: 'writing',
      hoeren: 'hoeren',
      hören: 'hoeren',
      lesen: 'lesen',
      bildbeschreibung: 'bild',
      bild: 'bild',
      images: 'bild',
      planung: 'planung',
      sprechen: 'speaking',
      speaking: 'speaking',
      akademie: 'akademie',
      grammatik: 'akademie',
      wortschatz: 'akademie',
      satzbau: 'akademie',
      konnektoren: 'akademie',
    };

    const section = sectionMap[rawType] || 'writing';
    const visitKey = `${section}Visits`;
    const visits = Number(localStorage.getItem(visitKey) || 0) + 1;

    localStorage.setItem(visitKey, visits);
    localStorage.setItem('lastSmartSection', section);
    setSmartSection(section);

    if (visits >= 4) {
      setShowPremiumHint(true);
    }

    return false;
  };

  const openAdminModel = (model) => {
    if (model.type === 'schreiben') {
      setSelectedWritingModel({
        id: model.id,
        level: model.level,
        title: model.title,
        category: model.category,
        task: model.content
          ? model.content.split('\n').filter((line) => line.trim() !== '')
          : [model.title],
        schreiben: model.solution || model.schreiben || model.content || '',
        words: model.words,
        verbs: model.verbs,
        grammar: model.grammar,
        satzbau: model.satzbau,
        konnektoren: model.konnektoren,
        tip: 'Aus Admin hinzugefügt.',
        source: 'admin',
      });

      setActiveTab('writing');
      return;
    }

    if (model.type === 'planung') return setActiveTab('planning');
    if (model.type === 'bildbeschreibung') return setActiveTab('images');
    if (model.type === 'lesen') return setActiveTab('lesen');
    if (model.type === 'hoeren' || model.type === 'hören') return setActiveTab('horen');
    if (model.type === 'sprechen' || model.type === 'speaking') return setActiveTab('speaking');

    if (
      model.type === 'akademie' ||
      model.type === 'grammatik' ||
      model.type === 'wortschatz' ||
      model.type === 'satzbau' ||
      model.type === 'konnektoren'
    ) {
      return setActiveTab('akademie');
    }
  };

  const openStaticModel = (model) => {
    if (level === 'A2') {
      setSelectedWritingModel(model);
      setActiveTab('writing');
      return;
    }

    if (level === 'B1') {
      setSelectedWritingModel({
        ...model,
        type: 'schreiben',
        source: 'b1-static',
        task: [],
        schreiben: '',
        words: [],
        verbs: [],
        grammar: [],
        tip: 'B1 Modell mit E-Mail A und E-Mail B. Musterlösungen werden später ergänzt.',
      });

      setActiveTab('writing');
      return;
    }

    if (level === 'B2') {
      setSelectedWritingModel(model);
      setActiveTab('b2model');
    }
  };

  const openModel = (model) => {
    shouldShowSmartHint(model);

    if (model.source === 'admin') {
      openAdminModel(model);
      return;
    }

    openStaticModel(model);
  };

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1 style={titleStyle}>Üben</h1>

      <p style={subtitleStyle}>
        Wähle dein Niveau und übe mit fertigen Modellen.
      </p>

      <div style={levelTabsStyle}>
        <button style={levelButtonStyle(true)} disabled>
          {userLevel}
        </button>
      </div>

      {showPremiumHint && (
        <div style={premiumHintStyle}>
          <strong>KI-Tipp:</strong> Du hast diesen Bereich mehrmals geöffnet.
          Der Einstufungstest kann dir zeigen, worauf du dich konzentrieren solltest.
          <button
            onClick={() => {
              setShowPremiumHint(false);
              setActiveTab('placementTest');
            }}
            style={premiumButtonStyle}
          >
            Einstufungstest starten
          </button>
        </div>
      )}

      <div style={cardsStyle}>
        {models.map((model, index) => (
          <div
            key={model.id || index}
            style={modelCardStyle}
            onClick={() => openModel(model)}
          >
            <div>
              <strong>
                {level === 'B1' && !model.source
                  ? model.title
                  : `${model.displayNumber || index + 1}. ${model.title}`}
              </strong>

              <p style={metaStyle}>
                {level === 'B1' && model.emails
                  ? `${model.emails.length} E-Mails · B1`
                  : `${model.category || model.type || 'Modell'} · ${model.level || level}`}
              </p>

              {model.source === 'admin' && (
                <p style={adminBadgeStyle}>Aus Admin hinzugefügt</p>
              )}
            </div>

            <span style={lockStyle}>➡️</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  paddingBottom: '90px',
  fontFamily: 'system-ui, sans-serif',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 16px',
  borderRadius: '999px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '18px',
};

const titleStyle = {
  margin: '0 0 8px',
  fontSize: '34px',
  color: '#0f172a',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.5,
};

const levelTabsStyle = {
  display: 'flex',
  gap: '10px',
  margin: '20px 0',
};

const levelButtonStyle = (active) => ({
  flex: 1,
  border: 'none',
  borderRadius: '14px',
  padding: '12px',
  backgroundColor: active ? '#2563eb' : '#e2e8f0',
  color: active ? '#ffffff' : '#0f172a',
  fontWeight: 'bold',
  cursor: 'pointer',
});

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  borderRadius: '18px',
  padding: '14px',
  marginBottom: '18px',
  lineHeight: 1.5,
};

const premiumButtonStyle = {
  display: 'block',
  marginTop: '10px',
  border: 'none',
  backgroundColor: '#ea580c',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: '999px',
  fontWeight: '700',
  cursor: 'pointer',
};

const cardsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const modelCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  cursor: 'pointer',
  border: '1px solid #e2e8f0',
};

const metaStyle = {
  margin: '6px 0 0',
  color: '#64748b',
};

const adminBadgeStyle = {
  display: 'inline-block',
  marginTop: '8px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
};

const lockStyle = {
  fontSize: '20px',
};