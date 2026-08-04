/**
 * Anonymous Community Q&A tables.
 */

import { query } from "./client.js";

const MIGRATION_ID = "003_community_qa_v1";

export async function runCommunityQaMigration() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS community_questions (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level             VARCHAR(8),
      title             VARCHAR(200) NOT NULL,
      body              TEXT NOT NULL,
      status            VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'answered', 'closed')),
      visibility        VARCHAR(16) NOT NULL DEFAULT 'public'
        CHECK (visibility IN ('public', 'hidden', 'removed')),
      answer_count      SMALLINT NOT NULL DEFAULT 0
        CHECK (answer_count >= 0 AND answer_count <= 3),
      owner_archived_at TIMESTAMPTZ,
      closed_at         TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS community_answers (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id       UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
      author_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_type       VARCHAR(16) NOT NULL DEFAULT 'member'
        CHECK (author_type IN ('member', 'admin')),
      body              TEXT NOT NULL,
      visibility        VARCHAR(16) NOT NULL DEFAULT 'public'
        CHECK (visibility IN ('public', 'hidden', 'removed')),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT community_answers_one_per_user UNIQUE (question_id, author_user_id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_community_questions_public_feed
      ON community_questions (created_at DESC)
      WHERE visibility = 'public' AND status IN ('open', 'answered', 'closed')
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_community_questions_owner
      ON community_questions (author_user_id, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_community_answers_question
      ON community_answers (question_id, created_at ASC)
  `);

  const { rows: applied } = await query(
    `SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1`,
    [MIGRATION_ID]
  );
  if (applied.length) return;

  await query(`INSERT INTO schema_migrations (id) VALUES ($1)`, [MIGRATION_ID]);
}
