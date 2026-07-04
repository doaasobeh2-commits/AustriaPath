# API contracts (frontend)

**Gate 0:** The master API specification lives in [`docs/backend-contract-pack/`](../docs/backend-contract-pack/README.md).

This folder retains route constants for SPA integration:

- `endpoints.js` — path constants (extend with `/exam-sessions`, `/student-profile`, `/rule-registry`)
- `contracts.js` — legacy JSDoc types; canonical enums align with `docs/backend-contract-pack/schemas/enums.json`

When implementing Phase H:

1. Add `httpClient.js` per integration guide
2. Add repository ports matching OpenAPI paths
3. Use `practice_heuristic` (not `training_heuristic`) for evaluation method

Do not implement backend logic in this folder.
