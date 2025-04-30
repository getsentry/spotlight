---
'@spotlightjs/overlay': patch
---

`window.crypto` API is only available under secure contexts which prevents Spotlight from being used in dev environments
w/o https (most of them?). This patch replaces that with our bona fide `generateUuidv4` function
