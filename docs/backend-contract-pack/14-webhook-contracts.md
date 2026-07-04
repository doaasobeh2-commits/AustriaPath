# 14 — Webhook Contracts

**Contract Pack version:** 2.0.0-gate0

---

## 1. Stripe webhooks

**Endpoint:** `POST /v1/webhooks/stripe`  
**Auth:** Stripe-Signature HMAC verification — no user session

### Supported events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, record payment, grant credits |
| `payment_intent.succeeded` | Confirm payment status |
| `payment_intent.payment_failed` | Mark payment failed |
| `charge.refunded` | Refund flow + credit clawback |
| `customer.subscription.deleted` | Cancel recurring if added later |

---

## 2. Webhook request handling

```
1. Verify Stripe-Signature with STRIPE_WEBHOOK_SECRET
2. Parse event.id → check idempotency (stripe_event_id unique in payments)
3. If duplicate → 200 OK (already processed)
4. BEGIN transaction
5. Process event
6. COMMIT
7. Return 200 { received: true }
```

On processing failure: return `500` so Stripe retries (max 3 days).

---

## 3. checkout.session.completed payload processing

**Extract:**
- `customer`, `client_reference_id` (user UUID)
- `metadata.planType`
- `amount_total`, `currency`
- `subscription` or `payment_intent`

**Actions:**
```sql
INSERT INTO payments (... stripe_event_id ...);
UPDATE subscriptions SET is_current=false WHERE user_id=...;
INSERT INTO subscriptions (active, remaining_exams, permissions, end_date);
UPDATE users SET plan=..., ai_credits=ai_credits + grant;
INSERT INTO ai_credits (plan_activation);
INSERT INTO admin_activity_log;
```

---

## 4. Idempotency

| Key | Storage |
|-----|---------|
| `stripe_event_id` | UNIQUE on `payments` |
| Stripe event ID | Reject duplicate processing |

---

## 5. Internal webhooks (future)

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/webhooks/export-complete` | GDPR export job done |
| `POST /v1/webhooks/deletion-complete` | Purge job done |

Authenticated via `INTERNAL_WEBHOOK_SECRET` header.

---

## 6. Webhook response schema

```json
{
  "success": true,
  "data": {
    "received": true,
    "eventId": "evt_...",
    "processed": true
  }
}
```

Errors log to admin monitoring — never expose internal errors to Stripe response body details.

---

## 7. Environment variables

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | API calls |
| `STRIPE_WEBHOOK_SECRET` | Signature verification |
| `STRIPE_PRICE_PLACEMENT` | Price ID map |
| `STRIPE_PRICE_WEEKLY_PLAN` | |
| `STRIPE_PRICE_AI_EXAM` | |
| `STRIPE_PRICE_INTENSIVE_WEEK` | |
| `STRIPE_PRICE_PREMIUM_MONTH` | |

---

## 8. Testing

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/v1/webhooks/stripe
stripe trigger checkout.session.completed
```

Contract tests must verify idempotent double-delivery.
