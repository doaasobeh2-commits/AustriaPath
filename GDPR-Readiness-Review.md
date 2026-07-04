# GDPR Readiness Review — AustriaPath

**Document version:** 2026.07  
**Last updated:** 4 July 2026  
**Status:** Pre-launch internal review (not legal advice)

---

## 1. Executive summary

AustriaPath is a client-side React SPA that stores most user data in the browser (`localStorage`). A production backend with real authentication, encrypted storage, and GDPR workflows is **required before public launch**. This document inventories current data practices and defines target policies.

---

## 2. Personal data collected

| Category | Data fields | Where stored (current) | Purpose |
|----------|-------------|------------------------|---------|
| **Account** | Name, email, password (plaintext in user registry until backend), role, status, level | `austriaPathUsers`, `currentUser`, legacy keys | Registration, login, access control |
| **Profile** | Display name, email, level, language, optional profile image (base64) | `userName`, `userEmail`, `userLevel`, `userLanguage`, `userProfileImage` | Personalisation |
| **Legal consent** | Acceptance timestamp, privacy version, terms version only | `austriaPathLegalConsent` | Proof of consent (Art. 7 DSGVO) |
| **Learning progress** | Placement profile, weekly plan, session reports | `austriaPathPlacementProfile`, `austriaPathWeeklyPlan` | Progress tracking |
| **AI reports** | Summarised evaluation reports (not full exam transcripts) | `austriaPathAIReports`, `austriaPathLastAIReport` | Student progress display |
| **Premium / subscription** | Plan type, schedule, exam appointments | `austriaPathSubscription`, `austriaPathPremiumSchedule`, etc. | Premium features |
| **Session integrity** | Non-reversible session fingerprint | `austriaPathSessionIntegrity` | Client-side tamper detection |
| **Admin (operator)** | User list, content library, AI examiner models | `austriaPathAdminData`, `austriaPathAiPrueferLibrary` | Platform operation |

**Sent to third parties (via API proxy):**

- Exam text, answers, and prompts sent to **OpenAI** for AI evaluation (transient processing; retention governed by OpenAI DPA + proxy logs policy).

---

## 3. What is stored

### Persisted for user benefit

- Account credentials and profile (local until backend migration)
- AI **reports** required for progress (scores, feedback summaries)
- Weekly training plans and placement results
- Premium schedule and subscription state
- Legal consent record: `{ acceptedAt, privacyVersion, termsVersion }` only

### Persisted for platform operation (admin)

- Admin-curated training content (`austriaPathAdminData`)
- AI examiner rule library (`austriaPathAiPrueferLibrary`)
- **Manually selected** sample exams in Examiner Lab for human–AI comparison (admin workflow)

---

## 4. What is NOT stored (by design)

| Data | Policy |
|------|--------|
| Full AI exam conversation logs | Not persisted long-term; session-only |
| Every AI exam attempt | Not stored — only resulting progress reports |
| Raw OpenAI API keys in browser | Blocked; proxy-only architecture |
| Marketing/analytics tracking IDs | Not implemented |
| Payment card data | Not handled client-side (future: Stripe/payment provider) |
| Automatic bulk export of all AI prompts | Not collected centrally |

Temporary session keys (examples — safe to purge on session end):

- `austriaPathCurrentSessionAnswers`
- `austriaPathCurrentAISession`
- `austriaPathAiSession`
- `austriaPathPremiumExamPackage` (active session)
- `austriaPathAIExamTimerStart`

---

## 5. Data retention policy

| Data type | Retention (target) | Action on expiry |
|-----------|-------------------|------------------|
| Active account data | Duration of account + 30 days after deletion request | Secure deletion |
| AI progress reports | Until account deletion or user export/delete request | Anonymise or delete |
| Examiner Lab samples | Until admin removes or 24 months after last use | Delete |
| Legal consent records | 3 years after account closure (legal proof) | Archive then delete |
| Server/proxy logs | Max 90 days | Auto-purge |
| Backup snapshots | Max 30 days rolling | Encrypted, access-controlled |

**Current gap:** Client-only storage has no central retention enforcement. Backend must implement TTL jobs and deletion hooks.

---

## 6. Account deletion policy

### Target process (backend required)

1. User requests deletion via Account Settings or email to datenschutz@ (see Kontakt page).
2. Identity verification (email confirmation link).
3. Within **30 days**: delete or anonymise:
   - Account record
   - Profile and progress data
   - AI reports linked to the account
   - Premium/subscription linkage
4. Retain only: legal consent timestamp (anonymised user ID), invoices if legally required.
5. Confirm deletion by email.

### Current state (pre-backend)

- No self-service delete button (marked “Demnächst verfügbar” in Account Settings).
- Manual deletion: clear browser localStorage + remove user from `austriaPathUsers` (admin) — **not GDPR-compliant at scale**.
- **Launch blocker:** Implement backend account deletion API before public marketing.

---

## 7. Data export requirements (Art. 20 DSGVO)

Users may request a machine-readable export containing:

- Account metadata (name, email, registration date)
- Profile settings (level, language)
- AI progress reports
- Weekly plan / placement profile
- Subscription status (if applicable)
- Legal consent record (timestamp + versions)

**Format:** JSON or CSV bundle, delivered within 30 days via secure download link.

**Current state:** Not implemented. Required for launch.

---

## 8. Lawful basis summary

| Processing | Legal basis |
|------------|-------------|
| Account & app delivery | Art. 6(1)(b) — contract |
| AI evaluation | Art. 6(1)(a) — consent (via legal consent + in-app AI disclaimer) |
| Security logging | Art. 6(1)(f) — legitimate interest |
| Legal consent proof | Art. 6(1)(c) — legal obligation |

---

## 9. DPIA / TIA triggers

Conduct a **Data Protection Impact Assessment** before launch because:

- Systematic use of AI for evaluation of natural persons
- Processing of learning/performance data
- Potential transfer to US (OpenAI)

Conduct **Transfer Impact Assessment** for OpenAI with SCCs.

---

## 10. Pre-launch checklist (GDPR-specific)

- [ ] Replace client-only auth with server-side authentication
- [ ] Implement account deletion API
- [ ] Implement data export API
- [ ] Sign DPA with OpenAI and hosting provider
- [ ] Complete Impressum with real operator address
- [ ] Appoint/contact data protection contact
- [ ] Document subprocessors list
- [ ] Privacy policy reviewed by qualified legal counsel (Austria/EU)

---

## 11. Contact

Data subject requests: see in-app **Kontakt** page and **Datenschutzerklärung**.

Supervisory authority: Österreichische Datenschutzbehörde — https://www.dsb.gv.at
