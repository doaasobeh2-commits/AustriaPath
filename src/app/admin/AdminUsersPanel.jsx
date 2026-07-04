import React, { useState } from "react";
import { getUsers, updateUserLevel, updateUserAllowedLevels } from "../userAccess";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState(getUsers());

  const toggleAllowedLevel = (user, levelName) => {
    const current = user.allowedLevels || ["A2"];
    const updatedLevels = current.includes(levelName)
      ? current.filter((l) => l !== levelName)
      : [...current, levelName];
    setUsers(updateUserAllowedLevels(user.id, updatedLevels.length ? updatedLevels : ["A2"]));
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>Benutzer verwalten</h2>
      {users.length === 0 ? (
        <p style={hintStyle}>Keine Benutzer vorhanden.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} style={rowStyle}>
            <div>
              <strong>{user.name || "Ohne Name"}</strong>
              <p style={hintStyle}>{user.email}</p>
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
              onChange={(e) => setUsers(updateUserLevel(user.id, e.target.value))}
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
const rowStyle = { display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, marginBottom: 12 };
const checkRowStyle = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 };
const checkStyle = { display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700 };
const selectStyle = { border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, fontWeight: 800 };
