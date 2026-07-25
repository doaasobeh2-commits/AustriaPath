/**
 * Hidden placement runtime issue monitor — learner-safe notices, admin diagnostics.
 * Must not affect routing, scoring, or timing.
 */

export const PLACEMENT_RUNTIME_CALM_MESSAGE = Object.freeze({
  de: "Es gibt eine kurze technische Verzögerung. Die Prüfung wird fortgesetzt...",
  ar: "حدث تأخير تقني بسيط، يتم متابعة الفحص...",
});

export const PLACEMENT_ISSUE_TYPES = Object.freeze([
  "stt_failure",
  "stt_low_confidence",
  "evaluator_timeout",
  "network_provider_error",
  "evaluator_failure",
  "invalid_structured_output",
  "retry_performed",
  "idempotency_recovery",
  "fallback_path",
  "duplicate_request_prevented",
  "premature_question_prevented",
  "premature_audio_prevented",
  "stage_mismatch",
  "invalid_question_selection",
  "repeated_covered_question_prevented",
  "unavailable_listening_model",
  "no_listening_evidence",
  "simplified_rephrase_used",
  "off_topic_after_rephrase",
  "low_routing_confidence",
  "unexpected_runtime_exception",
  "answer_too_short_validation",
  "planning_audio_playback_error",
  "unrecoverable_session_interruption",
  "bild_image_unavailable",
]);

const SEVERITY_RANK = Object.freeze({ info: 0, warning: 1, error: 2, critical: 3 });

const RECOVERABLE_NETWORK = new Set([
  "NETWORK_ERROR",
  "FETCH_FAILED",
  "TIMEOUT",
  "AI_PROVIDER_ERROR",
  "AI_INVALID_RESPONSE",
]);

function nowIso() {
  return new Date().toISOString();
}

function inferSeverity(type, recoverable) {
  if (type === "unexpected_runtime_exception" || type === "unavailable_listening_model") {
    return recoverable ? "error" : "critical";
  }
  if (type === "network_provider_error" || type === "evaluator_timeout") return "warning";
  if (type === "stt_failure" || type === "stt_low_confidence") return "warning";
  return recoverable ? "info" : "warning";
}

export function classifyPlacementApiError(error) {
  const code = String(error?.code || error?.name || "").trim();
  const status = Number(error?.status || 0);
  if (code === "VALIDATION_ERROR" && /kurz|too short/i.test(String(error?.message || ""))) {
    return "answer_too_short_validation";
  }
  if (code === "AI_INVALID_RESPONSE") return "invalid_structured_output";
  if (status === 408 || code === "TIMEOUT") return "evaluator_timeout";
  if (status >= 500 || code === "AI_PROVIDER_ERROR") return "network_provider_error";
  if (status === 0 || code === "NETWORK_ERROR" || code === "FETCH_FAILED") {
    return "network_provider_error";
  }
  if (status >= 400) return "evaluator_failure";
  return "unexpected_runtime_exception";
}

export function isRecoverablePlacementError(error) {
  const code = String(error?.code || "").trim();
  const status = Number(error?.status || 0);
  if (RECOVERABLE_NETWORK.has(code)) return true;
  if (status >= 500 || status === 408) return true;
  if (status === 0) return true;
  return false;
}

export function createPlacementRuntimeMonitor(options = {}) {
  const getContext = typeof options.getContext === "function" ? options.getContext : () => ({});
  const onSync = typeof options.onSync === "function" ? options.onSync : () => {};
  const issues = [];
  const retriedKeys = new Set();
  let recoveryNoticeActive = false;

  const recordIssue = (partial = {}) => {
    const type = PLACEMENT_ISSUE_TYPES.includes(partial.type)
      ? partial.type
      : "unexpected_runtime_exception";
    const recoverable = partial.recoverable !== false;
    const event = {
      id: `issue_${issues.length + 1}`,
      timestamp: nowIso(),
      stage: partial.stage ?? getContext().stage ?? null,
      turn: partial.turn ?? getContext().turn ?? null,
      severity: partial.severity || inferSeverity(type, recoverable),
      type,
      recoverable,
      recoveryAttempted: Boolean(partial.recoveryAttempted),
      recoverySucceeded: partial.recoverySucceeded === true,
      transcriptPreserved: partial.transcriptPreserved !== false,
      sessionPreserved: partial.sessionPreserved !== false,
      technicalDetails: partial.technicalDetails || null,
      adminNote: partial.adminNote || null,
    };
    issues.push(event);
    onSync({ type: "issue", issue: event });
    return event;
  };

  const issueSummary = () => {
    if (!issues.length) {
      return { count: 0, highestSeverity: null, hasIssues: false };
    }
    const highest = issues.reduce(
      (max, item) => (SEVERITY_RANK[item.severity] > SEVERITY_RANK[max] ? item.severity : max),
      "info"
    );
    return { count: issues.length, highestSeverity: highest, hasIssues: true };
  };

  return {
    issues,
    issueSummary,
    recordIssue,
    showRecoveryNotice() {
      recoveryNoticeActive = true;
    },
    clearRecoveryNotice() {
      recoveryNoticeActive = false;
    },
    isRecoveryNoticeActive() {
      return recoveryNoticeActive;
    },
    hasRetried(key) {
      return retriedKeys.has(String(key || ""));
    },
    markRetried(key) {
      if (key) retriedKeys.add(String(key));
    },
    canAutoRetry(error) {
      return isRecoverablePlacementError(error);
    },
    recordPrematureQuestionPrevented() {
      return recordIssue({
        type: "premature_question_prevented",
        recoverable: true,
        adminNote: "Follow-up hidden until evaluation completed.",
      });
    },
    recordPrematureAudioPrevented() {
      return recordIssue({
        type: "premature_audio_prevented",
        recoverable: true,
        adminNote: "Planung examiner audio deferred until evaluation completed.",
      });
    },
    recordSimplifiedRephraseUsed(meta = {}) {
      return recordIssue({
        type: "simplified_rephrase_used",
        recoverable: true,
        adminNote: meta.adminNote || "Simplified rephrase offered once.",
      });
    },
    recordDuplicateRequestPrevented(meta = {}) {
      return recordIssue({
        type: "duplicate_request_prevented",
        recoverable: true,
        adminNote: meta.adminNote || "Duplicate evaluate call blocked while evaluating.",
      });
    },
    recordSttObservation({ transcript = "", inputMode = "voice_transcript" } = {}) {
      if (!transcript.trim()) {
        return recordIssue({
          type: "stt_failure",
          recoverable: true,
          transcriptPreserved: false,
          adminNote: "No transcript captured before submit.",
        });
      }
      if (inputMode === "voice_transcript" && transcript.trim().split(/\s+/).length < 2) {
        return recordIssue({
          type: "stt_low_confidence",
          recoverable: true,
          adminNote: "Very short voice transcript — possible STT uncertainty.",
        });
      }
      return null;
    },
    async withEvaluateRecovery(idempotencyKey, evaluateFn) {
      try {
        const result = await evaluateFn();
        this.clearRecoveryNotice();
        return result;
      } catch (error) {
        const issueType = classifyPlacementApiError(error);
        recordIssue({
          type: issueType,
          recoverable: isRecoverablePlacementError(error),
          recoveryAttempted: false,
          technicalDetails: {
            code: error?.code || null,
            status: error?.status || null,
            message: error?.message || null,
          },
        });
        if (!this.canAutoRetry(error) || this.hasRetried(idempotencyKey)) {
          this.showRecoveryNotice();
          throw error;
        }
        this.markRetried(idempotencyKey);
        this.showRecoveryNotice();
        recordIssue({
          type: "retry_performed",
          recoverable: true,
          recoveryAttempted: true,
          adminNote: "Automatic evaluate-turn retry after transient failure.",
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const result = await evaluateFn();
          recordIssue({
            type: "idempotency_recovery",
            recoverable: true,
            recoveryAttempted: true,
            recoverySucceeded: true,
            adminNote: "Evaluate-turn retry succeeded.",
          });
          this.clearRecoveryNotice();
          return result;
        } catch (retryError) {
          recordIssue({
            type: issueType,
            recoverable: false,
            recoveryAttempted: true,
            recoverySucceeded: false,
            technicalDetails: {
              code: retryError?.code || null,
              status: retryError?.status || null,
              message: retryError?.message || null,
            },
          });
          recordIssue({
            type: "unrecoverable_session_interruption",
            recoverable: false,
            recoveryAttempted: true,
            recoverySucceeded: false,
            adminNote: "Evaluate-turn retry failed; session preserved for admin review.",
          });
          throw retryError;
        }
      }
    },
  };
}

export function formatCalmRuntimeNotice(language = "de") {
  const lang = String(language || "de").toLowerCase().startsWith("ar") ? "ar" : "de";
  return PLACEMENT_RUNTIME_CALM_MESSAGE[lang];
}
