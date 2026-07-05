import React, { useEffect, useState } from "react";
import { getAIErrorLog } from "../../ai/examinerMind/learning/errorLearningEngine";
import {
  loadLabDashboard,
  submitLabReview,
} from "../../exam-platform/adapters/labBridge.js";

export default function ExaminerLabScreen({ setActiveTab }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;
    loadLabDashboard().then((data) => {
      if (active) setDashboard(data);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const telemetryErrors = getAIErrorLog();

  const handleAction = async (labItemId, action, ruleText) => {
    try {
      const result = await submitLabReview({
        labItemId,
        action,
        reviewerId: "admin",
        rationale: `Lab review: ${action}`,
        ruleProposal:
          action === "propose_rule"
            ? {
                ruleText:
                  ruleText ||
                  "Bei widersprüchlichen Bewertungen ist Aufgabenerfüllung stärker zu gewichten.",
                skill: "writing",
                level: "B1",
                patchType: "append_scoring_rule",
              }
            : undefined,
      });
      setMessage(
        action === "propose_rule" && result.promotedRule
          ? `Regel promoted (Registry ${result.promotedRule.id}).`
          : `Fall ${action} abgeschlossen.`
      );
      setRefreshKey((k) => k + 1);
    } catch (error) {
      setMessage(error.message || "Aktion fehlgeschlagen.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {setActiveTab && (
        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          style={backButtonStyle}
        >
          ← Zurück zum Admin
        </button>
      )}

      <h2>🧠 Examiner Lab</h2>

      <p>
        High-value Fälle (Platform Queue): <b>{dashboard?.pendingCount ?? 0}</b> · Registry:{" "}
        <b>{dashboard?.registryVersion ?? "…"}</b> · Promoted Rules:{" "}
        <b>{dashboard?.promotedRulesCount ?? 0}</b>
      </p>

      <p style={{ color: "#64748b", fontSize: 14 }}>
        Interne Telemetrie (nicht Lab Queue): {telemetryErrors.length} Einträge
      </p>

      {message && (
        <p style={{ background: "#ecfdf5", padding: 12, borderRadius: 12 }}>{message}</p>
      )}

      {(!dashboard?.pendingCases || dashboard.pendingCases.length === 0) && (
        <p>Keine ausstehenden Lab-Fälle. Es werden nur selektierte Fälle enqueued (~1/Woche).</p>
      )}

      {(dashboard?.pendingCases || []).map((item, index) => (
        <div
          key={item.labItemId}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h4>
            Fall #{index + 1} · {item.classification || "review"}
          </h4>

          <p>Report: {item.reportId}</p>
          <p>Score: {item.summary?.score}</p>
          <p>Confidence: {item.summary?.confidence}%</p>
          <p>Warnings: {item.summary?.warnings || 0}</p>
          <p>Conflicts: {item.summary?.conflicts || 0}</p>

          <button onClick={() => handleAction(item.labItemId, "correct")}>✅ Correct</button>

          <button style={{ marginLeft: 10 }} onClick={() => handleAction(item.labItemId, "reject")}>
            ❌ Wrong
          </button>

          <button
            style={{ marginLeft: 10 }}
            onClick={() => handleAction(item.labItemId, "propose_rule")}
          >
            ➕ Neue Regel
          </button>
        </div>
      ))}
    </div>
  );
}

const backButtonStyle = {
  border: "none",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: "700",
  cursor: "pointer",
  marginBottom: "18px",
};
