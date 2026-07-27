import { a2Models } from "./modelsA2.js";
import { b1Models, b1PlanningModels } from "./modelsb1.js";
import { b2Models } from "./modelsB2.js";
import { b2PlanningModels, b2DiscussionModels } from "./b2PlanningModels.js";
import { a2Images } from "./a2Images.js";
import { b1Images } from "./b1Images.js";
import { b2Images } from "./b2Images.js";
import { b2Grafiken } from "./b2Grafiken.js";
import { b2LesenModels } from "./b2LesenModels.js";
import { weeklyPlanTaskNavigation } from "./weeklyPlanTaskNavigation.js";

const SOURCE_BUTTON_LABELS = {
  writing: "In Schreiben ansehen",
  planning: "In Planung ansehen",
  images: "In Bildbeschreibung ansehen",
  grafik: "In Grafikbeschreibung ansehen",
  speaking: "In Diskussion ansehen",
  akademie: "In der Akademie ansehen",
  lesen: "In Lesen ansehen",
};

function findPlanIndex(planId, level) {
  const models = level === "B1" ? b1PlanningModels : b2PlanningModels;
  return models.findIndex((m) => m.id === planId);
}

function resolveSourceRef(sourceRef) {
  if (!sourceRef || typeof sourceRef !== "object" || !sourceRef.file) {
    return null;
  }

  const { file } = sourceRef;

  if (file === "modelsA2") {
    const model = a2Models.find((m) => m.id === sourceRef.modelId);
    if (!model) return null;
    return { tab: "writing", buttonKey: "writing", level: "A2", writingModel: model };
  }

  if (file === "modelsb1") {
    if (sourceRef.planId) {
      const planIndex = findPlanIndex(sourceRef.planId, "B1");
      if (planIndex < 0) return null;
      return { tab: "planning", buttonKey: "planning", level: "B1", planIndex, planId: sourceRef.planId };
    }
    const model = b1Models.find((m) => m.id === sourceRef.modelId);
    if (!model) return null;
    return { tab: "writing", buttonKey: "writing", level: "B1", writingModel: model };
  }

  if (file === "modelsB2") {
    const model = b2Models.find((m) => m.id === sourceRef.modelId);
    if (!model) return null;
    return { tab: "b2model", buttonKey: "writing", level: "B2", writingModel: model };
  }

  if (file === "b2PlanningModels") {
    if (sourceRef.diskId) {
      const disk = b2DiscussionModels.find((m) => m.id === sourceRef.diskId);
      if (!disk) return null;
      return {
        tab: "speaking",
        buttonKey: "speaking",
        level: "B2",
        speakingTitle: disk.title,
      };
    }
    if (sourceRef.planId) {
      const planIndex = findPlanIndex(sourceRef.planId, "B2");
      if (planIndex < 0) return null;
      return { tab: "planning", buttonKey: "planning", level: "B2", planIndex, planId: sourceRef.planId };
    }
    return null;
  }

  if (file === "a2Images") {
    const image = a2Images.find((m) => m.id === sourceRef.imageId);
    if (!image) return null;
    return {
      tab: "images",
      buttonKey: "images",
      level: "A2",
      imageId: image.id,
      imageTitle: image.title,
    };
  }

  if (file === "b1Images") {
    const image = b1Images.find((m) => m.id === sourceRef.imageId);
    if (!image) return null;
    return {
      tab: "images",
      buttonKey: "images",
      level: "B1",
      imageId: image.id,
      imageTitle: image.title,
    };
  }

  if (file === "b2Images") {
    const image = b2Images.find((m) => m.id === sourceRef.imageId);
    if (!image) return null;
    return {
      tab: "images",
      buttonKey: "images",
      level: "B2",
      imageId: image.id,
      imageTitle: image.title,
    };
  }

  if (file === "b2Grafiken") {
    const grafik = b2Grafiken.find((m) => m.id === sourceRef.grafikId);
    if (!grafik) return null;
    return {
      tab: "images",
      buttonKey: "grafik",
      level: "B2",
      imageId: grafik.id,
      imageTitle: grafik.title,
      isGrafik: true,
    };
  }

  if (file === "b2Speaking") {
    return {
      tab: "speaking",
      buttonKey: "speaking",
      level: "B2",
      speakingTitle: sourceRef.speakingTitle,
    };
  }

  if (file === "akademieContent") {
    return {
      tab: "akademie",
      buttonKey: "akademie",
      level: sourceRef.level,
      akademieSection: sourceRef.section,
      akademieItemIndex: sourceRef.itemIndex,
    };
  }

  if (file === "weeklyPlanLibrary") {
    const mapped = weeklyPlanTaskNavigation[sourceRef.taskId];
    if (!mapped) return null;
    return resolveWeeklyPlanTarget(mapped);
  }

  if (file === "a2Planning") {
    const planIndex = Number(sourceRef.planIndex);
    if (!Number.isInteger(planIndex) || planIndex < 0) return null;
    return {
      tab: "planning",
      buttonKey: "planning",
      level: "A2",
      planIndex,
    };
  }

  if (file === "b2LesenModels") {
    const modelIndex = b2LesenModels.findIndex((m) => m.id === sourceRef.modelId);
    if (modelIndex < 0) return null;
    return {
      tab: "lesen",
      buttonKey: "lesen",
      level: "B2",
      lesenModelId: sourceRef.modelId,
      lesenModelIndex: modelIndex,
    };
  }

  return null;
}

function resolveWeeklyPlanTarget(target) {
  if (!target) return null;

  if (target.tab === "writing") {
    const level = target.level;
    const models = level === "A2" ? a2Models : level === "B1" ? b1Models : b2Models;
    const model = models.find((m) => m.id === target.writingModelId);
    if (!model) return null;
    const tab = level === "B2" ? "b2model" : "writing";
    return { tab, buttonKey: "writing", level, writingModel: model };
  }

  if (target.tab === "planning") {
    if (target.planId) {
      const planIndex = findPlanIndex(target.planId, target.level);
      if (planIndex < 0) return null;
      return {
        tab: "planning",
        buttonKey: "planning",
        level: target.level,
        planIndex,
        planId: target.planId,
      };
    }
    return {
      tab: "planning",
      buttonKey: "planning",
      level: target.level,
      planIndex: target.planIndex,
    };
  }

  if (target.tab === "images") {
    const images = target.level === "A2" ? a2Images : target.level === "B1" ? b1Images : b2Images;
    const image = images.find((m) => m.id === target.imageId);
    if (!image) return null;
    return {
      tab: "images",
      buttonKey: "images",
      level: target.level,
      imageId: image.id,
      imageTitle: image.title,
    };
  }

  if (target.tab === "speaking") {
    return {
      tab: "speaking",
      buttonKey: "speaking",
      level: target.level,
      speakingTitle: target.speakingTitle,
    };
  }

  if (target.tab === "akademie") {
    return {
      tab: "akademie",
      buttonKey: "akademie",
      level: target.level,
      akademieSection: target.akademieSection,
      akademieItemIndex: target.akademieItemIndex,
    };
  }

  if (target.tab === "lesen") {
    const modelIndex = b2LesenModels.findIndex((m) => m.id === target.lesenModelId);
    if (modelIndex < 0) return null;
    return {
      tab: "lesen",
      buttonKey: "lesen",
      level: target.level,
      lesenModelId: target.lesenModelId,
      lesenModelIndex: modelIndex,
    };
  }

  if (target.tab === "b2model") {
    const model = b2Models.find((m) => m.id === target.writingModelId);
    if (!model) return null;
    return { tab: "b2model", buttonKey: "writing", level: "B2", writingModel: model };
  }

  return null;
}

export function resolveDailyLearningNavigation(card) {
  const target = resolveSourceRef(card.sourceRef);
  if (!target) {
    throw new Error(`Daily Learning card ${card.id} has no valid sourceRef`);
  }
  const buttonKey = target.buttonKey || "akademie";
  return {
    ...target,
    buttonLabel: SOURCE_BUTTON_LABELS[buttonKey] || SOURCE_BUTTON_LABELS.akademie,
  };
}

export function buildDailyLearningNavigationContext(target) {
  if (!target) return null;
  return {
    fromDailyLearning: true,
    planIndex: target.planIndex,
    planId: target.planId,
    imageId: target.imageId,
    imageTitle: target.imageTitle,
    isGrafik: target.isGrafik,
    speakingTitle: target.speakingTitle,
    akademieSection: target.akademieSection,
    akademieItemIndex: target.akademieItemIndex,
    lesenModelId: target.lesenModelId,
    lesenModelIndex: target.lesenModelIndex,
  };
}

export function applyDailyLearningNavigation(
  target,
  { setActiveTab, setSelectedWritingModel, setNavigationContext, setSelectedLevel }
) {
  if (!target) return;

  if (target.level) {
    setSelectedLevel?.(target.level);
    localStorage.setItem("userLevel", target.level);
  }

  if (target.writingModel) {
    setSelectedWritingModel?.(target.writingModel);
  }

  setNavigationContext?.(buildDailyLearningNavigationContext(target));
  setActiveTab(target.tab);
}
