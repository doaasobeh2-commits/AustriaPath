# AustriaPath — Legal Operator Guide

**Version:** 1.0 · **Date:** 4 July 2026  
**For:** Product owner / operator — not legal advice

---

## Before closed beta

Complete placeholders in `src/legal/legalContent.js`:

| Section | Field | Action |
|---------|-------|--------|
| Impressum | Medieninhaber | Legal name or company |
| Impressum | Address | Full Austrian address |
| Impressum | Kontakt | Working email |
| Impressum | UID / Firmenbuch | If applicable |
| Kontakt | Support email | Monitored inbox |
| Datenschutz | datenschutz@ | Monitored inbox |

After changes: increment `LEGAL_VERSIONS` in `src/legal/legalVersions.js` → users re-consent.

---

## Before commercial launch

| Task | Owner |
|------|-------|
| Austrian/EU lawyer reviews Datenschutz | Legal counsel |
| AGB aligned with Stripe payment terms | Legal counsel |
| Subprocessor list updated (OpenAI, Vercel, Stripe, email) | DPO / Legal |
| DPA signed with OpenAI | Legal |
| Transfer Impact Assessment (US AI) | Legal |
| DPIA for AI evaluation features | Legal |
| Verarbeitungsverzeichnis | DPO |

---

## Documents map

| In-app page | Source | External doc |
|-------------|--------|--------------|
| Datenschutz | `legalContent.js` | [GDPR-Readiness-Review.md](./GDPR-Readiness-Review.md) |
| AI Disclaimer | `legalContent.js` | [AI-Transparency.md](./AI-Transparency.md) |
| AI data rules | — | [AI-Privacy-Policy.md](./AI-Privacy-Policy.md) |

---

## Beta-specific wording

Closed beta invite should state:

- No payment processed in beta
- Data stored in browser (may be lost)
- AI is assistive, not official ÖIF certification
- Contact email for deletion requests

See [Closed Beta Launch Plan](./AustriaPath_Closed_Beta_Launch_Plan.md).

---

## Do not

- Claim GDPR-compliant deletion until backend API exists
- Market paid plans before Stripe live
- Claim official ÖIF partnership
