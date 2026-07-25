# AustriaPath Daily Learning Bank v1

**Total cards:** 270 (90 × A2, 90 × B1, 90 × B2)

**Philosophy:** Teach which expression a stronger exam candidate would naturally use — not grammar theory, not trick questions.

**Card format:**
- Category
- Examiner Situation
- Question: *Which answer is better?*
- A / B (both grammatically correct, similar length, believable)
- Better + Reason

**Source files:**
- A2: `modelsA2.js`, `akademieContent.js` (a2Akademie), `a2Images.js`, `weeklyPlanLibrary.js`
- B1: `modelsb1.js`, `b1Images.js`, `b1PlanningModels`, `akademieContent.js` (b1Akademie), `weeklyPlanLibrary.js`
- B2: `b2Images.js`, `b2Grafiken.js`, `b2PlanningModels.js`, `b2LesenModels.js`, `akademieContent.js` (b2Akademie)

**Files:**
- [A2 cards](daily-learning-bank-A2.md) — A2-001 … A2-090
- [B1 cards](daily-learning-bank-B1.md) — B1-001 … B1-090
- [B2 cards](daily-learning-bank-B2.md) — B2-001 … B2-090

## Category distribution

| Level | Schreiben | Bild | Grafik | Planung | Meinung | Diskussion | Connector | Grammar | Vocabulary |
|-------|-----------|------|--------|---------|---------|------------|-----------|---------|------------|
| A2 | 25 | 10 | — | 10 | 8 | — | 15 | 12 | 10 |
| B1 | 20 | 15 | — | 18 | 12 | — | 12 | 8 | 5 |
| B2 | 10 | 12 | 15 | 12 | 8 | 12 | 15 | — | 6 |

## UX status

**Implemented** per [daily-learning-UX-SPEC-FINAL.md](daily-learning-UX-SPEC-FINAL.md).

- Home card → `dailyLearning` screen → 3 cards/day
- Regenerate bank: `npm run build:daily-learning`
