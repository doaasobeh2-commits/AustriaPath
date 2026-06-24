export const placementStages = [
  'selbstvorstellung',
  'bildbeschreibung',
  'lesenHoeren',
  'planung',
];

export const placementWeights = {
  selbstvorstellung: 25,
  bildbeschreibung: 25,
  lesenHoeren: 20,
  planung: 30,
};

export function getImageStepAfterSelfIntro(selfIntroResult) {
  if (selfIntroResult === 'schwach') {
    return {
      skill: 'bildbeschreibung',
      level: 'A2',
      difficulty: 'mittel',
      reason: 'Selbstvorstellung schwach → A2 Bildbeschreibung mittel',
    };
  }

  if (selfIntroResult === 'mittel') {
    return {
      skill: 'bildbeschreibung',
      level: 'A2',
      difficulty: 'mittel',
      reason: 'Selbstvorstellung mittel → A2 Bildbeschreibung mittel',
    };
  }

  if (selfIntroResult === 'stark') {
    return {
      skill: 'bildbeschreibung',
      level: 'B1',
      difficulty: 'leicht',
      internalLevel: 'A2+/B1-',
      reason: 'Selbstvorstellung stark → Übergang zu B1 Bildbeschreibung leicht',
    };
  }

  return {
    skill: 'bildbeschreibung',
    level: 'A2',
    difficulty: 'leicht',
    reason: 'Standardstart',
  };
}

export function getReadingListeningStep(selfIntroResult, imageResult) {
  if (selfIntroResult === 'schwach' && imageResult === 'mittel') {
    return {
      skill: 'lesenHoeren',
      level: 'A2',
      difficulty: 'stark',
      internalLevel: 'A2+',
      reason: 'Selbstvorstellung schwach, Bild mittel → A2 Lesen/Hören stark',
    };
  }

  if (selfIntroResult === 'mittel' && imageResult === 'mittel') {
    return {
      skill: 'lesenHoeren',
      level: 'A2',
      difficulty: 'stark',
      internalLevel: 'A2+',
      reason: 'A2 stabil → Lesen/Hören stärker testen',
    };
  }

  if (selfIntroResult === 'stark' && imageResult !== 'schwach') {
    return {
      skill: 'lesenHoeren',
      level: 'B1',
      difficulty: 'leicht',
      internalLevel: 'B1-',
      reason: 'Starke mündliche Leistung → B1 Lesen/Hören leicht',
    };
  }

  return {
    skill: 'lesenHoeren',
    level: 'A2',
    difficulty: 'mittel',
    reason: 'Standard A2 Lesen/Hören',
  };
}

export function getPlanningStep(results) {
  const { selfIntroResult, imageResult, lesenHoerenResult } = results;

  if (
    selfIntroResult === 'stark' &&
    imageResult !== 'schwach' &&
    lesenHoerenResult !== 'schwach'
  ) {
    return {
      skill: 'planung',
      level: 'B1',
      difficulty: 'leicht',
      internalLevel: 'B1-',
      reason: 'Bereit für B1 Planung leicht',
    };
  }

  if (selfIntroResult === 'schwach' && imageResult === 'mittel') {
    return {
      skill: 'planung',
      level: 'A2',
      difficulty: 'stark',
      internalLevel: 'A2+',
      reason: 'Mündlich uneinheitlich → A2 Planung stark',
    };
  }

  return {
    skill: 'planung',
    level: 'A2',
    difficulty: 'mittel',
    reason: 'Standard A2 Planung mittel',
  };
}

export function calculatePlacementScore(scores) {
  const selfIntro = scores.selbstvorstellung || 0;
  const image = scores.bildbeschreibung || 0;
  const lesenHoeren = scores.lesenHoeren || 0;
  const planung = scores.planung || 0;

  return Math.round(
    selfIntro * 0.25 +
    image * 0.25 +
    lesenHoeren * 0.20 +
    planung * 0.30
  );
}

export function getFinalInternalLevel(score) {
  if (score < 40) return 'A2';
  if (score < 60) return 'A2+';
  if (score < 75) return 'B1-';
  if (score < 88) return 'B1';
  if (score < 95) return 'B1+';
  return 'B2-';
}