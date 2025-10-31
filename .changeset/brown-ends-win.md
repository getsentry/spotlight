---
"@spotlightjs/electron": patch
---

Make Sentry error reporting silent for auto-updater failures. Updater check errors are now reported to Sentry in the background without showing disruptive dialogs or error screens to users.
