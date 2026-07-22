-- AustriaPath Backend Contract Pack — PostgreSQL DDL
-- Deploy bundle copy (preferred at runtime). Canonical spec: docs/backend-contract-pack/02-database-schema.sql
-- Version: 2.0.0-gate0
-- Target: PostgreSQL 15+
-- Status: FROZEN specification — implement as Flyway/Liquibase migration 001+

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('student', 'admin', 'examiner');
CREATE TYPE user_status AS ENUM ('approved', 'blocked');
CREATE TYPE email_verification_status AS ENUM ('pending', 'verified');
CREATE TYPE level_source AS ENUM ('self_selected', 'placement_test', 'admin_changed', 'admin_allowed_levels', 'system_admin');

CREATE TYPE product_type AS ENUM ('placement_test', 'weekly_plan', 'ai_exam', 'intensive_week', 'premium_month');
CREATE TYPE exam_mode AS ENUM ('diagnostic', 'practice', 'exam');
CREATE TYPE skill_id AS ENUM ('writing', 'reading', 'listening', 'picture_description', 'planning', 'discussion', 'self_introduction');
CREATE TYPE cefr_label AS ENUM ('A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+');
CREATE TYPE difficulty_band AS ENUM ('leicht', 'mittel', 'stark');
CREATE TYPE readiness_band AS ENUM ('building', 'developing', 'approaching', 'strong');
CREATE TYPE timing_policy AS ENUM ('soft', 'hard');
CREATE TYPE evaluation_method AS ENUM ('examiner_mind', 'practice_heuristic', 'rule_placement', 'pending_human_review', 'llm_conversational');
CREATE TYPE exam_session_status AS ENUM ('pending', 'active', 'awaiting_review', 'completed', 'cancelled', 'expired');

CREATE TYPE subscription_type AS ENUM ('free', 'placement_test', 'weekly_plan', 'ai_exam', 'intensive_week', 'premium_month');
CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'expired', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled');

CREATE TYPE lab_queue_status AS ENUM ('pending', 'in_review', 'resolved');
CREATE TYPE lab_action_type AS ENUM ('approve', 'reject', 'correct', 'propose_rule');
CREATE TYPE human_review_status AS ENUM ('pending', 'confirmed', 'corrected', 'disputed');
CREATE TYPE rule_proposal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE rule_proposal_action AS ENUM ('add', 'modify', 'deprecate');
CREATE TYPE registry_patch_type AS ENUM ('append_scoring_rule', 'append_examiner_check', 'append_common_mistake', 'add_critical_rule');

CREATE TYPE ai_credit_reason AS ENUM (
  'registration_default', 'plan_activation', 'admin_grant', 'admin_reset',
  'placement_test', 'weekly_plan', 'ai_exam', 'intensive_week_session',
  'premium_month_session', 'report_builder', 'follow_up_question', 'llm_proposal', 'refund_clawback'
);
CREATE TYPE ai_gateway_mode AS ENUM ('examiner_judge', 'llm_proposal', 'conversational', 'report_narrative');

CREATE TYPE export_request_status AS ENUM ('pending', 'processing', 'ready', 'downloaded', 'expired', 'failed');
CREATE TYPE deletion_request_status AS ENUM ('pending', 'verified', 'processing', 'completed', 'cancelled', 'failed');

-- ─── USERS & AUTH ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 CITEXT NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  role                  user_role NOT NULL DEFAULT 'student',
  status                user_status NOT NULL DEFAULT 'approved',
  level                 cefr_label NOT NULL DEFAULT 'B1',
  allowed_levels        cefr_label[] NOT NULL DEFAULT '{A2,B1}',
  level_source          level_source NOT NULL DEFAULT 'self_selected',
  plan                  subscription_type NOT NULL DEFAULT 'free',
  ai_credits            INTEGER NOT NULL DEFAULT 5 CHECK (ai_credits >= 0),
  used_ai_credits       INTEGER NOT NULL DEFAULT 0 CHECK (used_ai_credits >= 0),
  email_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_status email_verification_status NOT NULL DEFAULT 'pending',
  email_verified_at     TIMESTAMPTZ,
  user_code             VARCHAR(20),
  source                VARCHAR(50) NOT NULL DEFAULT 'E-Mail',
  notes                 TEXT,
  stripe_customer_id    VARCHAR(255),
  last_login_at         TIMESTAMPTZ,
  trial_started_at      TIMESTAMPTZ,
  trial_expires_at      TIMESTAMPTZ,
  is_access_approved    BOOLEAN NOT NULL DEFAULT FALSE,
  last_ai_usage_at      TIMESTAMPTZ,
  legacy_client_id      VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  CONSTRAINT users_email_active UNIQUE (email) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX idx_users_role_status ON users (role, status);
CREATE INDEX idx_users_plan ON users (plan) WHERE plan != 'free';
CREATE INDEX idx_users_stripe ON users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name          VARCHAR(255) NOT NULL,
  language              VARCHAR(50) NOT NULL DEFAULT 'Deutsch',
  profile_image_url     TEXT,
  placement_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  placement_profile     JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash            VARCHAR(255) NOT NULL,
  refresh_token_hash    VARCHAR(255),
  ip_address            INET,
  user_agent            TEXT,
  expires_at            TIMESTAMPTZ NOT NULL,
  refresh_expires_at    TIMESTAMPTZ,
  revoked_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions (user_id, expires_at DESC);
CREATE INDEX idx_auth_sessions_token ON auth_sessions (token_hash);

-- ─── STUDENT LEARNING PROFILE (V2) ───────────────────────────────────────────

CREATE TABLE student_learning_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_version       VARCHAR(20) NOT NULL DEFAULT '2.0.0',
  official_exam_level   cefr_label NOT NULL DEFAULT 'A2',
  official_skill_levels JSONB NOT NULL DEFAULT '{}',
  weak_skills           TEXT[] NOT NULL DEFAULT '{}',
  recurring_mistakes    TEXT[] NOT NULL DEFAULT '{}',
  readiness_band        readiness_band,
  global_used_model_ids TEXT[] NOT NULL DEFAULT '{}',
  active_package        JSONB,
  exam_history          JSONB NOT NULL DEFAULT '[]',
  practice_history      JSONB NOT NULL DEFAULT '[]',
  practice_stats        JSONB NOT NULL DEFAULT '{}',
  report_summaries      JSONB NOT NULL DEFAULT '[]',
  ai_recommendations    TEXT[] NOT NULL DEFAULT '{}',
  learning_trends       JSONB NOT NULL DEFAULT '[]',
  subscription_snapshot JSONB,
  profile_json          JSONB NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slp_user ON student_learning_profiles (user_id);
CREATE INDEX idx_slp_official_level ON student_learning_profiles (official_exam_level);

-- ─── SUBSCRIPTIONS & PAYMENTS ────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                        subscription_type NOT NULL,
  status                      subscription_status NOT NULL DEFAULT 'inactive',
  remaining_exams             INTEGER NOT NULL DEFAULT 0 CHECK (remaining_exams >= 0),
  permissions                 JSONB NOT NULL DEFAULT '{}',
  start_date                  TIMESTAMPTZ,
  end_date                    TIMESTAMPTZ,
  purchased_at                TIMESTAMPTZ,
  valid_until                 TIMESTAMPTZ,
  stripe_subscription_id      VARCHAR(255),
  stripe_price_id             VARCHAR(255),
  stripe_checkout_session_id  VARCHAR(255),
  is_current                  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_current ON subscriptions (user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_subscriptions_status ON subscriptions (status);

CREATE TABLE payments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subscription_id             UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_type                   subscription_type NOT NULL,
  amount_cents                INTEGER NOT NULL,
  currency                    CHAR(3) NOT NULL DEFAULT 'EUR',
  status                      payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id    VARCHAR(255),
  stripe_checkout_session_id  VARCHAR(255),
  stripe_customer_id          VARCHAR(255),
  stripe_event_id             VARCHAR(255),
  failure_reason              TEXT,
  paid_at                     TIMESTAMPTZ,
  refunded_at                 TIMESTAMPTZ,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_stripe_pi_unique UNIQUE (stripe_payment_intent_id),
  CONSTRAINT payments_stripe_event_unique UNIQUE (stripe_event_id)
);

CREATE INDEX idx_payments_user ON payments (user_id, created_at DESC);

CREATE TABLE exam_attempt_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id       UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  session_id            UUID,
  product_type          product_type NOT NULL,
  exam_index            INTEGER NOT NULL DEFAULT 1,
  idempotency_key       VARCHAR(64),
  consumed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remaining_after       INTEGER NOT NULL,
  CONSTRAINT exam_attempt_ledger_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_exam_attempt_user ON exam_attempt_ledger (user_id, consumed_at DESC);

-- ─── EXAM SESSIONS ───────────────────────────────────────────────────────────

CREATE TABLE exam_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id       UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  product_type          product_type NOT NULL,
  mode                  exam_mode NOT NULL,
  status                exam_session_status NOT NULL DEFAULT 'pending',
  blueprint             JSONB NOT NULL,
  current_section_index INTEGER NOT NULL DEFAULT 0,
  answers               JSONB NOT NULL DEFAULT '[]',
  evaluations           JSONB NOT NULL DEFAULT '[]',
  rules_version         VARCHAR(64) NOT NULL,
  catalog_version       VARCHAR(64),
  exam_index            INTEGER,
  exam_total            INTEGER,
  started_at            TIMESTAMPTZ,
  deadline_at           TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  idempotency_key       VARCHAR(64),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exam_sessions_start_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_exam_sessions_user_status ON exam_sessions (user_id, status);
CREATE INDEX idx_exam_sessions_deadline ON exam_sessions (deadline_at) WHERE status = 'active';

-- ─── COUNCIL & REPORTS ───────────────────────────────────────────────────────

CREATE TABLE council_decisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_json         JSONB NOT NULL,
  overall_score         INTEGER NOT NULL,
  cefr_level            cefr_label NOT NULL,
  confidence            INTEGER NOT NULL,
  needs_human_review    BOOLEAN NOT NULL DEFAULT FALSE,
  human_review_reason   TEXT,
  rules_version         VARCHAR(64) NOT NULL,
  examiner_mind_version VARCHAR(32) NOT NULL,
  decided_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id            UUID NOT NULL UNIQUE REFERENCES exam_sessions(id) ON DELETE RESTRICT,
  council_decision_id   UUID NOT NULL REFERENCES council_decisions(id) ON DELETE RESTRICT,
  product_type          product_type NOT NULL,
  mode                  exam_mode NOT NULL,
  evaluation_method     evaluation_method NOT NULL,
  schema_version        VARCHAR(20) NOT NULL DEFAULT '2.0.0',
  cefr_level            cefr_label NOT NULL,
  overall_score         INTEGER NOT NULL,
  confidence            INTEGER NOT NULL,
  readiness_band        readiness_band,
  skill_results         JSONB NOT NULL DEFAULT '{}',
  strengths             TEXT[] NOT NULL DEFAULT '{}',
  weaknesses            TEXT[] NOT NULL DEFAULT '{}',
  recurring_mistakes      TEXT[] NOT NULL DEFAULT '{}',
  focus_areas             TEXT[] NOT NULL DEFAULT '{}',
  summary                 TEXT NOT NULL,
  recommendations         TEXT[] NOT NULL DEFAULT '{}',
  study_advice              TEXT[] NOT NULL DEFAULT '{}',
  improvement_priorities    TEXT[] NOT NULL DEFAULT '{}',
  weekly_focus_skills       skill_id[],
  weekly_plan_mapping       TEXT[],
  human_review              JSONB,
  report_json               JSONB NOT NULL,
  rules_version             VARCHAR(64) NOT NULL,
  blueprint_id              VARCHAR(128) NOT NULL,
  legacy_adapter_key        VARCHAR(64),
  is_superseded             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_reports_user ON exam_reports (user_id, created_at DESC);
CREATE INDEX idx_exam_reports_product ON exam_reports (product_type);

CREATE TABLE report_revisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID NOT NULL REFERENCES exam_reports(id) ON DELETE CASCADE,
  lab_resolution_id     UUID,
  revision_number       INTEGER NOT NULL,
  previous_report_json  JSONB NOT NULL,
  revised_report_json   JSONB NOT NULL,
  human_review_status   human_review_status NOT NULL,
  revised_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rationale             TEXT,
  student_notified_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_revisions_unique UNIQUE (report_id, revision_number)
);

-- ─── RULE REGISTRY ───────────────────────────────────────────────────────────

CREATE TABLE rule_registry_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_version      VARCHAR(64) NOT NULL UNIQUE,
  schema_version        VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  registry_json         JSONB NOT NULL,
  is_current            BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_registry_current ON rule_registry_snapshots (is_current) WHERE is_current = TRUE;

CREATE TABLE rule_registry_promotions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_snapshot_id  UUID NOT NULL REFERENCES rule_registry_snapshots(id) ON DELETE RESTRICT,
  promotion_id            VARCHAR(128) NOT NULL,
  source_lab_item_id      UUID,
  lab_resolution_id       UUID,
  approved_by             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_at             TIMESTAMPTZ NOT NULL,
  skill                   skill_id,
  level                   cefr_label,
  rule_text               TEXT NOT NULL,
  structured_patch        JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rule_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id           VARCHAR(128) NOT NULL UNIQUE,
  lab_item_id           UUID,
  proposed_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  proposed_at           TIMESTAMPTZ NOT NULL,
  action                rule_proposal_action NOT NULL,
  target_path           TEXT NOT NULL,
  payload               JSONB NOT NULL,
  rationale             TEXT NOT NULL,
  status                rule_proposal_status NOT NULL DEFAULT 'pending',
  conflicts_with        TEXT[] NOT NULL DEFAULT '{}',
  reviewed_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EXAMINER LAB ────────────────────────────────────────────────────────────

CREATE TABLE examiner_lab_queue_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_item_id           VARCHAR(128) NOT NULL UNIQUE,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  report_id             UUID NOT NULL REFERENCES exam_reports(id) ON DELETE CASCADE,
  session_id            UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  council_decision_id   UUID NOT NULL REFERENCES council_decisions(id) ON DELETE RESTRICT,
  section_evaluations   JSONB NOT NULL,
  council_decision      JSONB NOT NULL,
  status                lab_queue_status NOT NULL DEFAULT 'pending',
  classification        VARCHAR(64),
  student_review_status human_review_status,
  queued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_queue_status ON examiner_lab_queue_items (status, queued_at DESC);

CREATE TABLE lab_resolutions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_item_id           UUID NOT NULL REFERENCES examiner_lab_queue_items(id) ON DELETE CASCADE,
  action                lab_action_type NOT NULL,
  reviewer_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rationale             TEXT,
  corrected_decision    JSONB,
  rule_proposal         JSONB,
  promotion_id          UUID REFERENCES rule_registry_promotions(id) ON DELETE SET NULL,
  resolved_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_resolutions_item ON lab_resolutions (lab_item_id, resolved_at DESC);

-- ─── AI ──────────────────────────────────────────────────────────────────────

CREATE TABLE ai_credits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount                INTEGER NOT NULL,
  balance_after         INTEGER NOT NULL,
  reason                ai_credit_reason NOT NULL,
  service_type          VARCHAR(50),
  reference_type        VARCHAR(50),
  reference_id          UUID,
  description           TEXT,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_credits_user ON ai_credits (user_id, created_at DESC);

CREATE TABLE ai_completion_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id            UUID REFERENCES exam_sessions(id) ON DELETE SET NULL,
  mode                  ai_gateway_mode NOT NULL,
  service_type          VARCHAR(50),
  skill                 skill_id,
  level                 cefr_label,
  model_name            VARCHAR(64) NOT NULL,
  prompt_tokens         INTEGER NOT NULL DEFAULT 0,
  completion_tokens     INTEGER NOT NULL DEFAULT 0,
  total_tokens          INTEGER NOT NULL DEFAULT 0,
  credits_charged       INTEGER NOT NULL DEFAULT 0,
  latency_ms            INTEGER,
  success               BOOLEAN NOT NULL,
  error_code            VARCHAR(64),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_completion_user ON ai_completion_logs (user_id, created_at DESC);

-- ─── GDPR & ADMIN ────────────────────────────────────────────────────────────

CREATE TABLE legal_consents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at           TIMESTAMPTZ NOT NULL,
  privacy_version       VARCHAR(20) NOT NULL,
  terms_version         VARCHAR(20) NOT NULL,
  ip_address            INET,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE data_export_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                export_request_status NOT NULL DEFAULT 'pending',
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at          TIMESTAMPTZ,
  download_url          TEXT,
  download_expires_at   TIMESTAMPTZ,
  file_size_bytes       BIGINT,
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_deletion_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                deletion_request_status NOT NULL DEFAULT 'pending',
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_token_hash VARCHAR(255),
  verified_at           TIMESTAMPTZ,
  scheduled_purge_at    TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  reason                TEXT,
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_activity_log (
  id                    BIGSERIAL PRIMARY KEY,
  actor_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  action                VARCHAR(100) NOT NULL,
  details               TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  ip_address            INET,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idempotency_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key       VARCHAR(64) NOT NULL UNIQUE,
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint              VARCHAR(255) NOT NULL,
  request_hash          VARCHAR(64) NOT NULL,
  response_status       INTEGER NOT NULL,
  response_body         JSONB NOT NULL,
  expires_at            TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_expires ON idempotency_records (expires_at);

CREATE TABLE user_messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind                  VARCHAR(32) NOT NULL DEFAULT 'system',
  source_type           VARCHAR(64) NOT NULL,
  source_id             VARCHAR(128) NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  subtitle              VARCHAR(255),
  snapshot              JSONB NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_messages_source_unique UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX idx_user_messages_user_created
  ON user_messages (user_id, created_at DESC);

-- ─── CONTENT (legacy examiner_rules parity) ──────────────────────────────────

CREATE TABLE examiner_content_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id             VARCHAR(100),
  level                 cefr_label NOT NULL,
  skill                 VARCHAR(50) NOT NULL,
  difficulty            difficulty_band NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  content_json          JSONB NOT NULL DEFAULT '{}',
  status                VARCHAR(20) NOT NULL DEFAULT 'active',
  version               INTEGER NOT NULL DEFAULT 1,
  source_lab_item_id    UUID,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_examiner_content_level_skill ON examiner_content_rules (level, skill);

-- ─── WEEKLY PLANS (supplementary) ────────────────────────────────────────────

CREATE TABLE weekly_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level                 cefr_label NOT NULL,
  plan_json             JSONB NOT NULL,
  status                VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weekly_plans_user ON weekly_plans (user_id);

-- ─── TRIGGERS: updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_slp_updated BEFORE UPDATE ON student_learning_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_exam_sessions_updated BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_exam_reports_updated BEFORE UPDATE ON exam_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_lab_queue_updated BEFORE UPDATE ON examiner_lab_queue_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
