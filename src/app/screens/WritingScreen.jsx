import React, { useEffect, useState } from 'react';
import { a2Models } from '../../data/modelsA2';
import { b1Models } from '../../data/modelsb1';

import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
const b2Models = [];

export function WritingScreen({ selectedWritingModel, setActiveTab }) {
  const [level, setLevel] = useState(selectedWritingModel?.level || 'A2');
  const [modelIndex, setModelIndex] = useState(0);


const language =
  localStorage.getItem('austriaPathLanguage') ||
  localStorage.getItem('userLanguage') ||
  'Deutsch';

const premiumMessage = getSmartPremiumMessage(language, 'writing');
const [showPremiumHint, setShowPremiumHint] = useState(false);
  const modelsByLevel = {
    A2: a2Models,
    B1: b1Models,
    B2: b2Models,
  };

  const baseModels = modelsByLevel[level] || [];

  const currentModel =
  selectedWritingModel?.source === 'admin'
    ? selectedWritingModel
    : baseModels[modelIndex];

  useEffect(() => {
    const visits =
  Number(localStorage.getItem('writingVisits') || 0) + 1;

localStorage.setItem('writingVisits', visits);

if (visits >= 4) {
  setShowPremiumHint(true);
}
    if (!selectedWritingModel) return;

    const newLevel = selectedWritingModel.level || 'A2';
    setLevel(newLevel);

    if (selectedWritingModel.source === 'admin' || selectedWritingModel.source === 'b1-static') {
      return;
    }

    const selectedModels = modelsByLevel[newLevel] || [];
    const index = selectedModels.findIndex((model) => model.id === selectedWritingModel.id);

    if (index >= 0) {
      setModelIndex(index);
    }
  }, [selectedWritingModel]);

  if (!currentModel) {
    return (
      <div style={pageStyle}>
        <BackButton setActiveTab={setActiveTab} />
        <h1>✍️ Schreiben Trainer</h1>
        <p>Für dieses Niveau sind noch keine Modelle verfügbar.</p>
      </div>
    );
  }

  if (currentModel.emails && Array.isArray(currentModel.emails)) {
    return (
  <div style={pageStyle}>
   

    <BackButton setActiveTab={setActiveTab} />

    <h1>✍️ Schreiben Trainer</h1>

        <p style={subtitleStyle}>
          B1 Schreiben: Wählen Sie ein Modell und üben Sie E-Mail A und E-Mail B.
        </p>

        <div style={levelBadgeStyle}>Niveau: {level}</div>

        <div style={modelTitleStyle}>
          <h2>{currentModel.title}</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            {currentModel.emails.length} Aufgaben · Schreiben B1
          </p>
        </div>

        {currentModel.emails.map((email, index) => (
          <div key={index} style={taskStyle}>
            <h3>{email.title}</h3>

            <ul>
              {email.task.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>

            <div style={comingSoonStyle}>
              Musterlösung wird später ergänzt.
            </div>
          </div>
        ))}

        <div style={tipStyle}>
          <h3>💡 Tipp</h3>
          <p>
            Schreiben Sie 90–100 Wörter. Beantworten Sie alle Punkte der Aufgabe
            und benutzen Sie passende Konnektoren wie „weil“, „deshalb“, „außerdem“
            und „trotzdem“.
          </p>
        </div>
      </div>
    );
  }

  const taskItems = Array.isArray(currentModel.task)
    ? currentModel.task
    : String(currentModel.task || currentModel.content || '')
        .split('\n')
        .filter((line) => line.trim() !== '');

  return (
    <div style={pageStyle}>
      <BackButton setActiveTab={setActiveTab} />

      <h1>✍️ Schreiben Trainer</h1>

      <p style={subtitleStyle}>
        Lernen Sie mit fertigen Musterlösungen und wichtigen Prüfungspunkten.
      </p>

      <div style={levelBadgeStyle}>Niveau: {level}</div>

      {currentModel.source !== 'admin' && (
        <select
          style={inputStyle}
          value={modelIndex}
          onChange={(e) => setModelIndex(Number(e.target.value))}
        >
          {baseModels.map((model, index) => (
            <option key={model.id} value={index}>
              Modell {index + 1}: {model.title}
            </option>
          ))}
        </select>
      )}

      {currentModel.source === 'admin' && (
        <div style={adminBadgeStyle}>Aus Admin hinzugefügt</div>
      )}

      <div style={taskStyle}>
        <h3>📌 Aufgabe</h3>
        <ul>
          {taskItems.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>

      <div style={solutionStyle}>
        <h3>✅ Musterlösung</h3>
        {currentModel.schreiben ? (
          <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
            {currentModel.schreiben}
          </p>
        ) : (
          <p style={{ color: '#64748b' }}>
            Dieses Modell wird bald vollständig ergänzt.
          </p>
        )}
      </div>

      <InfoBox title="📚 Wichtige Wörter" items={currentModel.words} />
      <InfoBox title="💪 Wichtige Verben" items={currentModel.verbs} />
      <InfoBox title="🧩 Grammatik aus dem Text" items={currentModel.grammar} />

      <div style={tipStyle}>
        <h3>💡 Tipp</h3>
        <p>{currentModel.tip || 'Lesen Sie die Aufgabe genau und beantworten Sie alle Punkte.'}</p>
      </div>
    </div>
  );
}

function BackButton({ setActiveTab }) {
  return (
    <button
      onClick={() => (setActiveTab ? setActiveTab('practice') : window.history.back())}
      style={backButtonStyle}
    >
      ← Zurück
    </button>
  );
}

function InfoBox({ title, items }) {
  const list = Array.isArray(items)
    ? items
    : String(items || '')
        .split('\n')
        .filter((item) => item.trim() !== '');

  return (
    <div style={boxStyle}>
      <h3>{title}</h3>
      {list.length > 0 ? (
        <ul>
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#64748b' }}>Wird bald ergänzt.</p>
      )}
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
};

const backButtonStyle = {
  marginBottom: '18px',
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 16px',
  borderRadius: '999px',
  fontWeight: '700',
  cursor: 'pointer',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
};

const levelBadgeStyle = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: '999px',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const modelTitleStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
};

const adminBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '700',
  marginBottom: '12px',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

const taskStyle = {
  backgroundColor: '#eff6ff',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '12px',
  border: '1px solid #bfdbfe',
};

const solutionStyle = {
  backgroundColor: '#f0fdf4',
  padding: '16px',
  borderRadius: '16px',
  marginBottom: '12px',
  border: '1px solid #bbf7d0',
};

const comingSoonStyle = {
  marginTop: '12px',
  backgroundColor: '#ffffff',
  border: '1px dashed #cbd5e1',
  borderRadius: '12px',
  padding: '10px',
  color: '#64748b',
  fontSize: '14px',
};

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
};

const tipStyle = {
  backgroundColor: '#fff7ed',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #fed7aa',
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