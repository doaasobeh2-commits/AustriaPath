import React, { useMemo, useState } from 'react';
import {
  grantPlan,
  addCredits,
  resetCredits,
  consumeAiCredits,
} from '../../data/subscriptionEngine';

const USERS_KEY = 'austriaPathUsers';
function getUserCode(user) {
  if (user.userCode) return user.userCode;
  const raw = String(user.id || user.email || Date.now());
  const num = Math.abs(
    raw.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  );
  return `AP-${String(num).padStart(6, '0').slice(0, 6)}`;
}
function loadUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (saved.length) return saved;
  } catch {}
console.log("Loaded users:", saved);
  return [
    {
      id: 'demo-1',
      name: localStorage.getItem('userName') || 'Demo Student',
      email: localStorage.getItem('userEmail') || 'demo@austriapath.at',
      level: localStorage.getItem('userLevel') || 'B1',
      allowedLevels: ['A2'],
      language: localStorage.getItem('userLanguage') || 'Deutsch',
      role: 'student',
      status: 'active',
      source: 'login_created',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      subscription: {
        type: 'free',
        status: 'inactive',
        remainingExams: 0,
        startDate: null,
        endDate: null,
      },
      aiLevel: '-',
      completedExams: 0,
      notes: '',
    },
  ];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export default function UserManagementScreen({ setActiveTab }) {
  const [users, setUsers] = useState(loadUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;

    return users.filter(
      (u) =>
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

 const stats = useMemo(() => ({
  total: users.length,
 active: users.filter(
  (u) => u.status === "approved" || u.status === "active"
).length,
  premium: users.filter(
    (u) =>
      (u.plan && u.plan !== "free") ||
      (u.subscription?.type && u.subscription.type !== "free")
  ).length,
  blocked: users.filter((u) => u.status === "blocked").length,
  pending: users.filter((u) => !u.status || u.status === "pending").length,
}), [users]);
  const updateUser = (id, changes) => {
    const next = users.map((u) => {
     if (String(u.id) !== String(id)) return u;

      const updated = {
        ...u,
        ...changes,
      };

      return updated;
    });

    setUsers(next);
    saveUsers(next);

    if (String(selectedUser?.id) === String(id)) {
      setSelectedUser((old) => ({ ...old, ...changes }));
    }
  };

  const toggleAllowedLevel = (user, level) => {
    const current = user.allowedLevels || ['A2'];
    const next = current.includes(level)
      ? current.filter((x) => x !== level)
      : [...current, level];

    updateUser(user.id, {
      allowedLevels: next.length ? next : ['A2'],
    });
  };

 const changeSubscription = (user, type) => {
    const updatedUser = grantPlan(user, type);
    updateUser(user.id, updatedUser);
};
const changeAiCredits = (user, amount) => {
  const updatedUser = addCredits(user, amount);
  updateUser(user.id, updatedUser);
};

const resetAiCredits = (user) => {
  const updatedUser = resetCredits(user);
  updateUser(user.id, updatedUser);
};

const testConsumeCredits = (user) => {
  const result = consumeAiCredits(user, 50, 'Test AI Prüfung');

  if (!result.ok) {
    alert(result.message);
    return;
  }

  updateUser(user.id, result.user);
};


const addActivity = (user, action, details = '') => {
  const item = {
    date: new Date().toISOString(),
    action,
    details,
  };

  updateUser(user.id, {
    activityLog: [item, ...(user.activityLog || [])],
  });
};
  const deleteUser = (user) => {
    const ok = window.confirm(`Benutzer ${user.name} wirklich löschen?`);
    if (!ok) return;

    const next = users.filter((u) => u.id !== user.id);
    setUsers(next);
    saveUsers(next);
    setSelectedUser(null);
  };

  if (selectedUser) {
    return (
      <div style={pageStyle}>
        <button style={backButtonStyle} onClick={() => setSelectedUser(null)}>
          ← Zurück zur Liste
        </button>

        <div style={heroStyle}>
          <h1>👤 {selectedUser.name}</h1>
          <p>{selectedUser.email}</p>
          <p style={{ opacity: 0.9, marginTop: '6px' }}>
  User ID: {getUserCode(selectedUser)}
</p>
          <div style={badgeRowStyle}>
            <span style={badgeStyle}>{selectedUser.level}</span>
            <span style={badgeStyle}>
             {selectedUser.status === "approved" || selectedUser.status === "active"
  ? "🟢 Aktiv"
  : selectedUser.status === "pending"
  ? "🟡 Wartet"
  : "🚫 Gesperrt"}
            </span>
            <span style={badgeStyle}>
              {subscriptionLabel(selectedUser.subscription?.type)}
            </span>
          </div>
        </div>

        <div style={cardStyle}>
          <h2>Grunddaten</h2>

          <label style={labelStyle}>Name</label>
          <input
            style={inputStyle}
            value={selectedUser.name || ''}
            onChange={(e) => updateUser(selectedUser.id, { name: e.target.value })}
          />

          <label style={labelStyle}>E-Mail</label>
          <input
            style={inputStyle}
            value={selectedUser.email || ''}
            onChange={(e) => updateUser(selectedUser.id, { email: e.target.value })}
          />

          <label style={labelStyle}>Sprache</label>
          <select
            style={inputStyle}
            value={selectedUser.language || 'Deutsch'}
            onChange={(e) => updateUser(selectedUser.id, { language: e.target.value })}
          >
            <option>Deutsch</option>
            <option>العربية</option>
            <option>Türkçe</option>
            <option>فارسی</option>
            <option>Українська</option>
          </select>

          <p><b>Registriert:</b> {formatDate(selectedUser.createdAt)}</p>
          <p><b>Letzter Login:</b> {formatDate(selectedUser.lastLogin)}</p>
          <p><b>Quelle:</b> {selectedUser.source || 'E-Mail'}</p>
        </div>

        <div style={cardStyle}>
          <h2>🎓 Niveau & Freigaben</h2>

          <label style={labelStyle}>Aktuelles Niveau</label>
          <select
            style={inputStyle}
            value={selectedUser.level || 'B1'}
            onChange={(e) => updateUser(selectedUser.id, { level: e.target.value })}
          >
            <option>A2</option>
            <option>B1</option>
            <option>B2</option>
          </select>

          <p style={mutedStyle}>Freigegebene Lernbereiche:</p>

          <div style={levelButtonsStyle}>
            {['A2', 'B1', 'B2'].map((lvl) => (
              <label key={lvl} style={levelCheckStyle}>
                <input
                  type="checkbox"
                  checked={(selectedUser.allowedLevels || []).includes(lvl)}
                  onChange={() => toggleAllowedLevel(selectedUser, lvl)}
                />
                {lvl}
              </label>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2>💳 Abo</h2>

          <label style={labelStyle}>Plan</label>
          <select
            style={inputStyle}
            value={selectedUser.subscription?.type || 'free'}
            onChange={(e) => changeSubscription(selectedUser, e.target.value)}
          >
            <option value="free">Free</option>
            <option value="placement_test">Einstufungstest</option>
            <option value="ai_exam">AI Probeprüfung</option>
            <option value="intensive_week">Intensive Woche</option>
            <option value="premium_month">Premium Monat</option>
          </select>

         <p>
  <b>Status:</b>{' '}
  {selectedUser.subscription?.status === 'active'
    ? '🟢 Aktiv'
    : selectedUser.subscription?.status === 'expired'
    ? '🔴 Abgelaufen'
    : '⚪ Inaktiv'}
</p>
          <p><b>Restliche Prüfungen:</b> {selectedUser.subscription?.remainingExams || 0}</p>
          <p><b>Start:</b> {formatDate(selectedUser.subscription?.startDate)}</p>
          <p><b>Ende:</b> {formatDate(selectedUser.subscription?.endDate)}</p>
<hr style={{ margin: '20px 0' }} />

<h3>🤖 AI Guthaben</h3>

<p><b>AI Credits:</b> {selectedUser.aiCredits || 0}</p>
<p><b>Verbrauchte Credits:</b> {selectedUser.usedAiCredits || 0}</p>
<p>
  <b>Verfügbar:</b>{' '}
  {Math.max(0, (selectedUser.aiCredits || 0) - (selectedUser.usedAiCredits || 0))}
</p>

<div style={actionGridStyle}>
  <button
    style={smallBlueButtonStyle}
    onClick={() => changeAiCredits(selectedUser, 50)}
  >
    ➕ 50 Credits
  </button>

  <button
    style={smallBlueButtonStyle}
    onClick={() => changeAiCredits(selectedUser, 100)}
  >
    ➕ 100 Credits
  </button>

  <button
    style={smallGrayButtonStyle}
    onClick={() => changeAiCredits(selectedUser, -50)}
  >
    ➖ 50 Credits
  </button>

  <button
    style={dangerButtonStyle}
    onClick={() => resetAiCredits(selectedUser)}
  >
    🔄 Reset Credits
  </button>
</div>
          <div style={actionGridStyle}>
            <button
              style={smallBlueButtonStyle}
              onClick={() => changeSubscription(selectedUser, 'ai_exam')}
            >
              AI Prüfung geben
            </button>

            <button
              style={smallBlueButtonStyle}
              onClick={() => changeSubscription(selectedUser, 'premium_month')}
            >
              Premium Monat geben
            </button>

            <button
              style={smallGrayButtonStyle}
              onClick={() => changeSubscription(selectedUser, 'free')}
            >
              Premium entfernen
            </button>
          </div>
        </div>
<div style={cardStyle}>
  <h2>🔐 Permissions</h2>

  {Object.entries(selectedUser.permissions || {}).length === 0 ? (
    <p style={mutedStyle}>Noch keine Berechtigungen.</p>
  ) : (
    Object.entries(selectedUser.permissions || {}).map(([key, value]) => (
      <p key={key}>
        <b>{key}:</b> {value ? '✅ Aktiv' : '❌ Inaktiv'}
      </p>
    ))
  )}
</div>
      <h2>🤖 AI Ergebnisse</h2>

<p><b>AI Niveau:</b> {selectedUser.aiLevel || '-'}</p>
<p><b>Letzte Prüfung:</b> {selectedUser.lastAiExam || '-'}</p>
<p><b>Durchschnitt:</b> {selectedUser.aiAverage || '-'}</p>
<p><b>Abgeschlossene Prüfungen:</b> {selectedUser.completedExams || 0}</p>

<p style={mutedStyle}>
  Berichte werden nach OpenAI-Integration automatisch hier angezeigt.
</p>

        <div style={cardStyle}>
          <h2>📝 Admin Notiz</h2>
<button
  style={smallBlueButtonStyle}
  onClick={() => alert('Notiz gespeichert.')}
>
  💾 Notiz speichern
</button>
          <textarea
            style={textareaStyle}
            value={selectedUser.notes || ''}
            placeholder="Interne Notiz zum Benutzer..."
            onChange={(e) => updateUser(selectedUser.id, { notes: e.target.value })}
          />
        </div>
<div style={cardStyle}>
  <h2>📜 Subscription History</h2>

  {(selectedUser.history || []).length === 0 ? (
    <p style={mutedStyle}>Noch keine Einträge.</p>
  ) : (
    (selectedUser.history || []).map((item, index) => (
      <div key={index} style={historyItemStyle}>
        <b>{new Date(item.date).toLocaleString('de-DE')}</b>
        <p>{item.action}</p>
        {item.details && <small>{item.details}</small>}
      </div>
    ))
  )}
</div>
<div style={cardStyle}>
  <h2>📊 Activity Log</h2>

  {(selectedUser.activityLog || []).length === 0 ? (
    <p style={mutedStyle}>Noch keine Aktivitäten.</p>
  ) : (
    (selectedUser.activityLog || []).map((item, index) => (
      <div key={index} style={historyItemStyle}>
        <b>{new Date(item.date).toLocaleString('de-DE')}</b>

        <p>{item.action}</p>

        {item.details && (
          <small>{item.details}</small>
        )}
      </div>
    ))
  )}
</div>
      <div style={cardStyle}>
  <h2>⚙️ Verwaltung</h2>


  {selectedUser.status === "approved" || selectedUser.status === "active" ? (
    <button
      style={deleteButtonStyle}
      onClick={() => {
        updateUser(selectedUser.id, { status: "blocked" });
        addActivity(selectedUser, "Benutzer gesperrt");
      }}
    >
      🚫 Sperren
    </button>
  ) : (
    <button
  style={successButtonStyle}
  onClick={() => {
    const updated = {
      ...selectedUser,
      status: "approved",
      accessUpdatedAt: new Date().toISOString(),
    };

    const next = users.map((u) =>
      String(u.id) === String(selectedUser.id) ? updated : u
    );

    setUsers(next);
    saveUsers(next);
    setSelectedUser(updated);
  
  }}
>
  ✅ Entsperren
</button>
  )}

  <button
    style={smallGrayButtonStyle}
    onClick={() => alert("Passwort-Reset wird nach Backend-Integration aktiviert.")}
  >
    🔑 Passwort zurücksetzen
  </button>

  <button
    style={smallGrayButtonStyle}
    onClick={() => alert("E-Mail-Bestätigung wird nach Backend-Integration aktiviert.")}
  >
    ✉️ E-Mail bestätigen
  </button>

  <button
    style={deleteButtonStyle}
    onClick={() => deleteUser(selectedUser)}
  >
    🗑 Löschen
  </button>
</div>
        </div>
      
    );
  }

  return (
    <div style={pageStyle}>
      <button style={backButtonStyle} onClick={() => setActiveTab('profile')}>
        ← Zurück
      </button>

      <div style={heroStyle}>
        <h1>👥 Benutzerverwaltung</h1>
        <p>Benutzer suchen, öffnen und verwalten.</p>
      </div>

      <div style={statsGridStyle}>
        <Stat label="Gesamt" value={stats.total} />
        <Stat label="Aktiv" value={stats.active} />
        <Stat label="Wartet" value={stats.pending} />
        <Stat label="Premium" value={stats.premium} />
        <Stat label="Gesperrt" value={stats.blocked} />
      </div>

      <input
        style={searchStyle}
        placeholder="🔍 Name oder E-Mail suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <div style={emptyStyle}>Keine Benutzer gefunden.</div>
      ) : (
        filteredUsers.map((user) => (
          <div key={user.id} style={userRowStyle}>
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{user.name}</h3>
              <p style={mutedStyle}>{user.email}</p>

              <div style={badgeRowStyle}>
                <span style={badgeStyle}>{user.level}</span>
                <span style={badgeStyle}>{subscriptionLabel(user.subscription?.type)}</span>
                <span style={badgeStyle}>
                 {user.status === "approved" || user.status === "active"
  ? "🟢 Aktiv"
  : user.status === "pending"
  ? "🟡 Wartet"
  : "🚫 Gesperrt"}
                </span>
              </div>
            </div>

            <button style={openButtonStyle} onClick={() => setSelectedUser(user)}>
              Öffnen
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function subscriptionLabel(type) {
  const labels = {
    free: 'Free',
    placement_test: 'Einstufungstest',
    ai_exam: 'AI Probeprüfung',
    intensive_week: 'Intensive Woche',
    premium_month: 'Premium Monat',
  };

  return labels[type] || 'Free';
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('de-DE');
  } catch {
    return '-';
  }
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '100px',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  marginBottom: '14px',
};

const heroStyle = {
  background: 'linear-gradient(135deg, #0f172a, #2563eb)',
  color: '#ffffff',
  padding: '22px',
  borderRadius: '22px',
  marginBottom: '16px',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '14px',
};

const statStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '14px',
  display: 'grid',
  gap: '4px',
  textAlign: 'center',
  color: '#334155',
};

const searchStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  marginBottom: '14px',
  boxSizing: 'border-box',
  fontSize: '15px',
};

const userRowStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '14px',
  lineHeight: '1.7',
};

const mutedStyle = {
  margin: '4px 0',
  color: '#64748b',
};

const badgeRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '10px',
};

const badgeStyle = {
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '800',
};

const openButtonStyle = {
  width: '100%',
  marginTop: '12px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontWeight: '800',
  marginBottom: '6px',
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  boxSizing: 'border-box',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
};

const levelButtonsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const levelCheckStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '999px',
  padding: '10px 14px',
  fontWeight: '800',
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
};

const actionGridStyle = {
  display: 'grid',
  gap: '10px',
};

const smallBlueButtonStyle = {
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const smallGrayButtonStyle = {
  border: 'none',
  backgroundColor: '#e2e8f0',
  color: '#334155',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const dangerButtonStyle = {
  border: 'none',
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const successButtonStyle = {
  border: 'none',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const deleteButtonStyle = {
  border: 'none',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
};

const emptyStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '18px',
  color: '#64748b',
};

const historyItemStyle = {
  borderLeft: '4px solid #2563eb',
  padding: '10px 12px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  marginBottom: '10px',
};

