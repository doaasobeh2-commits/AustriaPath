# AustriaPath Database Schema — v1.1 Addendum

**Date:** 4 July 2026  
**Applies to:** [AustriaPath_Database_Schema.md](./AustriaPath_Database_Schema.md) v1.0  
**Action:** Apply these changes when implementing migrations

---

## 1. New enum: `evaluation_method`

```sql
CREATE TYPE evaluation_method AS ENUM (
  'examiner_mind',
  'training_heuristic',
  'llm_conversational',
  'rule_placement'
);
```

Aligns with `src/api/contracts.js` → `EVALUATION_METHODS` and EC-06 recommendation.

---

## 2. Column additions

### `ai_reports`

```sql
ALTER TABLE ai_reports
  ADD COLUMN evaluation_method evaluation_method NOT NULL DEFAULT 'examiner_mind',
  ADD COLUMN package_type VARCHAR(50),
  ADD COLUMN exam_number INTEGER,
  ADD COLUMN package_exam_total INTEGER;
```

Maps frontend report fields from `PremiumExamSessionScreen`.

### `weekly_plan_reports`

```sql
ALTER TABLE weekly_plan_reports
  ADD COLUMN evaluation_method evaluation_method NOT NULL DEFAULT 'training_heuristic',
  ADD COLUMN parts_count INTEGER DEFAULT 0,
  ADD COLUMN next_recommendation TEXT;
```

### `users`

```sql
ALTER TABLE users
  ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN email_verified_at TIMESTAMPTZ,
  ADD COLUMN last_login_at TIMESTAMPTZ;
```

### `subscriptions`

```sql
ALTER TABLE subscriptions
  ADD COLUMN stripe_subscription_id VARCHAR(255),
  ADD COLUMN stripe_price_id VARCHAR(255);
```

---

## 3. Plan type alignment

Ensure `plan_type` enum includes:

```sql
-- Verify exists:
'placement_test', 'weekly_plan', 'ai_exam', 'intensive_week', 'premium_month'
```

Maps `SubscriptionScreen` `planMeta.type` via `clientSubscription.js` PLAN_TYPE_MAP.

---

## 4. Index additions

```sql
CREATE INDEX idx_ai_reports_eval_method ON ai_reports (user_id, evaluation_method);
CREATE INDEX idx_users_stripe_customer ON users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
```

---

## 5. `sessions` table (recommended for Sprint 1)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);
```

Store hashed session token only — never raw token in DB.

---

## 6. Migration note

Do **not** import plaintext passwords from `austriaPathUsers`. Force password reset or admin bootstrap on cutover.

See [LocalStorage Migration Guide](./AustriaPath_LocalStorage_Migration_Guide.md).
