/**
 * Hidden admin-only placement diagnostic recorder.
 * Collects full examiner reasoning for replay — never shown to learners.
 */

export const PLACEMENT_DIAGNOSTIC_FORMAT = "austriaPath.placementDiagnostic.v1";
export const PLACEMENT_LAB_REPLAY_COMPAT = "examiner-lab-placement-replay-v1";

function nowIso() {
  return new Date().toISOString();
}

export function createPlacementDiagnosticRecorder({
  attemptId,
  selectedLevel = "A2",
  qaMode = false,
  onSync = () => {},
} = {}) {
  const session = {
    format: PLACEMENT_DIAGNOSTIC_FORMAT,
    labReplayCompatible: PLACEMENT_LAB_REPLAY_COMPAT,
    sessionId: attemptId || null,
    attemptId: attemptId || null,
    startedAt: nowIso(),
    completedAt: null,
    qaMode: Boolean(qaMode),
    productionCapture: !qaMode,
    selectedLevel,
    stageOrder: ["selbstvorstellung", "bildbeschreibung", "lesenHoeren", "planung"],
    stages: [],
    turns: [],
    routingDecisions: [],
    listeningSelection: null,
    planningEvaluation: null,
    issues: [],
    finalPlacement: null,
    learnerReport: null,
    issueSummary: { count: 0, highestSeverity: null, hasIssues: false },
  };

  const sync = (patch = {}) => {
    if (qaMode) return;
    onSync({ attemptId: session.attemptId, patch, session: buildExportBundle() });
  };

  const recordStageStart = ({ stageIndex, skill, modelId, modelLevel, difficulty, reason }) => {
    session.stages.push({
      timestamp: nowIso(),
      stageIndex,
      skill,
      modelId,
      modelLevel: modelLevel || null,
      difficulty: difficulty || null,
      reason: reason || null,
    });
    sync({ event: "stage_start", stageIndex, skill });
  };

  const recordTurn = ({
    stageIndex,
    skill,
    turnIndex,
    examinerQuestionId,
    examinerQuestionText,
    learnerTranscript,
    sttConfidence,
    inputMode,
    evaluatorOutput,
    examinerSignals,
    followUpDecision,
    semanticCoverage,
    routingContext,
    moveId,
  }) => {
    const turn = {
      timestamp: nowIso(),
      stageIndex,
      skill,
      turnIndex,
      examinerQuestionId: examinerQuestionId || null,
      examinerQuestionText: examinerQuestionText || null,
      learnerTranscript: learnerTranscript || "",
      sttConfidence: sttConfidence || (inputMode === "typed" ? "typed_input" : "browser_stt_unknown"),
      inputMode: inputMode || "typed",
      evaluatorOutput: evaluatorOutput || null,
      examinerSignals: examinerSignals || null,
      followUpDecision: followUpDecision || null,
      semanticCoverage: semanticCoverage || null,
      routingContext: routingContext || null,
      moveId: moveId || null,
    };
    session.turns.push(turn);
    sync({ event: "turn", turn });
    return turn;
  };

  const recordRoutingDecision = (decision) => {
    const entry = { timestamp: nowIso(), ...decision };
    session.routingDecisions.push(entry);
    sync({ event: "routing", entry });
    return entry;
  };

  const recordListeningSelection = (selection) => {
    session.listeningSelection = { timestamp: nowIso(), ...selection };
    sync({ event: "listening_selection", selection: session.listeningSelection });
  };

  const recordPlanningStageSummary = (summary) => {
    session.planningEvaluation = { timestamp: nowIso(), ...summary };
    sync({ event: "planning_summary", summary: session.planningEvaluation });
  };

  const recordIssue = (issue) => {
    session.issues.push(issue);
    session.issueSummary = summarizeIssues(session.issues);
    sync({ event: "issue", issue });
  };

  const finalize = ({ finalPlacement, learnerReport, skillBands, modelsUsed, turnEvidence }) => {
    session.completedAt = nowIso();
    session.finalPlacement = finalPlacement || null;
    session.learnerReport = learnerReport || null;
    session.internalSnapshot = {
      skillBands: skillBands || null,
      modelsUsed: modelsUsed || null,
      turnEvidence: turnEvidence || null,
    };
    session.issueSummary = summarizeIssues(session.issues);
    sync({ event: "complete", session: buildExportBundle() });
    return buildExportBundle();
  };

  const buildExportBundle = () => ({
    ...session,
    turns: [...session.turns],
    stages: [...session.stages],
    routingDecisions: [...session.routingDecisions],
    issues: [...session.issues],
  });

  const buildLabReplayPayload = () => ({
    format: PLACEMENT_LAB_REPLAY_COMPAT,
    sourceFormat: PLACEMENT_DIAGNOSTIC_FORMAT,
    sessionId: session.sessionId,
    attemptId: session.attemptId,
    timeline: [
      ...session.stages.map((s) => ({ kind: "stage", ...s })),
      ...session.turns.map((t) => ({ kind: "turn", ...t })),
      ...session.routingDecisions.map((r) => ({ kind: "routing", ...r })),
      ...session.issues.map((i) => ({ kind: "issue", ...i })),
    ],
    diagnostic: buildExportBundle(),
  });

  return {
    session,
    recordStageStart,
    recordTurn,
    recordRoutingDecision,
    recordListeningSelection,
    recordPlanningStageSummary,
    recordIssue,
    finalize,
    buildExportBundle,
    buildLabReplayPayload,
  };
}

export function summarizeIssues(issues = []) {
  const list = Array.isArray(issues) ? issues : [];
  if (!list.length) {
    return { count: 0, highestSeverity: null, hasIssues: false };
  }
  const rank = { info: 0, warning: 1, error: 2, critical: 3 };
  const highestSeverity = list.reduce(
    (max, item) => (rank[item.severity] > rank[max] ? item.severity : max),
    "info"
  );
  return { count: list.length, highestSeverity, hasIssues: true };
}
