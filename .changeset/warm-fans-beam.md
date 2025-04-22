---
'@spotlightjs/overlay': patch
---

Fixes a race condition where we try to graft a trace which was a skeleton generated from a trace context rather than a
full trace. This was causing profile frames not getting grafted as the start_timestamp and timestamp values were not set
correctly.
