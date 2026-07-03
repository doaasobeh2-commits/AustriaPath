import React, { useMemo, useState } from 'react';
import { aiPremiumLibrary } from '../../data/aiPremiumLibrary';
import AdminActionBar from '../components/AdminActionBar';

const STORAGE_KEY = 'austriaPathAiPrueferLibrary';

const emptyForm = {
  level: 'A2',
  skill: 'selbstvorstellung',
  difficulty: 'leicht',
 serviceText: 'placement_test',
  title: '',
  shortPrompt: '',
  preparationTime: 30,
  estimatedTime: 90,
  visibleToStudents: false,
  studentPreview: '',
  studentPreviewPointsText: '',
  topic: '',
  imagePrompt: '',
  keywordsText: '',
  mandatoryTopicsText: '',
  examinerQuestionsText: '',
  followUpRulesText: '',
  examinerRulesText: '',
  reportFieldsText: '',
  trainingGoalsText: '',
  weaknessesText: '',
  weeklyPlanUse: 'nach_einstufung_oder_manuell',
};

function loadModels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return aiPremiumLibrary;
    return JSON.parse(saved);
  } catch {
    return aiPremiumLibrary;
  }
}

function saveModels(models) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

function linesToArray(text = '') {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToLines(arr = []) {
  return Array.isArray(arr) ? arr.join('\n') : '';
}

export default function AIPrueferScreen({ setActiveTab }) {
  const [models, setModels] = useState(loadModels);
  const [level, setLevel] = useState('Alle');
  const [skill, setSkill] = useState('Alle');
  const [difficulty, setDifficulty] = useState('Alle');
  const [service, setService] = useState('Alle');
  const [selectedModel, setSelectedModel] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const runAction = (actionId, fn) => {
    if (processingAction) return;

    setProcessingAction(actionId);
    try {
      fn();
    } finally {
      setProcessingAction(null);
    }
  };
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredModels = useMemo(() => {
    return models.filter((item) => {
      const levelOk = level === 'Alle' || item.level === level;
      const skillOk = skill === 'Alle' || item.skill === skill;
     const difficultyOk = difficulty === 'Alle' || item.difficulty === difficulty;

const itemServices = Array.isArray(item.service)
  ? item.service
  : item.service
  ? [item.service]
  : [];

const serviceOk =
  service === 'Alle' || itemServices.includes(service);

return levelOk && skillOk && difficultyOk && serviceOk;
    });
}, [models, level, skill, difficulty, service]);

  const stats = useMemo(() => {
    return {
      total: models.length,
      a2: models.filter((item) => item.level === 'A2').length,
      b1: models.filter((item) => item.level === 'B1').length,
      b2: models.filter((item) => item.level === 'B2').length,
    };
  }, [models]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Bitte Titel eingeben.');
      return;
    }

    const newItem = {
      id: editingId || `ai-${Date.now()}`,
      level: form.level,
      skill: form.skill,
      difficulty: form.difficulty,
      service: form.serviceText.split(',').map((x) => x.trim()).filter(Boolean),
      title: form.title,
      shortPrompt: form.shortPrompt,
      preparationTime: Number(form.preparationTime) || 0,
      estimatedTime: Number(form.estimatedTime) || 0,
      visibleToStudents: form.visibleToStudents,
      studentPreview: form.studentPreview,
      studentPreviewPoints: linesToArray(form.studentPreviewPointsText),
      topic: form.topic,
      imagePrompt: form.imagePrompt,
      keywords: linesToArray(form.keywordsText),
      mandatoryTopics: linesToArray(form.mandatoryTopicsText),
     examinerQuestions: linesToArray(form.examinerQuestionsText),

followUpRules: linesToArray(form.followUpRulesText),

examinerRules: linesToArray(form.examinerRulesText),
      reportFields: linesToArray(form.reportFieldsText),
      trainingGoals: linesToArray(form.trainingGoalsText),
      weaknesses: linesToArray(form.weaknessesText),
      weeklyPlanUse: form.weeklyPlanUse,
      updatedAt: new Date().toISOString(),
      fromAdmin: true,
    };

    const nextModels = editingId
      ? models.map((item) => (item.id === editingId ? newItem : item))
      : [newItem, ...models];

    setModels(nextModels);
    saveModels(nextModels);
    resetForm();
  };

  const handleEdit = (item) => {
    setSelectedModel(null);
    setEditingId(item.id);
    setForm({
      level: item.level || 'A2',
      skill: item.skill || 'selbstvorstellung',
      difficulty: item.difficulty || 'leicht',
      serviceText: Array.isArray(item.service) ? item.service.join(', ') : '',
      title: item.title || '',
      shortPrompt: item.shortPrompt || '',
      preparationTime: item.preparationTime || 30,
      estimatedTime: item.estimatedTime || 90,
      visibleToStudents: !!item.visibleToStudents,
      studentPreview: item.studentPreview || '',
      studentPreviewPointsText: arrayToLines(item.studentPreviewPoints),
      topic: item.topic || '',
      imagePrompt: item.imagePrompt || '',
      keywordsText: arrayToLines(item.keywords),
      mandatoryTopicsText: arrayToLines(item.mandatoryTopics),
      examinerQuestionsText: arrayToLines(item.examinerQuestions),

followUpRulesText: arrayToLines(item.followUpRules),

examinerRulesText: arrayToLines(item.examinerRules),
      reportFieldsText: arrayToLines(item.reportFields),
      trainingGoalsText: arrayToLines(item.trainingGoals),
      weaknessesText: arrayToLines(item.weaknesses),
      weeklyPlanUse: item.weeklyPlanUse || 'nach_einstufung_oder_manuell',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const ok = window.confirm('Dieses AI-Modell wirklich löschen?');
    if (!ok) return;

    const nextModels = models.filter((item) => item.id !== id);
    setModels(nextModels);
    saveModels(nextModels);
    setSelectedModel(null);
  };

  if (selectedModel) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={() => setSelectedModel(null)}>
          ← Zurück zur AI Library
        </button>

        <AdminActionBar
          processingAction={processingAction}
          actions={[
            {
              id: "edit-model",
              icon: "✏️",
              label: "Bearbeiten",
              variant: "outline-blue",
              onClick: () =>
                runAction("edit-model", () => handleEdit(selectedModel)),
            },
            {
              id: "delete-model",
              icon: "🗑",
              label: "Löschen",
              variant: "red",
              onClick: () =>
                runAction("delete-model", () =>
                  handleDelete(selectedModel.id)
                ),
            },
          ]}
        />

        <div style={headerCardStyle}>
          <span style={badgeStyle}>{selectedModel.level}</span>
          <span style={badgeStyle}>{selectedModel.skill}</span>
          <span style={badgeStyle}>{selectedModel.difficulty}</span>

          <h1 style={titleStyle}>{selectedModel.title}</h1>
          <p style={subtitleStyle}>{selectedModel.shortPrompt}</p>
        </div>

        <Card title="🧩 Grunddaten">
          <InfoRow label="ID" value={selectedModel.id} />
          <InfoRow label="Service" value={(selectedModel.service || []).join(', ')} />
          <InfoRow label="Vorbereitungszeit" value={`${selectedModel.preparationTime || 0} Sekunden`} />
          <InfoRow label="Geschätzte Zeit" value={`${selectedModel.estimatedTime || 0} Sekunden`} />
          <InfoRow label="Für Schüler sichtbar" value={selectedModel.visibleToStudents ? 'Ja' : 'Nein'} />
          <InfoRow label="Plan-Logik" value={selectedModel.weeklyPlanUse || '-'} />
        </Card>

        <Card title="👁️ Student Preview">
          <p>{selectedModel.studentPreview || 'Keine Vorschau.'}</p>
          <List items={selectedModel.studentPreviewPoints} />
        </Card>

        <Card title="🎯 Thema">
          <p>{selectedModel.topic || 'Kein Thema.'}</p>
        </Card>

        <Card title="🖼️ Bild Prompt">
          <p>{selectedModel.imagePrompt || 'Kein Bild-Prompt.'}</p>
        </Card>

        <Card title="🔑 Keywords">
          <List items={selectedModel.keywords} />
        </Card>

        <Card title="✅ Pflicht-Themen">
          <List items={selectedModel.mandatoryTopics} />
        </Card>

        <Card title="👨‍🏫 Prüfer-Fragen">
          <List items={selectedModel.examinerQuestions} />
        </Card>

        <Card title="📋 Prüfer-Regeln">
          <List items={selectedModel.examinerRules} />
        </Card>

        <Card title="📊 Report Fields">
          <List items={selectedModel.reportFields} />
        </Card>

        <Card title="🎯 Trainingsziele">
          <List items={selectedModel.trainingGoals} />
        </Card>

        <Card title="⚠️ Prüft Schwächen">
          <List items={selectedModel.weaknesses} />
        </Card>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={topActionsStyle}>
        <button style={backButtonStyle} onClick={() => setActiveTab('admin')}>
          ← Admin
        </button>

        <button style={addButtonStyle} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Formular schließen' : '+ Neues AI-Modell'}
        </button>
      </div>

      <div style={heroStyle}>
        <h1 style={heroTitleStyle}>🤖 AustriaPath AI Prüfer</h1>
        <p style={heroTextStyle}>
          Premium-Bibliothek für Einstufungstest, Wochenplan, Probeprüfung,
          intensive Woche und Premium Monat.
        </p>
      </div>

      <div style={statsGridStyle}>
        <StatCard label="Alle Modelle" value={stats.total} />
        <StatCard label="A2" value={stats.a2} />
        <StatCard label="B1" value={stats.b1} />
        <StatCard label="B2" value={stats.b2} />
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h2 style={{ marginTop: 0 }}>
            {editingId ? 'AI-Modell bearbeiten' : 'Neues AI-Modell hinzufügen'}
          </h2>

          <label style={labelStyle}>Niveau</label>
          <select style={inputStyle} value={form.level} onChange={(e) => updateForm('level', e.target.value)}>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>

          <label style={labelStyle}>Skill</label>
          <select style={inputStyle} value={form.skill} onChange={(e) => updateForm('skill', e.target.value)}>
            <option value="selbstvorstellung">Selbstvorstellung</option>
            <option value="bildbeschreibung">Bildbeschreibung</option>
            <option value="gespraech">Gespräch</option>
            <option value="planung">Planung</option>
            <option value="diskussion">Diskussion</option>
            <option value="hoeren">Hören</option>
            <option value="lesen">Lesen</option>
            <option value="schreiben">Schreiben</option>
            <option value="grammatik">Grammatik</option>
            <option value="wochenplan">Wochenplan</option>
          </select>

          <label style={labelStyle}>Schwierigkeit</label>
<select
  style={inputStyle}
  value={form.difficulty}
  onChange={(e) => updateForm('difficulty', e.target.value)}
>
  <option value="leicht">leicht</option>
  <option value="mittel">mittel</option>
  <option value="stark">stark</option>
</select>
<label style={labelStyle}>Service</label>
<select
  style={inputStyle}
  value={form.serviceText}
  onChange={(e) => updateForm('serviceText', e.target.value)}
>
  <option value="placement_test">Einstufungstest</option>
  <option value="weekly_plan">Wochenplan</option>
  <option value="ai_exam">AI Probeprüfung</option>
  <option value="intensive_week">Intensive Woche</option>
  <option value="premium_month">Premium Monat</option>
</select>

        

          <label style={labelStyle}>Titel</label>
          <input style={inputStyle} value={form.title} onChange={(e) => updateForm('title', e.target.value)} />

          <label style={labelStyle}>Kurzbeschreibung / Prompt</label>
          <textarea style={textareaStyle} value={form.shortPrompt} onChange={(e) => updateForm('shortPrompt', e.target.value)} />

          <label style={labelStyle}>Vorbereitungszeit Sekunden</label>
          <input type="number" style={inputStyle} value={form.preparationTime} onChange={(e) => updateForm('preparationTime', e.target.value)} />

          <label style={labelStyle}>Prüfungszeit Sekunden</label>
          <input type="number" style={inputStyle} value={form.estimatedTime} onChange={(e) => updateForm('estimatedTime', e.target.value)} />

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={form.visibleToStudents}
              onChange={(e) => updateForm('visibleToStudents', e.target.checked)}
            />
            Für Schüler sichtbar
          </label>

          <label style={labelStyle}>Student Preview</label>
          <textarea style={textareaStyle} value={form.studentPreview} onChange={(e) => updateForm('studentPreview', e.target.value)} />

          <label style={labelStyle}>Student Preview Punkte / كل سطر نقطة</label>
          <textarea style={textareaStyle} value={form.studentPreviewPointsText} onChange={(e) => updateForm('studentPreviewPointsText', e.target.value)} />

          <label style={labelStyle}>Thema / Aufgabe</label>
          <textarea style={textareaStyle} value={form.topic} onChange={(e) => updateForm('topic', e.target.value)} />

          <label style={labelStyle}>Bild Prompt</label>
          <textarea style={textareaStyle} value={form.imagePrompt} onChange={(e) => updateForm('imagePrompt', e.target.value)} />

          <label style={labelStyle}>Keywords / كل سطر كلمة</label>
          <textarea style={textareaStyle} value={form.keywordsText} onChange={(e) => updateForm('keywordsText', e.target.value)} />

          <label style={labelStyle}>Pflicht-Themen / كل سطر نقطة</label>
          <textarea style={textareaStyle} value={form.mandatoryTopicsText} onChange={(e) => updateForm('mandatoryTopicsText', e.target.value)} />

         <label style={labelStyle}>AI Prüfer-Fragen / كل سطر سؤال</label>
<textarea
  style={textareaStyle}
  value={form.examinerQuestionsText}
  onChange={(e) => updateForm('examinerQuestionsText', e.target.value)}
/>

<label style={labelStyle}>Follow-up Regeln / كل سطر قاعدة</label>
<textarea
  style={textareaStyle}
  value={form.followUpRulesText}
  onChange={(e) => updateForm('followUpRulesText', e.target.value)}
/>

<label style={labelStyle}>Prüfer-Regeln / كل سطر قاعدة</label>
<textarea
  style={textareaStyle}
  value={form.examinerRulesText}
  onChange={(e) => updateForm('examinerRulesText', e.target.value)}
/>

          <label style={labelStyle}>Report Fields / كل سطر عنصر تقرير</label>
          <textarea style={textareaStyle} value={form.reportFieldsText} onChange={(e) => updateForm('reportFieldsText', e.target.value)} />

          <label style={labelStyle}>Trainingsziele / كل سطر هدف</label>
          <textarea style={textareaStyle} value={form.trainingGoalsText} onChange={(e) => updateForm('trainingGoalsText', e.target.value)} />

          <label style={labelStyle}>Schwächen, die dieses Modell prüft</label>
          <textarea style={textareaStyle} value={form.weaknessesText} onChange={(e) => updateForm('weaknessesText', e.target.value)} />

          <label style={labelStyle}>Wochenplan-Logik</label>
          <select style={inputStyle} value={form.weeklyPlanUse} onChange={(e) => updateForm('weeklyPlanUse', e.target.value)}>
            <option value="nach_einstufung_oder_manuell">Nach Einstufungstest oder manuelle Auswahl</option>
            <option value="nur_nach_einstufung">Nur nach Einstufungstest</option>
            <option value="manuelle_auswahl">Manuelle Auswahl durch Schüler</option>
            <option value="premium_exam_followup">Nach Premium-Prüfung als Follow-up</option>
          </select>

          <AdminActionBar
            processingAction={processingAction}
            actions={[
              {
                id: editingId ? "save-model" : "add-model",
                icon: "💾",
                label: editingId ? "Änderungen speichern" : "Modell hinzufügen",
                variant: "green",
                onClick: () =>
                  runAction(editingId ? "save-model" : "add-model", handleSave),
              },
              {
                id: "cancel-form",
                icon: "✕",
                label: "Abbrechen",
                variant: "neutral",
                onClick: () => runAction("cancel-form", resetForm),
              },
            ]}
          />
        </div>
      )}

      <div style={filterCardStyle}>
        <label style={labelStyle}>Niveau</label>
        <select style={inputStyle} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="Alle">Alle</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>

        <label style={labelStyle}>Skill</label>
        <select style={inputStyle} value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="Alle">Alle</option>
          <option value="selbstvorstellung">Selbstvorstellung</option>
          <option value="bildbeschreibung">Bildbeschreibung</option>
          <option value="gespraech">Gespräch</option>
          <option value="planung">Planung</option>
          <option value="diskussion">Diskussion</option>
          <option value="hoeren">Hören</option>
          <option value="lesen">Lesen</option>
          <option value="schreiben">Schreiben</option>
          <option value="grammatik">Grammatik</option>
          <option value="wochenplan">Wochenplan</option>
        </select>

        <label style={labelStyle}>Schwierigkeit</label>
<select
  style={inputStyle}
  value={difficulty}
  onChange={(e) => setDifficulty(e.target.value)}
>
  <option value="Alle">Alle</option>
  <option value="leicht">leicht</option>
  <option value="mittel">mittel</option>
  <option value="stark">stark</option>
</select>
<label style={labelStyle}>Service</label>
<select
  style={inputStyle}
  value={service}
  onChange={(e) => setService(e.target.value)}
>
  <option value="Alle">Alle</option>
  <option value="placement_test">Einstufungstest</option>
  <option value="weekly_plan">Wochenplan</option>
  <option value="ai_exam">AI Probeprüfung</option>
  <option value="intensive_week">Intensive Woche</option>
  <option value="premium_month">Premium Monat</option>
</select>
      </div>

      {filteredModels.length === 0 ? (
        <div style={emptyStyle}>Noch keine AI-Modelle für diese Auswahl.</div>
      ) : (
        filteredModels.map((item) => (
          <div key={item.id} style={modelCardStyle}>
            <div onClick={() => setSelectedModel(item)}>
              <div style={modelTopStyle}>
                <span style={smallBadgeStyle}>{item.level}</span>
                <span style={smallBadgeStyle}>{item.skill}</span>
                <span style={smallBadgeStyle}>{item.difficulty}</span>
              </div>

              <h3 style={modelTitleStyle}>{item.title}</h3>

              <p style={modelTextStyle}>Service: {(item.service || []).join(', ')}</p>

              <p style={modelTextStyle}>
                Zeit: {item.estimatedTime || 0}s · Vorbereitung: {item.preparationTime || 0}s
              </p>

              <div style={openHintStyle}>Details öffnen ›</div>
            </div>

            <AdminActionBar
              processingAction={processingAction}
              actions={[
                {
                  id: `edit-${item.id}`,
                  icon: "✏️",
                  label: "Bearbeiten",
                  variant: "outline-blue",
                  onClick: () =>
                    runAction(`edit-${item.id}`, () => handleEdit(item)),
                },
                {
                  id: `delete-${item.id}`,
                  icon: "🗑",
                  label: "Löschen",
                  variant: "red",
                  onClick: () =>
                    runAction(`delete-${item.id}`, () => handleDelete(item.id)),
                },
              ]}
            />
          </div>
        ))
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <p style={{ margin: '6px 0' }}>
      <b>{label}:</b> {value}
    </p>
  );
}

function List({ items = [] }) {
  if (!items || items.length === 0) return <p style={mutedStyle}>Keine Daten.</p>;

  return (
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {items.map((item, index) => (
        <li key={index} style={{ marginBottom: '6px' }}>{item}</li>
      ))}
    </ul>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '100px',
  boxSizing: 'border-box'
};

const topActionsStyle = { marginBottom: '14px' };

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
  marginRight: '8px',
  marginBottom: '8px'
};

const addButtonStyle = {
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const heroStyle = {
  background: 'linear-gradient(135deg, #0f172a, #2563eb)',
  color: '#ffffff',
  borderRadius: '22px',
  padding: '22px',
  marginBottom: '16px'
};

const heroTitleStyle = { margin: 0, fontSize: '26px', fontWeight: '800' };

const heroTextStyle = { lineHeight: '1.6', marginBottom: 0, color: '#e0f2fe' };

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '16px'
};

const statCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '14px',
  border: '1px solid #e2e8f0',
  textAlign: 'center'
};

const statValueStyle = { fontSize: '26px', fontWeight: '800', color: '#2563eb' };

const statLabelStyle = { color: '#64748b', fontSize: '13px' };

const filterCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  border: '1px solid #e2e8f0',
  marginBottom: '16px'
};

const formCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '18px',
  border: '2px solid #2563eb',
  marginBottom: '16px'
};

const labelStyle = {
  display: 'block',
  fontWeight: '700',
  marginBottom: '6px',
  color: '#334155'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box'
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '90px',
  resize: 'vertical'
};

const checkboxStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  marginBottom: '12px',
  fontWeight: '700',
  color: '#334155'
};

const modelCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  border: '1px solid #e2e8f0',
  marginBottom: '12px',
  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)'
};

const modelTopStyle = { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' };

const smallBadgeStyle = {
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '4px 9px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700'
};

const modelTitleStyle = { margin: '0 0 8px', color: '#0f172a' };

const modelTextStyle = { margin: '4px 0', color: '#64748b', fontSize: '14px' };

const openHintStyle = { marginTop: '10px', color: '#2563eb', fontWeight: '700', cursor: 'pointer' };

const emptyStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '18px',
  color: '#64748b',
  border: '1px solid #e2e8f0'
};

const headerCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '14px',
  border: '1px solid #e2e8f0'
};

const titleStyle = { color: '#0f172a', marginBottom: '8px' };

const subtitleStyle = { color: '#64748b', lineHeight: '1.5' };

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  marginRight: '6px',
  marginBottom: '8px'
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  border: '1px solid #e2e8f0',
  marginBottom: '12px',
  lineHeight: '1.6'
};

const mutedStyle = { color: '#94a3b8', margin: 0 };