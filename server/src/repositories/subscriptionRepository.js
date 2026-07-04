import { query, withTransaction } from "../db/client.js";
import { randomUUID } from "node:crypto";

export async function syncSubscriptionAfterEngineStart(userId, subscriptionId, subscriptionRecord, session, idempotencyKey) {
  return withTransaction(async (q) => {
    await q(
      `UPDATE subscriptions SET remaining_exams = $2, updated_at = NOW() WHERE id = $1`,
      [subscriptionId, subscriptionRecord.remainingExams ?? 0]
    );

    await q(
      `INSERT INTO exam_attempt_ledger (user_id, subscription_id, session_id, product_type, exam_index, idempotency_key, remaining_after)
       VALUES ($1, $2, $3, $4::product_type, $5, $6, $7)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        userId,
        subscriptionId,
        session.sessionId,
        session.productType,
        session.blueprint?.examIndex || 1,
        idempotencyKey || null,
        subscriptionRecord.remainingExams ?? 0,
      ]
    );
  });
}

/** @deprecated use syncSubscriptionAfterEngineStart — engine owns in-memory consume */
export async function consumeSubscriptionExam(userId, subscriptionId, session, idempotencyKey) {
  return withTransaction(async (q) => {
    const { rows } = await q(
      `SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE`,
      [subscriptionId]
    );
    const sub = rows[0];
    if (!sub || sub.remaining_exams <= 0) {
      throw new Error("NO_REMAINING_EXAMS");
    }

    await q(
      `UPDATE subscriptions SET remaining_exams = remaining_exams - 1, updated_at = NOW() WHERE id = $1`,
      [subscriptionId]
    );

    await q(
      `INSERT INTO exam_attempt_ledger (user_id, subscription_id, session_id, product_type, exam_index, idempotency_key, remaining_after)
       VALUES ($1, $2, $3, $4::product_type, $5, $6, $7)`,
      [
        userId,
        subscriptionId,
        session.sessionId,
        session.productType,
        session.blueprint?.examIndex || 1,
        idempotencyKey || null,
        sub.remaining_exams - 1,
      ]
    );
  });
}

export async function consumeSubscriptionExamDirect(userId, subscriptionId, productType, examIndex, idempotencyKey) {
  return withTransaction(async (q) => {
    const { rows } = await q(`SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE`, [subscriptionId]);
    const sub = rows[0];
    if (!sub || sub.remaining_exams <= 0) {
      throw new Error("NO_REMAINING_EXAMS");
    }
    const remaining = sub.remaining_exams - 1;
    await q(`UPDATE subscriptions SET remaining_exams = $2, updated_at = NOW() WHERE id = $1`, [
      subscriptionId,
      remaining,
    ]);
    await q(
      `INSERT INTO exam_attempt_ledger (user_id, subscription_id, session_id, product_type, exam_index, idempotency_key, remaining_after)
       VALUES ($1, $2, NULL, $3::product_type, $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [userId, subscriptionId, productType, examIndex, idempotencyKey || null, remaining]
    );
    return remaining;
  });
}

export async function getSubscriptionForUser(userId) {
  const { rows } = await query(
    `SELECT * FROM subscriptions WHERE user_id = $1 AND is_current = TRUE ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function activateSubscription(userId, planType, stripeMeta = {}) {
  const { getPermissionsByPlan, PLAN_EXAM_MAP, PLAN_CREDIT_MAP } = await import(
    "../utils/permissions.js"
  );

  return withTransaction(async (q) => {
    await q(
      `UPDATE subscriptions SET is_current = FALSE WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );

    const endDate =
      planType === "intensive_week"
        ? new Date(Date.now() + 7 * 86400000)
        : planType === "premium_month"
          ? new Date(Date.now() + 30 * 86400000)
          : null;

    const { rows } = await q(
      `INSERT INTO subscriptions (
        user_id, type, status, remaining_exams, permissions, is_current,
        start_date, end_date, metadata
      ) VALUES ($1, $2::subscription_type, 'active', $3, $4::jsonb, TRUE, NOW(), $5, $6::jsonb)
      RETURNING *`,
      [
        userId,
        planType,
        PLAN_EXAM_MAP[planType] || 0,
        JSON.stringify(getPermissionsByPlan(planType)),
        endDate,
        JSON.stringify(stripeMeta),
      ]
    );

    const credits = PLAN_CREDIT_MAP[planType] || 0;
    if (credits > 0) {
      await q(`UPDATE users SET plan = $2::subscription_type, ai_credits = ai_credits + $3 WHERE id = $1`, [
        userId,
        planType,
        credits,
      ]);
      await q(
        `INSERT INTO ai_credits (user_id, amount, balance_after, reason)
         SELECT $1, $2, ai_credits, 'plan_activation' FROM users WHERE id = $1`,
        [userId, credits]
      );
    } else {
      await q(`UPDATE users SET plan = $2::subscription_type WHERE id = $1`, [userId, planType]);
    }

    return rows[0];
  });
}

export async function createCheckoutSession(userId, planType) {
  const { env } = await import("../config/env.js");
  if (!env.stripeSecretKey) {
    return {
      checkoutUrl: null,
      sessionId: `dev_${randomUUID()}`,
      devMode: true,
      planType,
    };
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.stripeSecretKey);
  const priceId = env.stripePrices[planType];
  if (!priceId) {
    throw new Error(`No Stripe price for ${planType}`);
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    metadata: { planType },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.corsOrigin}?checkout=success`,
    cancel_url: `${env.corsOrigin}?checkout=cancel`,
  });
  return { checkoutUrl: session.url, sessionId: session.id };
}
