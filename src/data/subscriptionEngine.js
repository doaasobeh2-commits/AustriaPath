// src/data/subscriptionEngine.js

function createLogItem(action, details = '') {
  return {
    date: new Date().toISOString(),
    action,
    details,
  };
}

function addActivity(user, action, details = '') {
  const item = createLogItem(action, details);

  return {
    ...user,
    activityLog: [item, ...(user.activityLog || [])],
  };
}

export function getPermissionsByPlan(type = 'free') {
  const free = {
    placementTest: false,
    aiExam: false,
    weeklyPlan: false,
    reports: false,
    writingAI: false,
    imageAI: false,
    speakingAI: false,
    readingAI: false,
    listeningAI: false,
  };

  if (type === 'placement_test') {
    return { ...free, placementTest: true, reports: true };
  }

  if (type === 'ai_exam') {
    return {
      ...free,
      aiExam: true,
      reports: true,
      writingAI: true,
      imageAI: true,
      speakingAI: true,
      readingAI: true,
      listeningAI: true,
    };
  }

  if (type === 'intensive_week' || type === 'premium_month') {
    return {
      placementTest: true,
      aiExam: true,
      weeklyPlan: true,
      reports: true,
      writingAI: true,
      imageAI: true,
      speakingAI: true,
      readingAI: true,
      listeningAI: true,
    };
  }

  return free;
}

export function addHistory(user, action, details = '') {
  const item = createLogItem(action, details);

  return {
    ...user,
    history: [item, ...(user.history || [])],
  };
}

export function grantPlan(user, type) {
  const now = new Date();
  const end = new Date(now);

  const examMap = {
    free: 0,
    placement_test: 1,
    ai_exam: 1,
    intensive_week: 3,
    premium_month: 5,
  };

  const creditMap = {
    free: 0,
    placement_test: 30,
    ai_exam: 50,
    intensive_week: 150,
    premium_month: 250,
  };

  if (type === 'intensive_week') end.setDate(end.getDate() + 7);
  if (type === 'premium_month') end.setDate(end.getDate() + 30);

  const nextUser = {
    ...user,
    subscription: {
      type,
      status: type === 'free' ? 'inactive' : 'active',
      remainingExams: examMap[type] || 0,
      startDate: type === 'free' ? null : now.toISOString(),
      endDate:
        type === 'intensive_week' || type === 'premium_month'
          ? end.toISOString()
          : null,
    },
    permissions: getPermissionsByPlan(type),
    aiCredits:
      type === 'free'
        ? 0
        : (user.aiCredits || 0) + (creditMap[type] || 0),
    usedAiCredits: user.usedAiCredits || 0,
  };

  const withHistory = addHistory(
    nextUser,
    type === 'free' ? 'Premium entfernt' : `${type} aktiviert`,
    `Credits: ${creditMap[type] || 0}, Prüfungen: ${examMap[type] || 0}`
  );

  return addActivity(
    withHistory,
    type === 'free' ? 'Plan geändert: Free' : `Plan geändert: ${type}`,
    `Credits: ${creditMap[type] || 0}, Prüfungen: ${examMap[type] || 0}`
  );
}

export function addCredits(user, amount) {
  const nextUser = {
    ...user,
    aiCredits: Math.max(0, (user.aiCredits || 0) + amount),
    usedAiCredits: user.usedAiCredits || 0,
  };

  const withHistory = addHistory(
    nextUser,
    `${amount > 0 ? '+' : ''}${amount} AI Credits`
  );

  return addActivity(
    withHistory,
    `${amount > 0 ? '+' : ''}${amount} AI Credits hinzugefügt`
  );
}

export function resetCredits(user) {
  const nextUser = {
    ...user,
    aiCredits: 0,
    usedAiCredits: 0,
  };

  const withHistory = addHistory(nextUser, 'AI Credits zurückgesetzt');

  return addActivity(withHistory, 'AI Credits zurückgesetzt');
}

export function consumeAiCredits(user, amount = 50, reason = 'AI Nutzung') {
  const available = Math.max(
    0,
    (user.aiCredits || 0) - (user.usedAiCredits || 0)
  );

  if (available < amount) {
    return {
      user,
      ok: false,
      message: 'Nicht genug AI Credits.',
    };
  }

  const nextUser = {
    ...user,
    usedAiCredits: (user.usedAiCredits || 0) + amount,
  };

  const withHistory = addHistory(
    nextUser,
    `${reason}: -${amount} Credits`
  );

  return {
    user: addActivity(
      withHistory,
      `${amount} AI Credits verbraucht`,
      reason
    ),
    ok: true,
  };
}