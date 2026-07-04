import React from "react";

const LINKS = [
  { id: "impressum", label: "Impressum" },
  { id: "datenschutz", label: "Datenschutz" },
  { id: "agb", label: "AGB" },
  { id: "kontakt", label: "Kontakt" },
  { id: "cookies", label: "Cookies" },
  { id: "aiDisclaimer", label: "AI-Hinweis" },
  { id: "aiPrivacy", label: "AI-Datenschutz" },
];

export default function LegalLinks({ onOpenLegal, compact = false }) {
  if (!onOpenLegal) return null;

  return (
    <nav
      style={compact ? compactNavStyle : navStyle}
      aria-label="Rechtliche Informationen"
    >
      {LINKS.map((link, index) => (
        <React.Fragment key={link.id}>
          {index > 0 && <span style={separatorStyle}>·</span>}
          <button
            type="button"
            onClick={() => onOpenLegal(link.id)}
            style={linkButtonStyle}
          >
            {link.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

const navStyle = {
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 4px",
  justifyContent: "center",
  alignItems: "center",
};

const compactNavStyle = {
  ...navStyle,
  marginTop: "12px",
  paddingTop: "12px",
};

const linkButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  padding: "2px 4px",
  textDecoration: "underline",
};

const separatorStyle = {
  color: "#cbd5e1",
  fontSize: "12px",
};
