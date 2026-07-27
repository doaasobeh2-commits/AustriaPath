/**
 * Training memory builders — stored per exercise, corrected only in the Final Daily Report.
 * @module data/utils/weeklyPlanTrainingMemory
 */

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export function buildSchreibenTrainingMemory(exercise, task) {
  return {
    category: 'schreiben',
    modelId: task?.id || exercise?.taskId || null,
    sessionId: exercise?.b1AiSessionId || null,
    selectedEmailIndex: exercise?.selectedEmailIndex || task?.selectedEmailIndex || null,
    writingSnapshot: exercise?.b1WritingSnapshot || null,
    originalEmail: String(exercise?.learnerResponse || ''),
    requiredPoints: exercise?.b1WritingSnapshot?.requiredPoints || [],
    submittedAt: exercise?.submittedAt || null,
  };
}

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export function buildHoerenTrainingMemory(exercise, task) {
  const correctAnswers = {};
  (task?.parts || []).forEach((part) => {
    (part.questions || []).forEach((question) => {
      correctAnswers[String(question.id)] = String(question.answer || '').trim();
    });
  });

  return {
    category: 'hoeren',
    modelId: task?.id || exercise?.taskId || null,
    sessionId: exercise?.b1AiSessionId || null,
    selectedAnswers: { ...(exercise?.selectedAnswers || {}) },
    correctAnswers,
    clipProgress: exercise?.b1HoerenClipProgress || null,
    submittedAt: exercise?.submittedAt || null,
  };
}

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export function buildBildbeschreibungTrainingMemory(exercise, task) {
  const state = exercise?.b1InteractiveState || {};
  const dialogue = Array.isArray(state.dialogue) ? state.dialogue : [];

  return {
    category: 'bildbeschreibung',
    modelId: task?.id || exercise?.taskId || null,
    sessionId: exercise?.b1AiSessionId || null,
    imageId: task?.imageId || exercise?.b1TaskSnapshot?.imageId || null,
    transcript: String(exercise?.learnerResponse || '').trim(),
    aiDialogue: dialogue,
    coveredPoints: state.coveredPoints || exercise?.trainingMemory?.coveredPoints || [],
    missingPoints: state.missingPoints || exercise?.trainingMemory?.missingPoints || [],
    submittedAt: exercise?.submittedAt || null,
  };
}

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export function buildSpeakingTrainingMemory(exercise, task, category) {
  const state = exercise?.b1InteractiveState || {};
  const dialogue = Array.isArray(state.dialogue) ? state.dialogue : [];

  return {
    category,
    modelId: task?.id || exercise?.taskId || null,
    sessionId: exercise?.b1AiSessionId || null,
    transcript: String(exercise?.learnerResponse || '').trim(),
    aiDialogue: dialogue,
    coveredPoints: state.coveredPoints || exercise?.trainingMemory?.coveredPoints || [],
    missingPoints: state.missingPoints || exercise?.trainingMemory?.missingPoints || [],
    learnerResponse: String(exercise?.learnerResponse || ''),
    speakingSubmitted: Boolean(exercise?.speakingSubmitted),
    submittedAt: exercise?.submittedAt || null,
  };
}

/**
 * @param {object} exercise
 * @param {object} [task]
 */
export function buildExerciseTrainingMemory(exercise, task) {
  const category = exercise?.b1Category || task?.b1Category;
  if (category === 'schreiben' || task?.isB1WeeklyPlanSchreibenTask) {
    return buildSchreibenTrainingMemory(exercise, task);
  }
  if (category === 'hoeren' || task?.isB1WeeklyPlanHoerenTask) {
    return buildHoerenTrainingMemory(exercise, task);
  }
  if (category === 'bildbeschreibung') {
    if (task?.isB1WeeklyPlanBildbeschreibungTask || exercise?.b1Category === 'bildbeschreibung') {
      return buildBildbeschreibungTrainingMemory(exercise, task);
    }
    return buildSpeakingTrainingMemory(exercise, task, 'bildbeschreibung');
  }
  if (category === 'planung') {
    if (task?.isB1WeeklyPlanPlanungTask || exercise?.b1Category === 'planung') {
      return buildSpeakingTrainingMemory(exercise, task, 'planung');
    }
    return buildSpeakingTrainingMemory(exercise, task, 'planung');
  }
  if (category === 'selbstvorstellung') {
    if (task?.isB1WeeklyPlanSelbstvorstellungTask || exercise?.b1Category === 'selbstvorstellung') {
      return buildSpeakingTrainingMemory(exercise, task, 'selbstvorstellung');
    }
    return buildSpeakingTrainingMemory(exercise, task, 'selbstvorstellung');
  }
  return {
    category: category || exercise?.coachType || 'unknown',
    modelId: task?.id || exercise?.taskId || null,
    learnerResponse: exercise?.learnerResponse || '',
    selectedAnswers: exercise?.selectedAnswers || {},
    submittedAt: exercise?.submittedAt || null,
  };
}
