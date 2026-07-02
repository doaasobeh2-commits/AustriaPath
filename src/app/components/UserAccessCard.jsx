import React from "react";

export default function UserAccessCard({
  user,
  onApprove,
  onBlock,
  onAddCredits,
  onResetCredits,
}) {
  const status = user.status || "pending";
  const credits =
    typeof user.aiCredits === "number" ? user.aiCredits : 5;

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
        <strong>Status:</strong> {status}
      </p>

      <p style={{ margin: "6px 0" }}>
        <strong>AI Credits:</strong> {credits}
      </p>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "10px",
        }}
      >
        <button onClick={() => onApprove(user.id)}>
          Approve
        </button>

        <button onClick={() => onBlock(user.id)}>
          Block
        </button>

        <button onClick={() => onAddCredits(user.id, 5)}>
          +5 AI Credits
        </button>

        <button onClick={() => onResetCredits(user.id)}>
          Reset Credits
        </button>
      </div>
    </div>
  );
}