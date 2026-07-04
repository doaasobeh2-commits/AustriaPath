# AustriaPath — Frontend Module Map

**Version:** 1.0 · **Date:** 4 July 2026

---

## Entry & routing

| File | Role |
|------|------|
| `src/main.jsx` | Bootstrap, `initFrontendSecurity()` |
| `src/app/App.jsx` | Tab router, auth gates, lazy admin screens |

---

## Auth & access

| File | Role |
|------|------|
| `src/app/userAccess.js` | Users registry, login, register, session |
| `src/config/authConfig.js` | Admin email, seed password (deprecated prod) |
| `src/config/accessControl.js` | Credits, costs, statuses |
| `src/security/routeGuard.js` | Admin tab ACL |
| `src/security/sessionIntegrity.js` | Client fingerprint |
| `src/utils/subscriptionAccess.js` | Canonical premium detection |
| `src/utils/clientSubscription.js` | Sync plan to user record (beta) |

---

## AI

| Path | Role |
|------|------|
| `src/ai/examinerMind/runExaminerMind.js` | Evaluation entry |
| `src/ai/examinerMind/core/*` | Brain, Council, DecisionEngine |
| `src/ai/examinerMind/judges/*` | Rule judges |
| `src/ai/examinerMind/learning/modelRouter.js` | OpenAI vs rule routing |
| `src/security/secureOpenAI.js` | Browser → proxy client |
| `api/ai/openai.js` | Vercel serverless proxy |

---

## Premium & subscriptions

| File | Role |
|------|------|
| `src/app/screens/SubscriptionScreen.jsx` | Plan selection (beta: no payment) |
| `src/data/subscriptionEngine.js` | Permissions, grantPlan, credits |
| `src/utils/aiCredits.js` | Runtime credit check/debit |
| `src/data/premiumExamBuilder.js` | Premium exam assembly |

---

## Data & content

| Path | Role |
|------|------|
| `src/data/modelsA2.js`, `modelsb1/`, `modelsB2.js` | Writing models |
| `src/data/b1LesenModels.js`, etc. | Lesen/Hören |
| `src/data/aiPremiumLibrary.js` | AI-Prüfer seeds |
| `src/utils/adminContent.js` | CMS helper |

---

## Legal & compliance

| File | Role |
|------|------|
| `src/legal/legalContent.js` | In-app legal text |
| `src/legal/consent.js` | Consent storage |
| `src/app/screens/LegalConsentScreen.jsx` | First-launch gate |

---

## API integration (future)

| File | Role |
|------|------|
| `src/api/endpoints.js` | Route constants for backend |

---

## Screens by domain

| Domain | Screens |
|--------|---------|
| Training | Home, Practice, Lesen, Hören, Writing, Speaking, Images, Planning, Akademie |
| Exams | IntelligentExam, PremiumExam, PremiumExamSession, PlacementTest |
| Premium AI | AISession, WeeklyPlanSetup, Subscription, Profile |
| Admin | AdminScreen, UserManagement, ExaminerLab, AIPruefer (lazy-loaded) |
| Auth | AuthWelcome, Login, Register, ForgotPassword, AccountSettings |

---

See [Knowledge Base](./AustriaPath_Knowledge_Base.md) for flow diagrams.
