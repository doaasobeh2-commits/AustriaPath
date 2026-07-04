# 15 — Error Codes & Response Standards

**Contract Pack version:** 2.0.0-gate0  
**Schema:** `schemas/error-response.json`

---

## 1. Response envelope

### Success

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440000",
    "apiVersion": "v1",
    "timestamp": "2026-07-04T10:00:00.000Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_INACTIVE",
    "message": "Kein aktives Abonnement für diese Prüfung.",
    "details": {
      "productType": "ai_exam"
    }
  },
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440000",
    "apiVersion": "v1",
    "timestamp": "2026-07-04T10:00:00.000Z"
  }
}
```

| Field | Rule |
|-------|------|
| `error.code` | UPPER_SNAKE_CASE English — machine readable |
| `error.message` | German — display in UI |
| `error.details` | Optional structured context — never stack traces |

---

## 2. HTTP status mapping

| HTTP | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async deletion/export) |
| 400 | `VALIDATION_ERROR` |
| 401 | `AUTH_REQUIRED`, `AUTH_INVALID` |
| 402 | `AI_CREDITS_EXHAUSTED` |
| 403 | `FORBIDDEN`, `AUTH_BLOCKED`, `SUBSCRIPTION_INACTIVE` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT`, `PROFILE_CONFLICT`, `IDEMPOTENCY_MISMATCH` |
| 410 | `SESSION_EXPIRED` |
| 422 | Business rule violation |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |
| 502 | `OPENAI_UPSTREAM_ERROR` |
| 503 | Maintenance |

---

## 3. Complete error code registry

### Authentication

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `AUTH_REQUIRED` | 401 | Bitte melden Sie sich an. |
| `AUTH_INVALID` | 401 | E-Mail oder Passwort ist falsch. |
| `AUTH_BLOCKED` | 403 | Ihr Konto wurde gesperrt. |
| `FORBIDDEN` | 403 | Keine Berechtigung für diese Aktion. |
| `EMAIL_ALREADY_REGISTERED` | 409 | Diese E-Mail ist bereits registriert. |
| `EMAIL_RESERVED` | 409 | Diese E-Mail ist reserviert. |

### Subscription & billing

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `SUBSCRIPTION_INACTIVE` | 403 | Kein aktives Abonnement. |
| `SUBSCRIPTION_EXPIRED` | 403 | Das Abonnement ist abgelaufen. |
| `SUBSCRIPTION_TYPE_MISMATCH` | 403 | Abonnement-Typ passt nicht. |
| `NO_REMAINING_EXAMS` | 403 | Keine verbleibenden Prüfungsversuche. |
| `PAYMENT_FAILED` | 402 | Zahlung fehlgeschlagen. |

### Exam sessions

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `SESSION_NOT_FOUND` | 404 | Prüfungssitzung nicht gefunden. |
| `SESSION_NOT_ACTIVE` | 409 | Diese Sitzung ist nicht aktiv. |
| `SESSION_EXPIRED` | 410 | Die Prüfungszeit ist abgelaufen. |
| `SESSION_INCOMPLETE` | 409 | Prüfung noch nicht abgeschlossen. |
| `SECTION_INDEX_MISMATCH` | 409 | Falsche Aufgabenreihenfolge. |
| `INVALID_PRODUCT_TYPE` | 400 | Unbekanntes Produkt. |

### Profile & reports

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `PROFILE_CONFLICT` | 409 | Profil wurde zwischenzeitlich aktualisiert. |
| `REPORT_NOT_FOUND` | 404 | Bericht nicht gefunden. |

### AI

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `AI_CREDITS_EXHAUSTED` | 402 | Keine AI-Credits mehr verfügbar. |
| `OPENAI_UPSTREAM_ERROR` | 502 | AI-Dienst vorübergehend nicht verfügbar. |
| `PROMPT_TOO_LONG` | 400 | Eingabe ist zu lang. |

### Lab & registry

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `LAB_ITEM_NOT_FOUND` | 404 | Lab-Fall nicht gefunden. |
| `LAB_ALREADY_RESOLVED` | 409 | Fall bereits bearbeitet. |
| `REGISTRY_VERSION_NOT_FOUND` | 404 | Regelversion nicht gefunden. |
| `RULE_CONFLICT` | 409 | Regelkonflikt erkannt. |

### General

| Code | HTTP | Message (DE) |
|------|------|--------------|
| `VALIDATION_ERROR` | 400 | Ungültige Eingabe. |
| `NOT_FOUND` | 404 | Ressource nicht gefunden. |
| `RATE_LIMITED` | 429 | Zu viele Anfragen. Bitte warten. |
| `IDEMPOTENCY_MISMATCH` | 409 | Idempotency-Key mit anderer Anfrage verwendet. |
| `INTERNAL_ERROR` | 500 | Ein Fehler ist aufgetreten. |

---

## 4. Validation error details

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ungültige Eingabe.",
    "details": {
      "fields": [
        { "path": "email", "message": "Ungültige E-Mail-Adresse." },
        { "path": "password", "message": "Mindestens 8 Zeichen." }
      ]
    }
  }
}
```

---

## 5. Request ID

Every response includes `meta.requestId` (UUID). Client may send `X-Request-Id` — server echoes or generates.

Log correlation: `{ requestId, userId, endpoint, errorCode }`.

---

## 6. Pagination meta

```json
{
  "success": true,
  "data": { "items": [], "pagination": { "page": 1, "limit": 20, "total": 142, "hasMore": true } },
  "meta": { }
}
```

---

## 7. Deprecation in errors

Unsupported API version:

```json
{
  "error": {
    "code": "API_VERSION_UNSUPPORTED",
    "message": "Diese API-Version wird nicht mehr unterstützt.",
    "details": { "minVersion": "v1", "requestedVersion": "v0" }
  }
}
```

HTTP 410 or 400 depending on path version invalidity.
