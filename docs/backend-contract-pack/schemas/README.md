# JSON Schemas — AustriaPath Gate 0

**Draft:** JSON Schema 2020-12  
**Base URL:** `https://api.austriapath.at/schemas/`

| Schema | Purpose |
|--------|---------|
| [enums.json](./enums.json) | All canonical enumerations |
| [meta.json](./meta.json) | Response metadata |
| [envelope.json](./envelope.json) | Success response wrapper |
| [error-response.json](./error-response.json) | Error response |
| [user.json](./user.json) | Auth user + permissions |
| [exam-session.json](./exam-session.json) | ExamSessionState, blueprint, answers |
| [final-report.json](./final-report.json) | FinalReport |
| [student-profile.json](./student-profile.json) | StudentProfile V2 |
| [council-decision.json](./council-decision.json) | CouncilDecision |
| [rule-registry.json](./rule-registry.json) | RuleRegistry document |
| [lab-queue-item.json](./lab-queue-item.json) | Lab queue + resolution |
| [ai-completion-request.json](./ai-completion-request.json) | AI gateway request |
| [ai-completion-response.json](./ai-completion-response.json) | AI gateway response |

OpenAPI references these schemas conceptually; validate request/response bodies against these files in CI.

**Source of truth alignment:** `src/exam-platform/contracts.js`, `ruleRegistrySchema.js`
