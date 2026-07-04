# AustriaPath Backend (Phase H)

Implements Gate 0 Contract Pack `2.0.0-gate0`.

## Deviation notes (documented)

**Embedded PostgreSQL (PGLite)** is used for automated tests when `USE_PGLITE=true` or `NODE_ENV=test` without `DATABASE_URL`. **Production (`NODE_ENV=production`) requires `DATABASE_URL`** and will not start without a valid PostgreSQL connection string. PGLite is never used in production.

**SQL statement splitter** strips leading section comments before emitting statements — required because Gate 0 DDL groups `CREATE TABLE` blocks under `-- section` headers without altering the frozen schema file.

**Rule registry metadata** maps `created_at` → API `updatedAt` on `GET /rule-registry` (snapshots are immutable; no `updated_at` column in schema).

**Password reset / email verification tokens** are stored in `idempotency_records` with route keys `auth:password-reset` and `auth:email-verify` (no dedicated token table in frozen schema).

**Migration import** creates completed exam session + council decision stubs for each legacy report so `exam_reports` FK constraints are satisfied.

**Closed beta registration** — when `BETA_ALLOWED_EMAILS` is set on the server, `POST /auth/register` returns `403` for emails not in the comma-separated list. Login and existing users are unaffected. Unset or empty = unrestricted (dev/test).

## Quick start

```bash
# Optional: Docker PostgreSQL
docker compose up -d

cp .env.example .env
# Set DATABASE_URL=postgresql://austria:austria@localhost:5432/austria_path

npm run server:migrate
npm run server:dev
```

API: `http://localhost:3000/v1`  
Vite proxies `/v1` when `VITE_USE_BACKEND=true`.

## Sprints

| Sprint | Endpoints |
|--------|-----------|
| 1 | `/health`, `/auth/*` |
| 2 | `/exam-sessions/*` |
| 3 | `/reports/*`, `/student-profile` |
| 4 | `/ai/completions`, `/ai/usage` |
| 5 | `/subscription/*`, `/webhooks/stripe` |
| 6 | `/rule-registry/*`, `/admin/examiner-lab/*` |
| 7 | `/migration/import` |

Exam Engine logic is imported from `src/exam-platform/` unchanged.
