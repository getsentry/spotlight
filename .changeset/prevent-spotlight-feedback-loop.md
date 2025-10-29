---
"@spotlightjs/spotlight": patch
"@spotlightjs/sidecar": patch
---

Prevent feedback loop when SENTRY_SPOTLIGHT points to self. When users set the SENTRY_SPOTLIGHT environment variable to point to the same Spotlight instance they're running, it now detects this and disables the Spotlight integration to prevent infinite feedback loops that cause memory exhaustion.

