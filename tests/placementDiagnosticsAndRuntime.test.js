/** Placement diagnostic capture + runtime monitor tests */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.USE_PGLITE = "true";

import { closeDb, initDb, runMigrations } from "../server/src/db/client.js";
import { runPlacementDiagnosticsMigration } from "../server/src/db/placementDiagnosticsMigration.js";
import {
  createPlacementDiagnosticRecorder,
  summarizeIssues,
} from "../src/data/utils/placementDiagnosticRecorder.js";
import {
  classifyPlacementApiError,
  createPlacementRuntimeMonitor,
  isRecoverablePlacementError,
  PLACEMENT_RUNTIME_CALM_MESSAGE,
} from "../src/data/utils/placementRuntimeMonitor.js";
import {
  canAutoCapturePlacementDiagnostic,
  finalizePlacementDiagnosticSession,
  getPlacementDiagnosticConfig,
  getPlacementDiagnosticSession,
  issueQualifiesForPostLimitCapture,
  listPlacementDiagnosticSessions,
  resetPlacementDiagnosticStoreForTests,
  sessionQualifiesForPostLimitCapture,
  syncPlacementDiagnosticSession,
} from "../server/src/services/placementDiagnosticService.js";

describe("placementDiagnosticRecorder", () => {
  it("builds export bundle with turns and routing", () => {
    const recorder = createPlacementDiagnosticRecorder({
      attemptId: "att-1",
      qaMode: false,
    });
    recorder.recordTurn({
      stageIndex: 0,
      skill: "selbstvorstellung",
      turnIndex: 0,
      examinerQuestionText: "Stellen Sie sich vor.",
      learnerTranscript: "Ich heiße Mina.",
      evaluatorOutput: { band: "medium" },
    });
    const bundle = recorder.buildExportBundle();
    expect(bundle.attemptId).toBe("att-1");
    expect(bundle.turns).toHaveLength(1);
    expect(bundle.format).toBe("austriaPath.placementDiagnostic.v1");
  });

  it("does not sync in QA mode", () => {
    const syncs = [];
    createPlacementDiagnosticRecorder({
      attemptId: "qa-1",
      qaMode: true,
      onSync: () => syncs.push(1),
    }).recordTurn({ skill: "selbstvorstellung", learnerTranscript: "x" });
    expect(syncs).toHaveLength(0);
  });
});

describe("placementRuntimeMonitor", () => {
  it("exposes calm learner messages in German and Arabic", () => {
    expect(PLACEMENT_RUNTIME_CALM_MESSAGE.de).toMatch(/technische Verzögerung/i);
    expect(PLACEMENT_RUNTIME_CALM_MESSAGE.ar).toMatch(/تأخير تقني/);
  });

  it("classifies recoverable network errors", () => {
    expect(isRecoverablePlacementError({ status: 502, code: "AI_PROVIDER_ERROR" })).toBe(true);
    expect(classifyPlacementApiError({ code: "AI_INVALID_RESPONSE" })).toBe(
      "invalid_structured_output"
    );
  });

  it("records issues without throwing", () => {
    const monitor = createPlacementRuntimeMonitor();
    monitor.recordIssue({ type: "retry_performed", recoverable: true });
    expect(monitor.issueSummary().count).toBe(1);
    expect(summarizeIssues(monitor.issues).hasIssues).toBe(true);
  });
});

describe("placementDiagnosticService", () => {
  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await runPlacementDiagnosticsMigration();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("captures only first N production sessions and keeps them after limit", async () => {
    await resetPlacementDiagnosticStoreForTests();
    const config = await getPlacementDiagnosticConfig();
    expect(config.captureLimit).toBe(20);

    for (let i = 0; i < 21; i += 1) {
      const attemptId = `attempt-${i}`;
      await syncPlacementDiagnosticSession({
        userId: "user-1",
        attemptId,
        qaMode: false,
        session: { attemptId, startedAt: new Date().toISOString(), turns: [] },
      });
      await finalizePlacementDiagnosticSession({
        userId: "user-1",
        attemptId,
        qaMode: false,
        session: {
          attemptId,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          turns: [],
          issueSummary: { count: 0, hasIssues: false },
        },
      });
    }

    const after = await getPlacementDiagnosticConfig();
    expect(after.completedCaptureCount).toBe(20);
    expect(await canAutoCapturePlacementDiagnostic({ qaMode: false })).toBe(false);
    expect((await listPlacementDiagnosticSessions("all")).length).toBeGreaterThanOrEqual(20);
  });

  it("does not store ordinary successful sessions after the first 20", async () => {
    await resetPlacementDiagnosticStoreForTests();
    for (let i = 0; i < 20; i += 1) {
      const attemptId = `full-${i}`;
      await finalizePlacementDiagnosticSession({
        userId: "user-1",
        attemptId,
        qaMode: false,
        session: {
          attemptId,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          turns: [],
          issues: [],
          issueSummary: { count: 0, hasIssues: false },
        },
      });
    }
    expect((await getPlacementDiagnosticConfig()).completedCaptureCount).toBe(20);

    const ordinary = await syncPlacementDiagnosticSession({
      userId: "user-2",
      attemptId: "ordinary-21",
      qaMode: false,
      session: {
        attemptId: "ordinary-21",
        startedAt: new Date().toISOString(),
        turns: [],
        issues: [{ type: "simplified_rephrase_used", severity: "info" }],
        issueSummary: { count: 1, hasIssues: true, highestSeverity: "info" },
      },
    });
    expect(ordinary.stored).toBe(false);
    expect(await getPlacementDiagnosticSession("ordinary-21")).toBeNull();
    expect((await getPlacementDiagnosticConfig()).completedCaptureCount).toBe(20);
  });

  it("stores post-limit technical error sessions without incrementing completedCaptureCount", async () => {
    await resetPlacementDiagnosticStoreForTests();
    for (let i = 0; i < 20; i += 1) {
      await finalizePlacementDiagnosticSession({
        userId: "user-1",
        attemptId: `full-${i}`,
        qaMode: false,
        session: {
          attemptId: `full-${i}`,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          turns: [{ learnerTranscript: "test" }],
          issues: [],
          issueSummary: { count: 0, hasIssues: false },
        },
      });
    }
    expect((await getPlacementDiagnosticConfig()).completedCaptureCount).toBe(20);

    const technicalIssue = {
      type: "network_provider_error",
      severity: "warning",
      recoveryAttempted: true,
      recoverySucceeded: false,
    };
    expect(issueQualifiesForPostLimitCapture(technicalIssue)).toBe(true);
    expect(issueQualifiesForPostLimitCapture({ type: "simplified_rephrase_used" })).toBe(false);

    const stored = await syncPlacementDiagnosticSession({
      userId: "user-3",
      attemptId: "error-only-1",
      qaMode: false,
      session: {
        attemptId: "error-only-1",
        startedAt: new Date().toISOString(),
        turns: [{ learnerTranscript: "Ich heiße Ali." }],
        issues: [technicalIssue],
        issueSummary: { count: 1, hasIssues: true, highestSeverity: "warning" },
      },
    });
    expect(stored.stored).toBe(true);
    expect(stored.reason).toBe("error_only_capture");

    const session = await getPlacementDiagnosticSession("error-only-1");
    expect(session.errorOnlyCapture).toBe(true);
    expect(session.captureMode).toBe("error_only");
    expect(session.completedCounted).toBeUndefined();
    expect((await getPlacementDiagnosticConfig()).completedCaptureCount).toBe(20);

    await finalizePlacementDiagnosticSession({
      userId: "user-3",
      attemptId: "error-only-1",
      qaMode: false,
      session: {
        ...session,
        issueSummary: session.issueSummary,
      },
    });
    expect((await getPlacementDiagnosticConfig()).completedCaptureCount).toBe(20);
    expect(sessionQualifiesForPostLimitCapture({ issues: [technicalIssue] })).toBe(true);
  });
});
