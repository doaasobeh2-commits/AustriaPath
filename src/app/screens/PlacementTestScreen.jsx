import React, { useMemo, useState } from 'react';
import { getPlacementFlow } from '../../data/aiPlacementLibrary';
import {
  buildPlacementProfile,
  savePlacementProfile,
} from '../../data/utils/placementEngine';

export default function PlacementTestScreen({ setActiveTab }) {
  const [selectedLevel, setSelectedLevel] = useState('A2');
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [skillScores, setSkillScores] = useState({});
  const [result, setResult] = useState(null);

  const flow = useMemo(() => getPlacementFlow(selectedLevel), [selectedLevel]);
  const currentModel = flow[step];

  const totalMinutes = 8;
  const skillName = getStudentSkillName(currentModel?.skill);

const saveAiEvaluation = (aiEvaluation) => {
  const updated = {
    ...skillScores,
    [currentModel.skill]: aiEvaluation,
  };

  setSkillScores(updated);

  if (step + 1 < flow.length) {
    setStep(step + 1);
  } else {
    const profile = buildPlacementProfile({
      selectedLevel,
      skillScores: updated,
    });

    savePlacementProfile(profile);
    setResult(profile);
  }
};

  if (result) {
    return (
      <div style={pageStyle}>
        <h2>Ergebnis Einstufungstest</h2>

        <div style={cardStyle}>
          <h1>{result.level}</h1>
          <p>Startniveau: {result.selectedStartLevel}</p>
          <p>Datum: {new Date(result.date).toLocaleDateString()}</p>
        </div>

        <div style={cardStyle}>
          <h3>Stärken</h3>
          {result.strengths.length === 0 ? (
            <p>Noch keine klaren Stärken erkannt.</p>
          ) : (
            result.strengths.map((item) => <p key={item}>✅ {getStudentSkillName(item)}</p>)
          )}
        </div>

        <div style={cardStyle}>
          <h3>Schwächen / Fokus</h3>
          {result.weaknesses.length === 0 ? (
            <p>Keine großen Schwächen erkannt.</p>
          ) : (
            result.weaknesses.map((item) => <p key={item}>⚠️ {getStudentSkillName(item)}</p>)
          )}
        </div>

        <div style={cardStyle}>
          <h3>Persönliche Lernempfehlung</h3>
          {(result.studyPlan || []).map((item) => (
            <p key={item.day}>
              <strong>{item.day}:</strong> {item.task}
            </p>
          ))}
        </div>

       <button style={buttonStyle} onClick={() => setActiveTab('profile')}>
  Zum Profil
</button>

        <button style={backButtonStyle} onClick={() => setActiveTab('home')}>
          Zur Startseite
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={pageStyle}>
        <h2>Einstufungstest</h2>
        <p>Der Test dauert ungefähr {totalMinutes} Minuten.</p>
        <p>Auf welchem Niveau soll der Test beginnen?</p>

        <div style={levelRowStyle}>
          {['A2', 'B1', 'B2'].map((level) => (
            <button
              key={level}
              style={{
                ...levelButtonStyle,
                background: selectedLevel === level ? '#2563eb' : '#e5e7eb',
                color: selectedLevel === level ? 'white' : '#111827',
              }}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>

        <button style={buttonStyle} onClick={() => setStarted(true)}>
          Test starten
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <p>
        Schritt {step + 1} von {flow.length} · ca. {totalMinutes} Minuten
      </p>

      <h2>{skillName}</h2>

      <div style={cardStyle}>
        <p>{getStudentPrompt(currentModel)}</p>

        <button style={buttonStyle}>
          🎙️ Aufnahme starten
        </button>

        <p style={smallTextStyle}>
          Aufnahmezeit: ca. 1 Minute. Danach analysiert der KI-Prüfer die Antwort.
        </p>
      </div>

      <div style={cardStyle}>
       <h3>KI-Simulation intern</h3>

<p>
  Nur für Testphase. Diese Bewertung wird später automatisch von OpenAI übernommen.
</p>

<div style={levelRowStyle}>
  {[
    { level: 'A2', label: 'AI bewertet: A2' },
    { level: 'A2+', label: 'AI bewertet: A2+' },
    { level: 'B1', label: 'AI bewertet: B1' },
    { level: 'B1+', label: 'AI bewertet: B1+' },
    { level: 'B2', label: 'AI bewertet: B2' },
  ].map((item) => (
    <button
      key={item.level}
      style={levelButtonStyle}
      onClick={() => saveAiEvaluation(item.level)}
    >
      {item.label}
    </button>
  ))}
</div>
      </div>
    </div>
  );
}

function getStudentSkillName(skill) {
  const names = {
    selbstvorstellung: 'Selbstvorstellung',
    bildbeschreibung: 'Bildbeschreibung',
    hoeren: 'Hören',
    planung: 'Planung',
    diskussion: 'Diskussion',
    grafikbeschreibung: 'Grafikbeschreibung',
  };

  return names[skill] || 'Einstufungstest';
}

function getStudentPrompt(model) {
  const skill = model?.skill;

  if (skill === 'selbstvorstellung') {
    return 'Stellen Sie sich bitte kurz vor.';
  }

  if (skill === 'bildbeschreibung') {
    return 'Beschreiben Sie bitte das Bild.';
  }

  if (skill === 'hoeren') {
    return 'Hören Sie bitte den kurzen Text und beantworten Sie danach die Fragen.';
  }

  if (skill === 'planung') {
    return 'Planen Sie bitte gemeinsam mit dem KI-Prüfer.';
  }

  if (skill === 'diskussion') {
    return 'Sprechen Sie bitte über das Thema und begründen Sie Ihre Meinung.';
  }

  if (skill === 'grafikbeschreibung') {
    return 'Beschreiben Sie bitte die Grafik und nennen Sie wichtige Informationen.';
  }

  return model?.studentPreview || 'Bitte beantworten Sie die Aufgabe.';
}

const pageStyle = {
  padding: 20,
  fontFamily: 'system-ui, sans-serif',
  maxWidth: 720,
  margin: '0 auto',
};

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 16,
  margin: '14px 0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const levelRowStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  margin: '16px 0',
};

const levelButtonStyle = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const buttonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: 14,
  background: '#2563eb',
  color: 'white',
  fontWeight: 700,
  marginTop: 12,
};

const backButtonStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: 14,
  background: '#e5e7eb',
  color: '#111827',
  fontWeight: 700,
  marginTop: 12,
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: 14,
  marginTop: 10,
};