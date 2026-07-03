import React from "react";
import "./AdminActionBar.css";

const VARIANT_CLASS = {
  green: "admin-action-btn--green",
  blue: "admin-action-btn--blue",
  orange: "admin-action-btn--orange",
  red: "admin-action-btn--red",
  neutral: "admin-action-btn--neutral",
  "outline-blue": "admin-action-btn--outline-blue",
  "outline-green": "admin-action-btn--outline-green",
  "outline-orange": "admin-action-btn--outline-orange",
  "outline-red": "admin-action-btn--outline-red",
};

export default function AdminActionBar({
  actions = [],
  processingAction = null,
  title = null,
  inset = false,
  wide = false,
}) {
  const barClass = ["admin-action-bar", wide ? "admin-action-bar--wide" : ""]
    .filter(Boolean)
    .join(" ");

  const panelClass = [
    "admin-action-panel",
    inset ? "admin-action-panel--inset" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div className={barClass}>
      {actions.map((action) => {
        const isProcessing = processingAction === action.id;
        const isDisabled = Boolean(processingAction) || action.disabled;

        return (
          <button
            key={action.id}
            type="button"
            className={`admin-action-btn ${
              VARIANT_CLASS[action.variant] || VARIANT_CLASS.neutral
            }`}
            disabled={isDisabled}
            onClick={action.onClick}
          >
            <span className="admin-action-btn__icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="admin-action-btn__label">
              {isProcessing ? `${action.label}…` : action.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (!title && !inset) {
    return content;
  }

  return (
    <div className={panelClass}>
      {title ? <p className="admin-action-panel__title">{title}</p> : null}
      {content}
    </div>
  );
}
