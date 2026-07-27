export const weeklyPageStyle = {
  padding: '16px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  paddingBottom: '100px',
  maxWidth: '430px',
  margin: '0 auto',
  boxSizing: 'border-box',
  color: '#0f172a',
};

export const weeklyBackButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: '700',
  marginBottom: '14px',
  cursor: 'pointer',
  padding: 0,
};

export const weeklyHeroStyle = {
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: 'white',
  padding: '20px',
  borderRadius: '22px',
  marginBottom: '16px',
};

export const weeklyCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
};

export const weeklyEmphasisCardStyle = {
  ...weeklyCardStyle,
  border: '2px solid #2563eb',
  boxShadow: '0 10px 24px rgba(37, 99, 235, 0.12)',
};

export const weeklySectionTitleStyle = {
  marginTop: 0,
  marginBottom: '10px',
  fontSize: '20px',
  color: '#0f172a',
};

export const weeklyMutedStyle = {
  color: '#64748b',
  lineHeight: 1.6,
  margin: '4px 0',
};

export const weeklyPrimaryButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '14px',
  fontWeight: '800',
  fontSize: '16px',
  cursor: 'pointer',
  minHeight: '48px',
};

export const weeklySecondaryButtonStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  padding: '12px',
  borderRadius: '14px',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
  minHeight: '44px',
  marginTop: '8px',
};

export const weeklyGhostButtonStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  color: '#2563eb',
  padding: '10px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '14px',
  cursor: 'pointer',
  minHeight: '44px',
};

export const weeklyTipStyle = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  borderRadius: '14px',
  padding: '12px',
  fontWeight: '600',
  lineHeight: 1.5,
  marginTop: '8px',
};

export const weeklySuccessPanelStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '14px',
  border: '1px solid #bbf7d0',
};

export const weeklyBadgeOpenStyle = {
  display: 'inline-block',
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '4px 10px',
  borderRadius: '999px',
  fontWeight: '700',
  fontSize: '12px',
};

export const weeklyBadgeRunningStyle = {
  display: 'inline-block',
  backgroundColor: '#ede9fe',
  color: '#7c3aed',
  padding: '4px 10px',
  borderRadius: '999px',
  fontWeight: '700',
  fontSize: '12px',
};

export const weeklyBadgeDoneStyle = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '4px 10px',
  borderRadius: '999px',
  fontWeight: '700',
  fontSize: '12px',
};

export const weeklyPlanStripStyle = {
  display: 'flex',
  gap: '6px',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

export const weeklyProgressBarTrackStyle = {
  height: '10px',
  backgroundColor: '#e5e7eb',
  borderRadius: '10px',
  overflow: 'hidden',
  marginTop: '10px',
};

export const weeklyProgressBarFillStyle = {
  height: '100%',
  backgroundColor: '#2563eb',
  borderRadius: '10px',
  transition: 'width 0.45s ease',
};

export function weeklyClickableCardStyle(disabled = false) {
  return {
    ...weeklyCardStyle,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  };
}

export const weeklyTextareaStyle = {
  width: '100%',
  minHeight: '120px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  padding: '12px',
  fontSize: '15px',
  lineHeight: 1.5,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  resize: 'vertical',
};

export const weeklyInputStyle = {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  fontSize: '15px',
  boxSizing: 'border-box',
};

export const weeklyQuestionBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '12px',
  marginTop: '10px',
};

export const weeklyTextBoxStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '12px',
  lineHeight: 1.6,
  marginBottom: '10px',
  whiteSpace: 'pre-wrap',
};

export const weeklyAudioButtonStyle = {
  width: '100%',
  border: '1px solid #bfdbfe',
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
  marginBottom: '10px',
};

export const weeklyRecordButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '15px',
  cursor: 'pointer',
};

export const weeklyStopButtonStyle = {
  ...weeklyRecordButtonStyle,
  backgroundColor: '#334155',
};

export const weeklyFeedbackSuccessStyle = {
  color: '#166534',
  backgroundColor: '#ecfdf5',
  borderRadius: '10px',
  padding: '10px 12px',
  marginTop: '8px',
};

export const weeklyFeedbackPartialStyle = {
  color: '#92400e',
  backgroundColor: '#fffbeb',
  borderRadius: '10px',
  padding: '10px 12px',
  marginTop: '8px',
};

export const weeklyFeedbackRetryStyle = {
  color: '#9a3412',
  backgroundColor: '#fff7ed',
  borderRadius: '10px',
  padding: '10px 12px',
  marginTop: '8px',
};

export const weeklyDotsRowStyle = {
  display: 'flex',
  gap: '6px',
  marginTop: '8px',
};

export function weeklyDotStyle(filled) {
  return {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: filled ? '#2563eb' : '#e5e7eb',
  };
}
