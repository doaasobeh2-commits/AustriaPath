# AI Privacy Policy — AustriaPath

**Document version:** 2026.07  
**Last updated:** 4 July 2026  
**Scope:** AI-specific data handling aligned with AustriaPath architecture

---

## 1. Purpose

This policy supplements the in-app **Datenschutzerklärung** and defines how AustriaPath handles data when AI assists language exam evaluation. It reflects the architectural principle: **store the minimum necessary for learning progress, not full AI interaction history**.

---

## 2. AI roles in AustriaPath

| Feature | AI role | Storage behaviour |
|---------|---------|-------------------|
| Intelligent Exam | Generates tasks, evaluates responses | Temporary session data; **report only** persisted |
| Premium AI Exam | Simulated exam with scoring | Report saved to `austriaPathAIReports` |
| Weekly AI Training | Structured practice sessions | Session answers temporary; report appended to weekly plan |
| Speaking / Writing evaluation | Feedback on submissions | Transient API call; summary in report if saved |
| Examiner Lab (admin) | Compare AI vs human scoring | **Only manually selected samples** retained |
| AI-Prüfer library (admin) | Rule/model configuration | Examiner rules stored; not student PII |

---

## 3. What we send to AI providers

When a user starts an AI-assisted activity, the app may transmit:

- User-written text (answers, essays, speaking transcripts)
- Exam prompts and rubric context
- Level (A2/B1/B2) and task metadata
- Language preference

We do **not** intentionally send:

- Passwords or payment details
- Unnecessary profile fields (beyond what the prompt requires)

All calls must route through a **server-side proxy** (no browser API keys).

---

## 4. What we store

### Stored (allowed)

1. **AI progress reports** — structured summaries (scores, skill breakdown, recommendations) in `austriaPathAIReports` and related profile views.
2. **Weekly plan session reports** — aggregated training outcomes in `austriaPathWeeklyPlan`.
3. **Examiner Lab samples** — only exams **explicitly selected by an administrator** for comparison with human examiner benchmarks.
4. **Examiner rule library** — non-personal configuration data for AI scoring consistency.

### Not stored (by default)

- Complete chat transcripts of every AI interaction
- Every generated exam paper and all intermediate AI reasoning
- Raw API request/response payloads in the browser
- Voice recordings beyond immediate transcription processing (unless explicitly saved by user action — currently not implemented)

---

## 5. Temporary data lifecycle

The following are **session/temporary** and should be cleared when the session ends or on logout:

```
austriaPathCurrentSessionAnswers
austriaPathCurrentAISession
austriaPathAiSession
austriaPathPremiumExamPackage (active)
austriaPathAIExamTimerStart
```

**Operational rule:** Backend and client should purge temporary AI buffers within 24 hours of session completion. No backup of temporary exam content.

---

## 6. User rights regarding AI data

Users may:

- **Access** stored AI reports via Profile
- **Request deletion** of AI reports with account deletion
- **Export** reports as part of GDPR data export
- **Object** to AI processing — alternative non-AI practice modes remain available where implemented

Users are informed via **AI Disclaimer** and **AI Transparency** that AI is not a certified examiner.

---

## 7. Third-party AI processing (OpenAI)

- Provider: OpenAI (or equivalent EU-compliant alternative)
- Purpose: Natural language evaluation and content generation
- Data minimisation: Send only task-relevant text
- Contractual safeguards: DPA + Standard Contractual Clauses
- Retention: Configure OpenAI API **zero data retention** where available; otherwise minimum provider retention

Proxy server must:

- Strip authentication tokens from client
- Rate-limit per user
- Avoid logging full prompt/response bodies in production logs

---

## 8. Admin responsibilities

Administrators must:

- Only add Examiner Lab samples with documented purpose
- Not export student AI data except for support with user consent
- Review AI-Prüfer library changes for bias and accuracy
- Delete obsolete samples when rules are updated

---

## 9. Incident response

If AI data is exposed:

1. Contain (revoke keys, disable proxy)
2. Assess scope (which users, which reports)
3. Notify DSB within 72 hours if risk to rights and freedoms
4. Notify affected users without undue delay

---

## 10. Review schedule

Review this policy:

- Before each major AI feature change
- When changing AI provider
- At least annually

Increment `LEGAL_VERSIONS.privacy` in `src/legal/legalVersions.js` when material changes require re-consent.
