import { useEffect, useState } from 'react';
import { getCurrentUser } from '../userAccess.js';
import {
  canAccessAllLearningLevels,
  getAccessibleLearningLevels,
  readAdminSessionLearningLevel,
  resolveActiveLearningLevel,
  writeAdminSessionLearningLevel,
} from '../../utils/learningLevelAccess.js';
import { getUserLevel } from '../../utils/userPreferences.js';

/**
 * Screen-local learning level with admin-wide switching (session-only, no profile write).
 */
export function useAdminLearningLevel({
  selectedLevel,
  setSelectedLevel,
  navigationLevel,
} = {}) {
  const user = getCurrentUser();
  const canSwitchLevel = canAccessAllLearningLevels(user);
  const storedLevel = getUserLevel();

  const [level, setLevel] = useState(() =>
    resolveActiveLearningLevel({
      user,
      selectedLevel,
      storedLevel,
      navigationLevel,
    })
  );

  useEffect(() => {
    const external = selectedLevel || navigationLevel;
    if (!external) return;
    setLevel(
      resolveActiveLearningLevel({
        user,
        selectedLevel: external,
        storedLevel,
      })
    );
  }, [selectedLevel, navigationLevel, user, storedLevel]);

  const changeLevel = (nextLevel) => {
    const allowed = getAccessibleLearningLevels(user);
    if (!allowed.includes(nextLevel)) return;
    setLevel(nextLevel);
    if (canSwitchLevel) {
      writeAdminSessionLearningLevel(nextLevel);
      setSelectedLevel?.(nextLevel);
    }
  };

  return {
    level,
    setLevel: changeLevel,
    canSwitchLevel,
    accessibleLevels: getAccessibleLearningLevels(user),
    storedLevel,
    sessionLevel: readAdminSessionLearningLevel(),
  };
}
