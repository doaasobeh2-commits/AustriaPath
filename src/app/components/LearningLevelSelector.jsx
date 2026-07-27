import React from 'react';
import { getCurrentUser } from '../userAccess.js';
import {
  canAccessAllLearningLevels,
  getAccessibleLearningLevels,
  LEARNING_LEVELS,
} from '../../utils/learningLevelAccess.js';

const defaultInputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
};

/**
 * Level selector — enabled for admin (all levels), disabled for learners (single level).
 */
export function LearningLevelSelector({
  level,
  onChange,
  inputStyle = defaultInputStyle,
  label,
}) {
  const user = getCurrentUser();
  const canSwitch = canAccessAllLearningLevels(user);
  const options = canSwitch ? [...LEARNING_LEVELS] : getAccessibleLearningLevels(user);
  const displayLevel = options.includes(level) ? level : options[0];

  return (
    <div>
      {label && (
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>
          {label}
        </label>
      )}
      <select
        style={{
          ...inputStyle,
          ...(canSwitch ? {} : { backgroundColor: '#f8fafc', color: '#64748b' }),
        }}
        value={displayLevel}
        onChange={(e) => onChange(e.target.value)}
        disabled={!canSwitch}
        aria-label="Sprachniveau"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {canSwitch && (
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
          Admin-Vorschau: Niveauwechsel gilt nur für diese Sitzung und ändert nicht Ihr Kontoniveau.
        </p>
      )}
    </div>
  );
}
