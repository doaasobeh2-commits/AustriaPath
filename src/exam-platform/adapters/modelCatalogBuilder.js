/**
 * Builds ModelCatalogEntry[] from existing AustriaPath content libraries.
 * Deterministic listing — selection is handled by modelSelectionService.
 *
 * @module exam-platform/adapters/modelCatalogBuilder
 */

import { a2Models } from "../../data/modelsA2.js";
import { b1Models, b1PlanningModels } from "../../data/modelsb1.js";
import { b2Models } from "../../data/modelsB2.js";
import { b1LesenModels } from "../../data/b1LesenModels.js";
import { b2LesenModels } from "../../data/b2LesenModels.js";
import { b1HorenModels } from "../../data/b1HorenModels.js";
import { b2HorenModels } from "../../data/b2HorenModels.js";
import { a2Images } from "../../data/a2Images.js";
import { b1Images } from "../../data/b1Images.js";
import { b2Grafiken } from "../../data/b2Grafiken.js";
import { aiPlacementLibrary } from "../../data/aiPlacementLibrary.js";
import { weeklyPlanLibrary } from "../../data/weeklyPlanLibrary.js";

/** @typedef {import('../contracts.js').ModelCatalogEntry} ModelCatalogEntry */
/** @typedef {import('../contracts.js').ProductType} ProductType */
/** @typedef {import('../contracts.js').SkillId} SkillId */

function cleanLevel(level = "B1") {
  return String(level || "B1").replace("+", "").trim().toUpperCase() || "B1";
}

function entry(id, skill, level, difficulty, contentRef, allowedProducts) {
  return {
    id,
    skill,
    level: cleanLevel(level),
    difficulty,
    selectionWeight: 1,
    source: "static",
    allowedProducts,
    contentRef,
  };
}

function placementSkillToPlatform(skill) {
  const map = {
    selbstvorstellung: "self_introduction",
    bildbeschreibung: "picture_description",
    hoeren: "listening",
    planung: "planning",
    diskussion: "discussion",
    grafikbeschreibung: "picture_description",
  };
  return /** @type {SkillId} */ (map[skill] || "self_introduction");
}

function weeklySkillToPlatform(skill = "") {
  const key = String(skill).toLowerCase();
  const map = {
    selbstvorstellung: "self_introduction",
    bildbeschreibung: "picture_description",
    hoeren: "listening",
    lesen: "reading",
    schreiben: "writing",
    planung: "planning",
    grammatik: "writing",
    diskussion: "discussion",
  };
  return /** @type {SkillId} */ (map[key] || "writing");
}

function addWritingEntries(catalog, models, level) {
  models.forEach((model) => {
    catalog.push(
      entry(
        `${level.toLowerCase()}-writing-${model.id}`,
        "writing",
        level,
        "mittel",
        { content: { ...model, kind: "writing" } },
        ["ai_exam", "intensive_week", "premium_month", "weekly_plan"]
      )
    );
  });
}

function addLesenEntries(catalog, models, level) {
  models.forEach((model) => {
    catalog.push(
      entry(
        model.id || `${level.toLowerCase()}-lesen-${model.title}`,
        "reading",
        level,
        "mittel",
        {
          content: {
            kind: "reading",
            ...model,
            type: model.teil1 ? "reading_cloze_bundle" : "reading",
          },
        },
        ["ai_exam", "intensive_week", "premium_month", "weekly_plan"]
      )
    );
  });
}

function addListeningEntries(catalog, models, level) {
  models.forEach((model, index) => {
    catalog.push(
      entry(
        model.id || `${level.toLowerCase()}-hoeren-${index}`,
        "listening",
        level,
        "mittel",
        { content: { kind: "listening", ...model } },
        ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
      )
    );
  });
}

function addImageEntries(catalog, models, level, skill = "picture_description") {
  models.forEach((model, index) => {
    catalog.push(
      entry(
        model.id || `${level.toLowerCase()}-image-${index}`,
        skill,
        level,
        "mittel",
        { content: { kind: "picture", ...model } },
        ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
      )
    );
  });
}

function addPlanningEntries(catalog, models, level) {
  models.forEach((model, index) => {
    catalog.push(
      entry(
        model.id || `${level.toLowerCase()}-planning-${index}`,
        "planning",
        level,
        "mittel",
        { content: { kind: "planning", ...model } },
        ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
      )
    );
  });
}

function addPlacementEntries(catalog) {
  aiPlacementLibrary.forEach((model) => {
    const skill = placementSkillToPlatform(model.skill);
    catalog.push(
      entry(
        model.id,
        skill,
        model.level,
        model.difficulty || "mittel",
        { content: { kind: "placement", ...model } },
        ["placement_test"]
      )
    );
  });
}

function addWeeklyEntries(catalog) {
  weeklyPlanLibrary.forEach((task) => {
    const skill = weeklySkillToPlatform(task.skill);
    catalog.push(
      entry(
        task.id,
        skill,
        task.level,
        "mittel",
        { content: { kind: "weekly", ...task } },
        ["weekly_plan"]
      )
    );
  });
}

/** @returns {ModelCatalogEntry[]} */
export function buildModelCatalog() {
  /** @type {ModelCatalogEntry[]} */
  const catalog = [];

  addWritingEntries(catalog, a2Models, "A2");
  addWritingEntries(catalog, b1Models, "B1");
  addWritingEntries(catalog, b2Models, "B2");

  addLesenEntries(catalog, b1LesenModels, "B1");
  addLesenEntries(catalog, b2LesenModels, "B2");

  addListeningEntries(catalog, b1HorenModels, "B1");
  addListeningEntries(catalog, b2HorenModels, "B2");

  addImageEntries(catalog, a2Images, "A2");
  addImageEntries(catalog, b1Images, "B1");
  addImageEntries(catalog, b2Grafiken, "B2", "picture_description");

  addPlanningEntries(catalog, b1PlanningModels, "B1");

  catalog.push(
    entry(
      "generic-self-intro-a2",
      "self_introduction",
      "A2",
      "mittel",
      { content: { kind: "self_intro", level: "A2" } },
      ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
    ),
    entry(
      "generic-self-intro-b1",
      "self_introduction",
      "B1",
      "mittel",
      { content: { kind: "self_intro", level: "B1" } },
      ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
    ),
    entry(
      "generic-self-intro-b2",
      "self_introduction",
      "B2",
      "mittel",
      { content: { kind: "self_intro", level: "B2" } },
      ["ai_exam", "intensive_week", "premium_month", "weekly_plan", "placement_test"]
    )
  );

  addPlacementEntries(catalog);
  addWeeklyEntries(catalog);

  return catalog;
}

let cachedCatalog = null;

export function getModelCatalog() {
  if (!cachedCatalog) cachedCatalog = buildModelCatalog();
  return cachedCatalog;
}

export function clearModelCatalogCache() {
  cachedCatalog = null;
}

export const modelCatalogBuilder = {
  buildModelCatalog,
  getModelCatalog,
  clearModelCatalogCache,
};
