import React from 'react';
import {
  weeklyCardStyle,
  weeklyMutedStyle,
  weeklySectionTitleStyle,
} from './weeklyPlanStyles.js';

/**
 * @param {{
 *   choices: Array<{ level: string, status: string, selectable: boolean, label: string, recommended?: boolean }>,
 *   selectedLevel: string,
 *   onSelect: (level: string) => void,
 *   onComingSoonClick?: () => void,
 *   placementRaw?: string|null,
 *   importedFocus?: string[],
 * }} props
 */
export function WeeklyPlanLevelSelector({
  choices,
  selectedLevel,
  onSelect,
  onComingSoonClick,
  placementRaw,
  importedFocus = [],
}) {
  const hasPlacement = Boolean(placementRaw);

  return (
    <div style={weeklyCardStyle}>
      <h2 style={weeklySectionTitleStyle}>1. Dein Trainingsniveau</h2>
      {hasPlacement && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            padding: '14px',
            borderRadius: '14px',
            fontWeight: 600,
            marginBottom: '14px',
            lineHeight: 1.6,
          }}
        >
          Einstufungstest: Niveau <strong>{placementRaw}</strong> wird empfohlen. Du kannst ein
          anderes verfügbares Trainingsniveau wählen.
        </div>
      )}
      {!hasPlacement && (
        <p style={weeklyMutedStyle}>
          Wähle dein Trainingsniveau. A2 ist der sichere Standard, wenn kein Einstufungstest
          vorliegt.
        </p>
      )}
      <div style={{ display: 'grid', gap: '10px' }}>
        {choices.map((choice) => {
          const active = selectedLevel === choice.level;
          const isComingSoon = choice.status === 'coming_soon';

          return (
            <button
              key={choice.level}
              type="button"
              disabled={!choice.selectable && !isComingSoon}
              onClick={() => {
                if (isComingSoon) {
                  onComingSoonClick?.();
                  return;
                }
                if (choice.selectable) onSelect(choice.level);
              }}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: '14px',
                border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                backgroundColor: active ? '#eff6ff' : isComingSoon ? '#f8fafc' : '#ffffff',
                cursor: choice.selectable || isComingSoon ? 'pointer' : 'not-allowed',
                opacity: choice.selectable || isComingSoon ? 1 : 0.55,
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{choice.label}</div>
              {choice.recommended && (
                <div style={{ fontSize: '13px', color: '#1d4ed8', marginTop: '4px' }}>
                  Empfohlen nach Einstufungstest
                </div>
              )}
              {isComingSoon && (
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Coming Soon
                </div>
              )}
            </button>
          );
        })}
      </div>
      {hasPlacement && importedFocus.length > 0 && (
        <p style={{ ...weeklyMutedStyle, marginTop: '12px', marginBottom: 0 }}>
          Schwerpunkte aus dem Test werden als Fokusinformation übernommen (keine Pflichtauswahl).
        </p>
      )}
    </div>
  );
}
