import { Router } from "express";
import { query } from "../db/client.js";
import { success } from "../utils/response.js";
import { getEffectiveKnowledgeForJudge } from "../../../src/exam-platform/services/registryKnowledgeMerge.js";
import { RULE_REGISTRY_STORAGE_KEY } from "../../../src/exam-platform/ruleRegistrySchema.js";

const router = Router();

function memStorage(registryJson) {
  const data = { [RULE_REGISTRY_STORAGE_KEY]: JSON.stringify(registryJson) };
  return {
    getItem(key) {
      return data[key] ?? null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT registry_version, schema_version, created_at FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    success(res, rows[0] ? {
      registryVersion: rows[0].registry_version,
      schemaVersion: rows[0].schema_version,
      updatedAt: rows[0].created_at,
    } : { registryVersion: "0.0.0", schemaVersion: "1.0.0" });
  } catch (e) {
    next(e);
  }
});

router.get("/effective", async (req, res, next) => {
  try {
    const level = String(req.query.level || "B1");
    const skill = String(req.query.skill || "writing");
    const { rows } = await query(
      `SELECT registry_json, registry_version FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    if (!rows.length) {
      return success(res, { rubric: null, registryVersion: "0.0.0" });
    }
    const storage = memStorage(rows[0].registry_json);
    const rubric = getEffectiveKnowledgeForJudge(level, skill, storage);
    success(res, { rubric, registryVersion: rows[0].registry_version, level, skill });
  } catch (e) {
    next(e);
  }
});

export default router;
