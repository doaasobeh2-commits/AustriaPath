import { describe, expect, it, beforeEach } from "vitest";
import { createExamEngine } from "../src/exam-platform/examEngine.js";
import { clearAllSessions } from "../src/exam-platform/sessionStore.js";
import { createEmptyProfile, saveProfile } from "../src/exam-platform/studentProfileService.js";
import { resetCoachingEvents } from "../src/exam-platform/services/coachingEvents.js";
import { clearLabQueue } from "../src/exam-platform/services/examinerLabService.js";

const mockCatalog = [
  {
    id: "r1",
    skill: "reading",
    level: "B1",
    difficulty: "mittel",
    contentRef: {
      content: {
        type: "reading_cloze",
        answers: { 31: "weil", 32: "dass" },
      },
    },
  },
  {
    id: "l1",
    skill: "listening",
    level: "B1",
    difficulty: "mittel",
    contentRef: {
      content: {
        questions: [
          { q: "Warum?", a: "Wegen Unfall." },
        ],
      },
    },
  },
  {
    id: "w1",
    skill: "writing",
    level: "B1",
    difficulty: "mittel",
    contentRef: { content: { prompt: "Schreiben Sie eine E-Mail." } },
  },
  {
    id: "pl1",
    skill: "planning",
    level: "B1",
    difficulty: "mittel",
    contentRef: { content: { prompt: "Planen Sie ein Gespräch." } },
  },
  {
    id: "s1",
    skill: "self_introduction",
    level: "B1",
    difficulty: "mittel",
    contentRef: { content: { prompt: "Stellen Sie sich vor." } },
  },
];

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function makeEngine(overrides = {}) {
  const storage = createMemoryStorage();
  const profile = createEmptyProfile();
  profile.officialExamLevel = "B1";
  saveProfile(profile, storage);

  return createExamEngine({
    catalog: mockCatalog,
    storage,
    rulesVersion: "1.0.0",
    subscription: {
      type: "ai_exam",
      status: "active",
      remainingExams: 3,
      startDate: null,
      endDate: null,
    },
    ...overrides,
  });
}

describe("examEngine lifecycle", () => {
  beforeEach(() => {
    clearAllSessions();
    resetCoachingEvents();
    clearLabQueue();
  });

  it("starts weekly plan without subscription validation", () => {
    const engine = makeEngine({ subscription: null });
    const { session } = engine.start({ productType: "weekly_plan" });
    expect(session.productType).toBe("weekly_plan");
    expect(session.mode).toBe("practice");
    expect(session.blueprint.sections.length).toBeGreaterThan(0);
  });

  it("blocks premium exam when subscription inactive", () => {
    const engine = makeEngine({
      subscription: {
        type: "ai_exam",
        status: "inactive",
        remainingExams: 1,
        startDate: null,
        endDate: null,
      },
    });
    expect(() => engine.start({ productType: "ai_exam" })).toThrow(/Abonnement/);
  });

  it("runs full lifecycle for reading + listening sections", async () => {
    const engine = makeEngine();
    const { sessionId, session } = engine.start({ productType: "weekly_plan" });

    for (const section of session.blueprint.sections) {
      const answer =
        section.skill === "reading"
          ? {
              sectionIndex: section.sectionIndex,
              skill: "reading",
              modelId: section.modelId,
              mcqAnswers: { 31: "weil", 32: "dass" },
            }
          : section.skill === "listening"
            ? {
                sectionIndex: section.sectionIndex,
                skill: "listening",
                modelId: section.modelId,
                mcqAnswers: { 0: "Wegen Unfall." },
              }
            : {
                sectionIndex: section.sectionIndex,
                skill: section.skill,
                modelId: section.modelId,
                freeText: "Beispielantwort für diese Aufgabe mit genügend Inhalt.",
              };
      await engine.submitSection(sessionId, answer);
    }

    const result = await engine.complete(sessionId);
    expect(result.report.productType).toBe("weekly_plan");
    expect(result.profile.officialExamLevel).toBe("B1");
    expect(result.profile.practiceHistory.length).toBe(1);
    expect(result.report.councilDecision.overallScore).toBeGreaterThan(0);
    expect(result.coachingEvent.emitted).toBe(true);
  });

  it("updates official level for premium exam reports", async () => {
    const engine = makeEngine();
    const { sessionId, session } = engine.start({ productType: "ai_exam" });

    for (const section of session.blueprint.sections) {
      const answer =
        section.skill === "reading"
          ? {
              sectionIndex: section.sectionIndex,
              skill: "reading",
              modelId: section.modelId,
              mcqAnswers: { 31: "weil", 32: "dass" },
            }
          : section.skill === "listening"
            ? {
                sectionIndex: section.sectionIndex,
                skill: "listening",
                modelId: section.modelId,
                mcqAnswers: { 0: "Wegen Unfall." },
              }
            : {
                sectionIndex: section.sectionIndex,
                skill: section.skill,
                modelId: section.modelId,
                freeText: "Antworttext.",
              };
      await engine.submitSection(sessionId, answer);
    }

    const result = await engine.complete(sessionId);
    expect(result.profile.examHistory.length).toBe(1);
    expect(result.profile.officialExamLevel).toBe(result.report.cefrLevel);
  });

  it("consumes subscription attempt on premium start", () => {
    const subscription = {
      type: "ai_exam",
      status: "active",
      remainingExams: 2,
      startDate: null,
      endDate: null,
    };
    const engine = makeEngine({ subscription });
    engine.start({ productType: "ai_exam" });
    expect(subscription.remainingExams).toBe(1);
  });

  it("does not enqueue lab for weekly plan", async () => {
    const engine = makeEngine({ subscription: null });
    const { sessionId, session } = engine.start({ productType: "weekly_plan" });

    for (const section of session.blueprint.sections) {
      await engine.submitSection(sessionId, {
        sectionIndex: section.sectionIndex,
        skill: section.skill,
        modelId: section.modelId,
        freeText: section.skill === "reading" ? undefined : "Antwort",
        mcqAnswers:
          section.skill === "reading"
            ? { 31: "weil", 32: "dass" }
            : section.skill === "listening"
              ? { 0: "Wegen Unfall." }
              : undefined,
      });
    }

    const result = await engine.complete(sessionId);
    expect(result.labEnqueued).toBe(false);
  });
});

describe("examOrchestrator", () => {
  it("rejects wrong section index", async () => {
    const engine = makeEngine({ subscription: null });
    const { sessionId } = engine.start({ productType: "weekly_plan" });

    await expect(
      engine.submitSection(sessionId, {
        sectionIndex: 99,
        skill: "reading",
        modelId: "r1",
        mcqAnswers: {},
      })
    ).rejects.toThrow(/Sektion/);
  });
});
