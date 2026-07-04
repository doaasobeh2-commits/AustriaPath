# API Integration Layer

This folder defines **contracts only** — no fake backend implementations.

| File | Purpose |
|------|---------|
| `endpoints.js` | URL path constants (`API_ENDPOINTS`) |
| `contracts.js` | JSDoc types, error codes, evaluation method enums |

## When backend ships

1. Add `httpClient.js` — `fetch` wrapper with `credentials: 'include'`
2. Add service modules: `authService.js`, `subscriptionService.js`, `aiService.js`, `reportsService.js`
3. Feature flag: `VITE_USE_BACKEND=true` in `.env`
4. Swap calls in `userAccess.js`, `secureOpenAI.js`, `SubscriptionScreen.jsx` behind the flag

**Do not** call `API_ENDPOINTS` URLs until backend is deployed — they will 404.

See [AustriaPath_Frontend_Backend_Integration.md](../../AustriaPath_Frontend_Backend_Integration.md).
