import React from 'react';
import { ADMIN_QA_BADGE_LABEL, isAdminQaMode } from '../../../utils/adminQaMode.js';

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  border: '1px solid #fcd34d',
  borderRadius: '999px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: '12px',
};

export function AdminQaBadge() {
  if (!isAdminQaMode()) return null;

  return <div style={badgeStyle}>{ADMIN_QA_BADGE_LABEL}</div>;
}
