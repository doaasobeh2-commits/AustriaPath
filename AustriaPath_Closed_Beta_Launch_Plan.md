# AustriaPath — Closed Beta Launch Plan

**Document version:** 1.0  
**Last updated:** 4 July 2026  
**Status:** Operational plan — no implementation authorized by this document  
**Goal:** Run a **safe closed beta/demo** before backend, Stripe, and production hardening  

---

## What “Closed Beta” Means for AustriaPath

| In scope | Out of scope |
|----------|--------------|
| Invite-only testers (small group, known identities) | Public registration link, ads, App Store |
| Admin-granted or self-register with **no payment** | Charging money or displaying prices as “buy now” |
| Browser-local data with **informed consent** | Claiming GDPR-compliant account deletion/export |
| Demo AI + rule-based ExaminerMind for feedback | Official ÖIF certification or examiner equivalence |
| Single deployment URL (Vercel) with `noindex` | SEO, mass marketing, press release |

**Success criteria for closed beta:** Testers can register, accept legal terms, practice, run a premium-style AI exam path, see a report in Profile, and you can administer users via Admin — **without** security incidents, billing disputes, or misleading “production” claims.

---

## 1. What Must Be Completed Before Closed Beta

Complete these **before** sending the URL to the first tester. Items marked *(pending)* refer to the uncommitted change set.

### A. Legal minimum (non-negotiable)

| # | Task | How to verify |
|---|------|---------------|
| 1 | Fill **Impressum** placeholders in `src/legal/legalContent.js` — real name/address, working contact email | Open Impressum from consent screen; no `[… eintragen]` left |
| 2 | Deploy **legal consent flow** *(pending)* — `LegalConsentScreen`, register checkbox, Account Settings links | Fresh browser → consent gate before app; re-consent after bumping `LEGAL_VERSIONS` |
| 3 | Add **closed-beta disclaimer** to Datenschutz or a short Beta-Hinweis page (copy only): data is browser-local, no payment, AI is assistive not official | Legal text visible from footer links |
| 4 | Send testers a **written beta agreement** (email is enough): no payment, data may be lost on cache clear, feedback welcome, not for certification | Email template ready |

You do **not** need full counsel sign-off for a 5–10 person internal beta, but you **do** need real operator identity in Impressum and honest disclosure.

### B. Deployment minimum

| # | Task | How to verify |
|---|------|---------------|
| 5 | Deploy to Vercel (or equivalent) with **`OPENAI_API_KEY`** set server-side only | Intelligent Exam / report builder returns real AI text, not only demo fallback |
| 6 | **`VITE_ADMIN_INITIAL_PASSWORD` empty** in production env | Build has no embedded admin password; `envValidation` would warn in dev only |
| 7 | Set **`VITE_ADMIN_EMAIL`** to your admin account (not a shared tester email) | Only that email can be admin |
| 8 | Confirm **`vercel.json`** security headers deploy *(pending)* | Response headers include CSP, X-Frame-Options |
| 9 | Keep **`robots: noindex`** in `index.html` | Page not indexed |
| 10 | **Commit and tag** beta baseline — legal, security, docs *(37 pending files)* | Git tag e.g. `closed-beta-0.1` so rollback is possible |

### C. Access control for beta

| # | Task | How to verify |
|---|------|---------------|
| 11 | **Do not publish the URL** on social media or landing pages | URL shared only by direct invite |
| 12 | Create admin account manually on first deploy (seed or register + promote in `austriaPathUsers`) | Admin login → Admin tab visible |
| 13 | Decide tester onboarding: **(a)** self-register + you approve in User Management, or **(b)** you create accounts | Document chosen process for support |
| 14 | Optionally **block** unknown registrations: only pre-approved emails (manual for beta — check User Management daily) | Rejected/blocked test if needed |

### D. OpenAI cost protection (minimum without full backend)

| # | Task | How to verify |
|---|------|---------------|
| 15 | Set **OpenAI usage limits** in OpenAI dashboard (hard monthly cap + alert) | Alert email configured |
| 16 | Share beta URL **only with trusted testers** (proxy has no auth today) | Treat URL as semi-secret |
| 17 | Monitor OpenAI usage **daily** during first week | Spreadsheet or dashboard check |

### E. Product honesty (copy/config, not new features)

| # | Task | How to verify |
|---|------|---------------|
| 18 | Communicate to testers: **Premium is unlocked without payment** for beta only | Beta invite email states this |
| 19 | Know which flows are **demo-labeled in UI** (see Section 2) | Walkthrough done once before invite |

---

## 2. What Must Be Disabled or Clearly Labeled as Demo/Beta

The app already contains demo copy in several places. **Do not remove it for beta** — it protects you. Ensure testers see it or you mention it in the invite.

### Already labeled in UI (keep visible)

| Screen / area | Label / behavior |
|---------------|------------------|
| `PremiumExamSessionScreen` | “Später” AI audio, transcription, interactive conversation |
| `PremiumExamParts` / `PremiumExamScreen` | “Demo: Antwort hier schreiben…” |
| `AISessionScreen` | “Später wird hier echte Aufnahme…” |
| `WeeklyPlanSessionScreen` | “Später: echte Aufnahme…” |
| `PlacementTestScreen` | “Nur für Testphase… später OpenAI” |
| `IntelligentExamScreen` | “Demo Bewertung” when proxy fails |

### Must be treated as beta in **communications** (even if UI shows prices)

| Feature | Beta treatment |
|---------|----------------|
| **SubscriptionScreen** (€2–€39.99) | **Do not call this “purchase.”** Tell testers: “Tap plan to unlock features — no charge in beta.” Consider adding a banner *(future, needs approval)* — for now: **beta email + verbal** |
| **Forgot password** | Fake success — tell testers: “Password reset not available; contact admin” |
| **Email verification** | Not enforced — tell testers registration works immediately |
| **Examiner Lab** | “Correct / Wrong / New Rule” buttons **do nothing** — admin view-only |
| **Intelligent Exam multi-turn** | May fall back to demo if proxy doesn’t receive `messages` — test before beta |
| **Scores in Profile** | Mixed sources (ExaminerMind vs heuristics vs demo) — label as **feedback**, not official grades |

### Recommended beta-only messaging (invite email / README for testers)

> AustriaPath Closed Beta — Browser demo. No payment. Data stays on your device and can be lost if you clear browser data. AI feedback is for learning only, not an official ÖIF result. Some speaking/audio features are placeholders.

---

## 3. Security Risks Acceptable for Closed Beta

Acceptable **only** with invite-only access, small group, and the mitigations below.

| Risk | Why acceptable short-term | Required mitigation |
|------|---------------------------|---------------------|
| Passwords stored in **plaintext** in browser localStorage | Small trusted group | ≤10–20 testers; unique beta passwords; no real email passwords; destroy data after beta |
| **No server auth** — roles/premium editable in DevTools | Testers aren’t adversaries | Admin grants; don’t rely on credits for billing; monitor abuse |
| **OpenAI proxy unauthenticated** | URL not public | Secret URL; OpenAI hard cap; rotate URL if leaked |
| **Session integrity** is weak (client fingerprint) | Not relied on for beta | Don’t claim “secure sessions” |
| **No GDPR export/delete API** | Minimal PII; informed consent | Beta agreement; delete user in Admin User Management; advise cache clear |
| **Admin password in localStorage** | Single admin operator | Strong admin password; private device |
| **Data loss** on cache clear | Expected for SPA demo | Warn testers in writing |

### Not acceptable even for closed beta

| Stop if |
|---------|
| Impressum still has placeholders |
| Production deploy has `VITE_ADMIN_INITIAL_PASSWORD` set |
| You are **charging money** without Stripe |
| Public URL posted where bots can hit `/api/ai/openai` |
| Testers are minors without parental consent process |
| You claim “GDPR-compliant deletion” or “secure payment” |

---

## 4. What Must NOT Be Marketed as Production-Ready

Do **not** say or imply the following in beta invites, landing pages, or screenshots:

| Claim | Reality |
|-------|---------|
| “Buy Premium” / “Subscribe now” | No Stripe; click grants access |
| “Official ÖIF exam” / “Certified result” | Independent prep tool; EC-19 |
| “Secure cloud account” / “Sync across devices” | localStorage only |
| “Password reset via email” | Stub UI |
| “Verified email required” | Not enforced |
| “Full speaking exam with AI examiner audio” | Demo placeholders |
| “Human examiner reviewed your answer” | Rule-based + optional OpenAI |
| “GDPR data export on request” | Not implemented server-side |
| “Production-grade security” | Client-side guards only |
| Specific **score** as pass/fail for visa or citizenship | Orientation/learning only |

**Safe wording:** “AI-assisted ÖIF-style practice,” “closed beta,” “feedback for learning,” “simulated exam experience.”

---

## 5. How to Test (Manual QA Scripts)

Run these **once on the production beta URL** as admin, then once as a fresh tester account.

### 5.1 Legal consent

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open beta URL in **incognito** | Onboarding → Legal consent *(if pending deployed)* |
| 2 | Open Datenschutz / AGB links without accepting | Full text; Impressum has real contact |
| 3 | Try Continue without checkbox | Alert blocked |
| 4 | Accept consent | Reaches auth welcome |
| 5 | DevTools → Application → localStorage → `austriaPathLegalConsent` | Only `acceptedAt`, `privacyVersion`, `termsVersion` |
| 6 | Bump `LEGAL_VERSIONS` in dev, redeploy, revisit | Consent screen shown again |

### 5.2 Login & registration

| Step | Action | Expected |
|------|--------|----------|
| 1 | Register new student (unique email) | Success; checkbox required |
| 2 | Log out; log in with same credentials | Home tab |
| 3 | Wrong password | Error message; no login |
| 4 | Register **admin email** as student | Should not get admin role (only seeded admin) |
| 5 | Log in as admin (`VITE_ADMIN_EMAIL`) | Admin tab in nav |
| 6 | Forgot password flow | Shows success but **no email** — document as known limitation |

### 5.3 Admin

| Step | Action | Expected |
|------|--------|----------|
| 1 | Admin → enter admin password gate | CMS accessible |
| 2 | User Management → find tester | Search works |
| 3 | Grant plan (e.g. `ai_exam`) + AI credits | User object updated |
| 4 | Block user → tester tries login | Blocked |
| 5 | Unblock → login works | Restored |
| 6 | Examiner Lab | Error list may show; buttons **no action** (expected) |
| 7 | AI-Prüfer | CRUD on library (localStorage) |

### 5.4 AI exam flow (premium path)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As tester: Profile → Premium / Subscription | Plans visible |
| 2 | Select **AI Probeprüfung** (or admin-granted) | No real payment |
| 3 | Profile → start premium exam (B1 recommended) | `PremiumExamSessionScreen` loads parts |
| 4 | Complete Schreiben (type text in demo field) | Can advance |
| 5 | Complete Lesen / Hören (best effort) | Parts render; some demo |
| 6 | Complete speaking parts (text demo fields) | Can finish |
| 7 | Finish exam | Report generated |
| 8 | Profile → reports section | New report with title, strengths/weaknesses |
| 9 | DevTools → `austriaPathAIReports` | New entry appended |

**If OpenAI fails:** Report may still generate with rule-based ExaminerMind; note any demo fallback text.

### 5.5 Placement & weekly plan (optional beta paths)

| Flow | Quick test |
|------|------------|
| Placement | Subscription → Einstufungstest → complete → `austriaPathPlacementProfile` set |
| Weekly plan | Subscription → Wochenplan → setup 3 Termine → start AI session → finish → report in Profile |

### 5.6 Intelligent Exam (speaking)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Practice → level → Intelligent Exam | Mic permission (browser) |
| 2 | Speak / interact | AI reply OR demo fallback if proxy issue |
| 3 | End session | “Demo Bewertung” or AI summary |

**Pre-beta gate:** If multi-turn chat always fails, document “single-turn beta only” in tester email.

---

## 6. Data Collection — What To Collect and What Not To Collect

### Collect (minimum for beta operation)

| Data | Where | Purpose |
|------|-------|---------|
| Consent timestamp + doc versions | `austriaPathLegalConsent` | Proof of accept |
| Name, email, password | `austriaPathUsers` | Login (beta-only passwords) |
| Level, progress, reports | `austriaPathAIReports`, profiles | Product feedback |
| Subscription flags (fake) | localStorage | Feature gating demo |
| OpenAI **usage** (provider dashboard) | OpenAI account | Cost control |

### Do not collect for beta

| Do not | Reason |
|--------|--------|
| Full exam **audio recordings** long-term | Not implemented; privacy risk |
| Full OpenAI **prompt/response logs** on your server | No logging infra; minimize |
| Payment card data | No Stripe |
| Government ID, visa status, nationality | Out of scope |
| Analytics (GA, Meta Pixel) without consent | None configured — keep off |
| Examiner Lab auto-log export to cloud | Stays in browser unless admin manually notes case |

### Tester instructions (include in invite)

- Use a **dedicated beta password**, not your main email password  
- Avoid real sensitive personal stories in free-text answers if uncomfortable  
- Understand data is **on your browser only** — support cannot restore after cache clear  
- Contact **[your email]** for account removal (admin deletes user in User Management)

---

## 7. Step-by-Step Checklist Before First Tester

Print and check off.

### Week before

- [ ] Impressum completed with real contact details  
- [ ] Beta disclaimer added to legal text or invite email  
- [ ] Pending legal/security changes committed and deployed  
- [ ] Production env: `OPENAI_API_KEY` set, `VITE_ADMIN_INITIAL_PASSWORD` **empty**  
- [ ] OpenAI billing cap + alert configured  
- [ ] Admin account login tested on production URL  
- [ ] Full manual QA (Section 5) passed on production URL  
- [ ] Beta invite email drafted (no payment, data local, AI limitations)  
- [ ] Tester list finalized (names + emails)  
- [ ] Support channel ready (single email address)  

### Day before

- [ ] Incognito smoke test: register → consent → home  
- [ ] Premium exam end-to-end → report in Profile  
- [ ] Intelligent Exam tested (note if demo-only)  
- [ ] URL works on mobile browser (primary use case)  
- [ ] Git tag created for deployed revision  

### Day of invite

- [ ] Send personal invite (no public post)  
- [ ] Include: URL, beta rules, support email, known limitations  
- [ ] Admin checks User Management once per day for first week  
- [ ] Check OpenAI usage daily for first 3 days  

### During beta (weekly)

- [ ] Collect structured feedback (form: bugs, confusing UI, exam quality)  
- [ ] Log EC-relevant exam issues (blank tasks, wrong scores) for later approval  
- [ ] Rotate beta URL or disable deploy if OpenAI abuse detected  

---

## 8. Blockers for Commercial Launch

These **cannot** be waived by calling beta “soft launch.” Each requires backend and/or legal work.

| # | Blocker | Why |
|---|---------|-----|
| 1 | **No Stripe / real payments** | Cannot charge legally or safely |
| 2 | **Plaintext passwords** | Unacceptable for public users |
| 3 | **No server-side auth/session** | Accounts trivially forgeable |
| 4 | **Unauthenticated OpenAI proxy** | Cost and abuse |
| 5 | **No GDPR export/delete API** | Legal requirement for EU users at scale |
| 6 | **Impressum + counsel-reviewed AGB/Datenschutz** | AT/EU compliance |
| 7 | **DPAs + TIA for OpenAI** | Cross-border AI processing |
| 8 | **EC Confirmed items** (EC-01, 02, 03, 05, 06, 07, 08, 13, 19, 20, 22) | Premium exam integrity |
| 9 | **Human content review** of premium models (EC-13) | Blank/wrong tasks |
| 10 | **Subscription key unification** + server enforcement | Premium fraud |
| 11 | **PostgreSQL** as system of record | Data loss, support, billing |
| 12 | **Email verification + password reset** | Basic account safety |
| 13 | **Error monitoring + backups** | Operability |
| 14 | **CI/tests** | Regression safety |
| 15 | **Remove admin seed password from any production bundle** | Critical exposure |
| 16 | **Marketing claims audit** | No ÖIF/certification/payment misrepresentation |

**Commercial launch gate:** All P0 items from the Production Readiness Review green, plus Stripe live, backend auth, and legal sign-off.

---

## Quick Reference — Beta vs Commercial

| Dimension | Closed beta | Commercial launch |
|-----------|-------------|-------------------|
| Users | Invite-only, ≤20 | Public registration |
| Payment | Free; plans unlock on tap | Stripe Checkout |
| Data | Browser localStorage | PostgreSQL |
| Passwords | Plaintext (mitigated by trust) | Hashed server-side |
| AI proxy | Secret URL + OpenAI cap | Auth + rate limit + credits |
| Legal | Impressum + consent + beta email | Full GDPR + DPAs + export/delete |
| Marketing | None / direct invite | Allowed with accurate claims |
| Exam scores | Learning feedback | Governed by EC fixes + labeling |

---

## Document maintenance

Update this plan when:

- Beta URL changes or tester count grows beyond ~20  
- OpenAI proxy gains authentication  
- Payment or backend MVP ships (graduate to “Open Beta” plan)  
- Legal counsel provides beta-specific guidance  

**Owner:** _[name]_  
**Beta URL:** _[TBD]_  
**Target first tester date:** _[TBD]_
