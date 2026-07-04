# 13 — AI Gateway Contracts

**Contract Pack version:** 2.0.0-gate0  
**Schemas:** `schemas/ai-completion-request.json`, `schemas/ai-completion-response.json`  
**Replaces:** Unauthenticated `api/ai/openai.js` proxy

---

## 1. Unified gateway

Single endpoint serves:

- Examiner Mind judges (`examiner_judge`)
- Exam Engine LLM proposals (`llm_proposal`)
- Conversational exam (`conversational`) — IntelligentExamScreen
- Report narratives (`report_narrative`)

**Implementation ports:** `llmGateway.js` + `secureOpenAI.js` + `modelRouter.js`

---

## 2. POST `/v1/ai/completions`

**Auth:** Required session  
**Rate limit:** 30/min/user, 500/day/user

### Request

```json
{
  "mode": "examiner_judge|llm_proposal|conversational|report_narrative",
  "prompt": "string (max 8000)",
  "studentAnswer": "string (max 8000)",
  "messages": [
    { "role": "user|assistant", "content": "string" }
  ],
  "context": {
    "serviceType": "ai_exam",
    "level": "B1",
    "skill": "writing",
    "sessionId": "uuid",
    "sectionIndex": 0,
    "engineName": "examiner_mind"
  }
}
```

Either `messages[]` OR (`prompt` + optional `studentAnswer`) required.

### Response — conversational mode

```json
{
  "success": true,
  "data": {
    "result": "German text response",
    "creditsUsed": 2,
    "creditsRemaining": 48,
    "mode": "conversational",
    "completionId": "uuid"
  }
}
```

### Response — llm_proposal mode

```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "proposalId": "uuid",
        "type": "grammar",
        "skill": "writing",
        "suggestedScoreDelta": -5,
        "suggestedWeaknesses": ["Artikel"],
        "confidence": 78,
        "modelId": "gpt-4.1-mini",
        "validated": false
      }
    ],
    "creditsUsed": 1,
    "creditsRemaining": 47
  }
}
```

---

## 3. Credit debit (atomic)

```
BEGIN;
  SELECT ai_credits FROM users WHERE id = $1 FOR UPDATE;
  IF balance < cost THEN ROLLBACK → 402 AI_CREDITS_EXHAUSTED;
  UPDATE users SET ai_credits = ai_credits - cost;
  INSERT INTO ai_credits (amount = -cost, ...);
  -- call OpenAI
  INSERT INTO ai_completion_logs (tokens, no prompt text);
COMMIT;
```

---

## 4. Mode → cost mapping

| mode | serviceType | Credits |
|------|-------------|---------|
| `conversational` | from context | per accessControl |
| `examiner_judge` | skill-specific | 2 |
| `llm_proposal` | `llm_proposal` | 1 |
| `report_narrative` | `report_builder` | 1 |

---

## 5. OpenAI upstream

| Setting | Value |
|---------|-------|
| Model | `OPENAI_MODEL` env, default `gpt-4.1-mini` |
| Temperature | 0.3 (examiner), 0.7 (conversational) |
| Max tokens | Mode-specific caps |
| System prompt | German ÖIF examiner persona |

**Never store** full prompt/response in production DB.

---

## 6. GET `/v1/ai/usage`

```json
{
  "aiCredits": 48,
  "usedAiCredits": 52,
  "recentUsage": [
    {
      "date": "ISO8601",
      "mode": "ai_exam",
      "creditsUsed": 2
    }
  ]
}
```

---

## 7. Error handling

| Condition | Code |
|-----------|------|
| No credits | `AI_CREDITS_EXHAUSTED` |
| Blocked user | `AUTH_BLOCKED` |
| Upstream OpenAI failure | `OPENAI_UPSTREAM_ERROR` |
| Prompt too long | `VALIDATION_ERROR` |
| Rate limited | `RATE_LIMITED` |

Failed calls that consumed no upstream tokens do not debit credits.

---

## 8. LLM Gateway interface (engine internal)

```typescript
// Ports src/exam-platform/services/llmGateway.js
proposeSectionAnalysis(context): Promise<LLMProposal[]>
proposeSessionSummary({ evaluations, productType }): Promise<LLMProposal[]>
```

Server implementation calls `/ai/completions` internally with `mode: llm_proposal` — not client-side.

---

## 9. Security

| Control | Requirement |
|---------|-------------|
| Auth | Session required |
| Entitlements | Check permissions for skill AI flags |
| Input sanitization | Same as `secureOpenAI.js` |
| Output | No PII leakage in logs |
| Admin bypass | Admin still debited unless config flag |
