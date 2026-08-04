/**
 * Placement freeze fixes — stop-submit coordinator and bounded evaluate-turn timeouts.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createPlacementStopSubmitCoordinator,
  PLACEMENT_STT_STOP_FALLBACK_MS,
} from "../src/data/utils/placementRecordingStop.js";
import {
  PLACEMENT_EVALUATE_TURN_TIMEOUT_MS,
  postPlacementEvaluateTurn,
} from "../src/api/placementEvaluateClient.js";
import { ApiError } from "../src/api/httpClient.js";
import {
  classifyPlacementApiError,
  createPlacementRuntimeMonitor,
  isRecoverablePlacementError,
} from "../src/data/utils/placementRuntimeMonitor.js";

describe("placementRecordingStop coordinator", () => {
  it("submits exactly once when onend fires normally", () => {
    const coordinator = createPlacementStopSubmitCoordinator();
    const submissions = [];

    coordinator.armStopFallback({
      scheduleTimeout: vi.fn(),
      onFallback: () => submissions.push("fallback"),
    });

    const committed = coordinator.submitOnce(() => submissions.push("onend"));

    expect(committed).toBe(true);
    expect(submissions).toEqual(["onend"]);
    expect(coordinator.hasCommitted()).toBe(true);
  });

  it("submits once via fallback when onend never fires", () => {
    vi.useFakeTimers();
    const coordinator = createPlacementStopSubmitCoordinator();
    const submissions = [];

    coordinator.armStopFallback({
      scheduleTimeout: (ms, fn) => setTimeout(fn, ms),
      onFallback: () => {
        coordinator.submitOnce(() => submissions.push("fallback"));
      },
    });

    vi.advanceTimersByTime(PLACEMENT_STT_STOP_FALLBACK_MS);

    expect(submissions).toEqual(["fallback"]);
    expect(coordinator.hasCommitted()).toBe(true);
    vi.useRealTimers();
  });

  it("does not duplicate when late onend arrives after fallback", () => {
    vi.useFakeTimers();
    const coordinator = createPlacementStopSubmitCoordinator();
    const submissions = [];

    coordinator.armStopFallback({
      scheduleTimeout: (ms, fn) => setTimeout(fn, ms),
      onFallback: () => {
        coordinator.submitOnce(() => submissions.push("fallback"));
      },
    });

    vi.advanceTimersByTime(PLACEMENT_STT_STOP_FALLBACK_MS);
    const lateOnend = coordinator.submitOnce(() => submissions.push("onend"));

    expect(lateOnend).toBe(false);
    expect(submissions).toEqual(["fallback"]);
    vi.useRealTimers();
  });

  it("clears the fallback timer when onend submits first", () => {
    vi.useFakeTimers();
    const coordinator = createPlacementStopSubmitCoordinator();
    const submissions = [];

    coordinator.armStopFallback({
      scheduleTimeout: (ms, fn) => setTimeout(fn, ms),
      onFallback: () => {
        coordinator.submitOnce(() => submissions.push("fallback"));
      },
    });

    coordinator.submitOnce(() => submissions.push("onend"));
    vi.advanceTimersByTime(PLACEMENT_STT_STOP_FALLBACK_MS);

    expect(submissions).toEqual(["onend"]);
    vi.useRealTimers();
  });
});

function mockAbortAwareFetch() {
  return vi.fn((_url, options) =>
    new Promise((_resolve, reject) => {
      const signal = options?.signal;
      if (signal?.aborted) {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        return;
      }
      signal?.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    })
  );
}

describe("placementEvaluateClient timeout", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("aborts evaluate-turn after the placement timeout and surfaces retryable TIMEOUT", async () => {
    vi.useFakeTimers();
    globalThis.fetch = mockAbortAwareFetch();

    const pending = postPlacementEvaluateTurn({
      idempotencyKey: "turn:3:a2_planung_mittel:birthday-time",
      attemptId: "att-1",
      productType: "placement_test",
      modelId: "a2_planung_mittel",
      answerText: "Wir feiern am Samstag im Park.",
    });
    const assertion = expect(pending).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 408,
    });

    await vi.advanceTimersByTimeAsync(PLACEMENT_EVALUATE_TURN_TIMEOUT_MS);
    await assertion;
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("routes timeout into the existing recoverable evaluation monitor flow", async () => {
    const monitor = createPlacementRuntimeMonitor();
    const error = new ApiError(
      "TIMEOUT",
      "Die Auswertung hat zu lange gedauert. Bitte erneut versuchen.",
      408
    );

    expect(isRecoverablePlacementError(error)).toBe(true);
    expect(classifyPlacementApiError(error)).toBe("evaluator_timeout");
    expect(monitor.canAutoRetry(error)).toBe(true);
  });
});

describe("placement OpenAI timeout + idempotent retry", () => {
  const originalFetch = globalThis.fetch;
  let userId;
  let attemptId;
  let closeDb;
  let query;
  let evaluatePlacementTurn;
  let withAuthorizedPlacementUsage;
  let PLACEMENT_OPENAI_TIMEOUT_MS;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.USE_PGLITE = "true";
    process.env.OPENAI_API_KEY = "test-provider-placeholder";

    const db = await import("../server/src/db/client.js");
    ({ closeDb, query } = db);
    const { initDb, runMigrations } = db;
    await initDb();
    await runMigrations();

    const entitlement = await import(
      "../server/src/services/placementEntitlementService.js"
    );
    ({ withAuthorizedPlacementUsage } = entitlement);

    const { rows } = await query(
      `INSERT INTO users
         (email, password_hash, level, allowed_levels, ai_credits, is_access_approved)
       VALUES
         ('placement-freeze@test.local', 'unused-test-hash', 'A2', ARRAY['A2']::cefr_label[], 0, TRUE)
       RETURNING id`
    );
    userId = rows[0].id;
    await query(
      `INSERT INTO subscriptions
         (user_id, type, status, remaining_exams, permissions, is_current)
       VALUES ($1, 'free', 'inactive', 0, '{}'::jsonb, TRUE)`,
      [userId]
    );
    await entitlement.grantPlacementAttempt(userId);
    const started = await entitlement.beginPlacementAttempt(userId);
    attemptId = started.attemptId;

    const provider = await import(
      "../server/src/services/placementEvaluateService.js"
    );
    evaluatePlacementTurn = provider.evaluatePlacementTurn;
    PLACEMENT_OPENAI_TIMEOUT_MS = provider.PLACEMENT_OPENAI_TIMEOUT_MS;
  });

  afterAll(async () => {
    await closeDb();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("terminates the backend OpenAI request safely on timeout", async () => {
    vi.useFakeTimers();
    globalThis.fetch = mockAbortAwareFetch();

    const pending = evaluatePlacementTurn({
      userId,
      attemptId,
      idempotencyKey: "freeze-openai-timeout",
      productType: "placement_test",
      modelId: "a2_self_mittel",
      answerText: "Ich heiße Mina und wohne in Wien.",
      currentQuestion: "Stellen Sie sich vor.",
      inputMode: "voice_transcript",
      conversation: [],
    });
    const assertion = expect(pending).rejects.toMatchObject({
      code: "OPENAI_UPSTREAM_ERROR",
      status: 504,
    });

    await vi.advanceTimersByTimeAsync(PLACEMENT_OPENAI_TIMEOUT_MS);
    await assertion;
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not double-count usage when an idempotent retry succeeds after provider failure", async () => {
    const idempotencyKey = "freeze-idempotent-retry";
    const payload = {
      skill: "selbstvorstellung",
      answer: "Ich heiße Ali.",
    };
    let providerCalls = 0;

    await expect(
      withAuthorizedPlacementUsage(
        {
          userId,
          attemptId,
          operation: "turn",
          idempotencyKey,
          requestPayload: payload,
        },
        async () => {
          providerCalls += 1;
          throw new Error("provider timeout");
        }
      )
    ).rejects.toThrow("provider timeout");
    expect(providerCalls).toBe(1);

    const replay = await withAuthorizedPlacementUsage(
      {
        userId,
        attemptId,
        operation: "turn",
        idempotencyKey,
        requestPayload: payload,
      },
      async () => {
        providerCalls += 1;
        return { band: "medium" };
      }
    );

    expect(replay).toEqual({ band: "medium" });
    expect(providerCalls).toBe(2);

    const replayAgain = await withAuthorizedPlacementUsage(
      {
        userId,
        attemptId,
        operation: "turn",
        idempotencyKey,
        requestPayload: payload,
      },
      async () => {
        providerCalls += 1;
        return { band: "strong" };
      }
    );

    expect(replayAgain).toEqual({ band: "medium" });
    expect(providerCalls).toBe(2);
  });
});
