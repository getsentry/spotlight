---
"@spotlightjs/spotlight": patch
---

Fixed Node 24.x compatibility by making the Sentry Vite plugin conditional. The plugin now only runs when Sentry auth credentials are configured, preventing the creation of a virtual module that caused circular dependency errors in Node 24.x.
