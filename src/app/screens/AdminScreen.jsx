import React, { useEffect, useState } from 'react';
import { getUsers, updateUserLevel, updateUserAllowedLevels } from '../userAccess';
import { a2Models } from '../../data/modelsA2';
import { b1Models } from '../../data/modelsb1/';
import { b2Models } from '../../data/modelsB2';
import UserAccessCard from "../components/UserAccessCard";

export function AdminScreen({ setActiveTab }) {
const STORAGE_KEY = 'austriaPathAdminData';



  const [unlocked, setUnlocked] = useState(true);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState(getUsers());
  const [editingId, setEditingId] = useState(null);
const [modelMode, setModelMode] = useState('new');
const [parentModelId, setParentModelId] = useState('');
  const [type, setType] = useState('schreiben');
  const [level, setLevel] = useState('A2');
  const [title, setTitle] = useState('');
  const [examId, setExamId] = useState('');
  const [examType, setExamType] = useState('ÖIF');
  const [examCenter, setExamCenter] = useState('');
  const [examDate, setExamDate] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [content, setContent] = useState('');
  const [solution, setSolution] = useState('');
  const [grammar, setGrammar] = useState('');
  const [satzbau, setSatzbau] = useState('');
  const [konnektoren, setKonnektoren] = useState('');
  const [words, setWords] = useState('');
  const [verbs, setVerbs] = useState('');
  const [expressions, setExpressions] = useState('');
  const [confirmations, setConfirmations] = useState(1);
  const [status, setStatus] = useState('draft');

  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      setItems(saved);
      setUsers(getUsers());
    } catch {
      setItems([]);
      setUsers([]);
    }
  }, []);

  const saveToStorage = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setItems(data);
  };

  const login = () => {
    if (password === 'admin123') {
      setUnlocked(true);
      setPassword('');
    } else {
      alert('Falsches Passwort');
    }
  };

  const normalize = (text) =>
    (text || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const toList = (text) =>
    String(text || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

  const today = () => new Date().toISOString().split('T')[0];
const staticModelsForAdmin = [
  ...a2Models.map((m) => ({
    id: `A2-${m.id}`,
    title: m.title,
    level: 'A2',
    source: 'static',
  })),
  ...b1Models.map((m) => ({
    id: `B1-${m.id}`,
    title: m.title,
    level: 'B1',
    source: 'static',
  })),
  ...b2Models.map((m) => ({
    id: `B2-${m.id}`,
    title: m.title,
    level: 'B2',
    source: 'static',
  })),
];

const adminMainModels = items
  .filter((item) => item.type === 'schreiben')
  .map((item) => ({
    id: `admin-${item.id}`,
    title: item.title,
    level: item.level,
    source: 'admin',
  }));

const allParentModels = [...staticModelsForAdmin, ...adminMainModels];

const selectedParentModel = allParentModels.find(
  (model) => model.id === parentModelId
);
  const buildPayload = () => ({
    
    type,
    level,
    title: title.trim(),
    examId: examId.trim(),
    examType,
    examCenter: examCenter.trim(),
    examDate,
    city: city.trim(),
    state: state.trim(),
    imageUrl,
    audioUrl,
    content: content.trim(),
    solution: solution.trim(),
    grammar: toList(grammar),
    satzbau: toList(satzbau),
    konnektoren: toList(konnektoren),
    words: toList(words),
    verbs: toList(verbs),
    expressions: toList(expressions),
    confirmations: Number(confirmations || 1),
    status,
    published: status === 'published',
    modelMode,
parentModelId,
parentModelTitle: selectedParentModel?.title || '',
parentModelLevel: selectedParentModel?.level || level,
isChildContent: modelMode === 'existing',
  });

  const resetForm = () => {
    setEditingId(null);
    setModelMode('new');
setParentModelId('');
    setType('schreiben');
    setLevel('A2');
    setTitle('');
    setExamId('');
    setExamType('ÖIF');
    setExamCenter('');
    setExamDate('');
    setCity('');
    setState('');
    setImageUrl('');
    setAudioUrl('');
    setContent('');
    setSolution('');
    setGrammar('');
    setSatzbau('');
    setKonnektoren('');
    setWords('');
    setVerbs('');
    setExpressions('');
    setConfirmations(1);
    setStatus('draft');
  };

  const saveItem = () => {
    if (!title.trim()) {
      alert('Bitte Titel eingeben.');
      return;
    }
if (modelMode === 'existing' && !parentModelId) {
  alert('Bitte ein bestehendes Modell auswählen.');
  return;
}
    const currentDate = today();

    const duplicateIndex = items.findIndex(
      (item) =>
        normalize(item.title) === normalize(title) &&
        item.level === level &&
        item.type === type &&
        item.id !== editingId
    );

    if (duplicateIndex >= 0 && !editingId) {
      const updated = [...items];
      const oldItem = updated[duplicateIndex];

      updated[duplicateIndex] = {
        ...oldItem,
        confirmations:
          Number(oldItem.confirmations || 0) + Number(confirmations || 1),
        lastConfirmed: currentDate,
        status: oldItem.status === 'archived' ? 'draft' : oldItem.status,
        published: oldItem.status === 'published',
        cities: uniqueArray([...(oldItem.cities || []), city.trim()].filter(Boolean)),
        states: uniqueArray([...(oldItem.states || []), state.trim()].filter(Boolean)),
        examDates: uniqueArray([...(oldItem.examDates || []), examDate].filter(Boolean)),
        examCenters: uniqueArray([...(oldItem.examCenters || []), examCenter.trim()].filter(Boolean)),
        history: [
          ...(oldItem.history || []),
          {
            date: currentDate,
            examDate,
            city: city.trim(),
            state: state.trim(),
            examCenter: examCenter.trim(),
            content: content.trim(),
            solution: solution.trim(),
            note: 'duplicate-confirmation',
          },
        ],
      };

      saveToStorage(updated);
      resetForm();
      alert('Vorhandenes Modell gefunden. Bestätigungen wurden erhöht.');
      return;
    }

    const newItem = {
      id: Date.now(),
      ...buildPayload(),
      cities: city.trim() ? [city.trim()] : [],
      states: state.trim() ? [state.trim()] : [],
      examDates: examDate ? [examDate] : [],
      examCenters: examCenter.trim() ? [examCenter.trim()] : [],
      lastConfirmed: currentDate,
      createdAt: new Date().toISOString(),
      history: [
        {
          date: currentDate,
          examDate,
          city: city.trim(),
          state: state.trim(),
          examCenter: examCenter.trim(),
          content: content.trim(),
          solution: solution.trim(),
          note: 'created',
        },
      ],
    };

    const updated = [...items, newItem];
    saveToStorage(updated);
    resetForm();
    alert('Gespeichert!');
  };

  const updateItem = () => {
    if (!title.trim()) {
      alert('Bitte Titel eingeben.');
      return;
    }

    const updated = items.map((item) =>
      item.id === editingId
        ? {
            ...item,
            ...buildPayload(),
            lastConfirmed: today(),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    saveToStorage(updated);
    resetForm();
    alert('Änderungen gespeichert.');
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setType(item.type || 'schreiben');
    setLevel(item.level || 'A2');
    setTitle(item.title || '');
    setExamId(item.examId || '');
    setExamType(item.examType || 'ÖIF');
    setExamCenter(item.examCenter || '');
    setExamDate(item.examDate || '');
    setCity(item.city || '');
    setState(item.state || '');
    setImageUrl(item.imageUrl || '');
    setAudioUrl(item.audioUrl || '');
    setContent(item.content || '');
    setSolution(item.solution || '');
    setGrammar((item.grammar || []).join('\n'));
    setSatzbau((item.satzbau || []).join('\n'));
    setKonnektoren((item.konnektoren || []).join('\n'));
    setWords((item.words || []).join('\n'));
    setVerbs((item.verbs || []).join('\n'));
    setExpressions((item.expressions || []).join('\n'));
    setConfirmations(item.confirmations || 1);
    setStatus(item.status || 'draft');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setItemStatus = (id, newStatus) => {
    const updated = items.map((item) =>
      item.id === id
        ? {
            ...item,
            status: newStatus,
            published: newStatus === 'published',
            lastConfirmed: newStatus === 'published' ? today() : item.lastConfirmed,
          }
        : item
    );

    saveToStorage(updated);
  };

  const archiveItem = (id) => setItemStatus(id, 'archived');
  const restoreItem = (id) => setItemStatus(id, 'draft');
  const publishItem = (id) => setItemStatus(id, 'published');
  const reviewItem = (id) => setItemStatus(id, 'review');
  const unpublishItem = (id) => setItemStatus(id, 'draft');

  const deleteItem = (id) => {
    const confirmDelete = window.confirm('Diesen Eintrag wirklich löschen?');
    if (!confirmDelete) return;

    const updated = items.filter((item) => item.id !== id);
    saveToStorage(updated);
  };

  const clearAllData = () => {
    const confirmClear = window.confirm(
      'Alle Admin-Daten löschen? Nur für Testdaten verwenden.'
    );
    if (!confirmClear) return;

    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  };

  const exportJson = () => {
    const json = JSON.stringify(items, null, 2);
    navigator.clipboard.writeText(json);
    alert('JSON wurde kopiert.');
  };

  const getCalculatedStatus = (item) => {
    if (item.status === 'archived') return 'archived';
    if (item.status === 'published') return 'published';
    if (item.status === 'review') return 'review';
    if (!item.lastConfirmed) return 'draft';

    const currentDate = new Date();
    const lastDate = new Date(item.lastConfirmed);
    const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 365) return 'old';
    if ((item.confirmations || 0) >= 5 && diffDays <= 180) return 'hot';

    return item.status || 'draft';
  };

  const getImportanceScore = (item) => {
    const confirmationsScore = Number(item.confirmations || 0) * 10;
    if (!item.lastConfirmed) return confirmationsScore;

    const currentDate = new Date();
    const lastDate = new Date(item.lastConfirmed);
    const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
    const freshnessPenalty = Math.floor(diffDays / 30);

    return confirmationsScore - freshnessPenalty;
  };

  const filteredItems = items
    .map((item) => ({
      ...item,
      calculatedStatus: getCalculatedStatus(item),
      score: getImportanceScore(item),
    }))
    .filter((item) => showArchived || item.status !== 'archived')
    .filter((item) => filterType === 'all' || item.type === filterType)
    .filter((item) => filterLevel === 'all' || item.level === filterLevel)
    .filter((item) => filterStatus === 'all' || item.status === filterStatus)
    .filter((item) => {
      const haystack =
        `${item.title} ${item.city} ${item.state} ${item.examCenter} ${item.content}`.toLowerCase();

      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => b.score - a.score);

    const toggleAllowedLevel = (user, levelName) => {
    const current = user.allowedLevels || ['A2'];

    const updatedLevels = current.includes(levelName)
      ? current.filter((item) => item !== levelName)
      : [...current, levelName];

    const finalLevels = updatedLevels.length > 0 ? updatedLevels : ['A2'];

    const updated = updateUserAllowedLevels(user.id, finalLevels);
    setUsers(updated);
  };
  const stats = {
    total: items.length,
    draft: items.filter((item) => item.status === 'draft').length,
    review: items.filter((item) => item.status === 'review').length,
    published: items.filter((item) => item.status === 'published').length,
    archived: items.filter((item) => item.status === 'archived').length,
  };

  if (!unlocked) {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
          ← Zurück
        </button>

        <div style={lockCardStyle}>
          <h1 style={titleStyle}>🔒 Admin Login</h1>
          <p style={subtitleStyle}>Dieser Bereich ist nur für AustriaPath.</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login();
            }}
          />

          <button onClick={login} style={saveButtonStyle}>
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('home')} style={backButtonStyle}>
        ← Zurück
      </button>

      <h1 style={titleStyle}>Admin Bereich</h1>

      <p style={subtitleStyle}>
        Neue Inhalte intern speichern, prüfen, veröffentlichen, archivieren und später als JSON exportieren.
      </p>
<button
  onClick={() => setActiveTab('aiPruefer')}
  style={{
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    marginBottom: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  }}
>
  🤖 AI Prüfer Bibliothek
</button>
<button
  onClick={() => setActiveTab("examinerLab")}
  style={{
    width: "100%",
    padding: "12px",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    marginBottom: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  🧠 Examiner Lab
</button>
      <div style={adminCardStyle}>
        <h2>Benutzer verwalten</h2>
        
<details>
  <summary style={{ cursor: 'pointer', fontWeight: '800', color: '#2563eb' }}>
    Benutzer anzeigen
  </summary>

  {users.length === 0 ? (
    <p style={smallTextStyle}>Keine Benutzer vorhanden.</p>
  ) : (
    users.map((user) => (
      <div key={user.id} style={userRowStyle}>
        <div>
          <strong>{user.name || 'Ohne Name'}</strong>

          <p style={{ margin: '4px 0', color: '#64748b' }}>
            {user.email}
          </p>

          <p style={{ margin: 0 }}>
            Aktuelles Niveau: <strong>{user.level}</strong>
          </p>

          <p style={{ margin: '4px 0', color: '#64748b' }}>
            Plan: {user.plan || 'free'} · Quelle: {user.levelSource || 'self_selected'}
          </p>

          <div style={levelAccessStyle}>
            {['A2', 'B1', 'B2'].map((levelName) => (
              <label key={levelName} style={levelCheckStyle}>
                <input
                  type="checkbox"
                  checked={(user.allowedLevels || ['A2']).includes(levelName)}
                  onChange={() => toggleAllowedLevel(user, levelName)}
                />
                {levelName}
              </label>
            ))}
          </div>
        </div>

        <select
          value={user.level || 'B1'}
          onChange={(e) => {
            const updated = updateUserLevel(user.id, e.target.value);
            setUsers(updated);
          }}
          style={selectStyle}
        >
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>
      </div>
    ))
  )}
</details>
</div>
      <div style={statsStyle}>
        <span>📦 Gesamt: {stats.total}</span>
        <span>📝 Draft: {stats.draft}</span>
        <span>🔍 Review: {stats.review}</span>
        <span>✅ Published: {stats.published}</span>
        <span>🗂 Archiv: {stats.archived}</span>
      </div>

      <div style={formCardStyle}>
        <label style={labelStyle}>Modell-Modus</label>
<select
  value={modelMode}
  onChange={(e) => setModelMode(e.target.value)}
  style={inputStyle}
>
  <option value="new">Neues Modell erstellen</option>
  <option value="existing">Zu bestehendem Modell hinzufügen</option>
</select>

{modelMode === 'existing' && (
  <>
    <label style={labelStyle}>Bestehendes Modell auswählen</label>
    <select
      value={parentModelId}
      onChange={(e) => {
        const value = e.target.value;
        setParentModelId(value);

        const selected = allParentModels.find((m) => m.id === value);
        if (selected) {
          setLevel(selected.level);
        }
      }}
      style={inputStyle}
    >
      <option value="">Modell wählen</option>
      {allParentModels.map((model) => (
        <option key={model.id} value={model.id}>
          {model.level} - {model.title}
        </option>
      ))}
    </select>
  </>
)}
        <label style={labelStyle}>Bereich</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          <option value="schreiben">Schreiben</option>
          <option value="bildbeschreibung">Bildbeschreibung / Grafikbeschreibung</option>
          <option value="planung">Planung</option>
          <option value="lesen">Lesen</option>
          <option value="hoeren">Hören</option>
          <option value="sprechen">Sprechen</option>
          <option value="erfahrung">Prüfungserfahrung</option>
        </select>

        <label style={labelStyle}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <label style={labelStyle}>Niveau</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>

        <label style={labelStyle}>Titel</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="z.B. Wohnung kündigen" />

        <label style={labelStyle}>Exam ID</label>
        <input value={examId} onChange={(e) => setExamId(e.target.value)} style={inputStyle} placeholder="z.B. B1-2026-001" />

        <label style={labelStyle}>Exam Type</label>
        <select value={examType} onChange={(e) => setExamType(e.target.value)} style={inputStyle}>
          <option value="ÖIF">ÖIF</option>
          <option value="ÖSD">ÖSD</option>
          <option value="Goethe">Goethe</option>
          <option value="Telc">Telc</option>
          <option value="Andere">Andere</option>
        </select>

        <label style={labelStyle}>Prüfungszentrum</label>
        <input value={examCenter} onChange={(e) => setExamCenter(e.target.value)} style={inputStyle} placeholder="z.B. BFI Wien, WIFI Linz" />

        <label style={labelStyle}>Prüfungsdatum</label>
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Bundesland</label>
        <input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} placeholder="z.B. Wien, Niederösterreich" />

        <label style={labelStyle}>Stadt</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} placeholder="z.B. Wien, St. Pölten" />

        <label style={labelStyle}>Bild hochladen</label>
        <input
          type="file"
          accept="image/*"
          style={inputStyle}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => setImageUrl(reader.result);
            reader.readAsDataURL(file);
          }}
        />

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Vorschau"
            style={{
              width: '100%',
              marginTop: '10px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
            }}
          />
        )}

        <label style={labelStyle}>Audio hochladen</label>
        <input
          type="file"
          accept="audio/*"
          style={inputStyle}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => setAudioUrl(reader.result);
            reader.readAsDataURL(file);
          }}
        />

        {audioUrl && (
          <audio controls style={{ width: '100%', marginTop: '10px' }}>
            <source src={audioUrl} />
            Ihr Browser unterstützt das Audio-Element nicht.
          </audio>
        )}

        <label style={labelStyle}>Inhalt / Aufgabe / Notizen</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={textareaStyle}
          placeholder="Aufgabe, Text, Transkript, Bildbeschreibung oder Notizen..."
        />

        <label style={labelStyle}>Musterlösung</label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          style={textareaStyle}
          placeholder="Hier die fertige Musterlösung eingeben..."
        />

        <label style={labelStyle}>Grammatik für Akademie</label>
        <textarea value={grammar} onChange={(e) => setGrammar(e.target.value)} style={smallTextareaStyle} placeholder="Jede Regel in eine neue Zeile" />

        <label style={labelStyle}>Satzbau für Akademie</label>
        <textarea value={satzbau} onChange={(e) => setSatzbau(e.target.value)} style={smallTextareaStyle} placeholder="Jeder Satz in eine neue Zeile" />

        <label style={labelStyle}>Konnektoren für Akademie</label>
        <textarea value={konnektoren} onChange={(e) => setKonnektoren(e.target.value)} style={smallTextareaStyle} placeholder="weil&#10;deshalb&#10;trotzdem" />

        <label style={labelStyle}>Wortschatz für Akademie</label>
        <textarea value={words} onChange={(e) => setWords(e.target.value)} style={smallTextareaStyle} placeholder="das Formular&#10;der Termin" />

        <label style={labelStyle}>Verben für Akademie</label>
        <textarea value={verbs} onChange={(e) => setVerbs(e.target.value)} style={smallTextareaStyle} placeholder="absagen&#10;vereinbaren" />
<label style={labelStyle}>B2 Ausdrücke für Akademie</label>
<textarea
  value={expressions}
  onChange={(e) => setExpressions(e.target.value)}
  style={smallTextareaStyle}
  placeholder="finanziell unter Druck geraten&#10;berufliche Nachteile befürchten"
/>
        <label style={labelStyle}>Bestätigungen</label>
        <input type="number" min="1" value={confirmations} onChange={(e) => setConfirmations(e.target.value)} style={inputStyle} />

        <button onClick={editingId ? updateItem : saveItem} style={saveButtonStyle}>
          {editingId ? 'Änderungen speichern' : 'Speichern'}
        </button>

        {editingId && (
          <button onClick={resetForm} style={cancelButtonStyle}>
            Bearbeitung abbrechen
          </button>
        )}

        <button onClick={exportJson} style={exportButtonStyle}>
          Export JSON kopieren
        </button>
      </div>

      <h2 style={listTitleStyle}>Gespeicherte Inhalte</h2>
<details>
  <summary
    style={{
      cursor: 'pointer',
      fontWeight: '800',
      color: '#2563eb',
      marginBottom: '15px'
    }}
  >
    Gespeicherte Inhalte anzeigen
  </summary>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
        placeholder="🔍 Suche..."
      />

      <div style={filterBoxStyle}>
       <select
  value={filterType}
  onChange={(e) => setFilterType(e.target.value)}
  style={filterInputStyle}
>
  <option value="all">Alle Bereiche</option>
  <option value="schreiben">Schreiben</option>
  <option value="bildbeschreibung">Bildbeschreibung / Grafikbeschreibung</option>
  <option value="planung">Planung</option>
  <option value="lesen">Lesen</option>
  <option value="hoeren">Hören</option>
  <option value="sprechen">Sprechen</option>
  <option value="erfahrung">Prüfungserfahrung</option>
</select>

        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={filterInputStyle}>
          <option value="all">Alle Niveaus</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterInputStyle}>
          <option value="all">Alle Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <button onClick={() => setShowArchived(!showArchived)} style={archiveToggleStyle}>
          {showArchived ? 'Archiv ausblenden' : 'Archiv anzeigen'}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div style={emptyStyle}>Keine Inhalte gefunden.</div>
      ) : (
        filteredItems.map((item) => (
          <div key={item.id} style={itemCardStyle}>
            <div style={itemHeaderStyle}>
              <strong>{item.title}</strong>
              <StatusBadge status={item.calculatedStatus} />
            </div>

            <p style={smallTextStyle}>
              {item.level} · {item.type} · {item.examType || 'Exam'} · {item.state || 'Bundesland offen'} · {item.city || 'Stadt offen'}
            </p>

            <p style={smallTextStyle}>
              Bestätigungen: {item.confirmations} · Score: {item.score} · Zuletzt: {item.lastConfirmed}
            </p>

            {item.examDate && <p style={smallTextStyle}>Prüfungsdatum: {item.examDate}</p>}
            {item.examCenter && <p style={smallTextStyle}>Zentrum: {item.examCenter}</p>}
            {item.cities?.length > 0 && <p style={smallTextStyle}>Städte: {item.cities.join(', ')}</p>}

           <details style={{ marginTop: '10px' }}>
  <summary style={{ cursor: 'pointer', fontWeight: '700', color: '#2563eb' }}>
    Inhalt anzeigen
  </summary>

  {item.content && <p style={contentPreviewStyle}>{item.content}</p>}
  {item.solution && (
    <p style={contentPreviewStyle}>Musterlösung: {item.solution}</p>
  )}
</details>

            <div style={actionRowStyle}>
              <button onClick={() => editItem(item)} style={editButtonStyle}>
                Bearbeiten
              </button>

              {item.status === 'published' ? (
                <button onClick={() => unpublishItem(item.id)} style={archiveButtonStyle}>
                  Stoppen
                </button>
              ) : (
                <button onClick={() => publishItem(item.id)} style={publishButtonStyle}>
                  Veröffentlichen
                </button>
              )}
            </div>

            <div style={actionRowStyle}>
              {item.status === 'archived' ? (
                <button onClick={() => restoreItem(item.id)} style={restoreButtonStyle}>
                  Wiederherstellen
                </button>
              ) : (
                <button onClick={() => archiveItem(item.id)} style={archiveButtonStyle}>
                  Archivieren
                </button>
              )}

              <button onClick={() => reviewItem(item.id)} style={reviewButtonStyle}>
                Review
              </button>

              <button onClick={() => deleteItem(item.id)} style={deleteButtonStyle}>
                Löschen
              </button>
            </div>
          </div>
        ))
      )}
</details>
      <button onClick={clearAllData} style={clearButtonStyle}>
        Testdaten komplett löschen
      </button>
    </div>
  );
}

function uniqueArray(arr) {
  return [...new Set(arr)];
}

function StatusBadge({ status }) {
  const data = {
    hot: { text: '🔥 Häufig', style: { backgroundColor: '#fee2e2', color: '#991b1b' } },
    draft: { text: '📝 Draft', style: { backgroundColor: '#e0f2fe', color: '#0369a1' } },
    review: { text: '🔍 Review', style: { backgroundColor: '#fef3c7', color: '#92400e' } },
    published: { text: '✅ Published', style: { backgroundColor: '#dcfce7', color: '#166534' } },
    old: { text: '⏳ Alt', style: { backgroundColor: '#fef3c7', color: '#92400e' } },
    archived: { text: '📦 Archiv', style: { backgroundColor: '#e5e7eb', color: '#374151' } },
  };

  const current = data[status] || data.draft;

  return <span style={{ ...statusBadgeStyle, ...current.style }}>{current.text}</span>;
}

const pageStyle = {
  padding: '22px',
  paddingBottom: '100px',
  fontFamily: 'system-ui, sans-serif',
  background: '#f8fafc',
  minHeight: '100vh',
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

const lockCardStyle = {
  background: '#ffffff',
  borderRadius: '22px',
  padding: '22px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
};

const titleStyle = {
  margin: '0 0 8px',
  color: '#0f172a',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
  marginBottom: '18px',
};

const adminCardStyle = {
  background: 'white',
  borderRadius: '18px',
  padding: '18px',
  marginTop: '18px',
  marginBottom: '16px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
};

const userRowStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
};

const selectStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '10px',
  fontWeight: 800,
  backgroundColor: '#ffffff',
};
const levelAccessStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '10px',
  flexWrap: 'wrap',
};

const levelCheckStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '999px',
  padding: '6px 10px',
  fontSize: '13px',
  fontWeight: '700',
  color: '#334155',
};
const statsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '8px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '14px',
  marginBottom: '16px',
  color: '#334155',
  fontWeight: '800',
};

const formCardStyle = {
  background: '#ffffff',
  borderRadius: '22px',
  padding: '18px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};

const labelStyle = {
  display: 'block',
  margin: '12px 0 6px',
  color: '#334155',
  fontWeight: '700',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '150px',
  resize: 'vertical',
};

const smallTextareaStyle = {
  ...inputStyle,
  minHeight: '90px',
  resize: 'vertical',
};

const saveButtonStyle = {
  width: '100%',
  marginTop: '18px',
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '800',
  fontSize: '16px',
  cursor: 'pointer',
};

const cancelButtonStyle = {
  width: '100%',
  marginTop: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  padding: '12px',
  borderRadius: '16px',
  fontWeight: '800',
  fontSize: '15px',
  cursor: 'pointer',
};

const exportButtonStyle = {
  width: '100%',
  marginTop: '10px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '800',
  fontSize: '16px',
  cursor: 'pointer',
};

const listTitleStyle = {
  marginTop: '28px',
  color: '#0f172a',
};

const filterBoxStyle = {
  display: 'grid',
  gap: '8px',
  marginTop: '12px',
  marginBottom: '14px',
};

const filterInputStyle = {
  ...inputStyle,
  padding: '10px',
};

const archiveToggleStyle = {
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  padding: '11px',
  borderRadius: '14px',
  fontWeight: '700',
  cursor: 'pointer',
};

const emptyStyle = {
  background: '#ffffff',
  border: '1px dashed #cbd5e1',
  borderRadius: '16px',
  padding: '18px',
  color: '#64748b',
  textAlign: 'center',
};

const itemCardStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'center',
};

const statusBadgeStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '800',
  whiteSpace: 'nowrap',
};

const smallTextStyle = {
  color: '#64748b',
  fontSize: '13px',
  margin: '6px 0',
};

const contentPreviewStyle = {
  background: '#f8fafc',
  borderRadius: '12px',
  padding: '10px',
  color: '#334155',
  fontSize: '14px',
  lineHeight: '1.5',
  whiteSpace: 'pre-line',
};

const actionRowStyle = {
  display: 'flex',
  gap: '8px',
  marginTop: '10px',
};

const editButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const publishButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const reviewButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const archiveButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const restoreButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const deleteButtonStyle = {
  flex: 1,
  border: 'none',
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer',
};

const clearButtonStyle = {
  width: '100%',
  marginTop: '22px',
  border: '1px solid #fecaca',
  backgroundColor: '#fff1f2',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '16px',
  fontWeight: '800',
  cursor: 'pointer',
};