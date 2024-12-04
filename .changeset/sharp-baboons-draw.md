---
'@spotlightjs/astro': major
'@spotlightjs/spotlight': patch
'@spotlightjs/electron': patch
'@spotlightjs/overlay': patch
'@spotlightjs/sidecar': patch
---

Fix Astro v5 compatibility

Upgraded all Astro dependencies to v5+. This required suppressing Sentry instrumentation on the sidecar
when used programmatically (unless explicitly passed `isStandalone: true`) to prevent Spotlight spamming
itself with transactions from the very sidecar instance that it is running.

BREAKING: We had to bump minimum required Astro version for the Astro plugin to 4.7+ as we needed the new
          dev toolbar app APIs.
