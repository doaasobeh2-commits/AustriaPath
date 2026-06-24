import React, { useEffect, useState } from 'react';
import { a2Models } from '../../data/modelsA2';
import { b1Models } from '../../data/modelsb1';
import { b2Models } from '../../data/modelsB2';

import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';

export function PracticeScreen({
  setActiveTab,
  setSelectedWritingModel,
  userLevel = localStorage.getItem('userLevel') || 'B1',
}) {
  const [level] = useState(userLevel);
  const [adminItems, setAdminItems] = useState([]);
  const [showPremiumHint, setShowPremiumHint] = useState(false);
  const [smartSection, setSmartSection] = useState('writing');

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem('austriaPathAdminData') || '[]'
    );

    setAdminItems(
      saved.filter(
        (item) =>
          item.status === 'published' &&
          String(item.type).toLowerCase() === 'schreiben'
      )
    );
  }, []);

  const staticModels =
    level === 'A2' ? a2Models :
    level === 'B1' ? b1Models :
    b2Models;

  const adminModels = adminItems
    .filter((item) => item.level === level)
    .map((item, index) => ({
      id: `admin-${item.id}`,
      originalId: item.id,
      displayNumber: staticModels.length + index + 1,
      title: item.title,
      level: item.level,
      type: item.type,
      category: item.type,
      source: 'admin',
      content: item.content,
      solution: item.solution,
      schreiben: item.type === 'schreiben' ? item.solution || item.content : '',
      words: item.words || [],
      verbs: item.verbs || [],
      grammar: item.grammar || [],
      satzbau: item.satzbau || [],
      konnektoren: item.konnektoren || [],
      confirmations: item.confirmations || 1,
    }));

  const models = [...staticModels, ...adminModels];

  const language =
    localStorage.getItem('austriaPathLanguage') ||
    localStorage.getItem('userLanguage') ||
    'Deutsch';

 

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

  const openModelDirectly = (model) => {
    if (model.source === 'admin') {
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
      if (model.type === 'hoeren') return setActiveTab('horen');
      if (model.type === 'sprechen') return setActiveTab('speaking');
    }

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
  openModelDirectly(model);
};

  return (
    <div style={pageStyle}>
     

      <button
        onClick={() => setActiveTab('home')}
        style={backButtonStyle}
      >
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

      <div style={cardsStyle}>
        {models.map((model, index) => (
          <div
            key={model.id}
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
                  : `${model.category || model.type} · ${model.level}`}
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