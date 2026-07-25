import { describe, it, expect, beforeEach } from "vitest";
import {
  getDailyLearningSession,
  markDailyLearningSessionComplete,
  resetDailyLearningStateForTests,
} from "../src/data/dailyLearningRotation.js";
import {
  resolveDailyLearningNavigation,
  buildDailyLearningNavigationContext,
} from "../src/data/dailyLearningNavigation.js";
import { dailyLearningCards, dailyLearningCardsByLevel } from "../src/data/dailyLearningBank.js";
import { DAILY_LEARNING_SOURCE_REGISTRY } from "../src/data/dailyLearningSourceRegistry.js";
import { weeklyPlanTaskNavigation } from "../src/data/weeklyPlanTaskNavigation.js";
import { a2Models } from "../src/data/modelsA2.js";
import { b1Models, b1PlanningModels } from "../src/data/modelsb1.js";
import { b2Models } from "../src/data/modelsB2.js";
import { b2PlanningModels } from "../src/data/b2PlanningModels.js";
import { a2Images } from "../src/data/a2Images.js";
import { b1Images } from "../src/data/b1Images.js";
import { b2Images } from "../src/data/b2Images.js";
import { b2Grafiken } from "../src/data/b2Grafiken.js";
import { b2LesenModels } from "../src/data/b2LesenModels.js";
import { weeklyPlanLibrary } from "../src/data/weeklyPlanLibrary.js";
import { a2Akademie, b1Akademie, b2Akademie } from "../src/data/akademieContent.js";

describe("dailyLearningRotation", () => {
  beforeEach(() => {
    resetDailyLearningStateForTests();
  });

  it("returns 3 cards per day for B1", () => {
    const session = getDailyLearningSession("B1");
    expect(session.cards).toHaveLength(3);
    expect(session.sessionComplete).toBe(false);
  });

  it("uses unique categories when possible", () => {
    const session = getDailyLearningSession("A2");
    const categories = session.cards.map((c) => c.category);
    expect(new Set(categories).size).toBe(3);
  });

  it("keeps the same cards on the same day", () => {
    const first = getDailyLearningSession("B1");
    const second = getDailyLearningSession("B1");
    expect(second.cards.map((c) => c.id)).toEqual(first.cards.map((c) => c.id));
  });

  it("marks session complete for home state", () => {
    getDailyLearningSession("B1");
    markDailyLearningSessionComplete("B1");
    const session = getDailyLearningSession("B1");
    expect(session.sessionComplete).toBe(true);
  });
});

describe("dailyLearning source registry", () => {
  it("defines explicit sourceRef for all 270 cards", () => {
    expect(Object.keys(DAILY_LEARNING_SOURCE_REGISTRY)).toHaveLength(270);
    expect(dailyLearningCards).toHaveLength(270);
    for (const card of dailyLearningCards) {
      expect(card.sourceRef).toBeTruthy();
      expect(card.sourceRef.file).toBeTruthy();
      expect(DAILY_LEARNING_SOURCE_REGISTRY[card.id]).toEqual(card.sourceRef);
    }
  });

  it("maps every weeklyPlanLibrary task used by cards", () => {
    const taskIds = new Set(
      dailyLearningCards
        .filter((c) => c.sourceRef?.file === "weeklyPlanLibrary")
        .map((c) => c.sourceRef.taskId)
    );
    for (const taskId of taskIds) {
      expect(weeklyPlanLibrary.some((t) => t.id === taskId)).toBe(true);
      expect(weeklyPlanTaskNavigation[taskId]).toBeTruthy();
    }
  });
});

describe("dailyLearningNavigation", () => {
  it("resolves every card to an existing model without heuristics", () => {
    for (const card of dailyLearningCards) {
      const nav = resolveDailyLearningNavigation(card);
      expect(nav.tab).toBeTruthy();

      if (nav.tab === "writing") {
        const pool = card.level === "A2" ? a2Models : b1Models;
        expect(pool.some((m) => m.id === nav.writingModel.id)).toBe(true);
      }
      if (nav.tab === "b2model") {
        expect(b2Models.some((m) => m.id === nav.writingModel.id)).toBe(true);
      }
      if (nav.tab === "planning") {
        const pool = card.level === "A2" ? [{ title: "Geburtstag planen" }, { title: "Arzttermin für die Mutter" }] : card.level === "B1" ? b1PlanningModels : b2PlanningModels;
        if (nav.planId) {
          expect(pool.some((m) => m.id === nav.planId)).toBe(true);
        } else {
          expect(nav.planIndex).toBeGreaterThanOrEqual(0);
          expect(nav.planIndex).toBeLessThan(pool.length);
        }
      }
      if (nav.tab === "images") {
        const pool = card.level === "A2" ? a2Images : card.level === "B1" ? b1Images : [...b2Images, ...b2Grafiken];
        expect(pool.some((m) => m.id === nav.imageId)).toBe(true);
      }
      if (nav.tab === "speaking" && nav.speakingTitle) {
        expect(nav.speakingTitle.length).toBeGreaterThan(0);
      }
      if (nav.tab === "akademie") {
        const contentKeyBySection = {
          grammatik: "grammar",
          satzbau: "satzbau",
          konnektoren: "konnektoren",
          wortschatz: "words",
          verben: "verbs",
          fehler: "mistakes",
        };
        const pool = nav.level === "A2" ? a2Akademie : nav.level === "B1" ? b1Akademie : b2Akademie;
        const contentKey = contentKeyBySection[nav.akademieSection];
        expect(pool[contentKey]?.length).toBeGreaterThan(nav.akademieItemIndex);
      }
      if (nav.tab === "lesen") {
        expect(b2LesenModels.some((m) => m.id === nav.lesenModelId)).toBe(true);
      }
    }
  });

  it("resolves Schreiben cards to writing tab", () => {
    const card = dailyLearningCardsByLevel.A2.find((c) => c.id === "A2-001");
    const nav = resolveDailyLearningNavigation(card);
    expect(nav.tab).toBe("writing");
    expect(nav.writingModel.id).toBe(1);
    expect(nav.buttonLabel).toBe("In Schreiben ansehen");
  });

  it("resolves Planung cards to planning tab by planId", () => {
    const card = dailyLearningCardsByLevel.B1.find((c) => c.id === "B1-021");
    const nav = resolveDailyLearningNavigation(card);
    expect(nav.tab).toBe("planning");
    expect(nav.planId).toBe("b1-plan-01");
  });

  it("resolves weeklyPlanLibrary cards through explicit task mapping", () => {
    const card = dailyLearningCardsByLevel.A2.find((c) => c.id === "A2-042");
    const nav = resolveDailyLearningNavigation(card);
    expect(nav.tab).toBe("planning");
    expect(nav.planIndex).toBe(0);
  });

  it("builds one-time navigation context", () => {
    const card = dailyLearningCardsByLevel.B2.find((c) => c.id === "B2-001");
    const nav = resolveDailyLearningNavigation(card);
    const ctx = buildDailyLearningNavigationContext(nav);
    expect(ctx.fromDailyLearning).toBe(true);
    expect(ctx.speakingTitle).toBe("Homeoffice vs. Büro");
  });
});
