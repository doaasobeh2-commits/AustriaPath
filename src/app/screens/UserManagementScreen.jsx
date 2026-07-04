import React, { useEffect, useMemo, useState } from 'react';
import {
  grantPlan,
  addCredits,
  resetCredits,
  consumeAiCredits,
} from '../../data/subscriptionEngine';
import { getUsers, USERS_KEY } from '../userAccess';
import AdminActionBar from '../components/AdminActionBar';
import { useBackend } from '../../api/useBackend.js';
import { listAdminUsers, patchAdminUser } from '../../api/repositories/index.js';
function getUserCode(user) {
  if (user.userCode) return user.userCode;
  const raw = String(user.id || user.email || Date.now());
  const num = Math.abs(
    raw.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  );
  return `AP-${String(num).padStart(6, '0').slice(0, 6)}`;
}
function loadUsers() {
  return getUsers();
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function mapApiUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.email,
    role: u.role,
    status: u.status || 'approved',
    level: u.level || 'B1',
    allowedLevels: u.allowedLevels || u.allowed_levels || ['A2', 'B1', 'B2'],
    subscription: { type: u.plan || 'free', status: 'active' },
    aiCredits: u.aiCredits ?? 0,
    createdAt: u.createdAt,
  };
}

export default function UserManagementScreen({ setActiveTab }) {
  const [users, setUsers] = useState(() => (useBackend() ? [] : loadUsers()));
  const [loading, setLoading] = useState(useBackend());
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    if (!useBackend()) return;
    listAdminUsers()
      .then((rows) => setUsers(rows.map(mapApiUser)))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const persistUserPatch = async (id, changes) => {
    if (!useBackend()) return;
    const apiFields = {};
    if (changes.status) apiFields.status = changes.status;
    if (changes.level) apiFields.level = changes.level;
    if (changes.allowedLevels) apiFields.allowedLevels = changes.allowedLevels;
    if (Object.keys(apiFields).length) {
      await patchAdminUser(id, apiFields);
    }
  };

  const runAction = (actionId, fn) => {
    if (processingAction) return;

    setProcessingAction(actionId);
    try {
      fn();
    } finally {
      setProcessingAction(null);
    }
  };

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
  active: users.filter((u) => u.status !== "blocked").length,
  premium: users.filter(
    (u) =>
      (u.plan && u.plan !== "free") ||
      (u.subscription?.type && u.subscription.type !== "free")
  ).length,
  blocked: users.filter((u) => u.status === "blocked").length,
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
    if (!useBackend()) saveUsers(next);
    else persistUserPatch(id, changes).catch(() => {});

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
    const isBlocked = selectedUser.status === "blocked";

    const handleUnlockUser = () => {
      runAction("unlock", () => {
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
      });
    };

    const handleBlockUser = () => {
      runAction("block", () => {
        updateUser(selectedUser.id, { status: "blocked" });
        addActivity(selectedUser, "Benutzer gesperrt");
      });
    };

    const handleResetPassword = () => {
      if (processingAction) return;

      const confirmed = window.confirm(
        `Passwort für ${selectedUser.name} wirklich zurücksetzen?`
      );
      if (!confirmed) return;

      runAction("reset-password", () => {
        if (useBackend()) {
          alert("Passwort-Reset-E-Mail wird vom Backend versendet (Forgot-Password-Flow).");
        } else {
          alert("Passwort-Reset wird nach Backend-Integration aktiviert.");
        }
      });
    };

    const handleVerifyEmail = () => {
      runAction("verify-email", () => {
        if (useBackend()) {
          alert("E-Mail-Verifizierung erfolgt über den Bestätigungslink des Benutzers.");
        } else {
          alert("E-Mail-Bestätigung wird nach Backend-Integration aktiviert.");
        }
      });
    };

    const handleDeleteUser = () => {
      runAction("delete", () => deleteUser(selectedUser));
    };

    const managementActions = [
      ...(isBlocked
        ? [
            {
              id: "unlock",
              icon: "🔓",
              label: "Entsperren",
              variant: "green",
              onClick: handleUnlockUser,
            },
          ]
        : [
            {
              id: "block",
              icon: "🚫",
              label: "Sperren",
              variant: "neutral",
              onClick: handleBlockUser,
            },
          ]),
      {
        id: "reset-password",
        icon: "🔑",
        label: "Passwort zurücksetzen",
        variant: "blue",
        onClick: handleResetPassword,
      },
      {
        id: "verify-email",
        icon: "✉️",
        label: "E-Mail bestätigen",
        variant: "orange",
        onClick: handleVerifyEmail,
      },
      {
        id: "delete",
        icon: "🗑",
        label: "Löschen",
        variant: "red",
        onClick: handleDeleteUser,
      },
    ];

    const creditActions = [
      {
        id: "credits-plus-50",
        icon: "➕",
        label: "+50 Credits",
        variant: "blue",
        onClick: () =>
          runAction("credits-plus-50", () =>
            changeAiCredits(selectedUser, 50)
          ),
      },
      {
        id: "credits-plus-100",
        icon: "➕",
        label: "+100 Credits",
        variant: "blue",
        onClick: () =>
          runAction("credits-plus-100", () =>
            changeAiCredits(selectedUser, 100)
          ),
      },
      {
        id: "credits-minus-50",
        icon: "➖",
        label: "−50 Credits",
        variant: "neutral",
        onClick: () =>
          runAction("credits-minus-50", () =>
            changeAiCredits(selectedUser, -50)
          ),
      },
      {
        id: "credits-reset",
        icon: "🔄",
        label: "Reset Credits",
        variant: "outline-red",
        onClick: () =>
          runAction("credits-reset", () => resetAiCredits(selectedUser)),
      },
    ];

    const subscriptionActions = [
      {
        id: "sub-ai-exam",
        icon: "🤖",
        label: "AI Prüfung geben",
        variant: "blue",
        onClick: () =>
          runAction("sub-ai-exam", () =>
            changeSubscription(selectedUser, "ai_exam")
          ),
      },
      {
        id: "sub-premium",
        icon: "⭐",
        label: "Premium Monat",
        variant: "blue",
        onClick: () =>
          runAction("sub-premium", () =>
            changeSubscription(selectedUser, "premium_month")
          ),
      },
      {
        id: "sub-free",
        icon: "↩️",
        label: "Premium entfernen",
        variant: "neutral",
        onClick: () =>
          runAction("sub-free", () => changeSubscription(selectedUser, "free")),
      },
    ];

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
            <span style={badgeStyle}>{accountStatusLabel(selectedUser.status)}</span>
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

<AdminActionBar
  title="Credits anpassen"
  inset
  actions={creditActions}
  processingAction={processingAction}
/>
          <AdminActionBar
            title="Abo-Plan ändern"
            inset
            actions={subscriptionActions}
            processingAction={processingAction}
          />
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
          <textarea
            style={textareaStyle}
            value={selectedUser.notes || ''}
            placeholder="Interne Notiz zum Benutzer..."
            onChange={(e) => updateUser(selectedUser.id, { notes: e.target.value })}
          />
          <AdminActionBar
            inset
            processingAction={processingAction}
            actions={[
              {
                id: "save-note",
                icon: "💾",
                label: "Notiz speichern",
                variant: "blue",
                onClick: () =>
                  runAction("save-note", () => alert("Notiz gespeichert.")),
              },
            ]}
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
  <p style={managementHintStyle}>
    Konto sperren, Passwort zurücksetzen, E-Mail bestätigen oder Benutzer löschen.
  </p>

  <AdminActionBar
    inset
    actions={managementActions}
    processingAction={processingAction}
  />
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
        <Stat label="Premium" value={stats.premium} />
        <Stat label="Gesperrt" value={stats.blocked} />
      </div>

      <input
        style={searchStyle}
        placeholder="🔍 Name oder E-Mail suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div style={emptyStyle}>Benutzer werden geladen…</div>
      ) : filteredUsers.length === 0 ? (
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
                <span style={badgeStyle}>{accountStatusLabel(user.status)}</span>
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

function accountStatusLabel(status) {
  return status === "blocked" ? "🚫 Gesperrt" : "🟢 Aktiv";
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

const managementHintStyle = {
  margin: '0 0 4px',
  color: '#64748b',
  fontSize: '14px',
  lineHeight: 1.5,
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

