import React, { useState } from "react";
import { LEGAL_VERSIONS } from "../../legal/legalVersions";
import {
  authCardStyle,
  authCheckboxStyle,
  authPageStyle,
  authPrimaryButtonStyle,
  authSubtitleStyle,
  authTitleStyle,
} from "../auth/authStyles";
import LegalLinks from "../components/LegalLinks";

export default function LegalConsentScreen({ onAccept, onOpenLegal }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) {
      alert("Bitte bestätigen Sie Datenschutz und AGB.");
      return;
    }
    onAccept();
  };

  return (
    <div style={authPageStyle}>
      <div style={authCardStyle}>
        <h1 style={authTitleStyle}>Datenschutz & Nutzungsbedingungen</h1>
        <p style={authSubtitleStyle}>
          Bevor Sie AustriaPath nutzen, lesen Sie bitte unsere Datenschutzerklärung
          und Allgemeinen Geschäftsbedingungen. Wir speichern nur den Zeitpunkt
          Ihrer Zustimmung und die Version der Dokumente.
        </p>

        <div style={versionBoxStyle}>
          <p style={versionLineStyle}>
            Datenschutz Version: <strong>{LEGAL_VERSIONS.privacy}</strong>
          </p>
          <p style={versionLineStyle}>
            AGB Version: <strong>{LEGAL_VERSIONS.terms}</strong>
          </p>
        </div>

        <label style={authCheckboxStyle}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            Ich habe die{" "}
            <button
              type="button"
              style={inlineLinkStyle}
              onClick={() => onOpenLegal("datenschutz")}
            >
              Datenschutzerklärung
            </button>{" "}
            und die{" "}
            <button
              type="button"
              style={inlineLinkStyle}
              onClick={() => onOpenLegal("agb")}
            >
              AGB
            </button>{" "}
            gelesen und akzeptiere sie.
          </span>
        </label>

        <button type="button" onClick={handleAccept} style={authPrimaryButtonStyle}>
          Zustimmen und fortfahren
        </button>

        <LegalLinks onOpenLegal={onOpenLegal} />
      </div>
    </div>
  );
}

const versionBoxStyle = {
  backgroundColor: "#f1f5f9",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "14px",
  marginBottom: "8px",
};

const versionLineStyle = {
  margin: "0 0 6px",
  fontSize: "13px",
  color: "#475569",
};

const inlineLinkStyle = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontWeight: "700",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  fontSize: "inherit",
};
