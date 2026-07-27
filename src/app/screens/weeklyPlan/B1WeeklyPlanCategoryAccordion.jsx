import React from 'react';
import {
  weeklyCardStyle,
  weeklyMutedStyle,
  weeklySectionTitleStyle,
} from './weeklyPlanStyles.js';

const headerButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '14px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
};

const counterStyle = {
  fontSize: '13px',
  fontWeight: 800,
  color: '#475569',
  whiteSpace: 'nowrap',
};

/**
 * @param {{
 *   icon: string,
 *   title: string,
 *   counterLabel?: string,
 *   expanded: boolean,
 *   onToggle: () => void,
 *   children?: React.ReactNode,
 * }} props
 */
export function B1WeeklyPlanCategoryAccordion({
  icon,
  title,
  counterLabel,
  expanded,
  onToggle,
  children,
}) {
  return (
    <div style={weeklyCardStyle}>
      <button type="button" onClick={onToggle} style={headerButtonStyle} aria-expanded={expanded}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }} aria-hidden="true">
            {icon}
          </span>
          <span style={{ ...weeklySectionTitleStyle, margin: 0 }}>{title}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {counterLabel ? <span style={counterStyle}>{counterLabel}</span> : null}
          <span style={{ fontSize: '18px', color: '#64748b' }} aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
        </span>
      </button>
      {expanded ? <div style={{ padding: '0 16px 16px' }}>{children}</div> : null}
    </div>
  );
}

const selbstvorstellungItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  lineHeight: 1.6,
  color: '#334155',
  marginBottom: '8px',
};

export function B1SelbstvorstellungInfoPanel() {
  const items = [
    'Pflichtübung',
    'KI-Prüfer',
    '3× pro Woche',
    'Automatisch im Wochenplan enthalten',
  ];

  return (
    <div>
      {items.map((item) => (
        <div key={item} style={selbstvorstellungItemStyle}>
          <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
          <span>{item}</span>
        </div>
      ))}
      <p style={{ ...weeklyMutedStyle, margin: '12px 0 0' }}>
        Du musst keine Modelle auswählen — die Übung wird an Tag 1, 4 und 7 eingeplant.
      </p>
    </div>
  );
}
