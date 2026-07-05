# AustriaPath

German language learning platform — daily practice with AI-supported feedback, personalized learning, and exercises for reading, listening, writing, and speaking.

**Figma source:** [AustriaPath Mobile App Screens](https://www.figma.com/design/OezfG34rLab3Rj5SBdLetd/AustriaPath-Mobile-App-Screens)

---

## Quick start

```bash
npm install
cp .env.example .env    # set VITE_ADMIN_EMAIL; leave VITE_ADMIN_INITIAL_PASSWORD empty in prod
npm run dev
npm test                # unit tests (Vitest)
```

Production build:

```bash
npm run build
npm run preview
```

Deploy target: **Vercel** (static SPA + `api/ai/openai.js` serverless).

---

## Environment variables

| Variable | Scope | Required |
|----------|-------|----------|
| `VITE_ADMIN_EMAIL` | Client (public) | Recommended |
| `VITE_ADMIN_INITIAL_PASSWORD` | Client (public) | **Empty in production** |
| `OPENAI_API_KEY` | Server only | For AI features on Vercel |

See [`.env.example`](./.env.example) and [Backend Security Requirements.md](./Backend%20Security%20Requirements.md).

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [AustriaPath_BACKEND_HANDOFF_INDEX.md](./AustriaPath_BACKEND_HANDOFF_INDEX.md) | **Backend dev start here** |
| [openapi.yaml](./openapi.yaml) | OpenAPI 3.1 contract |
| [AustriaPath_Final_Production_Checklist.md](./AustriaPath_Final_Production_Checklist.md) | **Executive status — done vs remaining** |
| [AustriaPath_Knowledge_Base.md](./AustriaPath_Knowledge_Base.md) | Single source of truth — architecture & flows |
| [AustriaPath_Production_Engineering_Package.md](./AustriaPath_Production_Engineering_Package.md) | Backend handoff — auth, API, payments, AI |
| [AustriaPath_Backend_Implementation_Guide.md](./AustriaPath_Backend_Implementation_Guide.md) | Sprint-by-sprint backend build guide |
| [AustriaPath_LocalStorage_Migration_Guide.md](./AustriaPath_LocalStorage_Migration_Guide.md) | DB migration from client storage |
| [AustriaPath_Frontend_Module_Map.md](./AustriaPath_Frontend_Module_Map.md) | Codebase navigation |
| [AustriaPath_Security_Review.md](./AustriaPath_Security_Review.md) | Formal pre-backend security review |
| [AustriaPath_DEPLOYMENT_RUNBOOK.md](./AustriaPath_DEPLOYMENT_RUNBOOK.md) | Vercel deploy procedure |
| [AustriaPath_Legal_Operator_Guide.md](./AustriaPath_Legal_Operator_Guide.md) | Legal placeholder completion |
| [AustriaPath_Frontend_Backend_Integration.md](./AustriaPath_Frontend_Backend_Integration.md) | SPA wiring after API ships |
| [AustriaPath_Database_Schema_v1.1_Addendum.md](./AustriaPath_Database_Schema_v1.1_Addendum.md) | Schema improvements |
| [AustriaPath_Testing_Strategy.md](./AustriaPath_Testing_Strategy.md) | Unit, manual, and API test plan |
| [AustriaPath_Closed_Beta_Launch_Plan.md](./AustriaPath_Closed_Beta_Launch_Plan.md) | Closed beta operations |
| [AustriaPath_Technical_Specification.md](./AustriaPath_Technical_Specification.md) | Master engineering spec |
| [AustriaPath_Database_Schema.md](./AustriaPath_Database_Schema.md) | PostgreSQL blueprint |
| [Launch-Checklist.md](./Launch-Checklist.md) | Pre-launch sign-off |

---

## Project structure

```
src/
  app/           Screens, App.jsx tab router
  ai/            ExaminerMind pipeline
  config/        authConfig, accessControl
  data/          Exam models, subscription engine
  legal/         Consent, legal content
  security/      Client hardening, storage registry
  utils/         Credits, subscription access, preferences
api/
  ai/openai.js   OpenAI proxy (serverless)
```

---

## Current limitations (pre-backend)

- Auth and users: browser `localStorage` only — not multi-device
- Subscriptions: client-side flags — not real payments
- Admin bootstrap: per-browser; see Closed Beta Launch Plan
- Premium enforcement: client-side — backend required for production

---

## License

Private — see [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).
