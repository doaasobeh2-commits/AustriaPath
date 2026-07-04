import { Router } from "express";
import { query } from "../../db/client.js";
import { success } from "../../utils/response.js";
import { requireAdmin } from "../../middleware/auth.js";
import { requireIdempotency } from "../../middleware/idempotency.js";
import { randomUUID } from "node:crypto";

const router = Router();

router.post("/promote", requireAdmin, requireIdempotency("POST /admin/rule-registry/promote"), async (req, res, next) => {
  try {
    const { ruleText, skill, level, structuredPatch, sourceLabItemId, rationale } = req.body;
    const { rows: current } = await query(
      `SELECT * FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    const prev = current[0];
    const registry = prev?.registry_json || {
      meta: { registryVersion: "0.0.0", schemaVersion: "1.0.0", updatedAt: new Date(0).toISOString() },
      globalPrinciples: [],
      criticalRules: [],
      levels: {},
      promotedRules: [],
    };

    const promotion = {
      id: `prom_${randomUUID()}`,
      sourceLabItemId: sourceLabItemId || "",
      approvedBy: req.auth.userId,
      approvedAt: new Date().toISOString(),
      skill,
      level,
      ruleText,
      structuredPatch,
    };
    registry.promotedRules = [...(registry.promotedRules || []), promotion];
    const parts = String(registry.meta.registryVersion || "0.0.0").split(".");
    const nextVersion = `${parts[0]}.${Number(parts[1] || 0) + 1}.0`;
    registry.meta = {
      ...registry.meta,
      registryVersion: nextVersion,
      updatedAt: new Date().toISOString(),
      approvedBy: req.auth.userId,
    };

    await query(`UPDATE rule_registry_snapshots SET is_current = FALSE WHERE is_current = TRUE`);
    const { rows } = await query(
      `INSERT INTO rule_registry_snapshots (registry_version, registry_json, is_current, approved_by)
       VALUES ($1, $2::jsonb, TRUE, $3) RETURNING *`,
      [nextVersion, JSON.stringify(registry), req.auth.userId]
    );

    await query(
      `INSERT INTO rule_registry_promotions (registry_snapshot_id, promotion_id, source_lab_item_id, approved_by, approved_at, skill, level, rule_text, structured_patch)
       VALUES ($1, $2, $3, $4, NOW(), $5::skill_id, $6::cefr_label, $7, $8::jsonb)`,
      [rows[0].id, promotion.id, sourceLabItemId || null, req.auth.userId, skill || null, level?.replace("+", "") || null, ruleText, JSON.stringify(structuredPatch || {})]
    );

    success(res, { registryVersion: nextVersion, rationale }, 201);
  } catch (e) {
    next(e);
  }
});

export default router;
