import { Router } from "express";
import { query } from "../db/client.js";
import { success } from "../utils/response.js";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT profile_json, updated_at FROM student_learning_profiles WHERE user_id = $1`,
      [req.auth.userId]
    );
    success(res, { profile: rows[0]?.profile_json || null, updatedAt: rows[0]?.updated_at });
  } catch (e) {
    next(e);
  }
});

export default router;
