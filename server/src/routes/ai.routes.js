import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth } from "../middleware/auth.js";
import { query, withTransaction } from "../db/client.js";
import { AI_COSTS } from "../utils/permissions.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { randomUUID } from "node:crypto";
import { aiRateLimit, aiDailyRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post("/completions", requireAuth, aiRateLimit, aiDailyRateLimit, async (req, res, next) => {
  try {
    const mode = req.body.mode || "conversational";
    const serviceType = req.body.context?.serviceType || mode;
    const cost = AI_COSTS[serviceType] || AI_COSTS.llm_proposal || 1;

    const { rows } = await query(`SELECT ai_credits FROM users WHERE id = $1`, [req.auth.userId]);
    const balance = rows[0]?.ai_credits ?? 0;
    if (balance < cost) {
      throw new AppError("AI_CREDITS_EXHAUSTED", "Keine AI-Credits mehr verfügbar.", 402);
    }

    let resultText = "";
    let proposals = [];

    if (mode === "llm_proposal") {
      proposals = [];
    } else if (env.openaiApiKey) {
      const messages = req.body.messages?.length
        ? req.body.messages
        : [{ role: "user", content: [req.body.prompt, req.body.studentAnswer].filter(Boolean).join("\n\n") }];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: env.openaiModel,
          messages: [
            { role: "system", content: "Du bist ein freundlicher Deutsch-Sprachtrainer für Übungssituationen. Antworte ausschließlich auf Deutsch. Du bist kein Prüfer und stellst keine behördliche Bewertung aus." },
            ...messages.slice(-30),
          ],
          temperature: mode === "conversational" ? 0.7 : 0.3,
          max_tokens: mode === "conversational" ? 800 : 400,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new AppError("OPENAI_UPSTREAM_ERROR", "AI-Dienst vorübergehend nicht verfügbar.", 502);
      }
      resultText = data.choices?.[0]?.message?.content || "";
    }

    const completionId = randomUUID();
    let creditsRemaining = balance;

    await withTransaction(async (q) => {
      const locked = await q(`SELECT ai_credits FROM users WHERE id = $1 FOR UPDATE`, [req.auth.userId]);
      const current = locked.rows[0]?.ai_credits ?? 0;
      if (current < cost) {
        throw new AppError("AI_CREDITS_EXHAUSTED", "Keine AI-Credits mehr verfügbar.", 402);
      }
      await q(
        `UPDATE users SET ai_credits = ai_credits - $2, used_ai_credits = used_ai_credits + $2, last_ai_usage_at = NOW() WHERE id = $1`,
        [req.auth.userId, cost]
      );
      creditsRemaining = current - cost;
      await q(
        `INSERT INTO ai_credits (user_id, amount, balance_after, reason, service_type)
         VALUES ($1, $2, $3, 'llm_proposal', $4)`,
        [req.auth.userId, -cost, creditsRemaining, serviceType]
      );
      await q(
        `INSERT INTO ai_completion_logs (user_id, mode, service_type, model_name, credits_charged, success)
         VALUES ($1, $2::ai_gateway_mode, $3, $4, $5, TRUE)`,
        [req.auth.userId, mode, serviceType, env.openaiModel, cost]
      );
    });

    if (mode === "llm_proposal") {
      success(res, { proposals, creditsUsed: cost, creditsRemaining, completionId });
    } else {
      success(res, { result: resultText, creditsUsed: cost, creditsRemaining, mode, completionId });
    }
  } catch (e) {
    next(e);
  }
});

router.get("/usage", requireAuth, async (req, res, next) => {
  try {
    const { rows: u } = await query(
      `SELECT ai_credits, used_ai_credits FROM users WHERE id = $1`,
      [req.auth.userId]
    );
    const { rows: recent } = await query(
      `SELECT created_at, mode, service_type, credits_charged FROM ai_completion_logs
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.auth.userId]
    );
    success(res, {
      aiCredits: u[0]?.ai_credits ?? 0,
      usedAiCredits: u[0]?.used_ai_credits ?? 0,
      recentUsage: recent.map((r) => ({
        date: r.created_at,
        mode: r.service_type || r.mode,
        creditsUsed: r.credits_charged,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
