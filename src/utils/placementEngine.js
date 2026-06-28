export function buildPlacementProfile(aiEvaluation = {}) {
  const level = aiEvaluation.level || aiEvaluation.finalLevel || "B1";

  return {
    level,
    finalLevel: level,
    strengths: aiEvaluation.strengths || [],
    weaknesses: aiEvaluation.weaknesses || [],
    focus: aiEvaluation.focus || "",
    studyPlan: aiEvaluation.studyPlan || [],
    recommendedPlan: aiEvaluation.recommendedPlan || [],
    createdAt: new Date().toISOString(),
  };
}

export function savePlacementProfile(profile) {
  localStorage.setItem(
    "austriaPathPlacementProfile",
    JSON.stringify(profile)
  );

  if (profile.level) {
    localStorage.setItem("userLevel", profile.level);
  }

  return profile;
}