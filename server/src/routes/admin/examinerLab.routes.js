import { Router } from "express";
import { query } from "../../db/client.js";
import { success } from "../../utils/response.js";
import { requireExaminerOrAdmin } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { requireIdempotency } from "../../middleware/idempotency.js";

const router = Router();

router.get("/dashboard", requireExaminerOrAdmin, async (_req, res, next) => {
  try {
    const { rows: pending } = await query(
      `SELECT * FROM examiner_lab_queue_items WHERE status = 'pending' ORDER BY queued_at DESC LIMIT 20`
    );
    const { rows: reg } = await query(
      `SELECT registry_version FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    const { rows: resRows } = await query(
      `SELECT * FROM lab_resolutions ORDER BY resolved_at DESC LIMIT 10`
    );
    success(res, {
      pendingCases: pending,
      registryStats: { registryVersion: reg[0]?.registry_version || "0.0.0", promotedRulesCount: 0, pendingProposalsCount: 0 },
      recentResolutions: resRows,
      queueStats: { pending: pending.length, inReview: 0, resolvedThisWeek: resRows.length },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/queue", requireExaminerOrAdmin, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM examiner_lab_queue_items ORDER BY queued_at DESC LIMIT 50`
    );
    success(res, { items: rows });
  } catch (e) {
    next(e);
  }
});

router.post("/queue/:labItemId/resolve", requireExaminerOrAdmin, requireIdempotency("POST /admin/examiner-lab/queue/:labItemId/resolve"), async (req, res, next) => {
  try {
    const { action, rationale, correctedDecision, ruleProposal } = req.body;
    const { rows } = await query(
      `SELECT * FROM examiner_lab_queue_items WHERE lab_item_id = $1`,
      [req.params.labItemId]
    );
    if (!rows.length) throw new AppError("LAB_ITEM_NOT_FOUND", "Lab-Fall nicht gefunden.", 404);
    const item = rows[0];
    if (item.status === "resolved") throw new AppError("LAB_ALREADY_RESOLVED", "Fall bereits bearbeitet.", 409);

    await query(
      `INSERT INTO lab_resolutions (lab_item_id, action, reviewer_id, rationale, corrected_decision, rule_proposal)
       VALUES ($1, $2::lab_action_type, $3, $4, $5::jsonb, $6::jsonb)`,
      [
        item.id,
        action,
        req.auth.userId,
        rationale || null,
        correctedDecision ? JSON.stringify(correctedDecision) : null,
        ruleProposal ? JSON.stringify(ruleProposal) : null,
      ]
    );

    await query(
      `UPDATE examiner_lab_queue_items SET status = 'resolved', updated_at = NOW() WHERE id = $1`,
      [item.id]
    );

    if (action === "correct" && correctedDecision) {
      await query(
        `UPDATE exam_reports SET human_review = $2::jsonb, updated_at = NOW() WHERE id = $1`,
        [
          item.report_id,
          JSON.stringify({
            status: "corrected",
            summary: rationale || "Ergebnis korrigiert.",
            changedReport: true,
            reviewedAt: new Date().toISOString(),
          }),
        ]
      );
    }

    success(res, { resolved: true, action });
  } catch (e) {
    next(e);
  }
});

export default router;
