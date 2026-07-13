import React from "react";
import { ADMIN_EMAIL } from "../../config/authConfig";
import {
  authCardStyle,
  authPageStyle,
  authPrimaryButtonStyle,
  authSubtitleStyle,
  authTextButtonStyle,
  authTitleStyle,
} from "../auth/authStyles";

export default function TrialExpiredScreen({ onSignOut }) {
  const contactHref = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    "AustriaPath Access Request"
  )}&body=${encodeURIComponent(
    "Hello,\n\nMy 48-hour trial has ended and I would like to request continued access.\n\nThank you."
  )}`;

  return (
    <div style={authPageStyle}>
      <div style={authCardStyle}>
        <h1 style={authTitleStyle}>Trial expired</h1>
        <p style={authSubtitleStyle}>
          Your 48-hour trial has ended.
          <br />
          Please contact the administrator if you need continued access.
        </p>

        <button type="button" onClick={onSignOut} style={authPrimaryButtonStyle}>
          Sign Out
        </button>

        <a href={contactHref} style={linkButtonStyle}>
          Contact Administrator
        </a>
      </div>
    </div>
  );
}

const linkButtonStyle = {
  ...authTextButtonStyle,
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  marginTop: 12,
};
