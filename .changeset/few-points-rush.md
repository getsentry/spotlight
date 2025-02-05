---
'@spotlightjs/tsconfig': major
'@spotlightjs/spotlight': minor
'@spotlightjs/electron': minor
'@spotlightjs/overlay': minor
'@spotlightjs/astro': minor
---

# Add profile grafting into traces

With this change, Spotlight can now ingest v1 profiles and graft profiling
data into the trace view to fill in the gaps where span/trace instrumentation
falls short.

This feature is experimental.

Breaking change for `tsconfig`: It now targets ES2023 as we needed `Array.findLastIndex()`
