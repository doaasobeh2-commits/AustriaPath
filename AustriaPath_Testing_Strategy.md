# AustriaPath — Testing Strategy

**Version:** 1.0 · **Date:** 4 July 2026

---

## 1. Current state

| Layer | Tool | Status |
|-------|------|--------|
| Unit | Vitest | ✅ `tests/placementEngine.test.js`, `tests/sanitize.test.js` |
| CI | GitHub Actions | ✅ `.github/workflows/ci.yml` — build + test |
| E2E | — | Not yet |
| API | — | Pending backend |

Run: `npm test` · `npm run test:watch`

---

## 2. Unit test targets (frontend — expand without backend)

| Module | Priority | Cases |
|--------|----------|-------|
| `data/utils/placementEngine.js` | P0 | ✅ Started |
| `security/sanitize.js` | P0 | ✅ Started |
| `utils/subscriptionAccess.js` | P1 | Mock localStorage |
| `utils/aiCredits.js` | P1 | Ledger debit |
| `ai/examinerMind/core/decisionEngine.js` | P1 | Score, conflicts |
| `data/subscriptionEngine.js` | P1 | Permissions per plan |
| `config/accessControl.js` | P2 | Cost map |

---

## 3. Manual QA scripts (pre-beta / pre-launch)

### Auth
1. Register student → login → logout
2. Admin email blocked on register
3. Blocked user cannot login

### Legal
1. Fresh browser → consent required
2. `austriaPathLegalConsent` shape correct

### Premium
1. Select plan → premium hints suppressed
2. Premium exam → report in Profile
3. Credits decrement on AI call

### Placement
1. Full placement flow → `studyPlan` populated

### Admin
1. Admin login → CMS → user management grant plan

---

## 4. Backend test plan (when API exists)

| Suite | Tool | Coverage |
|-------|------|----------|
| Auth | Supertest + Vitest/Jest | Register, login, block, reserved email |
| Credits | Integration | Concurrent debit race |
| Stripe | Stripe CLI | checkout.session.completed |
| GDPR | Integration | Export shape, deletion queue |
| AI proxy | Integration | Auth required, 402 on no credits |

---

## 5. Launch gates

| Gate | Requirement |
|------|-------------|
| Closed beta | Manual QA script passed once |
| Commercial | Unit tests green + API integration + staging E2E |

---

## 6. Browser support

| Browser | Support |
|---------|---------|
| Chrome / Edge (desktop + Android) | Primary |
| Safari iOS | Primary (speech recognition varies) |
| Firefox | Best effort |

Document speech API limitations in release notes — not a test failure.
