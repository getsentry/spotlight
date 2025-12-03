---
"@spotlightjs/spotlight": minor
---

Add `--allowed-origin` / `-A` CLI option and `allowedOrigins` API option for configuring additional CORS origins. Supports both full origins (e.g., `https://ngrok.io:443`) for strict matching and plain domains (e.g., `myapp.local`) for permissive matching. Fixes [#1171](https://github.com/getsentry/spotlight/issues/1171).

