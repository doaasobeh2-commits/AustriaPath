import React, { useState } from "react";
import AdminActionBar from "./AdminActionBar";

export default function UserAccessCard({
  user,
  onBlock,
  onAddCredits,
  onResetCredits,
}) {
  const [processingAction, setProcessingAction] = useState(null);
  const status = user.status === "blocked" ? "blocked" : "approved";
  const credits =
    typeof user.aiCredits === "number" ? user.aiCredits : 5;

  const runAction = (actionId, fn) => {
    if (processingAction) return;

    setProcessingAction(actionId);
    try {
      fn();
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div
      style={{
        marginTop: "12px",
        padding: "12px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <p style={{ margin: 0 }}>
        <strong>Status:</strong>{" "}
        {status === "blocked" ? "Gesperrt" : "Aktiv"}
      </p>

      <p style={{ margin: "6px 0" }}>
        <strong>AI Credits:</strong> {credits}
      </p>

      <AdminActionBar
        processingAction={processingAction}
        actions={[
          {
            id: "block",
            icon: "🚫",
            label: "Block",
            variant: "neutral",
            onClick: () => runAction("block", () => onBlock(user.id)),
          },
          {
            id: "add-credits",
            icon: "➕",
            label: "+5 AI Credits",
            variant: "blue",
            onClick: () =>
              runAction("add-credits", () => onAddCredits(user.id, 5)),
          },
          {
            id: "reset-credits",
            icon: "🔄",
            label: "Reset Credits",
            variant: "outline-red",
            onClick: () =>
              runAction("reset-credits", () => onResetCredits(user.id)),
          },
        ]}
      />
    </div>
  );
}
