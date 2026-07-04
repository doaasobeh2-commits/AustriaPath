/**
 * Model Selection Service — intelligent exam construction (Phase B).
 * @module exam-platform/modelSelectionService
 */

import { getProductPolicy, SelectionWeights } from "./productPolicies.js";
import { getUsedModelIds } from "./studentProfileService.js";

function cleanLevel(level = "B1") {
  return String(level || "B1").replace("+", "").trim().toUpperCase() || "B1";
}

function uid(prefix = "bp") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const FULL_EXAM_SKILLS = Object.freeze([
  "writing",
  "reading",
  "listening",
  "picture_description",
  "planning",
  "self_introduction",
]);

const PLACEMENT_SKILLS = Object.freeze([
  "self_introduction",
  "picture_description",
  "listening",
  "planning",
]);

const WEEKLY_SKILLS = Object.freeze([
  "writing",
  "reading",
  "listening",
  "picture_description",
  "planning",
  "discussion",
]);

function computeCandidateScore(entry, profile, policy, examIndex) {
  const weights = SelectionWeights[policy.productType] || SelectionWeights.ai_exam;
  let score = entry.selectionWeight ?? 1;
  const weak = new Set(profile.weakSkills || []);
  const strong = new Set(profile.recurringStrengths || []);
  if (weak.has(entry.skill)) score *= weights.weakSkillWeight;
  else if (strong.has(entry.skill)) score *= weights.strongSkillWeight;
  else score *= weights.neutralWeight;
  if (entry.difficulty === "stark" && examIndex > 1) score *= 1.1;
  if (entry.difficulty === "leicht" && examIndex <= 1) score *= 1.05;
  return score;
}

function pickBestForSkill(candidates, usedIds, skill) {
  return (
    candidates
      .filter((c) => c.skill === skill && !usedIds.has(c.id))
      .sort((a, b) => b._score - a._score)[0] || null
  );
}

function rotateSkills(skills, examIndex) {
  if (skills.length <= 1 || examIndex <= 1) return skills;
  const shift = (examIndex - 1) % skills.length;
  return [...skills.slice(shift), ...skills.slice(0, shift)];
}

/**
 * @param {Object} params
 * @param {import('./contracts.js').ProductType} params.productType
 * @param {import('./contracts.js').StudentProfile} params.profile
 * @param {import('./contracts.js').ModelCatalogEntry[]} params.catalog
 * @param {number} [params.examIndex]
 * @param {number} [params.examTotal]
 * @param {string} [params.rulesVersion]
 */
export function selectBlueprint({
  productType,
  profile,
  catalog = [],
  examIndex = 1,
  examTotal = 1,
  rulesVersion = "0.0.0",
}) {
  const policy = getProductPolicy(productType);
  const weightConfig = SelectionWeights[productType] || SelectionWeights.ai_exam;
  const targetLevel = profile.officialExamLevel || "B1";
  const levelBase = cleanLevel(targetLevel);
  const usedIds = new Set(getUsedModelIds(profile, weightConfig.dedupScope));

  let skillOrder = FULL_EXAM_SKILLS;
  if (productType === "placement_test") skillOrder = PLACEMENT_SKILLS;
  else if (productType === "weekly_plan") {
    skillOrder = rotateSkills(
      (profile.weakSkills?.length ? profile.weakSkills : WEEKLY_SKILLS).slice(0, 4),
      1
    );
  } else if (policy.examCount > 1) {
    skillOrder = rotateSkills(FULL_EXAM_SKILLS, examIndex);
  }

  if (!policy.fullExamStructure) {
    skillOrder = skillOrder.slice(0, 4);
  }

  const candidates = catalog
    .filter((entry) => {
      if (cleanLevel(entry.level) !== levelBase) return false;
      if (
        entry.allowedProducts?.length &&
        !entry.allowedProducts.includes(productType)
      ) {
        return false;
      }
      return true;
    })
    .map((entry) => ({
      ...entry,
      _score: computeCandidateScore(entry, profile, policy, examIndex),
    }));

  const sections = [];
  const selectedIds = new Set();

  skillOrder.forEach((skill) => {
    const pick = pickBestForSkill(
      candidates,
      new Set([...usedIds, ...selectedIds]),
      skill
    );
    if (!pick) return;
    selectedIds.add(pick.id);
    sections.push({
      sectionIndex: sections.length,
      modelId: pick.id,
      skill: pick.skill,
      difficulty: pick.difficulty,
      timeLimitMinutes: policy.defaultDurationMinutes
        ? Math.floor(policy.defaultDurationMinutes / Math.max(skillOrder.length, 1))
        : undefined,
      allowFollowUp:
        skill === "picture_description" ||
        skill === "planning" ||
        skill === "discussion",
    });
  });

  return {
    blueprintId: uid("blueprint"),
    productType,
    mode: policy.mode,
    targetLevel,
    examIndex: policy.examCount > 0 ? examIndex : undefined,
    examTotal: policy.examCount > 0 ? examTotal || policy.examCount : undefined,
    sections,
    rulesVersion,
    createdAt: new Date().toISOString(),
  };
}

export const modelSelectionService = { selectBlueprint };
