import React, { useCallback, useEffect, useState } from "react";
import { getUsers, updateUserLevel, updateUserAllowedLevels, USER_REGISTERED_EVENT } from "../userAccess";
import { useBackend } from "../../api/useBackend.js";
import { listAdminUsers, patchAdminUser } from "../../api/repositories/index.js";
import { accessStatusLabel } from "../../utils/accessStatus.js";

function mapApiUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.email,
    role: u.role,
    status: u.status || "approved",
    level: u.level || "B1",
    plan: u.plan || "free",
    allowedLevels: u.allowedLevels || u.allowed_levels || ["A2", "B1", "B2"],
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    trialStartedAt: u.trialStartedAt,
    trialExpiresAt: u.trialExpiresAt,
    isAccessApproved: u.isAccessApproved,
    accessStatus: u.accessStatus,
  };
}

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("de-DE");
  } catch {
    return "—";
  }
}

function accountStatusLabel(status) {
  return status === "blocked" ? "Gesperrt" : "Aktiv";
}

export default function AdminUsersPanel({ isActive = true }) {
  const backend = useBackend();
  const [users, setUsers] = useState(() => (backend ? [] : getUsers()));
  const [loading, setLoading] = useState(backend);
  const [loadError, setLoadError] = useState(null);

  const reloadUsers = useCallback(async () => {
    if (!backend) {
      setUsers(getUsers());
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const rows = await listAdminUsers();
      setUsers(rows.map(mapApiUser));
    } catch {
      setLoadError("Benutzer konnten nicht geladen werden.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    if (!isActive) return;
    reloadUsers();
  }, [isActive, reloadUsers]);

  useEffect(() => {
    const onRegistered = () => {
      if (isActive) reloadUsers();
    };
    window.addEventListener(USER_REGISTERED_EVENT, onRegistered);
    return () => window.removeEventListener(USER_REGISTERED_EVENT, onRegistered);
  }, [isActive, reloadUsers]);

  const persistPatch = async (userId, changes) => {
    if (!backend) return;
    const apiFields = {};
    if (changes.level) apiFields.level = changes.level;
    if (changes.allowedLevels) apiFields.allowedLevels = changes.allowedLevels;
    if (Object.keys(apiFields).length) {
      await patchAdminUser(userId, apiFields);
    }
  };

  const applyLocalUpdate = (userId, changes) => {
    setUsers((current) =>
      current.map((user) =>
        String(user.id) === String(userId) ? { ...user, ...changes } : user
      )
    );
  };

  const toggleAllowedLevel = (user, levelName) => {
    const current = user.allowedLevels || ["A2"];
    const updatedLevels = current.includes(levelName)
      ? current.filter((l) => l !== levelName)
      : [...current, levelName];
    const allowedLevels = updatedLevels.length ? updatedLevels : ["A2"];

    if (backend) {
      applyLocalUpdate(user.id, { allowedLevels });
      persistPatch(user.id, { allowedLevels }).catch(() => reloadUsers());
      return;
    }

    setUsers(updateUserAllowedLevels(user.id, allowedLevels));
  };

  const changeLevel = (user, newLevel) => {
    if (backend) {
      applyLocalUpdate(user.id, { level: newLevel });
      persistPatch(user.id, { level: newLevel }).catch(() => reloadUsers());
      return;
    }

    setUsers(updateUserLevel(user.id, newLevel));
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>Benutzer verwalten</h2>
      {loading ? (
        <p style={hintStyle}>Benutzer werden geladen…</p>
      ) : loadError ? (
        <p style={errorStyle}>{loadError}</p>
      ) : users.length === 0 ? (
        <p style={hintStyle}>Keine Benutzer vorhanden.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} style={rowStyle}>
            <div>
              <strong>{user.name || "Ohne Name"}</strong>
              <p style={hintStyle}>{user.email}</p>
              <p style={hintStyle}>
                Registriert: {formatDate(user.createdAt)} · Letzter Login:{" "}
                {formatDate(user.lastLogin)} · Status: {accountStatusLabel(user.status)}
                {user.accessStatus ? ` · Zugang: ${accessStatusLabel(user.accessStatus)}` : ""}
              </p>
              <p style={hintStyle}>Niveau: {user.level} · Plan: {user.plan || "free"}</p>
              <div style={checkRowStyle}>
                {["A2", "B1", "B2"].map((levelName) => (
                  <label key={levelName} style={checkStyle}>
                    <input
                      type="checkbox"
                      checked={(user.allowedLevels || ["A2"]).includes(levelName)}
                      onChange={() => toggleAllowedLevel(user, levelName)}
                    />
                    {levelName}
                  </label>
                ))}
              </div>
            </div>
            <select
              value={user.level || "B1"}
              onChange={(e) => changeLevel(user, e.target.value)}
              style={selectStyle}
            >
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = { background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e2e8f0" };
const hintStyle = { color: "#64748b", fontSize: 13, margin: "4px 0" };
const errorStyle = { color: "#b91c1c", fontSize: 13, margin: "4px 0" };
const rowStyle = { display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, marginBottom: 12 };
const checkRowStyle = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 };
const checkStyle = { display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700 };
const selectStyle = { border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, fontWeight: 800 };
