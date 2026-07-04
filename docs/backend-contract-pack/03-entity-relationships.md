# 03 — Entity Relationships (ERD)

**Contract Pack version:** 2.0.0-gate0

---

## 1. Core domain ERD

```mermaid
erDiagram
    users ||--o| user_profiles : has
    users ||--o{ auth_sessions : has
    users ||--o{ subscriptions : has
    users ||--o{ payments : makes
    users ||--o{ ai_credits : ledger
    users ||--|| student_learning_profiles : owns
    users ||--o{ exam_sessions : starts
    users ||--o{ exam_reports : receives
    users ||--o{ legal_consents : accepts
    users ||--o{ data_export_requests : requests
    users ||--o{ account_deletion_requests : requests

    subscriptions ||--o{ payments : paid_by
    subscriptions ||--o{ exam_attempt_ledger : consumes

    exam_sessions ||--o| exam_reports : produces
    exam_sessions }o--|| subscriptions : may_require

    exam_reports ||--o| council_decisions : references
    exam_reports ||--o{ report_revisions : may_have

    council_decisions ||--o| examiner_lab_queue_items : may_enqueue

    examiner_lab_queue_items ||--o| lab_resolutions : resolved_by
    lab_resolutions ||--o| rule_registry_promotions : may_create
    rule_registry_promotions }o--|| rule_registry_snapshots : bumps

    rule_registry_snapshots ||--o{ rule_proposals : pending

    users ||--o{ ai_completion_logs : consumes
    exam_sessions ||--o{ ai_completion_logs : attributes

    users ||--o{ admin_activity_log : actor_or_target
    users ||--o{ examiner_content_rules : admin_maintains
```

---

## 2. Exam platform pipeline ERD

```mermaid
flowchart LR
    subgraph Client
        S[Screens]
    end
    subgraph API
        ES[exam_sessions]
        ER[exam_reports]
        SLP[student_learning_profiles]
        RR[rule_registry_snapshots]
        LAB[examiner_lab_queue_items]
    end
    subgraph Engine
        SEL[Model Selection]
        EVAL[Skill Evaluators]
        LLM[AI Gateway]
        COUNCIL[Examiner Council]
        REP[Report Builder]
    end
    S --> ES
    ES --> SEL --> EVAL --> LLM --> COUNCIL --> REP --> ER
    REP --> SLP
    COUNCIL --> LAB
    LAB --> RR
    RR --> COUNCIL
```

---

## 3. Relationship table

| Parent | Child | Cardinality | FK | On delete |
|--------|-------|-------------|-----|-----------|
| `users` | `user_profiles` | 1:1 | `user_id` | CASCADE |
| `users` | `student_learning_profiles` | 1:1 | `user_id` | CASCADE |
| `users` | `auth_sessions` | 1:n | `user_id` | CASCADE |
| `users` | `subscriptions` | 1:n | `user_id` | CASCADE |
| `users` | `payments` | 1:n | `user_id` | RESTRICT |
| `users` | `exam_sessions` | 1:n | `user_id` | CASCADE |
| `users` | `exam_reports` | 1:n | `user_id` | CASCADE |
| `users` | `ai_credits` | 1:n | `user_id` | CASCADE |
| `users` | `ai_completion_logs` | 1:n | `user_id` | CASCADE |
| `subscriptions` | `payments` | 1:n | `subscription_id` | SET NULL |
| `subscriptions` | `exam_attempt_ledger` | 1:n | `subscription_id` | RESTRICT |
| `exam_sessions` | `exam_reports` | 1:1 | `session_id` | RESTRICT |
| `exam_sessions` | `exam_attempt_ledger` | 1:1 | `session_id` | RESTRICT |
| `exam_reports` | `council_decisions` | 1:1 | `council_decision_id` | RESTRICT |
| `exam_reports` | `report_revisions` | 1:n | `report_id` | CASCADE |
| `council_decisions` | `examiner_lab_queue_items` | 1:n | `council_decision_id` | SET NULL |
| `examiner_lab_queue_items` | `lab_resolutions` | 1:n | `lab_item_id` | CASCADE |
| `lab_resolutions` | `rule_registry_promotions` | 1:n | `lab_resolution_id` | SET NULL |
| `rule_registry_snapshots` | `rule_registry_promotions` | 1:n | `registry_snapshot_id` | RESTRICT |
| `examiner_lab_queue_items` | `rule_proposals` | 1:n | `lab_item_id` | SET NULL |

---

## 4. Legacy compatibility views

These are **read models**, not separate sources of truth:

| Legacy client shape | Canonical table(s) |
|---------------------|-------------------|
| `austriaPathAIReports[]` | `exam_reports` WHERE `legacy_adapter_key` set |
| `austriaPathStudentProfileV2` | `student_learning_profiles.profile_json` |
| `austriaPathRuleRegistry` | Latest `rule_registry_snapshots` row |
| `austriaPathExaminerLabQueue` | `examiner_lab_queue_items` WHERE `status != resolved` |
| `austriaPathSubscription` | `subscriptions` WHERE `is_current = true` |

---

## 5. Admin & examiner access zones

```mermaid
flowchart TB
    subgraph Public
        REG[Register / Login]
        WH[Stripe Webhook]
    end
    subgraph Student
        ES[Exam Sessions]
        REP[Reports read own]
        PROF[Profile read/write own]
        SUB[Subscription read own]
        AI[AI completions]
    end
    subgraph Examiner
        LABR[Lab read + resolve]
        RRRead[Registry read]
    end
    subgraph Admin
        USR[User management]
        LABA[Lab full]
        RRW[Registry promote]
        PAY[Payments read all]
        LOG[Activity log]
    end
    REG --> Student
    Student --> Examiner
    Examiner --> Admin
```

See [05-roles-permissions-matrix.md](./05-roles-permissions-matrix.md).
