---
'@spotlightjs/overlay': minor
'@spotlightjs/sidecar': minor
---

Add base64 encoding for envelope passing

This fixes the issue certain characters getting lost or changed during the implicit
and forced UTF-8 encoding, namely certain ANSI-escape characters when we capture
them as breadcrumbs. This was breaking NextJS recently.

The mechanism is opt-in from Sidecar side and the new overlay automatically opts
in to fix the issue. The new overlay is also capable of processing messages w/o
base64 encoding so this change is both backwards and forwards compatible meaning
a new version of overlay can work with an old sidecar and a new version of sidecar
can work with an older overlay. That said to get the fix, both should be on the new
version, opting into base64 encoding.
