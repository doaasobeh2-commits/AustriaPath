import React from "react";

export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  badge = null,
  children,
}) {
  return (
    <details open={defaultOpen} style={sectionStyle}>
      <summary style={summaryStyle}>
        <span>
          {title}
          {badge != null && <span style={badgeStyle}>{badge}</span>}
        </span>
        {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
      </summary>
      <div style={bodyStyle}>{children}</div>
    </details>
  );
}

const sectionStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  marginBottom: "14px",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  overflow: "hidden",
};

const summaryStyle = {
  cursor: "pointer",
  padding: "16px 18px",
  fontWeight: 800,
  color: "#0f172a",
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const subtitleStyle = {
  fontWeight: 600,
  fontSize: "13px",
  color: "#64748b",
};

const badgeStyle = {
  marginLeft: "8px",
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "2px 8px",
  borderRadius: "999px",
  fontSize: "12px",
};

const bodyStyle = {
  padding: "0 18px 18px",
  borderTop: "1px solid #f1f5f9",
};
