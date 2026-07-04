import { Router } from "express";
import express from "express";
import { success } from "../utils/response.js";
import { env } from "../config/env.js";
import { activateSubscription } from "../repositories/subscriptionRepository.js";
import { query } from "../db/client.js";

const router = Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      let event;
      if (env.stripeWebhookSecret && env.stripeSecretKey) {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(env.stripeSecretKey);
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
      } else {
        event = JSON.parse(req.body.toString());
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planType = session.metadata?.planType;
        if (userId && planType) {
          await activateSubscription(userId, planType, { stripeSessionId: session.id });
          await query(
            `INSERT INTO payments (user_id, plan_type, amount_cents, status, stripe_checkout_session_id, stripe_event_id, paid_at)
             VALUES ($1, $2::subscription_type, $3, 'succeeded', $4, $5, NOW())
             ON CONFLICT (stripe_event_id) DO NOTHING`,
            [userId, planType, session.amount_total || 0, session.id, event.id]
          );
        }
      }

      success(res, { received: true, eventId: event.id, processed: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
