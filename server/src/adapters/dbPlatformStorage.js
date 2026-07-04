/**
 * DB-backed Storage adapter for exam-platform (Phase H).
 * Maps localStorage keys to PostgreSQL tables per Gate 0 migration plan.
 */

import { query } from "../db/client.js";

const KEY_PROFILE = "austriaPathStudentProfileV2";
const KEY_SESSION = "austriaPathExamSession";
const KEY_REGISTRY = "austriaPathRuleRegistry";
const KEY_LAB_QUEUE = "austriaPathExaminerLabQueue";
const KEY_RULE_PROPOSALS = "austriaPathRuleProposals";

export function createDbPlatformStorage(userId) {
  const mem = new Map();

  async function loadProfileJson() {
    const { rows } = await query(
      `SELECT profile_json FROM student_learning_profiles WHERE user_id = $1`,
      [userId]
    );
    return rows[0]?.profile_json || null;
  }

  async function saveProfileJson(json) {
    await query(
      `UPDATE student_learning_profiles SET profile_json = $2::jsonb, updated_at = NOW() WHERE user_id = $1`,
      [userId, JSON.stringify(json)]
    );
  }

  async function loadRegistryJson() {
    const { rows } = await query(
      `SELECT registry_json FROM rule_registry_snapshots WHERE is_current = TRUE LIMIT 1`
    );
    return rows[0]?.registry_json || null;
  }

  return {
    /** @type {Storage} */
    getItem(key) {
      if (mem.has(key)) return mem.get(key);
      return null;
    },
    setItem(key, value) {
      mem.set(key, value);
    },
    removeItem(key) {
      mem.delete(key);
    },
    async hydrate() {
      const profile = await loadProfileJson();
      if (profile) mem.set(KEY_PROFILE, JSON.stringify(profile));
      const registry = await loadRegistryJson();
      if (registry) mem.set(KEY_REGISTRY, JSON.stringify(registry));
      mem.set(KEY_LAB_QUEUE, "[]");
      mem.set(KEY_RULE_PROPOSALS, "[]");
    },
    async flush() {
      if (mem.has(KEY_PROFILE)) {
        await saveProfileJson(JSON.parse(mem.get(KEY_PROFILE)));
      }
    },
    keys: {
      PROFILE: KEY_PROFILE,
      SESSION: KEY_SESSION,
      REGISTRY: KEY_REGISTRY,
      LAB_QUEUE: KEY_LAB_QUEUE,
    },
  };
}
