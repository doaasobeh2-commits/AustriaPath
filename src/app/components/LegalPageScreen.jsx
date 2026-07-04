import React from "react";
import { LEGAL_PAGES } from "../../legal/legalContent";

export default function LegalPageScreen({ pageId, onBack }) {
  const page = LEGAL_PAGES[pageId];

  if (!page) {
    return (
      <div style={pageStyle}>
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← Zurück
        </button>
        <p>Seite nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button type="button" onClick={onBack} style={backButtonStyle}>
        ← Zurück
      </button>

      <header style={headerStyle}>
        <h1 style={titleStyle}>{page.title}</h1>
        {page.subtitle && <p style={subtitleStyle}>{page.subtitle}</p>}
      </header>

      <div style={contentStyle}>
        {page.sections.map((section) => (
          <section key={section.heading} style={sectionStyle}>
            <h2 style={headingStyle}>{section.heading}</h2>
            {section.body.split("\n").map((line, index) => (
              <p key={`${section.heading}-${index}`} style={paragraphStyle}>
                {line}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  padding: "24px",
  paddingBottom: "48px",
  fontFamily: "system-ui, sans-serif",
  boxSizing: "border-box",
  maxWidth: "720px",
  margin: "0 auto",
};

const backButtonStyle = {
  border: "none",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  padding: "10px 16px",
  borderRadius: "999px",
  fontWeight: "700",
  cursor: "pointer",
  marginBottom: "20px",
};

const headerStyle = {
  marginBottom: "24px",
};

const titleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "28px",
};

const subtitleStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.5,
};

const contentStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  padding: "24px",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
};

const sectionStyle = {
  marginBottom: "24px",
};

const headingStyle = {
  margin: "0 0 10px",
  color: "#1e293b",
  fontSize: "17px",
};

const paragraphStyle = {
  margin: "0 0 8px",
  color: "#475569",
  lineHeight: 1.65,
  fontSize: "15px",
};
