import React, { useState } from "react";
import AdminNav from "./AdminNav.jsx";
import ContentManager from "./ContentManager.jsx";
import AdminUsersPanel from "./AdminUsersPanel.jsx";
import AdminOverviewPanel from "./AdminOverviewPanel.jsx";
import { useAdminContent } from "./useAdminContent.js";

export default function AdminShell({ setActiveTab }) {
  const [activeSection, setActiveSection] = useState("content");
  const admin = useAdminContent();

  return (
    <div style={pageStyle}>
      <button type="button" onClick={() => setActiveTab("home")} style={backBtnStyle}>
        ← Zurück
      </button>

      <h1 style={titleStyle}>Admin Bereich</h1>
      <p style={subtitleStyle}>
        Content Manager, Benutzer und Übersicht — dauerhaft von hier erreichbar.
      </p>

      <AdminNav activeTab={activeSection} onTabChange={setActiveSection} setActiveTab={setActiveTab} />

      {activeSection === "content" && (
        <ContentManager
          items={admin.items}
          form={admin.form}
          updateForm={admin.updateForm}
          resetForm={admin.resetForm}
          loadItem={admin.loadItem}
          saveItem={admin.saveItem}
          setItemStatus={admin.setItemStatus}
          deleteItem={admin.deleteItem}
          applyExtractionToForm={admin.applyExtractionToForm}
          approveSuggestionItem={admin.approveSuggestionItem}
          rejectSuggestionItem={admin.rejectSuggestionItem}
          editSuggestionItem={admin.editSuggestionItem}
          approveAllFields={admin.approveAllFields}
          approveAkademie={admin.approveAkademie}
          rejectAkademie={admin.rejectAkademie}
          updateAkademieEntry={admin.updateAkademieEntry}
        />
      )}

      {activeSection === "overview" && (
        <AdminOverviewPanel stats={admin.stats} onExport={admin.exportJson} onClearAll={admin.clearAll} />
      )}

      {activeSection === "users" && <AdminUsersPanel isActive={activeSection === "users"} />}
    </div>
  );
}

const pageStyle = {
  padding: "22px",
  paddingBottom: "100px",
  fontFamily: "system-ui, sans-serif",
  background: "#f8fafc",
  minHeight: "100vh",
};

const backBtnStyle = {
  border: "none",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: "700",
  cursor: "pointer",
  marginBottom: "18px",
};

const titleStyle = { margin: "0 0 8px", color: "#0f172a" };
const subtitleStyle = { color: "#64748b", lineHeight: 1.5, marginBottom: "18px" };
